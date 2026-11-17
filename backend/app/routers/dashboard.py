from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Note, Task
from ..schemas import DashboardStatsResponse


router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_notes = db.query(func.count(Note.id)).scalar() or 0
    total_tasks = db.query(func.count(Task.id)).scalar() or 0
    completed_tasks = (
        db.query(func.count(Task.id))
        .filter(Task.is_completed.is_(True))
        .scalar()
        or 0
    )
    pending_tasks = (
        db.query(func.count(Task.id))
        .filter(Task.is_completed.is_(False))
        .scalar()
        or 0
    )

    return DashboardStatsResponse(
        total_notes=total_notes,
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        pending_tasks=pending_tasks,
    )
