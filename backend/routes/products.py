from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend import crud, schemas, models
from backend.audit import log_action
from backend.database import get_db
from backend.dependencies import get_current_user, require_permission

router = APIRouter(prefix="/products", tags=["Products"])


# ✅ PUBLIC (or you can protect this too)
@router.get("/")
def get_products(db: Session = Depends(get_db)):
    return crud.get_products(db)


# ✅ CREATE PRODUCT
@router.post("/")
def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    _: bool = Depends(require_permission("products:manage")),
):
    new_product = models.Product(**product.dict())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    log_action(
        db,
        current_user.id,
        f"Created product {new_product.name} (id={new_product.id})",
    )

    return new_product


# ✅ UPDATE PRODUCT
@router.put("/{id}")
def update_product(
    id: int,
    product: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    _: bool = Depends(require_permission("products:manage")),
):
    db_product = db.query(models.Product).filter(models.Product.id == id).first()

    if not db_product:
        return {"error": "Product not found"}

    for key, value in product.dict().items():
        setattr(db_product, key, value)

    db.commit()
    db.refresh(db_product)

    log_action(
        db,
        current_user.id,
        f"Updated product {db_product.name} (id={db_product.id})",
    )

    return db_product


# ✅ DELETE PRODUCT
@router.delete("/{id}")
def delete_product(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    _: bool = Depends(require_permission("products:manage")),
):
    product = db.query(models.Product).filter(models.Product.id == id).first()

    if not product:
        return {"error": "Product not found"}

    deleted_name = product.name

    db.delete(product)
    db.commit()

    log_action(
        db,
        current_user.id,
        f"Deleted product {deleted_name} (id={id})",
    )

    return {"message": "Product deleted"}