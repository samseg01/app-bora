"""Popula o banco a partir de um JSON de curadoria de campo.

    docker compose exec api python scripts/seed.py seed/anhangabau.json

Idempotente por nome: rodar duas vezes não duplica nada, e rodar de novo depois de
editar o JSON atualiza o que mudou. Ver seed/README.md para o formato.

Existe para o passo R5 do roteiro: tirar a curadoria do caderno e colocar no app sem
escrever SQL na mão, e sem depender do login do frontend (que ainda não existe).
"""

import asyncio
import json
import sys
from datetime import UTC, datetime, time, timedelta
from pathlib import Path

from sqlalchemy import func, select

from boraroles.core.geo import point_from_latlng
from boraroles.core.security import hash_password
from boraroles.db.models import (
    Comentario,
    Lugar,
    PapelUsuario,
    Role,
    Sinalizacao,
    TipoSinalizacao,
    Usuario,
)
from boraroles.db.session import async_session_maker


def _hoje_em(hhmm: str) -> datetime:
    """"21:00" -> hoje às 21h. Depois da meia-noite vira o dia seguinte, senão o rolê
    já nasceria terminado e a /descoberta não o veria."""
    h, m = (int(p) for p in hhmm.split(":"))
    agora = datetime.now(UTC)
    base = datetime.combine(agora.date(), time(h, m), tzinfo=UTC)
    return base + timedelta(days=1) if h < 6 else base


async def _curador(db, dados: dict) -> Usuario:
    usuario = await db.scalar(select(Usuario).where(Usuario.email == dados["email"]))
    if usuario is None:
        usuario = Usuario(
            nome=dados["nome"],
            email=dados["email"],
            senha_hash=hash_password(dados["senha"]),
            papel=PapelUsuario.CURADOR,
        )
        db.add(usuario)
        await db.flush()
        print(f"  + curador {usuario.email}")
    elif usuario.papel != PapelUsuario.CURADOR:
        # Promoção normalmente é manual (ADR-0007); aqui é o próprio curador do seed.
        usuario.papel = PapelUsuario.CURADOR
        print(f"  ~ {usuario.email} promovido a curador")
    return usuario


async def _usuarios_extra(db, lista: list[dict]) -> dict[str, Usuario]:
    """Gente comum para assinar comentários e sinais.

    O seed grava sinalização direto no banco, contornando a restrição de papel do
    ADR-0006 de propósito: sem isso os estados `live` e `warm` do frescor — a aposta
    central do produto — seriam impossíveis de ver em desenvolvimento.
    """
    por_nome: dict[str, Usuario] = {}
    for d in lista:
        u = await db.scalar(select(Usuario).where(Usuario.email == d["email"]))
        if u is None:
            u = Usuario(
                nome=d["nome"],
                email=d["email"],
                senha_hash=hash_password(d["senha"]),
                papel=PapelUsuario.COMUM,
            )
            db.add(u)
            await db.flush()
            print(f"  + usuário {u.nome}")
        por_nome[d["nome"]] = u
    return por_nome


async def semear(caminho: Path) -> None:
    dados = json.loads(caminho.read_text(encoding="utf-8"))
    bairro = dados["bairro"]

    async with async_session_maker() as db:
        curador = await _curador(db, dados["curador"])
        pessoas = await _usuarios_extra(db, dados.get("usuarios", []))
        elenco = [*pessoas.values()] or [curador]

        for item in dados["lugares"]:
            if item.get("lat") is None or item.get("lng") is None:
                print(f"  ! {item['nome']}: sem lat/lng, pulado")
                continue

            lugar = await db.scalar(
                select(Lugar).where(Lugar.nome == item["nome"], Lugar.bairro == bairro)
            )
            if lugar is None:
                lugar = Lugar(
                    nome=item["nome"],
                    categoria=item["categoria"],
                    geo=point_from_latlng(item["lat"], item["lng"]),
                    bairro=bairro,
                    endereco=item.get("endereco"),
                    criado_por=curador.id,
                )
                db.add(lugar)
                await db.flush()
                print(f"  + lugar {lugar.nome}")
            else:
                lugar.categoria = item["categoria"]
                lugar.geo = point_from_latlng(item["lat"], item["lng"])
                lugar.endereco = item.get("endereco")
                print(f"  ~ lugar {lugar.nome}")

            for c in item.get("comentarios", []):
                autor = pessoas.get(c["autor"], curador)
                existe = await db.scalar(
                    select(Comentario).where(
                        Comentario.lugar_id == lugar.id, Comentario.texto == c["texto"]
                    )
                )
                if existe is None:
                    db.add(
                        Comentario(
                            lugar_id=lugar.id,
                            autor_id=autor.id,
                            texto=c["texto"],
                            created_at=datetime.now(UTC) - timedelta(minutes=c["ha_minutos"]),
                        )
                    )
                    print(f"      + comentário de {autor.nome}")

            for r in item.get("roles", []):
                role = await db.scalar(
                    select(Role).where(Role.lugar_id == lugar.id, Role.titulo == r["titulo"])
                )
                inicio, fim = _hoje_em(r["inicio"]), _hoje_em(r["fim"])
                if fim <= inicio:
                    fim += timedelta(days=1)

                if role is None:
                    db.add(
                        Role(
                            lugar_id=lugar.id,
                            titulo=r["titulo"],
                            descricao=r.get("descricao"),
                            categoria=r["categoria"],
                            data_inicio=inicio,
                            data_fim=fim,
                            criado_por=curador.id,
                        )
                    )
                    print(f"    + rolê {r['titulo']}")
                    await db.flush()
                    role = await db.scalar(
                        select(Role).where(Role.lugar_id == lugar.id, Role.titulo == r["titulo"])
                    )
                else:
                    role.descricao = r.get("descricao")
                    role.categoria = r["categoria"]
                    role.data_inicio, role.data_fim = inicio, fim
                    print(f"    ~ rolê {r['titulo']}")

                # Sinais: "N sinais nos últimos M minutos" vira N linhas espalhadas na janela.
                sinais = r.get("sinais")
                if sinais and role is not None:
                    ja = await db.scalar(
                        select(func.count(Sinalizacao.id)).where(Sinalizacao.role_id == role.id)
                    )
                    faltam = sinais["quantos"] - (ja or 0)
                    agora = datetime.now(UTC)
                    for i in range(max(0, faltam)):
                        minutos = sinais["ha_minutos"] - i * sinais.get("passo_minutos", 3)
                        db.add(
                            Sinalizacao(
                                role_id=role.id,
                                usuario_id=elenco[i % len(elenco)].id,
                                tipo=TipoSinalizacao(sinais.get("tipo", "presenca")),
                                timestamp=agora - timedelta(minutes=max(1, minutos)),
                            )
                        )
                    if faltam > 0:
                        print(f"      + {faltam} sinais")

        await db.commit()
    print(f"pronto: {bairro}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__)
        raise SystemExit(1)
    arquivo = Path(sys.argv[1])
    if not arquivo.exists():
        raise SystemExit(f"arquivo não encontrado: {arquivo}")
    asyncio.run(semear(arquivo))
