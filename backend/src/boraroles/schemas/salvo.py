import uuid
from datetime import datetime

from pydantic import BaseModel


class SalvoCreate(BaseModel):
    lugar_id: uuid.UUID


class SalvoPublic(BaseModel):
    lugar_id: uuid.UUID
    created_at: datetime
