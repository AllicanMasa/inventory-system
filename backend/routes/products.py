from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from backend import auth, crud, schemas, models
from backend.audit import log_action
from backend.database import get_db

router = APIRouter()
security = HTTPBearer(auto_error=False)


def _extract_token(credentials: HTTPAuthorizationCredentials | None) -> str:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    token = credentials.credentials
    if auth.is_token_revoked(token):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has been logged out")
    return token


def get_current_user(db: Session, credentials: HTTPAuthorizationCredentials):
    token = _extract_token(credentials)
    payload = auth.decode_access_token(token)
    user_id = int(payload["sub"])
    return db.query(models.User).filter(models.User.id == user_id).first()


@router.post("/products")
def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    current_user = get_current_user(db, credentials)
    new_product = models.Product(**product.dict())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    if current_user:
        log_action(db, current_user.id, f"Created product {new_product.name} (id={new_product.id})")
    return new_product


@router.get("/products")
def get_products(db: Session = Depends(get_db)):
    return crud.get_products(db)


@router.put("/products/{id}")
def update_product(
    id: int,
    product: schemas.ProductCreate,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    current_user = get_current_user(db, credentials)
    db_product = db.query(models.Product).filter(models.Product.id == id).first()

    if not db_product:
        return {"error": "Product not found"}

    for key, value in product.dict().items():
        setattr(db_product, key, value)

    db.commit()
    db.refresh(db_product)
    if current_user:
        log_action(db, current_user.id, f"Updated product {db_product.name} (id={db_product.id})")

    return db_product


@router.delete("/products/{id}")
def delete_product(
    id: int,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    current_user = get_current_user(db, credentials)
    product = db.query(models.Product).filter(models.Product.id == id).first()

    if not product:
        return {"error": "Product not found"}

    deleted_name = product.name
    db.delete(product)
    db.commit()
    if current_user:
        log_action(db, current_user.id, f"Deleted product {deleted_name} (id={id})")

    return {"message": "Product deleted"}
