"""CLI manual pra promover um usuário a curador/dono_estabelecimento (ADR-007).

De propósito, não existe endpoint HTTP pra isso — promoção de papel é sempre
uma ação manual contra o banco, nunca self-service.

Uso: uv run python scripts/promote_role.py usuario@exemplo.com curador
"""

import asyncio
import sys

from sqlalchemy import select

from boraroles.db.models import PapelUsuario, Usuario
from boraroles.db.session import async_session_maker


async def promote(email: str, papel: PapelUsuario) -> None:
    async with async_session_maker() as session:
        usuario = await session.scalar(select(Usuario).where(Usuario.email == email))
        if usuario is None:
            print(f"Usuário {email} não encontrado")
            sys.exit(1)
        usuario.papel = papel
        await session.commit()
        print(f"{email} agora é {papel.value}")


def main() -> None:
    if len(sys.argv) != 3:
        print("Uso: python scripts/promote_role.py <email> <papel>")
        print(f"Papéis válidos: {', '.join(p.value for p in PapelUsuario)}")
        sys.exit(1)

    email, papel_str = sys.argv[1], sys.argv[2]
    try:
        papel = PapelUsuario(papel_str)
    except ValueError:
        print(f"Papel inválido: {papel_str}")
        print(f"Papéis válidos: {', '.join(p.value for p in PapelUsuario)}")
        sys.exit(1)

    asyncio.run(promote(email, papel))


if __name__ == "__main__":
    main()
