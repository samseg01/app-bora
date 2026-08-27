from boraroles.db.models import Role
from boraroles.schemas.role import RolePublic
from boraroles.services.frescor import FrescorEstado


def role_to_public(role: Role, frescor: FrescorEstado | None) -> RolePublic:
    return RolePublic(
        id=role.id,
        lugar_id=role.lugar_id,
        titulo=role.titulo,
        descricao=role.descricao,
        categoria=role.categoria,
        data_inicio=role.data_inicio,
        data_fim=role.data_fim,
        frescor=frescor.value if frescor else None,
        created_at=role.created_at,
    )
