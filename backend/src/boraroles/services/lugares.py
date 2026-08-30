import uuid

from sqlalchemy import ColumnElement, or_, select

from boraroles.core.geo import latlng_from_point
from boraroles.db.models import Comentario, Lugar, Role
from boraroles.schemas.lugar import LugarPublic


def comentarios_do_lugar(lugar_id: uuid.UUID) -> ColumnElement[bool]:
    """Comentários que pertencem a este lugar: os feitos nele **e** os feitos em rolês dele.

    `Comentario` aceita um alvo ou o outro (ver o CheckConstraint no modelo), e a tela de
    confirmação de sinalização — o "Contar como está lá dentro" da 2e — grava com
    `role_id`. Enquanto as duas leituras filtravam só por `lugar_id`, esses comentários
    ficavam gravados e invisíveis: nenhuma tela do app conseguia mostrá-los.

    Juntar os dois é o que o produto quer dizer de qualquer forma. Quem abre um lugar
    para decidir se vai quer ler como está lá dentro agora, e não faz diferença para
    quem lê se o texto foi escrito sobre a casa ou sobre o rolê de hoje na casa. A
    ordenação por recência já resolve o comentário velho.
    """
    return or_(
        Comentario.lugar_id == lugar_id,
        Comentario.role_id.in_(select(Role.id).where(Role.lugar_id == lugar_id)),
    )


def lugar_to_public(lugar: Lugar) -> LugarPublic:
    lat, lng = latlng_from_point(lugar.geo)
    return LugarPublic(
        id=lugar.id,
        nome=lugar.nome,
        categoria=lugar.categoria,
        lat=lat,
        lng=lng,
        bairro=lugar.bairro,
        endereco=lugar.endereco,
        descricao=lugar.descricao,
        instagram=lugar.instagram,
        horario_funcionamento=lugar.horario_funcionamento,
        programacao=lugar.programacao,
        horarios=lugar.horarios,
        preco_longneck=lugar.preco_longneck,
        preco_visto_em=lugar.preco_visto_em,
        estabelecimento_id=lugar.estabelecimento_id,
        fotos=lugar.fotos,
        tags=lugar.tags,
        created_at=lugar.created_at,
    )
