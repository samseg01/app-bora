"""initial schema

Escrita à mão (não autogenerate) — GeoAlchemy2 tem diff automático problemático
em colunas Geometry. Cria a extensão PostGIS, as 7 tabelas do modelo de
domínio, os enums, os índices (inclusive o GiST em lugar.geo) e as constraints
CHECK de "exatamente um alvo" em sinalizacao/comentario.

Revision ID: 1c276c275067
Revises:
Create Date: 2026-08-26 19:51:18.886518

"""
from collections.abc import Sequence

import geoalchemy2
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "1c276c275067"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    op.create_table(
        "usuario",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("nome", sa.String(120), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("senha_hash", sa.String(255), nullable=False),
        sa.Column(
            "papel",
            sa.Enum("comum", "curador", "dono_estabelecimento", name="papel_usuario"),
            nullable=False,
            server_default="comum",
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_usuario_email", "usuario", ["email"], unique=True)

    op.create_table(
        "estabelecimento",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "dono_usuario_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("usuario.id"),
            nullable=False,
        ),
        sa.Column("nome", sa.String(160), nullable=False),
        sa.Column(
            "plano",
            sa.Enum("organico", "destacado", name="plano_estabelecimento"),
            nullable=False,
            server_default="organico",
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )

    op.create_table(
        "lugar",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("nome", sa.String(160), nullable=False),
        sa.Column("categoria", sa.String(60), nullable=False),
        sa.Column(
            "geo",
            geoalchemy2.Geometry(geometry_type="POINT", srid=4326),
            nullable=False,
        ),
        sa.Column("bairro", sa.String(80), nullable=False),
        sa.Column(
            "estabelecimento_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("estabelecimento.id"),
            nullable=True,
        ),
        sa.Column("fotos", postgresql.ARRAY(sa.String), nullable=True),
        sa.Column(
            "criado_por", postgresql.UUID(as_uuid=True), sa.ForeignKey("usuario.id"), nullable=False
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_lugar_categoria", "lugar", ["categoria"])
    op.create_index("ix_lugar_bairro", "lugar", ["bairro"])
    # sem índice GiST explícito: GeoAlchemy2 cria "idx_lugar_geo" automaticamente
    # (spatial_index=True é o default da coluna Geometry, dispara no evento after_create)

    op.create_table(
        "role",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("lugar_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("lugar.id"), nullable=False),
        sa.Column("titulo", sa.String(160), nullable=False),
        sa.Column("categoria", sa.String(60), nullable=False),
        sa.Column("data_inicio", sa.DateTime(timezone=True), nullable=False),
        sa.Column("data_fim", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "criado_por", postgresql.UUID(as_uuid=True), sa.ForeignKey("usuario.id"), nullable=False
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_role_categoria", "role", ["categoria"])
    op.create_index("ix_role_lugar_janela", "role", ["lugar_id", "data_inicio", "data_fim"])

    op.create_table(
        "sinalizacao",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("role_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("role.id"), nullable=True),
        sa.Column("lugar_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("lugar.id"), nullable=True),
        sa.Column(
            "usuario_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("usuario.id"), nullable=False
        ),
        sa.Column(
            "tipo",
            sa.Enum("presenca", "fila", "lotado", name="tipo_sinalizacao"),
            nullable=False,
        ),
        sa.Column(
            "timestamp", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.CheckConstraint(
            "(role_id IS NOT NULL AND lugar_id IS NULL) "
            "OR (role_id IS NULL AND lugar_id IS NOT NULL)",
            name="ck_sinalizacao_um_alvo",
        ),
    )
    op.create_index("ix_sinalizacao_role_timestamp", "sinalizacao", ["role_id", "timestamp"])
    op.create_index("ix_sinalizacao_lugar_timestamp", "sinalizacao", ["lugar_id", "timestamp"])

    op.create_table(
        "salvo",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "usuario_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("usuario.id"), nullable=False
        ),
        sa.Column("lugar_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("lugar.id"), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.UniqueConstraint("usuario_id", "lugar_id", name="uq_salvo_usuario_lugar"),
    )

    op.create_table(
        "comentario",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("lugar_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("lugar.id"), nullable=True),
        sa.Column("role_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("role.id"), nullable=True),
        sa.Column(
            "autor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("usuario.id"), nullable=False
        ),
        sa.Column("texto", sa.Text, nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.CheckConstraint(
            "(lugar_id IS NOT NULL AND role_id IS NULL) "
            "OR (lugar_id IS NULL AND role_id IS NOT NULL)",
            name="ck_comentario_um_alvo",
        ),
    )


def downgrade() -> None:
    op.drop_table("comentario")
    op.drop_table("salvo")
    op.drop_table("sinalizacao")
    op.execute("DROP TYPE IF EXISTS tipo_sinalizacao")
    op.drop_table("role")
    op.drop_table("lugar")
    op.drop_table("estabelecimento")
    op.execute("DROP TYPE IF EXISTS plano_estabelecimento")
    op.drop_table("usuario")
    op.execute("DROP TYPE IF EXISTS papel_usuario")
