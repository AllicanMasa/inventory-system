from sqlalchemy.orm import Session
from backend import models
from datetime import datetime

def log_action(db: Session, user_id: int, action: str):
    log = models.AuditLog(
        user_id=user_id,
        action=action,
        created_at=datetime.utcnow()
    )
    db.add(log)
    db.commit()