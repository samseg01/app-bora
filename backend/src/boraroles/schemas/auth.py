import uuid

from pydantic import BaseModel, EmailStr, Field

from boraroles.db.models import PapelUsuario


class SignupRequest(BaseModel):
    nome: str = Field(min_length=1, max_length=120)
    email: EmailStr
    senha: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    senha: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UsuarioPublic(BaseModel):
    id: uuid.UUID
    nome: str
    email: EmailStr
    papel: PapelUsuario

    model_config = {"from_attributes": True}
