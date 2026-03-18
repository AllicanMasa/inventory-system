from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from backend import auth, models, schemas
from backend.database import get_db
from fastapi import Body

router = APIRouter(tags=["auth"])
security = HTTPBearer(auto_error=False)

# Permissions mapped by normalized role keys
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
        "reports:view:department",
        "audit_logs:view:all",
    ],
    "staff": [
        "stock:in",
        "stock:out",
    ],
}


def _build_auth_user(user: models.User, role_name: str) -> schemas.AuthUser:
    return schemas.AuthUser(
        id=user.id,
        name=user.name,
        email=user.email,
        role=role_name,  # Keep display name nice
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

    # create token
    token = auth.create_access_token({"sub": str(user.id)})

    # normalize role_name to match ROLE_PERMISSIONS keys
    role_name_key = role_name.lower().replace(" ", "_")
    permissions = ROLE_PERMISSIONS.get(role_name_key, [])

    return schemas.LoginResponse(
        access_token=token,
        user=_build_auth_user(user, role_name),  # original role name for display
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

    # normalize role_name for permissions lookup
    role_name_key = role_name.lower().replace(" ", "_")
    permissions = ROLE_PERMISSIONS.get(role_name_key, [])

    return schemas.LoginResponse(
        access_token=token,
        user=_build_auth_user(user, role_name),  # keep display name
        permissions=permissions,
    )

@router.get("/users", response_model=list[schemas.UserOut])
def get_users(db: Session = Depends(get_db), credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = _extract_token(credentials)
    payload = auth.decode_access_token(token)
    current_user_id = int(payload["sub"])
    current_user = db.query(models.User).filter(models.User.id == current_user_id).first()

    # Super admin sees all users
    if current_user.role_id == 1:  # super_user
        users = db.query(models.User).all()
    else:
        # Admin sees only users from their department
        users = db.query(models.User).filter(models.User.department_id == current_user.department_id).all()
    return users

# POST add user
@router.post("/users", response_model=schemas.UserOut)
def create_user(payload: schemas.UserCreate, db: Session = Depends(get_db), credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = _extract_token(credentials)
    payload_token = auth.decode_access_token(token)
    current_user_id = int(payload_token["sub"])
    current_user = db.query(models.User).filter(models.User.id == current_user_id).first()

    # Only super admin can add super users
    if payload.role_id == 1 and current_user.role_id != 1:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot create super user")
    
    new_user = models.User(
        name=payload.name,
        email=payload.email,
        password=payload.password or "default123",
        role_id=payload.role_id,
        department_id=payload.department_id,
        status=payload.status if payload.status is not None else True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

# PUT edit user
@router.put("/users/{user_id}", response_model=schemas.UserOut)
def update_user(user_id: int, payload: schemas.UserUpdate, db: Session = Depends(get_db), credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = _extract_token(credentials)
    payload_token = auth.decode_access_token(token)
    current_user_id = int(payload_token["sub"])
    current_user = db.query(models.User).filter(models.User.id == current_user_id).first()

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Only super admin can change roles or department outside their own
    if current_user.role_id != 1:
        if payload.role_id and payload.role_id == 1:
            raise HTTPException(status_code=403, detail="Cannot assign super user role")
        if payload.department_id and payload.department_id != current_user.department_id:
            raise HTTPException(status_code=403, detail="Cannot change department outside your own")

    for field in ["name", "email", "role_id", "department_id", "status", "password"]:
        value = getattr(payload, field, None)
        if value is not None:
            setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    return user

# DELETE user
@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = _extract_token(credentials)
    payload_token = auth.decode_access_token(token)
    current_user_id = int(payload_token["sub"])
    current_user = db.query(models.User).filter(models.User.id == current_user_id).first()

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Admin cannot delete super users
    if current_user.role_id != 1 and user.role_id == 1:
        raise HTTPException(status_code=403, detail="Cannot delete super user")
    
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

# Get all roles
@router.get("/roles", response_model=list[schemas.RoleOut])
def get_roles(db: Session = Depends(get_db)):
    return db.query(models.Role).all()

# Get all departments
@router.get("/departments", response_model=list[schemas.DepartmentOut])
def get_departments(db: Session = Depends(get_db)):
    return db.query(models.Department).all()