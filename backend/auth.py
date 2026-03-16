import base64
import hashlib
import hmac
import json
import os
import time
from typing import Any, Dict

SECRET_KEY = os.getenv("AUTH_SECRET_KEY", "change-me-in-production")
TOKEN_EXPIRE_SECONDS = 60 * 60 * 8  # 8 hours
REVOKED_TOKENS: set[str] = set()


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def _sign(data: str) -> str:
    signature = hmac.new(SECRET_KEY.encode("utf-8"), data.encode("utf-8"), hashlib.sha256).digest()
    return _b64url_encode(signature)


def create_access_token(payload: Dict[str, Any]) -> str:
    body = payload.copy()
    body["exp"] = int(time.time()) + TOKEN_EXPIRE_SECONDS
    encoded_payload = _b64url_encode(json.dumps(body, separators=(",", ":")).encode("utf-8"))
    signature = _sign(encoded_payload)
    return f"{encoded_payload}.{signature}"


def decode_access_token(token: str) -> Dict[str, Any]:
    try:
        encoded_payload, signature = token.split(".", 1)
    except ValueError as exc:
        raise ValueError("Invalid token format") from exc

    expected_signature = _sign(encoded_payload)
    if not hmac.compare_digest(signature, expected_signature):
        raise ValueError("Invalid token signature")

    payload = json.loads(_b64url_decode(encoded_payload).decode("utf-8"))
    if int(payload.get("exp", 0)) < int(time.time()):
        raise ValueError("Token expired")

    return payload


def revoke_token(token: str) -> None:
    REVOKED_TOKENS.add(token)


def is_token_revoked(token: str) -> bool:
    return token in REVOKED_TOKENS
