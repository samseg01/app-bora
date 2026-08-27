import uuid
from datetime import datetime

from pydantic import BaseModel

from boraroles.db.models import PlanoEstabelecimento


class EstabelecimentoPublic(BaseModel):
    id: uuid.UUID
    dono_usuario_id: uuid.UUID
    nome: str
    plano: PlanoEstabelecimento
    created_at: datetime


class EngajamentoPorLugar(BaseModel):
    lugar_id: uuid.UUID
    lugar_nome: str
    total_salvos: int
    total_sinalizacoes: int


class EngajamentoEstabelecimento(BaseModel):
    estabelecimento_id: uuid.UUID
    total_salvos: int
    total_sinalizacoes: int
    por_lugar: list[EngajamentoPorLugar]
