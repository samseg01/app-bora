import uuid
from datetime import datetime

from pydantic import BaseModel

from boraroles.schemas.lugar import LugarPublic, RolePin


class SalvoCreate(BaseModel):
    lugar_id: uuid.UUID


class SalvoPublic(BaseModel):
    """Resposta do POST — só a confirmação de que salvou."""

    lugar_id: uuid.UUID
    created_at: datetime


class SalvoDetalhe(BaseModel):
    """Item do GET /salvos: o lugar inteiro e o rolê de hoje nele, se houver.

    Antes o GET devolvia só `lugar_id`, e a tela do caderninho tinha de descobrir o resto
    sozinha: uma chamada a `/lugares/{id}` por item, mais um `GET /mapa` para saber quais
    tinham rolê. E o `/mapa` é filtrado por bairro — então um lugar salvo fora do recorte
    selecionado aparecia como "sem rolê hoje" **mesmo tendo rolê**. A tela afirmava uma
    coisa que não sabia.

    O caderninho é pessoal e atravessa bairros por natureza: alguém salva um boteco na
    República e um sarau em Pinheiros. Perguntar isso ao mapa de um bairro só era a
    pergunta errada; quem sabe a resposta é esta rota, que olha cada lugar salvo.
    """

    lugar: LugarPublic
    role_ativo: RolePin | None
    created_at: datetime
