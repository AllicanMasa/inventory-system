from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from backend.database import get_db
from backend import models
from backend.dependencies import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    today = datetime.now().date()
    
    # 1. Get the total number of product variants in the system
    total_prods = db.query(models.ProductVariant).filter(models.ProductVariant.is_active == True).count()

    # 2. Fetch all transactions to calculate totals
    all_transactions = db.query(models.StockTransaction).all()
    
    m_sales = 0
    d_sales = 0
    p_count = 0      # This counts "Stock In" events
    stock_out_count = 0 # This counts "Stock Out" events
    r_count = 0      # This counts "Return" events
    p_amount = 0

    for t in all_transactions:
        price = t.variant.product.price if (t.variant and t.variant.product) else 0
        t_date = t.timestamp.date()

        # 1. Handle Returns separately
        if t.type == "return":
            r_count += 1
            # Optional: Decide if returns should affect "Stock In/Out" totals. 
            # Usually, you keep them separate for clean data.

        # 2. Regular Stock Out
        elif t.type == "stock_out":
            stock_out_count += 1
            m_sales += (t.quantity * price)
            if t_date == today:
                d_sales += (t.quantity * price)
        
        # 3. Regular Stock In
        elif t.type == "stock_in":
            p_count += 1
            p_amount += (t.quantity * price)
            
    return {
        "totalProducts": total_prods,
        "monthlySales": m_sales,
        "monthlyProfit": m_sales, 
        "dailySales": d_sales,
        "dailyProfit": d_sales,
        "purchases": p_count,
        "stockOutCount": stock_out_count,
        "purchaseAmount": p_amount,
        "returns": r_count  # Ensure this matches the key React is looking for
    }

@router.get("/sales-chart")
def get_sales_chart(view: str = "day", db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if view == "day":
        days = []
        data = []
        # Get sales for the last 7 days
        for i in range(6, -1, -1):
            date = (datetime.now() - timedelta(days=i)).date()
            # Calculate sum of (qty * price) for stock_out on this specific date
            val = db.query(
                func.sum(models.StockTransaction.quantity * models.Product.price)
            ).join(models.ProductVariant, models.StockTransaction.variant_id == models.ProductVariant.id)\
             .join(models.Product, models.ProductVariant.product_id == models.Product.id)\
             .filter(func.date(models.StockTransaction.timestamp) == date)\
             .filter(models.StockTransaction.type == "stock_out").scalar() or 0
            
            days.append(date.strftime("%a"))
            data.append(val)
        return {"labels": days, "data": data}
    
    return {"labels": ["N/A"], "data": [0]}

@router.get("/online-users")
def get_online_users(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Anyone seen in the last 5 minutes is considered "Online"
    five_minutes_ago = datetime.utcnow() - timedelta(minutes=5)
    
    online_users = db.query(models.User).filter(
        models.User.last_seen >= five_minutes_ago
    ).all()
    
    return [{"name": u.name, "id": u.id} for u in online_users]

@router.get("/inventory-levels")
def get_inventory_levels(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    results = (
        db.query(
            models.Product.name,
            models.ProductVariant.size,
            models.ProductVariant.color,
            models.ProductVariant.quantity,
            models.Product.min_stock
        ) # <--- Fill these in to fix the "No overloads" error
        .join(models.Product, models.ProductVariant.product_id == models.Product.id)
        .filter(models.ProductVariant.is_active == True)
        .filter(models.Product.is_active == True)
        .order_by(models.ProductVariant.quantity.asc()) 
        .limit(15)
        .all()
    )

    return [
        {
            "label": f"{r.name} ({r.size}{f' - {r.color}' if r.color else ''})",
            "stock": r.quantity or 0,
            "min_stock": r.min_stock or 0
        }
        for r in results
    ]