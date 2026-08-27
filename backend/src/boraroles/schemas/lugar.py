import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class LugarCreate(BaseModel):
    nome: str = Field(min_length=1, max_length=160)
    categoria: str = Field(min_length=1, max_length=60)
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    bairro: str = Field(min_length=1, max_length=80)
    estabelecimento_id: uuid.UUID | None = None
    fotos: list[str] | None = None


class LugarUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=1, max_length=160)
    categoria: str | None = Field(default=None, min_length=1, max_length=60)
    lat: float | None = Field(default=None, ge=-90, le=90)
    lng: float | None = Field(default=None, ge=-180, le=180)
    bairro: str | None = Field(default=None, min_length=1, max_length=80)
    estabelecimento_id: uuid.UUID | None = None
    fotos: list[str] | None = None


class LugarPublic(BaseModel):
    id: uuid.UUID
    nome: str
    categoria: str
    lat: float
    lng: float
    bairro: str
    estabelecimento_id: uuid.UUID | None
    fotos: list[str] | None
    created_at: datetime


class RolePin(BaseModel):
    """Rolê ativo num pin do mapa, com o frescor já classificado."""

    id: uuid.UUID
    titulo: str
    categoria: str
    data_inicio: datetime
    data_fim: datetime
    frescor: str | None


class MapaPin(BaseModel):
    lugar: LugarPublic
    role_ativo: RolePin | None
    total_comentarios: int


class ComentarioResumo(BaseModel):
    autor_nome: str
    texto: str
    created_at: datetime


class LugarDetalhe(LugarPublic):
    comentarios_recentes: list[ComentarioResumo]
    frescor: str | None
