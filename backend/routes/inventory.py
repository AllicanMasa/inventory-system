from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.dependencies import require_permission, get_current_user
from backend import models
from backend.audit import log_action

router = APIRouter(prefix="/inventory", tags=["inventory"])

# ── GET INVENTORY ──
@router.get("/", dependencies=[Depends(require_permission("stock:in"))])
def get_inventory(db: Session = Depends(get_db)):
    results = (
        db.query(
            models.Product.id.label("product_id"),
            models.Product.name,
            models.Product.sku,
            models.Product.min_stock,
            models.Inventory.quantity,
        )
        .outerjoin(models.Inventory, models.Inventory.product_id == models.Product.id)
        .all()
    )
    return [
        {
            "product_id": r.product_id,
            "name": r.name,
            "sku": r.sku,
            "quantity": r.quantity or 0,
            "min_stock": r.min_stock,
        }
        for r in results
    ]

# ── STOCK TRANSACTION ──
@router.post("/stock", dependencies=[Depends(require_permission("stock:in"))])
def stock_transaction(
    data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    product_id = data.get("product_id")
    # Normalize input types to uppercase
    type_input = (data.get("type") or "").upper() 
    quantity = int(data.get("quantity", 0))
    direction_input = (data.get("direction") or "").upper()
    supplier_id = data.get("supplier_id")
    notes = data.get("notes")

    # 1. Basic validation
    if not product_id or not type_input or quantity <= 0:
        raise HTTPException(status_code=400, detail="Invalid input")
    
    if type_input not in ["IN", "OUT", "RETURN"]:
        raise HTTPException(status_code=400, detail="Invalid type")

    # 2. Get or create inventory row
    inventory = db.query(models.Inventory).filter_by(product_id=product_id).first()
    if not inventory:
        inventory = models.Inventory(product_id=product_id, quantity=0)
        db.add(inventory)
        db.flush() # Use flush to get an ID without committing yet

    # 3. Logic Mapping & DB Translation
    # This 'db_type' MUST match your CHECK constraint: ['stock_in', 'stock_out']
    db_type = ""
    db_direction = None

    if type_input == "IN":
        inventory.quantity += quantity
        db_type = "stock_in"
        db_direction = None # Or "IN" depending on your model preference, but type is key
        try:
            supplier_id = int(supplier_id) if supplier_id else None
        except (TypeError, ValueError):
            supplier_id = None

    elif type_input == "OUT":
        if inventory.quantity < quantity:
            raise HTTPException(status_code=400, detail="Not enough stock")
        inventory.quantity -= quantity
        db_type = "stock_out"
        db_direction = None
        supplier_id = None

    elif type_input == "RETURN":
        if direction_input not in ["IN", "OUT"]:
            raise HTTPException(status_code=400, detail="Direction required for RETURN")
        
        db_direction = direction_input # Keep the direction info
        
        if direction_input == "IN":
            inventory.quantity += quantity
            db_type = "stock_in"  # Mapping RETURN IN to stock_in
        else:
            if inventory.quantity < quantity:
                raise HTTPException(status_code=400, detail="Not enough stock")
            inventory.quantity -= quantity
            db_type = "stock_out" # Mapping RETURN OUT to stock_out
        
        supplier_id = None

    # 4. Save to Database
    try:
        transaction = models.StockTransaction(
            product_id=product_id,
            user_id=current_user.id,
            supplier_id=supplier_id,
            type=db_type,           # Applied the mapped value here
            direction=db_direction,
            quantity=quantity,
            notes=notes,
        )
        db.add(transaction)
        db.commit()
        db.refresh(transaction)

        # Audit log
        log_action(
            db,
            current_user.id,
            f"{type_input} {quantity} units (Product ID: {product_id})",
        )
        
        return {"message": "Transaction successful", "transaction_id": transaction.id}

    except Exception as e:
        db.rollback()
        # Log the actual error to your console for debugging
        print(f"DATABASE ERROR: {e}") 
        raise HTTPException(status_code=500, detail=f"Database Error: {str(e)}")