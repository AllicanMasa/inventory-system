from sqlalchemy.orm import Session
from backend import models
from sqlalchemy.orm import joinedload


def create_product(db: Session, product):
    db_product = models.Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


def get_products(db: Session):
    return (
        db.query(models.Product)
        .options(joinedload(models.Product.variants))   # ← this is the key line
        .all()
    )