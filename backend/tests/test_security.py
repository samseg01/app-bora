import uuid
from datetime import UTC, datetime, timedelta

import jwt
import pytest

from boraroles.config import get_settings
from boraroles.core.security import (
    InvalidTokenError,
    create_access_token,
    decode_token,
    hash_password,
    verify_password,
)
from boraroles.db.models import PapelUsuario


def test_hash_roundtrip() -> None:
    hashed = hash_password("senha-super-secreta")
    assert hashed != "senha-super-secreta"
    assert verify_password("senha-super-secreta", hashed)
    assert not verify_password("senha-errada", hashed)


def test_jwt_roundtrip() -> None:
    usuario_id = uuid.uuid4()
    token = create_access_token(usuario_id, PapelUsuario.CURADOR)
    payload = decode_token(token)
    assert payload.sub == usuario_id
    assert payload.papel == PapelUsuario.CURADOR


def test_jwt_expired_token_rejeitado() -> None:
    settings = get_settings()
    now = datetime.now(UTC)
    expired_payload = {
        "sub": str(uuid.uuid4()),
        "papel": PapelUsuario.COMUM.value,
        "iat": now - timedelta(minutes=10),
        "exp": now - timedelta(minutes=1),
    }
    expired_token = jwt.encode(expired_payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    with pytest.raises(InvalidTokenError):
        decode_token(expired_token)


def test_jwt_token_adulterado_rejeitado() -> None:
    token = create_access_token(uuid.uuid4(), PapelUsuario.COMUM)
    with pytest.raises(InvalidTokenError):
        decode_token(token + "adulterado")
