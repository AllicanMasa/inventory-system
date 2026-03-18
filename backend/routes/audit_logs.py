from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend import models, schemas
from backend.database import get_db
from backend.dependencies import require_permission


router = APIRouter(prefix="/audit_logs", tags=["audit_logs"])


@router.get("/", response_model=list[schemas.AuditLogOut], dependencies=[Depends(require_permission("audit_logs:view"))])
def get_audit_logs(db: Session = Depends(get_db)):
    return db.query(models.AuditLog).order_by(models.AuditLog.created_at.desc(), models.AuditLog.id.desc()).all()
