"""Authentication, password hashing and signed token utilities."""

import hashlib
import hmac
import os
import secrets
import time

TOKEN_TTL_SECONDS = 24 * 60 * 60  # tokens last 24 hours
DEV_AUTH_SECRET = "dev-only-secret-change-me"


def hash_password(password: str) -> str:
    """Generate a secure PBKDF2 HMAC SHA-256 hash with random 16-byte salt."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
    return f"{salt}${key.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify that a plain password matches the hashed string."""
    try:
        salt, key_hex = hashed_password.split("$", 1)
        key = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt.encode("utf-8"), 100_000)
        return secrets.compare_digest(key.hex(), key_hex)
    except Exception:
        return False


def _secret() -> bytes:
    """Signing key from AUTH_SECRET. Falls back to a dev value for local runs and tests."""
    return os.getenv("AUTH_SECRET", DEV_AUTH_SECRET).encode("utf-8")


def _sign(message: str) -> str:
    return hmac.new(_secret(), message.encode("utf-8"), hashlib.sha256).hexdigest()


def create_token(user_id, now: float | None = None) -> str:
    """Return a signed token: '<user_id>.<expiry>.<signature>'."""
    expires = int((now if now is not None else time.time()) + TOKEN_TTL_SECONDS)
    message = f"{user_id}.{expires}"
    return f"{message}.{_sign(message)}"


def decode_token(token: str, now: float | None = None) -> str | None:
    """Return the user id if the token is genuine and not expired, else None."""
    try:
        user_id, expires, signature = token.split(".")
        if not hmac.compare_digest(_sign(f"{user_id}.{expires}"), signature):
            return None
        if int(expires) < (now if now is not None else time.time()):
            return None
        return user_id
    except Exception:
        return None