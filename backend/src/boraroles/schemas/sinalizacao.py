import uuid
from datetime import datetime

from pydantic import BaseModel, Field, model_validator

from boraroles.db.models import TipoSinalizacao


class SinalizacaoCreate(BaseModel):
    role_id: uuid.UUID | None = None
    lugar_id: uuid.UUID | None = None
    tipo: TipoSinalizacao
    # Onde a pessoa está NESTE momento, para o servidor conferir se ela está no lugar
    # (ADR-009). Obrigatório para tudo que não seja `intencao` — ver `_valida_local`.
    #
    # A coordenada é conferida e DESCARTADA: não vai para coluna nenhuma, não entra em
    # log. É parâmetro de consulta e morre na requisição, igual em `GET /lugares/proximos`.
    # Num app que promete não guardar onde você esteve, isso é a promessa, não um detalhe
    # de implementação.
    lat: float | None = Field(default=None, ge=-90, le=90)
    lng: float | None = Field(default=None, ge=-180, le=180)

    @model_validator(mode="after")
    def _valida_um_alvo(self) -> "SinalizacaoCreate":
        if (self.role_id is None) == (self.lugar_id is None):
            raise ValueError("informe exatamente um de role_id ou lugar_id")
        return self

    @model_validator(mode="after")
    def _valida_local(self) -> "SinalizacaoCreate":
        """Quem afirma estar no lugar precisa dizer onde está.

        `intencao` ("Tô indo") é o único tipo que dispensa: ela afirma o contrário — que
        a pessoa NÃO está lá. Exigir GPS de quem avisa que vem seria pedir localização
        para nada, e o ADR-009 é explícito em que sem permissão não há sinal de presença.

        Recusar aqui, e não no cliente, é o ponto: no cliente basta não chamar.
        """
        exige_local = self.tipo is not TipoSinalizacao.INTENCAO
        if exige_local and (self.lat is None or self.lng is None):
            raise ValueError(
                "lat e lng são obrigatórios para sinalizar presença — "
                "só 'intencao' (Tô indo) dispensa localização"
            )
        if not exige_local and (self.lat is not None or self.lng is not None):
            raise ValueError("'intencao' não aceita localização: quem vai indo não está lá")
        return self


class SinalizacaoPublic(BaseModel):
    id: uuid.UUID
    role_id: uuid.UUID | None
    lugar_id: uuid.UUID | None
    tipo: TipoSinalizacao
    timestamp: datetime
