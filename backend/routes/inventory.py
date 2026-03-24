from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from backend.database import get_db
from backend.dependencies import require_permission, get_current_user
from backend import models
from backend.audit import log_action

router = APIRouter(prefix="/inventory", tags=["inventory"])

# ── GET CURRENT INVENTORY ──
@router.get("/", dependencies=[Depends(require_permission("stock:in"))])
def get_inventory(db: Session = Depends(get_db)):
    results = (
        db.query(
            models.ProductVariant.id.label("variant_id"),
            models.Product.name.label("product_name"),
            models.ProductVariant.sku,
            models.ProductVariant.size,
            models.ProductVariant.color,
            models.ProductVariant.quantity,
            models.Product.min_stock,
            models.Category.name.label("category"),
        )
        .join(models.Product, models.ProductVariant.product_id == models.Product.id)
        .outerjoin(models.Category, models.Product.category_id == models.Category.id)
        .filter(models.ProductVariant.is_active == True)
        .all()
    )

    return [
        {
            "id": r.variant_id,
            "product_name": r.product_name,
            "sku": r.sku,
            "size": r.size,
            "color": r.color,
            "quantity": r.quantity or 0,
            "min_stock": r.min_stock or 0,
            "category": r.category,
        }
        for r in results
    ]

# ── POST STOCK TRANSACTION (IN/OUT/RETURN) ──
@router.post("/stock", dependencies=[Depends(require_permission("stock:in"))])
def stock_transaction(
    data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    variant_id = data.get("variant_id")
    type_input = (data.get("type") or "").upper()
    quantity = int(data.get("quantity", 0))
    direction_input = (data.get("direction") or "").upper()
    supplier_id = data.get("supplier_id")
    notes = data.get("notes")

    # 1. Validation
    if not variant_id or not type_input or quantity <= 0:
        raise HTTPException(status_code=400, detail="Missing required fields or invalid quantity")

    variant = db.query(models.ProductVariant).filter(models.ProductVariant.id == variant_id).first()
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")

    # 2. Logic & Quantity Updates
    db_type = ""
    db_direction = None

    if type_input == "IN":
        variant.quantity += quantity
        db_type = "stock_in"
    
    elif type_input == "OUT":
        if variant.quantity < quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock for this variant")
        variant.quantity -= quantity
        db_type = "stock_out"

    elif type_input == "RETURN":
        if direction_input not in ["IN", "OUT"]:
            raise HTTPException(status_code=400, detail="Direction (IN/OUT) required for Returns")
        
        db_direction = direction_input
        db_type = "return"  # <--- FIX: Force the type to stay "return"
        
        if direction_input == "IN":
            variant.quantity += quantity
        else:
            if variant.quantity < quantity:
                raise HTTPException(status_code=400, detail="Insufficient stock to return to supplier")
            variant.quantity -= quantity

    # 3. Save Transaction
    try:
        transaction = models.StockTransaction(
            variant_id=variant_id,
            user_id=current_user.id,
            supplier_id=int(supplier_id) if supplier_id else None,
            type=db_type,
            direction=db_direction,
            quantity=quantity,
            notes=notes
        )
        db.add(transaction)
        db.commit()
        db.refresh(transaction)

        log_action(
            db, 
            current_user.id, 
            f"Stock {type_input}: {quantity} units for {variant.sku}"
        )

        return {"message": "Success", "new_quantity": variant.quantity}

    except Exception as e:
        db.rollback()
        print(f"DB Error: {e}")
        raise HTTPException(status_code=500, detail="Database error during transaction")

# ── GET TRANSACTION HISTORY ──
@router.get("/history")
def get_transaction_history(db: Session = Depends(get_db)):
    # Fetch data with all relationships joined to avoid "N+1" query issues
    history = (
        db.query(models.StockTransaction)
        .options(
            joinedload(models.StockTransaction.variant)
                .joinedload(models.ProductVariant.product),
            joinedload(models.StockTransaction.user),
            joinedload(models.StockTransaction.supplier)
        )
        .order_by(models.StockTransaction.timestamp.desc())
        .all()
    )

    return [
        {
            "id": t.id,
            "product_name": t.variant.product.name if (t.variant and t.variant.product) else "Unknown Product",
            "sku": t.variant.sku if t.variant else "N/A",
            "type": t.type,
            "direction": t.direction,
            "quantity": t.quantity,
            "user": t.user.name if t.user else "System", 
            "supplier": t.supplier.name if t.supplier else "N/A",
            "notes": t.notes,
            "date": t.timestamp.strftime("%Y-%m-%d %H:%M")
        }
        for t in history
    ]