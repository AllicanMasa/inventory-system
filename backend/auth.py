import os
import time
from typing import Any, Dict
from fastapi import HTTPException, status
from jose import jwt, ExpiredSignatureError, JWTError

ALGORITHM = "HS256"
SECRET_KEY = os.getenv("AUTH_SECRET_KEY", "change-me-in-production")
TOKEN_EXPIRE_SECONDS = 60 * 60 * 8  # 8 hours
REVOKED_TOKENS: set[str] = set()


def create_access_token(payload: Dict[str, Any]) -> str:
    body = payload.copy()
    body["exp"] = int(time.time()) + TOKEN_EXPIRE_SECONDS
    return jwt.encode(body, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired"
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )


def revoke_token(token: str) -> None:
    REVOKED_TOKENS.add(token)


def is_token_revoked(token: str) -> bool:
    return token in REVOKED_TOKENS
