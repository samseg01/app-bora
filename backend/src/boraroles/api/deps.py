import uuid
from collections.abc import Awaitable, Callable
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from boraroles.core.security import InvalidTokenError, decode_token
from boraroles.db.models import Estabelecimento, PapelUsuario, Usuario
from boraroles.db.session import get_session

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

get_db = get_session
DbSession = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: DbSession) -> Usuario:
    try:
        payload = decode_token(token)
    except InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    usuario = await db.get(Usuario, payload.sub)
    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário não encontrado"
        )
    return usuario


CurrentUser = Annotated[Usuario, Depends(get_current_user)]


def require_role(*papeis: PapelUsuario) -> Callable[[Usuario], Awaitable[Usuario]]:
    async def checker(usuario: CurrentUser) -> Usuario:
        if usuario.papel not in papeis:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Sem permissão para essa ação"
            )
        return usuario

    return checker


async def require_estabelecimento_owner(
    estabelecimento_id: uuid.UUID, usuario: CurrentUser, db: DbSession
) -> Estabelecimento:
    estabelecimento = await db.get(Estabelecimento, estabelecimento_id)
    if estabelecimento is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Estabelecimento não encontrado"
        )
    if estabelecimento.dono_usuario_id != usuario.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Você não é dono desse estabelecimento"
        )
    return estabelecimento
