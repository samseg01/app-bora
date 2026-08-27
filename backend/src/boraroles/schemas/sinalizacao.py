import uuid
from datetime import datetime

from pydantic import BaseModel, model_validator

from boraroles.db.models import TipoSinalizacao


class SinalizacaoCreate(BaseModel):
    role_id: uuid.UUID | None = None
    lugar_id: uuid.UUID | None = None
    tipo: TipoSinalizacao

    @model_validator(mode="after")
    def _valida_um_alvo(self) -> "SinalizacaoCreate":
        if (self.role_id is None) == (self.lugar_id is None):
            raise ValueError("informe exatamente um de role_id ou lugar_id")
        return self


class SinalizacaoPublic(BaseModel):
    id: uuid.UUID
    role_id: uuid.UUID | None
    lugar_id: uuid.UUID | None
    tipo: TipoSinalizacao
    timestamp: datetime
