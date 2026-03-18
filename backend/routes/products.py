from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend import crud, schemas, models
from backend.database import get_db

router = APIRouter()


@router.post("/products")
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    new_product = models.Product(**product.dict())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product


@router.get("/products")
def get_products(db: Session = Depends(get_db)):
    return crud.get_products(db)


@router.put("/products/{id}")
def update_product(id: int, product: schemas.ProductCreate, db: Session = Depends(get_db)):
    db_product = db.query(models.Product).filter(models.Product.id == id).first()

    if not db_product:
        return {"error": "Product not found"}

    for key, value in product.dict().items():
        setattr(db_product, key, value)

    db.commit()
    db.refresh(db_product)

    return db_product


@router.delete("/products/{id}")
def delete_product(id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == id).first()

    if not product:
        return {"error": "Product not found"}

    db.delete(product)
    db.commit()

    return {"message": "Product deleted"}