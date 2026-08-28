"""lugar.endereco — o endereço que quem lê precisa para chegar

Escrita à mão, como a 0001 e a 0002 (ver ADR-0002).

Nullable de propósito, por dois motivos. O lugar já é localizável por `geo`
sozinho, então o endereço não é requisito do sistema — é conveniência de quem
lê e vai a pé. E o curador em campo nem sempre tem o número na mão: exigir o
endereço para cadastrar um lugar transformaria uma anotação de calçada num
formulário, que é exatamente o atrito que a curadoria manual não pode ter.

Sem `server_default`: NULL significa "ninguém anotou ainda", e string vazia
significaria "anotaram que não tem". Só o primeiro é verdade aqui.

Revision ID: 3d91c07ae5b6
Revises: 8b3f1a4c9d20
Create Date: 2026-08-28 08:41:19.204871

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "3d91c07ae5b6"
down_revision: str | Sequence[str] | None = "8b3f1a4c9d20"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("lugar", sa.Column("endereco", sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column("lugar", "endereco")
