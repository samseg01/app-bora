import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator


class FaixaHorario(BaseModel):
    """Uma faixa de funcionamento: quais dias, de que hora a que hora.

    `dias` usa 0 = domingo. `fecha` menor que `abre` atravessa a meia-noite — que neste
    produto é a regra, não a exceção.
    """

    dias: list[int] = Field(min_length=1, max_length=7)
    abre: str = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    fecha: str = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")

    @field_validator("dias")
    @classmethod
    def _dias_validos(cls, v: list[int]) -> list[int]:
        if any(d < 0 or d > 6 for d in v):
            raise ValueError("dia fora de 0 (domingo) a 6 (sábado)")
        return sorted(set(v))


class LugarCreate(BaseModel):
    nome: str = Field(min_length=1, max_length=160)
    categoria: str = Field(min_length=1, max_length=60)
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    bairro: str = Field(min_length=1, max_length=80)
    endereco: str | None = Field(default=None, max_length=255)
    descricao: str | None = Field(default=None, max_length=2000)
    instagram: str | None = Field(default=None, max_length=80)
    horario_funcionamento: str | None = Field(default=None, max_length=255)
    programacao: str | None = Field(default=None, max_length=2000)
    horarios: list[FaixaHorario] | None = None
    preco_longneck: Decimal | None = Field(default=None, ge=0, le=9999)
    estabelecimento_id: uuid.UUID | None = None
    fotos: list[str] | None = None


class LugarUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=1, max_length=160)
    categoria: str | None = Field(default=None, min_length=1, max_length=60)
    lat: float | None = Field(default=None, ge=-90, le=90)
    lng: float | None = Field(default=None, ge=-180, le=180)
    bairro: str | None = Field(default=None, min_length=1, max_length=80)
    endereco: str | None = Field(default=None, max_length=255)
    descricao: str | None = Field(default=None, max_length=2000)
    instagram: str | None = Field(default=None, max_length=80)
    horario_funcionamento: str | None = Field(default=None, max_length=255)
    programacao: str | None = Field(default=None, max_length=2000)
    horarios: list[FaixaHorario] | None = None
    preco_longneck: Decimal | None = Field(default=None, ge=0, le=9999)
    estabelecimento_id: uuid.UUID | None = None
    fotos: list[str] | None = None


class LugarPublic(BaseModel):
    id: uuid.UUID
    nome: str
    categoria: str
    lat: float
    lng: float
    bairro: str
    endereco: str | None
    descricao: str | None
    instagram: str | None
    horario_funcionamento: str | None
    programacao: str | None
    horarios: list[FaixaHorario] | None
    preco_longneck: Decimal | None
    #: Preço envelhece — a tela mostra "R$ 12, visto em 28/08", nunca o número sozinho.
    preco_visto_em: date | None
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
    #: Frescor do LUGAR, de sinalizações com `lugar_id` — independente de haver rolê.
    #: Sem isto um bar cheio numa terça, sem nada programado, fica com pin apagado para
    #: sempre: é o degrau de baixo da escada do `conceito.md`, invisível no mapa.
    frescor: str | None
    total_comentarios: int


class LugarProximo(BaseModel):
    """Item de GET /lugares/proximos — o mesmo pin do mapa, mais a distância.

    `distancia_m` é em metros sobre a esfera (cast para `geography` no PostGIS), não
    graus: a tela mostra "a 700 m" para uma pessoa decidindo se vai a pé.
    """

    lugar: LugarPublic
    distancia_m: int
    role_ativo: RolePin | None


class ComentarioResumo(BaseModel):
    autor_nome: str
    texto: str
    created_at: datetime


class LugarDetalhe(LugarPublic):
    comentarios_recentes: list[ComentarioResumo]
    frescor: str | None
