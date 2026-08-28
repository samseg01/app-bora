"""lugar: descrição, instagram, horário e preço da longneck

Escrita à mão, como as anteriores (ver ADR-002).

Os quatro campos são da **ficha do lugar** — permanentes, ao contrário de
`Role.descricao`, que é o motivo pra ir hoje e morre com o rolê. Todos nullable:
o curador anota na calçada o que conseguiu, e exigir campo cheio transformaria
uma anotação rápida num formulário.

`preco_longneck` vem acompanhado de `preco_visto_em` de propósito. Preço
envelhece, e um número sem idade na tela vira promessa que ninguém pode
cumprir — com a data, a tela diz "R$ 12, visto em 28/08", que é verdade
indefinidamente. Numeric(6,2) e não float: dinheiro não se guarda em binário
de ponto flutuante.

`instagram` guarda só o identificador, sem @ nem URL — a tela monta o link.

`horario_funcionamento` é texto livre e não estrutura de horário por dia. Uma
casa do Centro muda no feriado e ninguém mantém sete faixas atualizadas; a
programação recorrente ("quinta é forró") é outro assunto e está em aberto.

Revision ID: 5a2e8c31b7d4
Revises: 3d91c07ae5b6
Create Date: 2026-08-28 12:58:41.117203

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "5a2e8c31b7d4"
down_revision: str | Sequence[str] | None = "3d91c07ae5b6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("lugar", sa.Column("descricao", sa.Text(), nullable=True))
    op.add_column("lugar", sa.Column("instagram", sa.String(length=80), nullable=True))
    op.add_column(
        "lugar", sa.Column("horario_funcionamento", sa.String(length=255), nullable=True)
    )
    op.add_column("lugar", sa.Column("preco_longneck", sa.Numeric(6, 2), nullable=True))
    op.add_column("lugar", sa.Column("preco_visto_em", sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column("lugar", "preco_visto_em")
    op.drop_column("lugar", "preco_longneck")
    op.drop_column("lugar", "horario_funcionamento")
    op.drop_column("lugar", "instagram")
    op.drop_column("lugar", "descricao")
