import uuid
from datetime import datetime

from pydantic import BaseModel, Field, model_validator


class ComentarioCreate(BaseModel):
    lugar_id: uuid.UUID | None = None
    role_id: uuid.UUID | None = None
    texto: str = Field(min_length=1, max_length=2000)

    @model_validator(mode="after")
    def _valida_um_alvo(self) -> "ComentarioCreate":
        if (self.lugar_id is None) == (self.role_id is None):
            raise ValueError("informe exatamente um de lugar_id ou role_id")
        return self


class ComentarioPublic(BaseModel):
    id: uuid.UUID
    lugar_id: uuid.UUID | None
    role_id: uuid.UUID | None
    autor_id: uuid.UUID
    texto: str
    created_at: datetime
