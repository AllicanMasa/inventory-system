from datetime import datetime, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from backend import auth, models
from backend.database import get_db

# Initialize Bearer token security
security = HTTPBearer(auto_error=False)

# Permission mapping based on roles
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
    """
    Decodes the JWT and returns the list of permissions associated with the user's role.
    """
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = credentials.credentials

    if auth.is_token_revoked(token):
        raise HTTPException(status_code=401, detail="Token revoked")

    payload = auth.decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = int(payload["sub"])

    # Fetch user and role name in one join
    result = (
        db.query(models.User, models.Role.name)
        .join(models.Role, models.User.role_id == models.Role.id)
        .filter(models.User.id == user_id)
        .first()
    )

    try:
        payload = auth.decode_access_token(token)
    except ValueError as e:
        raise HTTPException(
        status_code=401,
        detail=str(e)
    )

    user, role_name = result
    # Normalize role name (e.g., "Super User" -> "super_user")
    role_key = role_name.lower().replace(" ", "_")

    return ROLE_PERMISSIONS.get(role_key, [])


def require_permission(required_prefix: str):
    """
    Decorator-style dependency to restrict routes based on permissions.
    """
    def checker(permissions: list = Depends(get_current_user_permissions)):
        for perm in permissions:
            # Check for exact match or hierarchical match
            if perm == required_prefix or perm.startswith(f"{required_prefix}:"):
                return True

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have the required permissions to access this resource.",
        )

    return checker


def get_current_user(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = credentials.credentials

    if auth.is_token_revoked(token):
        raise HTTPException(status_code=401, detail="Token revoked")

    payload = auth.decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = int(payload["sub"])
    user = db.query(models.User).filter(models.User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # ── UPDATE ONLINE STATUS ──
    user.last_seen = datetime.now(timezone.utc)
    db.add(user)
    db.commit()  # <-- this is required to save last_seen
    db.refresh(user)

    return user