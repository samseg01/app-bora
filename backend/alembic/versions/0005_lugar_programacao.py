"""lugar.programacao — o que a casa costuma ter na semana

Escrita à mão (ver ADR-002). Texto livre, nullable.

É **texto**, e não estrutura de recorrência que gera rolê. Gerar exigiria uma de
duas coisas que o projeto não tem: um cron, recusado pelo ADR-004 nesta fase; ou
rolê derivado na leitura, que não tem linha no banco — e como `Sinalizacao.role_id`
e `Comentario.role_id` são FK, um forró de quinta derivado não poderia ser
sinalizado nem comentado. Acender é justamente o ponto. Ver item 44 do TODO.

A distinção também é de produto, não só técnica: **programação é o que a casa
costuma ter; rolê é o que alguém foi ver hoje.** A primeira é declarada, a segunda
é verificada. A tela precisa manter as duas separadas — é a mesma linha que o
ADR-008 propõe entre o que o app garante e o que ele atribui.

Revision ID: 7f4b2d9e0c15
Revises: 5a2e8c31b7d4
Create Date: 2026-08-28 13:41:07.882014

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "7f4b2d9e0c15"
down_revision: str | Sequence[str] | None = "5a2e8c31b7d4"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("lugar", sa.Column("programacao", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("lugar", "programacao")
