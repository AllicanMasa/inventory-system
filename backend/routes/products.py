from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from backend import models, schemas, crud
from backend.database import get_db
from backend.dependencies import get_current_user, require_permission
from backend.audit import log_action

router = APIRouter(prefix="/products", tags=["Products"])


# ------------------ HELPERS ------------------

def generate_sku(base_sku: str, color: str, size: str) -> str:
    def format_val(val):
        return (val or "NA").upper().replace(" ", "-")
    return f"{base_sku}-{format_val(color)}-{format_val(size)}"


def check_duplicate_variant(db, product_id, size, color):
    existing = db.query(models.ProductVariant).filter_by(
        product_id=product_id,
        size=size,
        color=color
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Variant already exists (same color and size)"
        )


# ------------------ GET ALL PRODUCTS ------------------

@router.get("/")
def get_products(db: Session = Depends(get_db)):
    return crud.get_products(db)


# ------------------ CREATE PRODUCT ------------------

@router.post("/")
def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    _: bool = Depends(require_permission("products:manage")),
):
    product_data = product.dict(exclude={"variants"})
    new_product = models.Product(**product_data)

    db.add(new_product)
    db.flush()  # get ID

    try:
        if product.variants:
            for var in product.variants:
                check_duplicate_variant(
                    db, new_product.id, var.size, var.color
                )

                new_variant = models.ProductVariant(
                    product_id=new_product.id,
                    size=var.size,
                    color=var.color,
                    sku=generate_sku(new_product.sku, var.color, var.size),
                    quantity=var.quantity or 0,
                )
                db.add(new_variant)

        db.commit()

    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Duplicate SKU or invalid data")

    db.refresh(new_product)

    log_action(
        db,
        current_user.id,
        f"Created product {new_product.name} (id={new_product.id})"
    )

    return new_product


# ------------------ UPDATE PRODUCT ------------------

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
        raise HTTPException(status_code=404, detail="Product not found")

    incoming_data = product.dict(exclude_unset=True)

    for key, value in incoming_data.items():
        if key != "variants":
            setattr(db_product, key, value)

    try:
        if incoming_data.get("variants") is not None:
            db_product.variants.clear()

            for var in product.variants: # type: ignore
                check_duplicate_variant(db, id, var.size, var.color)

                new_variant = models.ProductVariant(
                    product_id=id,
                    size=var.size,
                    color=var.color,
                    sku=generate_sku(db_product.sku, var.color, var.size),
                    quantity=var.quantity or 0,
                )
                db_product.variants.append(new_variant)

        db.commit()

    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Duplicate SKU or invalid update")

    db.refresh(db_product)

    log_action(
        db,
        current_user.id,
        f"Updated product {db_product.name} (id={id})"
    )

    return db_product


# ------------------ DELETE PRODUCT ------------------

@router.delete("/{id}")
def delete_product(
    id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user),
    _: bool = Depends(require_permission("products:manage"))
):
    product = db.query(models.Product).filter(models.Product.id == id).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Soft delete the product
    product.is_active = False
    
    # Optional: Also soft-delete all associated variants so they don't hang around
    for variant in product.variants:
        variant.is_active = False
        
    db.commit()
    
    log_action(db, current_user.id, f"Deactivated product {product.name} (id={id})")
    return {"message": "Product and variants deactivated"}


# ------------------ ADD VARIANT ------------------

@router.post("/{product_id}/variants")
def add_variant_to_product(
    product_id: int,
    variant: schemas.VariantBase,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    _: bool = Depends(require_permission("products:manage")),
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Prevent duplicate color + size
    check_duplicate_variant(db, product_id, variant.size, variant.color)

    new_variant = models.ProductVariant(
        product_id=product_id,
        size=variant.size,
        color=variant.color,
        sku=generate_sku(product.sku, variant.color, variant.size),
        quantity=variant.quantity or 0,
    )

    db.add(new_variant)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="SKU already exists")

    db.refresh(product)

    log_action(
        db,
        current_user.id,
        f"Added variant {new_variant.sku} to product {product.name} (id={product_id})",
    )

    return product