from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from boraroles.api.deps import DbSession
from boraroles.core.security import create_access_token, hash_password, verify_password
from boraroles.db.models import PapelUsuario, Usuario
from boraroles.schemas.auth import LoginRequest, SignupRequest, TokenResponse, UsuarioPublic

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=UsuarioPublic, status_code=status.HTTP_201_CREATED)
async def signup(body: SignupRequest, db: DbSession) -> Usuario:
    existente = await db.scalar(select(Usuario).where(Usuario.email == body.email))
    if existente is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email já cadastrado")

    # Cadastro sempre cria papel=comum; promoção a curador/dono_estabelecimento é manual
    # via scripts/promote_role.py (ADR-007) — nunca self-service.
    usuario = Usuario(
        nome=body.nome,
        email=body.email,
        senha_hash=hash_password(body.senha),
        papel=PapelUsuario.COMUM,
    )
    db.add(usuario)
    await db.commit()
    await db.refresh(usuario)
    return usuario


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: DbSession) -> TokenResponse:
    usuario = await db.scalar(select(Usuario).where(Usuario.email == body.email))
    if usuario is None or not verify_password(body.senha, usuario.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Email ou senha inválidos"
        )
    token = create_access_token(usuario.id, usuario.papel)
    return TokenResponse(access_token=token)
