"""lugar.horarios — funcionamento estruturado, em faixas

Escrita à mão (ver ADR-002).

Substitui `horario_funcionamento`, que era texto livre. Estruturado destrava a
pergunta que o produto de fato faz — **esta casa está aberta agora?** — que com
texto livre é impossível sem adivinhar.

Forma: `[{"dias": [1,2,3,4,5], "abre": "12:00", "fecha": "01:00"}]`, com
0 = domingo. Lista de faixas, e não uma só, porque "ter a qui até 2h, sex e sáb
até 4h" é o caso comum num bar.

`fecha` menor que `abre` significa atravessar a meia-noite, que é a regra e não a
exceção neste produto.

Esta migration **só adiciona**. A coluna antiga fica até o dado existente ser
convertido e a interface parar de lê-la — expandir, migrar, contrair. Dropar
junto perderia o que já foi preenchido em campo, e havia um registro real
("segunda a sexta - 12:00 às 01:00") quando isto foi escrito. Ver item 46 do
TODO.

Revision ID: 9c1a7e42f8b3
Revises: 7f4b2d9e0c15
Create Date: 2026-08-28 14:26:33.509118

"""
from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "9c1a7e42f8b3"
down_revision: str | Sequence[str] | None = "7f4b2d9e0c15"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("lugar", sa.Column("horarios", postgresql.JSONB(), nullable=True))


def downgrade() -> None:
    op.drop_column("lugar", "horarios")
