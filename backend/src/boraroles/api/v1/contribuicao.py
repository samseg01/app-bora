import uuid
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from boraroles.api.deps import CurrentUser, DbSession, require_role
from boraroles.config import get_settings
from boraroles.db.models import Comentario, Lugar, PapelUsuario, Salvo, Sinalizacao, Usuario
from boraroles.schemas.comentario import ComentarioCreate, ComentarioPublic
from boraroles.schemas.lugar import RolePin
from boraroles.schemas.salvo import SalvoCreate, SalvoDetalhe, SalvoPublic
from boraroles.schemas.sinalizacao import SinalizacaoCreate, SinalizacaoPublic
from boraroles.services.descoberta import frescor_de_role, role_ativo_de_lugar
from boraroles.services.lugares import lugar_to_public

router = APIRouter(tags=["contribuicao"])

# ver ADR: sinalização começa restrita a curador/dono_estabelecimento
# (arquitetura-backend-frontend.md, sequenciamento ponto 3)
SinalizadorUser = Annotated[
    Usuario, Depends(require_role(PapelUsuario.CURADOR, PapelUsuario.DONO_ESTABELECIMENTO))
]


@router.post("/salvos", response_model=SalvoPublic, status_code=status.HTTP_201_CREATED)
async def salvar_lugar(body: SalvoCreate, usuario: CurrentUser, db: DbSession) -> Salvo:
    salvo = Salvo(usuario_id=usuario.id, lugar_id=body.lugar_id)
    db.add(salvo)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Lugar já salvo ou inexistente"
        ) from exc
    await db.refresh(salvo)
    return salvo


@router.delete("/salvos/{lugar_id}", status_code=status.HTTP_204_NO_CONTENT)
async def dessalvar_lugar(lugar_id: uuid.UUID, usuario: CurrentUser, db: DbSession) -> None:
    salvo = await db.scalar(
        select(Salvo).where(Salvo.usuario_id == usuario.id, Salvo.lugar_id == lugar_id)
    )
    if salvo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Não encontrado")
    await db.delete(salvo)
    await db.commit()


@router.get("/salvos", response_model=list[SalvoDetalhe])
async def listar_salvos(usuario: CurrentUser, db: DbSession) -> list[SalvoDetalhe]:
    """O caderninho, já resolvido: cada lugar salvo com o rolê de hoje nele, se houver.

    Devolve o lugar inteiro e não só o id porque o caderninho **atravessa bairros** — e
    a tela, sem isto, perguntava a um `GET /mapa` filtrado por um bairro só, o que fazia
    lugar salvo de outro recorte aparecer como "sem rolê hoje" mesmo tendo rolê.
    """
    rows = (
        await db.execute(
            select(Salvo, Lugar)
            .join(Lugar, Lugar.id == Salvo.lugar_id)
            .where(Salvo.usuario_id == usuario.id)
            .order_by(Salvo.created_at.desc())
        )
    ).all()

    itens = []
    for salvo, lugar in rows:
        role = await role_ativo_de_lugar(db, lugar.id)
        pin = None
        if role is not None:
            frescor = await frescor_de_role(db, role)
            pin = RolePin(
                id=role.id,
                titulo=role.titulo,
                categoria=role.categoria,
                data_inicio=role.data_inicio,
                data_fim=role.data_fim,
                frescor=frescor.value if frescor else None,
            )
        itens.append(
            SalvoDetalhe(lugar=lugar_to_public(lugar), role_ativo=pin, created_at=salvo.created_at)
        )
    return itens


@router.post("/sinalizacoes", response_model=SinalizacaoPublic, status_code=status.HTTP_201_CREATED)
async def sinalizar(
    body: SinalizacaoCreate, usuario: SinalizadorUser, db: DbSession
) -> Sinalizacao:
    """Cria **ou renova** o sinal desta pessoa neste alvo.

    Renova, e não empilha, porque uma segunda linha da mesma pessoa não é uma segunda
    pessoa. Antes desta regra, três toques em "Tô indo" da mesma conta somavam três
    sinais e acendiam o "Bombando agora" — a promessa central do app forjável com um
    dedo. `services/descoberta.py` também passou a contar pessoas distintas; as duas
    coisas são o mesmo conserto por dois lados, e a contagem distinta é a que vale
    mesmo para as linhas duplicadas que já existiam.

    Sinalizar de novo mais tarde é legítimo ("continuo aqui") e por isso renova o
    `timestamp`: o sinal volta a valer pela janela inteira, em vez de expirar no
    horário do primeiro toque.
    """
    corte = datetime.now(UTC) - timedelta(minutes=get_settings().frescor_warm_window_minutes)
    alvo = (
        Sinalizacao.role_id == body.role_id
        if body.role_id is not None
        else Sinalizacao.lugar_id == body.lugar_id
    )
    existente = await db.scalar(
        select(Sinalizacao)
        .where(Sinalizacao.usuario_id == usuario.id, alvo, Sinalizacao.timestamp >= corte)
        .order_by(Sinalizacao.timestamp.desc())
    )
    if existente is not None:
        existente.timestamp = datetime.now(UTC)
        existente.tipo = body.tipo
        await db.commit()
        await db.refresh(existente)
        return existente

    sinalizacao = Sinalizacao(
        usuario_id=usuario.id, role_id=body.role_id, lugar_id=body.lugar_id, tipo=body.tipo
    )
    db.add(sinalizacao)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alvo inexistente") from exc
    await db.refresh(sinalizacao)
    return sinalizacao


@router.get("/sinalizacoes/minhas", response_model=list[SinalizacaoPublic])
async def meus_sinais(usuario: CurrentUser, db: DbSession) -> list[Sinalizacao]:
    """Os sinais do próprio usuário que ainda estão valendo.

    Sem isto o "Tá marcado" da tela 2e vive só na memória do componente: ao sair do
    detalhe do rolê o estado some e o app volta a oferecer "Tô indo" para quem já
    marcou — dizendo à pessoa que o sinal dela não existe, quando ele está no banco
    alimentando o frescor. É a rota que permite rehidratar aquele estado.

    O recorte é a mesma janela warm que `services/frescor.py` usa para contar: um
    sinal fora dela já não afeta nada que se veja, então mostrá-lo como ativo seria
    outra forma de mentir.

    Devolve só o que é do requisitante. Sinalização é anônima por promessa do
    produto — não existe rota para ver o sinal de terceiros, nem agregada por pessoa.
    """
    corte = datetime.now(UTC) - timedelta(minutes=get_settings().frescor_warm_window_minutes)
    result = await db.execute(
        select(Sinalizacao)
        .where(Sinalizacao.usuario_id == usuario.id, Sinalizacao.timestamp >= corte)
        .order_by(Sinalizacao.timestamp.desc())
    )
    return list(result.scalars().all())


@router.delete("/sinalizacoes/{sinalizacao_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancelar_sinalizacao(
    sinalizacao_id: uuid.UUID, usuario: CurrentUser, db: DbSession
) -> None:
    """Desfaz o próprio sinal — o "cancelar meu sinal" da tela de confirmação.

    Sinal de outra pessoa devolve 404, não 403: 403 confirmaria que aquele id existe,
    e sinalização é anônima por promessa do produto.

    Note que aqui basta estar autenticado, sem a restrição de papel do POST: quem
    conseguiu criar pode desfazer, e negar isso prenderia a pessoa num sinal errado.

    Apaga também os **outros sinais ainda ativos da mesma pessoa no mesmo alvo**.
    Cancelar quer dizer "não vou": deixar de pé outra linha sua dizendo que vai seria
    falso, e era o que fazia o "Cancelar meu sinal" parecer não funcionar — apagava uma
    linha, a tela recarregava e achava a seguinte. Linhas já fora da janela ficam: elas
    não contam mais para nada e são histórico.
    """
    sinalizacao = await db.get(Sinalizacao, sinalizacao_id)
    if sinalizacao is None or sinalizacao.usuario_id != usuario.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Não encontrado")

    corte = datetime.now(UTC) - timedelta(minutes=get_settings().frescor_warm_window_minutes)
    alvo = (
        Sinalizacao.role_id == sinalizacao.role_id
        if sinalizacao.role_id is not None
        else Sinalizacao.lugar_id == sinalizacao.lugar_id
    )
    irmaos = (
        await db.execute(
            select(Sinalizacao).where(
                Sinalizacao.usuario_id == usuario.id,
                alvo,
                Sinalizacao.timestamp >= corte,
            )
        )
    ).scalars().all()

    for irmao in irmaos:
        await db.delete(irmao)
    if sinalizacao not in irmaos:
        await db.delete(sinalizacao)
    await db.commit()


@router.post("/comentarios", response_model=ComentarioPublic, status_code=status.HTTP_201_CREATED)
async def comentar(body: ComentarioCreate, usuario: CurrentUser, db: DbSession) -> Comentario:
    comentario = Comentario(
        autor_id=usuario.id, lugar_id=body.lugar_id, role_id=body.role_id, texto=body.texto
    )
    db.add(comentario)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alvo inexistente") from exc
    await db.refresh(comentario)
    return comentario
