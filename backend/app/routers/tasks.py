from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Task
from ..schemas import TaskCreate, TaskResponse, TaskStatus, TaskUpdate


router = APIRouter(prefix="/api/tasks", tags=["Tasks"])


def get_task_or_404(db: Session, task_id: int) -> Task:
    task = db.query(Task).filter(Task.id == task_id).first()
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    return task


@router.get("", response_model=list[TaskResponse])
def list_tasks(
    status_filter: TaskStatus = Query(default="all", alias="status"),
    db: Session = Depends(get_db),
):
    query = db.query(Task)

    if status_filter == "pending":
        query = query.filter(Task.is_completed.is_(False))
    elif status_filter == "completed":
        query = query.filter(Task.is_completed.is_(True))

    return query.order_by(Task.created_at.desc(), Task.id.desc()).all()


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(task_data: TaskCreate, db: Session = Depends(get_db)):
    task = Task(title=task_data.title)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, task_data: TaskUpdate, db: Session = Depends(get_db)):
    task = get_task_or_404(db, task_id)
    task.title = task_data.title
    db.commit()
    db.refresh(task)
    return task


@router.patch("/{task_id}/toggle", response_model=TaskResponse)
def toggle_task_completion(task_id: int, db: Session = Depends(get_db)):
    task = get_task_or_404(db, task_id)
    task.is_completed = not task.is_completed
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = get_task_or_404(db, task_id)
    db.delete(task)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
