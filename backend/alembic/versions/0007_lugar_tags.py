"""lugar.tags — o que a casa tem, além do que ela é

Escrita à mão (ver ADR-002).

`categoria` responde **o que o lugar é** (boteco, praça, casa de show) e é uma
só. `tags` responde **como ele é por dentro** — mesa na calçada, cerveja barata,
tem forró — e são várias. As duas não se substituem: um boteco com mesa na
calçada e um boteco sem são a mesma categoria e decisões diferentes para quem lê.

`ARRAY(String)`, como `fotos`, e não tabela de junção: o vocabulário é fechado no
cliente (`frontend/src/lib/tags.ts`), a lista é curta, e não há consulta por tag
nesta fase — a decisão registrada é exibir, não filtrar. Se um dia entrar filtro,
o passo é um índice GIN nesta mesma coluna, sem mudar a forma do dado.

Nullable, como todo campo de ficha: o curador anota o que viu, e exigir tag
transformaria uma anotação de calçada num formulário obrigatório.

Revision ID: b3d81f0a6c27
Revises: 9c1a7e42f8b3
Create Date: 2026-08-30 10:12:44.201883

"""
from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "b3d81f0a6c27"
down_revision: str | Sequence[str] | None = "9c1a7e42f8b3"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("lugar", sa.Column("tags", postgresql.ARRAY(sa.String()), nullable=True))


def downgrade() -> None:
    op.drop_column("lugar", "tags")
