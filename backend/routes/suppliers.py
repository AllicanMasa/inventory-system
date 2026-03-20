from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend import models, schemas, auth
from backend.audit import log_action
from backend.database import get_db
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

router = APIRouter(tags=["suppliers"])
security = HTTPBearer(auto_error=False)

def get_current_user(db, credentials):
    token = credentials.credentials
    payload = auth.decode_access_token(token)
    user_id = int(payload["sub"])
    return db.query(models.User).filter(models.User.id == user_id).first()

def _extract_token(credentials: HTTPAuthorizationCredentials | None) -> str:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    token = credentials.credentials
    if auth.is_token_revoked(token):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has been logged out")
    return token

@router.get("/suppliers", response_model=list[schemas.Supplier])
def get_suppliers(db: Session = Depends(get_db), credentials: HTTPAuthorizationCredentials = Depends(security)):
    _extract_token(credentials)
    return db.query(models.Supplier).all()


@router.post("/suppliers", response_model=schemas.Supplier)
def create_supplier(supplier: schemas.SupplierCreate, db: Session = Depends(get_db), credentials: HTTPAuthorizationCredentials = Depends(security)):
    _extract_token(credentials)
    current_user = get_current_user(db, credentials)
    new_supplier = models.Supplier(
        name=supplier.name,
        phone=supplier.phone,
        email=supplier.email,
        address=supplier.address,
    )
    db.add(new_supplier)
    db.commit()
    db.refresh(new_supplier)
    if current_user:
        log_action(db, current_user.id, f"Created supplier {new_supplier.name} (id={new_supplier.id})")
    return new_supplier


@router.put("/suppliers/{supplier_id}", response_model=schemas.Supplier)
def update_supplier(supplier_id: int, supplier: schemas.SupplierCreate, db: Session = Depends(get_db), credentials: HTTPAuthorizationCredentials = Depends(security)):
    _extract_token(credentials)
    current_user = get_current_user(db, credentials)
    db_supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    db_supplier.name = supplier.name
    db_supplier.phone = supplier.phone
    db_supplier.email = supplier.email
    db_supplier.address = supplier.address
    db.commit()
    db.refresh(db_supplier)
    if current_user:
        log_action(db, current_user.id, f"Updated supplier {db_supplier.name} (id={db_supplier.id})")
    return db_supplier


@router.delete("/suppliers/{supplier_id}")
def delete_supplier(supplier_id: int, db: Session = Depends(get_db), credentials: HTTPAuthorizationCredentials = Depends(security)):
    _extract_token(credentials)
    current_user = get_current_user(db, credentials)
    db_supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    deleted_name = db_supplier.name
    db.delete(db_supplier)
    db.commit()
    if current_user:
        log_action(db, current_user.id, f"Deleted supplier {deleted_name} (id={supplier_id})")
    return {"message": "Supplier deleted successfully"}