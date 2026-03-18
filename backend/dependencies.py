from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from backend import auth, models
from backend.database import get_db

security = HTTPBearer(auto_error=False)

# SAME permissions mapping
ROLE_PERMISSIONS = {
    "super_user": [
        "users:manage:all",
        "products:manage:all",
        "categories:manage:all",
        "suppliers:manage:all",
        "stock:in:all",
        "stock:out:all",
        "audit_logs:view:all",
        "settings:manage:global",
    ],
    "admin": [
        "products:manage:department",
        "categories:manage:department",
        "suppliers:manage:department",
        "stock:in:department",
        "stock:out:department",
        "audit_logs:view:all",
    ],
    "staff": [
        "stock:in",
        "stock:out",
    ],
}


def get_current_user_permissions(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = credentials.credentials

    if auth.is_token_revoked(token):
        raise HTTPException(status_code=401, detail="Token revoked")

    payload = auth.decode_access_token(token)
    user_id = int(payload["sub"])

    result = (
        db.query(models.User, models.Role.name)
        .join(models.Role, models.User.role_id == models.Role.id)
        .filter(models.User.id == user_id)
        .first()
    )

    if not result:
        raise HTTPException(status_code=401, detail="User not found")

    user, role_name = result
    role_key = role_name.lower().replace(" ", "_")

    permissions = ROLE_PERMISSIONS.get(role_key, [])
    return permissions


def require_permission(required_prefix: str):
    def checker(permissions: list = Depends(get_current_user_permissions)):
        for perm in permissions:
            if perm == required_prefix or perm.startswith(f"{required_prefix}:"):
                return True

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )

    return checker