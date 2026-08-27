import enum
import uuid
from datetime import datetime
from typing import Any

from geoalchemy2 import Geometry
from sqlalchemy import (
    ARRAY,
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from boraroles.db.base import Base


class PapelUsuario(enum.StrEnum):
    COMUM = "comum"
    CURADOR = "curador"
    DONO_ESTABELECIMENTO = "dono_estabelecimento"


class PlanoEstabelecimento(enum.StrEnum):
    ORGANICO = "organico"
    DESTACADO = "destacado"


class TipoSinalizacao(enum.StrEnum):
    PRESENCA = "presenca"
    FILA = "fila"
    LOTADO = "lotado"


def _pg_enum(enum_cls: type[enum.Enum], name: str) -> Enum:
    # sem values_callable, SQLAlchemy grava o .name do enum ("COMUM"), não o .value
    # ("comum") que é o que o tipo ENUM do Postgres realmente tem.
    return Enum(enum_cls, name=name, values_callable=lambda obj: [e.value for e in obj])


def _uuid_pk() -> Mapped[uuid.UUID]:
    return mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)


class Usuario(Base):
    __tablename__ = "usuario"

    id: Mapped[uuid.UUID] = _uuid_pk()
    nome: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    senha_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    papel: Mapped[PapelUsuario] = mapped_column(
        _pg_enum(PapelUsuario, "papel_usuario"),
        nullable=False,
        default=PapelUsuario.COMUM,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class Estabelecimento(Base):
    __tablename__ = "estabelecimento"

    id: Mapped[uuid.UUID] = _uuid_pk()
    dono_usuario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuario.id"), nullable=False
    )
    nome: Mapped[str] = mapped_column(String(160), nullable=False)
    plano: Mapped[PlanoEstabelecimento] = mapped_column(
        _pg_enum(PlanoEstabelecimento, "plano_estabelecimento"),
        nullable=False,
        default=PlanoEstabelecimento.ORGANICO,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class Lugar(Base):
    __tablename__ = "lugar"

    id: Mapped[uuid.UUID] = _uuid_pk()
    nome: Mapped[str] = mapped_column(String(160), nullable=False)
    categoria: Mapped[str] = mapped_column(String(60), index=True, nullable=False)
    # Any, não WKBElement: GeoAlchemy2 aceita/retorna formatos diferentes (WKBElement lido do
    # banco, WKTElement/from_shape() na escrita) e não expõe um tipo estático único e correto aqui.
    geo: Mapped[Any] = mapped_column(Geometry("POINT", srid=4326), nullable=False)
    bairro: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    estabelecimento_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("estabelecimento.id"), nullable=True
    )
    fotos: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    criado_por: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuario.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # sem índice GiST explícito aqui: GeoAlchemy2 cria "idx_lugar_geo"
    # automaticamente via evento de DDL (spatial_index=True é o default da coluna Geometry)


class Role(Base):
    """Rolê: evento efêmero associado a um Lugar. Nome de tabela sem acento de propósito."""

    __tablename__ = "role"

    id: Mapped[uuid.UUID] = _uuid_pk()
    lugar_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("lugar.id"), nullable=False
    )
    titulo: Mapped[str] = mapped_column(String(160), nullable=False)
    # O "motivo pra ir": o que o curador viu em campo e faz alguém sair de casa.
    # Nullable porque os rolês criados antes desta coluna não têm como preenchê-la —
    # e porque um rolê sem motivo ainda é publicável, só é pior.
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    categoria: Mapped[str] = mapped_column(String(60), index=True, nullable=False)
    data_inicio: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    data_fim: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    criado_por: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuario.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        Index("ix_role_lugar_janela", "lugar_id", "data_inicio", "data_fim"),
    )


class Sinalizacao(Base):
    __tablename__ = "sinalizacao"

    id: Mapped[uuid.UUID] = _uuid_pk()
    role_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("role.id"), nullable=True
    )
    lugar_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("lugar.id"), nullable=True
    )
    usuario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuario.id"), nullable=False
    )
    tipo: Mapped[TipoSinalizacao] = mapped_column(
        _pg_enum(TipoSinalizacao, "tipo_sinalizacao"), nullable=False
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        CheckConstraint(
            "(role_id IS NOT NULL AND lugar_id IS NULL) "
            "OR (role_id IS NULL AND lugar_id IS NOT NULL)",
            name="ck_sinalizacao_um_alvo",
        ),
        Index("ix_sinalizacao_role_timestamp", "role_id", "timestamp"),
        Index("ix_sinalizacao_lugar_timestamp", "lugar_id", "timestamp"),
    )


class Salvo(Base):
    __tablename__ = "salvo"

    id: Mapped[uuid.UUID] = _uuid_pk()
    usuario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuario.id"), nullable=False
    )
    lugar_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("lugar.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (UniqueConstraint("usuario_id", "lugar_id", name="uq_salvo_usuario_lugar"),)


class Comentario(Base):
    __tablename__ = "comentario"

    id: Mapped[uuid.UUID] = _uuid_pk()
    lugar_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("lugar.id"), nullable=True
    )
    role_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("role.id"), nullable=True
    )
    autor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuario.id"), nullable=False
    )
    texto: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        CheckConstraint(
            "(lugar_id IS NOT NULL AND role_id IS NULL) "
            "OR (lugar_id IS NULL AND role_id IS NOT NULL)",
            name="ck_comentario_um_alvo",
        ),
    )
