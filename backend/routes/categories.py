from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import models, database

router = APIRouter()

@router.get("/categories")
def get_categories(db: Session = Depends(database.get_db)):
    return db.query(models.Category).all()