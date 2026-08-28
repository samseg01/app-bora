import uuid
from datetime import datetime

from pydantic import BaseModel, Field, model_validator


class RoleCreate(BaseModel):
    lugar_id: uuid.UUID
    titulo: str = Field(min_length=1, max_length=160)
    # O "motivo pra ir" — opcional, mas é o que faz alguém sair de casa.
    descricao: str | None = Field(default=None, max_length=2000)
    categoria: str = Field(min_length=1, max_length=60)
    data_inicio: datetime
    data_fim: datetime

    @model_validator(mode="after")
    def _valida_janela(self) -> "RoleCreate":
        if self.data_fim <= self.data_inicio:
            raise ValueError("data_fim precisa ser depois de data_inicio")
        return self


class RoleUpdate(BaseModel):
    titulo: str | None = Field(default=None, min_length=1, max_length=160)
    descricao: str | None = Field(default=None, max_length=2000)
    categoria: str | None = Field(default=None, min_length=1, max_length=60)
    data_inicio: datetime | None = None
    data_fim: datetime | None = None


class RolePublic(BaseModel):
    id: uuid.UUID
    lugar_id: uuid.UUID
    titulo: str
    descricao: str | None
    categoria: str
    data_inicio: datetime
    data_fim: datetime
    frescor: str | None
    created_at: datetime


class RoleDescoberta(BaseModel):
    """Item de GET /descoberta — inclui o Lugar embutido pra a tela não precisar de outra chamada."""

    id: uuid.UUID
    # Sem isto a home não conseguia salvar o lugar de um card: só tinha o nome dele, e
    # `POST /salvos` pede o id. O botão ficava desabilitado por falta de dado, não por regra.
    lugar_id: uuid.UUID
    titulo: str
    descricao: str | None
    categoria: str
    data_inicio: datetime
    data_fim: datetime
    frescor: str | None
    lugar_nome: str
    lugar_bairro: str
