from fastapi import APIRouter, Depends
from backend.dependencies import require_permission
from backend import auth, models

router = APIRouter(prefix="/inventory", tags=["inventory"])

@router.post("/stock-in", dependencies=[Depends(require_permission("stock:in"))])
def stock_in():
    return {"message": "Stock in allowed"}

def get_current_user(db, credentials):
    token = credentials.credentials
    payload = auth.decode_access_token(token)
    user_id = id(payload["sub"])
    return db.query(models.User).filter(models.User.id == user_id).first()