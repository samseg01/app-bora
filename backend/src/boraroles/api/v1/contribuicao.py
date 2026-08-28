import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from boraroles.api.deps import CurrentUser, DbSession, require_role
from boraroles.db.models import Comentario, PapelUsuario, Salvo, Sinalizacao, Usuario
from boraroles.schemas.comentario import ComentarioCreate, ComentarioPublic
from boraroles.schemas.salvo import SalvoCreate, SalvoPublic
from boraroles.schemas.sinalizacao import SinalizacaoCreate, SinalizacaoPublic

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


@router.get("/salvos", response_model=list[SalvoPublic])
async def listar_salvos(usuario: CurrentUser, db: DbSession) -> list[Salvo]:
    result = await db.execute(select(Salvo).where(Salvo.usuario_id == usuario.id))
    return list(result.scalars().all())


@router.post("/sinalizacoes", response_model=SinalizacaoPublic, status_code=status.HTTP_201_CREATED)
async def sinalizar(
    body: SinalizacaoCreate, usuario: SinalizadorUser, db: DbSession
) -> Sinalizacao:
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


@router.delete("/sinalizacoes/{sinalizacao_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancelar_sinalizacao(
    sinalizacao_id: uuid.UUID, usuario: CurrentUser, db: DbSession
) -> None:
    """Desfaz o próprio sinal — o "cancelar meu sinal" da tela de confirmação.

    Sinal de outra pessoa devolve 404, não 403: 403 confirmaria que aquele id existe,
    e sinalização é anônima por promessa do produto.

    Note que aqui basta estar autenticado, sem a restrição de papel do POST: quem
    conseguiu criar pode desfazer, e negar isso prenderia a pessoa num sinal errado.
    """
    sinalizacao = await db.get(Sinalizacao, sinalizacao_id)
    if sinalizacao is None or sinalizacao.usuario_id != usuario.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Não encontrado")
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
