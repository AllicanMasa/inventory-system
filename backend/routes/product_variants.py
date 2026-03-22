from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend import models
from backend.dependencies import require_permission, get_current_user
from backend.audit import log_action

router = APIRouter(prefix="/variants", tags=["Variants"])


# ------------------ GET ALL VARIANTS ------------------
@router.get("/")
def get_variants(db: Session = Depends(get_db)):
    results = (
        db.query(
            models.ProductVariant.id,
            models.ProductVariant.sku,
            models.ProductVariant.size,
            models.ProductVariant.color,
            models.ProductVariant.quantity,
            models.Product.name.label("product_name"),
            models.Product.price,
            models.Product.min_stock, # <--- ADD THIS LINE
            models.Category.name.label("category"),
        )
        .join(models.Product, models.ProductVariant.product_id == models.Product.id)
        .join(models.Category, models.Product.category_id == models.Category.id)
        .all()
    )

    return [
        {
            "id": r.id,
            "sku": r.sku,
            "size": r.size,
            "color": r.color,
            "quantity": r.quantity,
            "product_name": r.product_name,
            "price": float(r.price),
            "min_stock": r.min_stock, # <--- ADD THIS LINE
            "category": r.category,
        }
        for r in results
    ]


# ------------------ UPDATE VARIANT ------------------
@router.put("/{id}")
def update_variant(
    id: int,
    data: dict,  # Can be replaced with Pydantic schema for stricter validation
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    _: bool = Depends(require_permission("products:manage")),
):
    """
    Edit a single variant.
    """
    variant = db.query(models.ProductVariant).filter_by(id=id).first()
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")

    # Update safely
    variant.size = data.get("size", variant.size)
    variant.color = data.get("color", variant.color)
    variant.quantity = data.get("quantity", variant.quantity)

    db.commit()
    db.refresh(variant)

    log_action(
        db,
        current_user.id,
        f"Updated variant {variant.sku} (id={variant.id})",
    )

    return variant


# ------------------ DELETE VARIANT ------------------
@router.delete("/{id}")
def delete_variant(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    _: bool = Depends(require_permission("products:manage")),
):
    """
    Delete a single variant.
    """
    variant = db.query(models.ProductVariant).filter_by(id=id).first()
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")

    db.delete(variant)
    db.commit()

    log_action(
        db,
        current_user.id,
        f"Deleted variant {variant.sku} (id={id})",
    )

    return {"message": "Variant deleted"}