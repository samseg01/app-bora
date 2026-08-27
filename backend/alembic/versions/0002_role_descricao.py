"""role.descricao — o "motivo pra ir"

Escrita à mão, como a 0001 (ver ADR-0002 e a docstring de lá).

Nullable de propósito: os rolês criados antes desta coluna não têm como
preenchê-la, e um rolê sem motivo continua publicável — só é pior. Sem
server_default: string vazia e NULL diriam coisas diferentes ("o curador não
escreveu" vs "escreveu nada"), e só NULL é honesto aqui.

Revision ID: 8b3f1a4c9d20
Revises: 1c276c275067
Create Date: 2026-08-27 15:12:04.331902

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "8b3f1a4c9d20"
down_revision: str | Sequence[str] | None = "1c276c275067"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("role", sa.Column("descricao", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("role", "descricao")
