from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend import models, schemas, auth
from backend.dependencies import require_permission
from backend.audit import log_action


router = APIRouter(prefix="/categories", tags=["categories"])

def get_current_user(db, credentials):
    token = credentials.credentials
    payload = auth.decode_access_token(token)
    user_id = id(payload["sub"])
    return db.query(models.User).filter(models.User.id == user_id).first()

# GET all categories — everyone with view permission
@router.get("/", response_model=list[schemas.Category])
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(models.Category).all()
    return categories

# POST a new category — only users with "categories:manage"
@router.post("/", response_model=schemas.Category, dependencies=[Depends(require_permission("categories:manage"))])
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Category).filter(models.Category.name == category.name).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category already exists")
    
    new_category = models.Category(name=category.name)
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    return new_category

# PUT / PATCH — update category
@router.put("/{category_id}", response_model=schemas.Category, dependencies=[Depends(require_permission("categories:manage"))])
def update_category(category_id: int, category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    
    existing.name = category.name
    db.commit()
    db.refresh(existing)
    return existing

# DELETE category
@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_permission("categories:manage"))])
def delete_category(category_id: int, db: Session = Depends(get_db)):
    existing = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    
    db.delete(existing)
    db.commit()
    return