from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend import models, schemas
from backend.database import get_db
from backend.dependencies import require_permission


router = APIRouter(prefix="/audit_logs", tags=["audit_logs"])


@router.get(
    "/",
    response_model=list[schemas.AuditLogOut],
    dependencies=[Depends(require_permission("audit_logs:view"))],
)
def get_audit_logs(db: Session = Depends(get_db)):
    logs = (
        db.query(models.AuditLog, models.User.name)
        .join(models.User, models.AuditLog.user_id == models.User.id)
        .order_by(models.AuditLog.created_at.desc(), models.AuditLog.id.desc())
        .all()
    )

    result = []
    for log, name in logs:
        result.append({
            "id": log.id,
            "user_id": log.user_id,
            "name": name,
            "action": log.action,
            "created_at": log.created_at,
        })

    return result