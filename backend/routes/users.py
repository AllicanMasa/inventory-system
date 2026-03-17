from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

import auth
import models
import schemas
from database import get_db

router = APIRouter(tags=["auth"])
security = HTTPBearer(auto_error=False)

ROLE_PERMISSIONS = {
    "Super User": [
        "users:manage:all",
        "products:manage:all",
        "categories:manage:all",
        "suppliers:manage:all",
        "stock:in:all",
        "stock:out:all",
        "audit_logs:view:all",
        "settings:manage:global",
    ],
    "Admin": [
        "users:manage:department",
        "products:manage:department",
        "categories:manage:department",
        "suppliers:manage:department",
        "stock:in:department",
        "stock:out:department",
        "reports:view:department",
    ],
    "Staff": [
        "products:view",
        "stock:in",
        "stock:out",
    ],
}


def _build_auth_user(user: models.User, role_name: str) -> schemas.AuthUser:
    return schemas.AuthUser(
        id=user.id,
        name=user.name,
        email=user.email,
        role=role_name,
        department_id=user.department_id,
    )


def _get_user_and_role(db: Session, user_id: int):
    result = (
        db.query(models.User, models.Role.name)
        .join(models.Role, models.User.role_id == models.Role.id)
        .filter(models.User.id == user_id)
        .first()
    )
    return result


def _extract_token(credentials: HTTPAuthorizationCredentials | None) -> str:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    token = credentials.credentials
    if auth.is_token_revoked(token):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has been logged out")
    return token


@router.post("/auth/login", response_model=schemas.LoginResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    result = (
        db.query(models.User, models.Role.name)
        .join(models.Role, models.User.role_id == models.Role.id)
        .filter(models.User.email == payload.email)
        .first()
    )

    if not result:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    user, role_name = result

    if not user.status:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive")

    if user.password != payload.password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = auth.create_access_token({"sub": str(user.id)})
    permissions = ROLE_PERMISSIONS.get(role_name, [])

    return schemas.LoginResponse(
        access_token=token,
        user=_build_auth_user(user, role_name),
        permissions=permissions,
    )


@router.post("/auth/logout")
def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = _extract_token(credentials)
    auth.revoke_token(token)
    return {"message": "Logged out successfully"}


@router.get("/auth/me", response_model=schemas.LoginResponse)
def me(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    token = _extract_token(credentials)

    try:
        payload = auth.decode_access_token(token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    user_id = int(payload["sub"])
    result = _get_user_and_role(db, user_id)
    if not result:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    user, role_name = result
    if not user.status:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive")

    return schemas.LoginResponse(
        access_token=token,
        user=_build_auth_user(user, role_name),
        permissions=ROLE_PERMISSIONS.get(role_name, []),
    )
