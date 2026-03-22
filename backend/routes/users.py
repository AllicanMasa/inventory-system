from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from backend import auth, models, schemas
from backend.audit import log_action
from backend.database import get_db

router = APIRouter(tags=["auth"])
security = HTTPBearer(auto_error=False)

# Permissions mapped by normalized role keys
ROLE_PERMISSIONS = {
    "super_user": [
        "users:manage:all", "products:manage:all", "categories:manage:all",
        "suppliers:manage:all", "stock:in:all", "stock:out:all",
        "audit_logs:view:all", "settings:manage:global",
    ],
    "admin": [
        "products:manage:department", "categories:manage:department",
        "suppliers:manage:department", "stock:in:department",
        "stock:out:department", "reports:view:department",
        "audit_logs:view:all",
    ],
    "staff": [
        "stock:in", "stock:out",
    ],
}

# --- HELPERS ---

def _build_auth_user(user: models.User, role_name: str) -> schemas.AuthUser:
    return schemas.AuthUser(
        id=user.id,
        name=user.name,
        email=user.email,
        role=role_name,
        department_id=user.department_id,
    )

def _get_user_and_role(db: Session, user_id: int):
    return (
        db.query(models.User, models.Role.name)
        .join(models.Role, models.User.role_id == models.Role.id)
        .filter(models.User.id == user_id)
        .first()
    )

def _extract_token(credentials: HTTPAuthorizationCredentials | None) -> str:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Authentication required"
        )
    token = credentials.credentials
    if auth.is_token_revoked(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Token has been logged out"
        )
    return token

# --- AUTH ENDPOINTS ---

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
    
    role_name_key = role_name.lower().replace(" ", "_")
    permissions = ROLE_PERMISSIONS.get(role_name_key, [])

    return schemas.LoginResponse(
        access_token=token,
        user=_build_auth_user(user, role_name),
        permissions=permissions,
    )

@router.post("/auth/logout")
def logout(db: Session = Depends(get_db), credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = _extract_token(credentials)
    
    try:
        # Update last_seen to 10 mins ago so they disappear from "Online Staff" immediately
        payload = auth.decode_access_token(token)
        user_id = int(payload["sub"])
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if user:
            user.last_seen = datetime.utcnow() - timedelta(minutes=10)
            db.commit()
    except Exception:
        pass # If token is invalid, we still want to revoke it

    auth.revoke_token(token)
    return {"message": "Logged out successfully"}

@router.get("/auth/me", response_model=schemas.LoginResponse)
def me(db: Session = Depends(get_db), credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = _extract_token(credentials)
    try:
        payload = auth.decode_access_token(token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    result = _get_user_and_role(db, int(payload["sub"]))
    if not result or not result[0].status:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User unavailable")

    user, role_name = result
    role_name_key = role_name.lower().replace(" ", "_")
    
    return schemas.LoginResponse(
        access_token=token,
        user=_build_auth_user(user, role_name),
        permissions=ROLE_PERMISSIONS.get(role_name_key, []),
    )

# --- USER MANAGEMENT ---

@router.get("/users", response_model=list[schemas.UserOut])
def get_users(db: Session = Depends(get_db), credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = _extract_token(credentials)
    payload = auth.decode_access_token(token)
    current_user = db.query(models.User).filter(models.User.id == int(payload["sub"])).first()

    if current_user.role_id == 1:
        return db.query(models.User).all()
    
    return db.query(models.User).filter(models.User.department_id == current_user.department_id).all()

@router.post("/users", response_model=schemas.UserOut)
def create_user(payload: schemas.UserCreate, db: Session = Depends(get_db), credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = _extract_token(credentials)
    payload_token = auth.decode_access_token(token)
    current_user_id = int(payload_token["sub"])
    current_user = db.query(models.User).filter(models.User.id == current_user_id).first()

    if payload.role_id == 1 and current_user.role_id != 1:
        raise HTTPException(status_code=403, detail="Cannot create super user")
    
    new_user = models.User(
        **payload.dict(exclude={"status"}),
        status=payload.status if payload.status is not None else True
    )
    if not new_user.password: new_user.password = "default123"
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    log_action(db, current_user_id, f"Created user {new_user.email}")
    return new_user

@router.put("/users/{user_id}", response_model=schemas.UserOut)
def update_user(user_id: int, payload: schemas.UserUpdate, db: Session = Depends(get_db), credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = _extract_token(credentials)
    current_user_id = int(auth.decode_access_token(token)["sub"])
    current_user = db.query(models.User).filter(models.User.id == current_user_id).first()

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")

    if current_user.role_id != 1:
        if payload.role_id == 1: raise HTTPException(status_code=403, detail="Forbidden action")
        if payload.department_id and payload.department_id != current_user.department_id:
            raise HTTPException(status_code=403, detail="Department mismatch")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    log_action(db, current_user_id, f"Updated user {user.email}")
    return user

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = _extract_token(credentials)
    current_user_id = int(auth.decode_access_token(token)["sub"])
    current_user = db.query(models.User).filter(models.User.id == current_user_id).first()

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    
    if current_user.role_id != 1 and user.role_id == 1:
        raise HTTPException(status_code=403, detail="Cannot delete super user")
    
    email = user.email
    db.delete(user)
    db.commit()
    log_action(db, current_user_id, f"Deleted user {email}")
    return {"message": "User deleted successfully"}

@router.get("/roles", response_model=list[schemas.RoleOut])
def get_roles(db: Session = Depends(get_db)):
    return db.query(models.Role).all()

@router.get("/departments", response_model=list[schemas.DepartmentOut])
def get_departments(db: Session = Depends(get_db)):
    return db.query(models.Department).all()