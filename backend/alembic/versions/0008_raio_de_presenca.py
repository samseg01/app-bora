"""raio de presença no lugar e no rolê, e o tipo `intencao`

Escrita à mão (ver ADR-002). Primeira consequência de schema do **ADR-009**, aceito
em 01/09/2026.

## Por que duas colunas, e não uma

O ADR-009 proposto fazia o raio ser configuração global (~150 m para tudo). Na
aceitação isso caiu: o perímetro que significa "você está aqui" não é propriedade do
sistema, é propriedade física do lugar. Um número único erra nas duas direções ao
mesmo tempo — apertado demais para uma festa de rua, largo demais para separar dois
bares vizinhos do Largo do Arouche.

`lugar.raio_metros` é o padrão da casa, e é onde o dado nasce: quem mede é o curador,
de pé na calçada, durante a curadoria de campo (R3). O tamanho de um bar não muda
entre uma quinta e um sábado, então guardar isso no rolê obrigaria a redigitar o mesmo
número toda semana.

`role.raio_metros` existe para a exceção: a festa que transborda para a rua, o show que
ocupa o quarteirão. Quando preenchido, ganha do lugar.

A resolução fica em `services/presenca.raio_efetivo()`: rolê → lugar → padrão do
`config.py`. As duas colunas são nullable porque o padrão precisa continuar existindo —
exigir um raio em todo cadastro transformaria uma anotação de calçada em formulário
obrigatório, que é a mesma razão de `tags` e do resto da ficha.

## Por que o tipo `intencao`

A segunda emenda do ADR-009 separou o que sempre esteve espremido num botão só:
"Tô aqui" (no lugar, verificado, alimenta o frescor) e "Tô indo" (de fora, sem GPS,
avisa quem te acompanha). São ações diferentes e precisam ser distinguíveis no dado —
senão a separação existe só no rótulo e o frescor continua contando intenção como
presença, que é exatamente a incoerência que o ADR foi escrito para resolver.

`intencao` entra no enum existente em vez de virar tabela nova porque a forma do dado é
idêntica (quem, em quê, quando) e a `Sinalizacao` já carrega a constraint de alvo único.

⚠️ **`ALTER TYPE ... ADD VALUE` não tem downgrade.** O Postgres não remove valor de
enum: seria preciso recriar o tipo e reescrever a coluna. O downgrade abaixo derruba as
colunas e **deixa o valor no enum**, o que é seguro (nada obriga a usá-lo) e está dito
aqui para ninguém achar que é esquecimento.

Revision ID: c7e4a91b2d58
Revises: b3d81f0a6c27
Create Date: 2026-09-01 23:58:12.446201

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "c7e4a91b2d58"
down_revision: str | Sequence[str] | None = "b3d81f0a6c27"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("lugar", sa.Column("raio_metros", sa.Integer(), nullable=True))
    op.add_column("role", sa.Column("raio_metros", sa.Integer(), nullable=True))
    # PG 12+ aceita ADD VALUE dentro de transação desde que o valor não seja *usado*
    # na mesma transação. Esta migration só o declara, então está ok.
    op.execute("ALTER TYPE tipo_sinalizacao ADD VALUE IF NOT EXISTS 'intencao'")


def downgrade() -> None:
    op.drop_column("role", "raio_metros")
    op.drop_column("lugar", "raio_metros")
    # 'intencao' permanece no enum — ver a nota no cabeçalho.
