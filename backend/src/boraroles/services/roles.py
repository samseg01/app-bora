from boraroles.db.models import Lugar, Role
from boraroles.schemas.role import RolePublic
from boraroles.services.frescor import FrescorEstado
from boraroles.services.presenca import raio_efetivo


def role_to_public(
    role: Role,
    frescor: FrescorEstado | None,
    sinais_recentes: int = 0,
    lugar: Lugar | None = None,
) -> RolePublic:
    """Serializa o rolê para leitura pública.

    `lugar` é opcional só porque nem toda chamada tem o objeto na mão. Quando vem, o
    `raio_metros` devolvido é o **efetivo** — já resolvido pela cascata rolê → lugar →
    padrão —, e não o valor cru da coluna. É o número que o cliente precisa: ele vai
    usá-lo para dizer "você precisa estar a até X metros" *antes* de a pessoa tentar, e
    o valor cru do rolê é `None` na esmagadora maioria dos casos, o que não explicaria
    nada.
    """
    return RolePublic(
        id=role.id,
        lugar_id=role.lugar_id,
        titulo=role.titulo,
        descricao=role.descricao,
        categoria=role.categoria,
        data_inicio=role.data_inicio,
        data_fim=role.data_fim,
        raio_metros=raio_efetivo(lugar, role) if lugar is not None else role.raio_metros,
        frescor=frescor.value if frescor else None,
        sinais_recentes=sinais_recentes,
        created_at=role.created_at,
    )
