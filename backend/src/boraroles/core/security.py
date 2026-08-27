import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

import jwt
from pwdlib import PasswordHash

from boraroles.config import get_settings
from boraroles.db.models import PapelUsuario

_password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return _password_hash.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return _password_hash.verify(password, hashed)


@dataclass(frozen=True)
class TokenPayload:
    sub: uuid.UUID
    papel: PapelUsuario


class InvalidTokenError(Exception):
    pass


def create_access_token(usuario_id: uuid.UUID, papel: PapelUsuario) -> str:
    settings = get_settings()
    now = datetime.now(UTC)
    payload = {
        "sub": str(usuario_id),
        "papel": papel.value,
        "iat": now,
        "exp": now + timedelta(minutes=settings.jwt_expires_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> TokenPayload:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return TokenPayload(sub=uuid.UUID(payload["sub"]), papel=PapelUsuario(payload["papel"]))
    except (jwt.PyJWTError, KeyError, ValueError) as exc:
        raise InvalidTokenError from exc
