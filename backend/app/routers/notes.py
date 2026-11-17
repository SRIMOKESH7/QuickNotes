from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Note
from ..schemas import NoteCreate, NoteResponse, NoteUpdate


router = APIRouter(prefix="/api/notes", tags=["Notes"])


def get_note_or_404(db: Session, note_id: int) -> Note:
    note = db.query(Note).filter(Note.id == note_id).first()
    if note is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found",
        )
    return note


@router.get("", response_model=list[NoteResponse])
def list_notes(search: str | None = Query(default=None), db: Session = Depends(get_db)):
    query = db.query(Note)

    search_term = search.strip() if search else ""
    if search_term:
        search_pattern = f"%{search_term}%"
        query = query.filter(
            or_(
                Note.title.ilike(search_pattern),
                Note.content.ilike(search_pattern),
            )
        )

    return query.order_by(Note.is_pinned.desc(), Note.created_at.desc()).all()


@router.get("/{note_id}", response_model=NoteResponse)
def get_note(note_id: int, db: Session = Depends(get_db)):
    return get_note_or_404(db, note_id)


@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def create_note(note_data: NoteCreate, db: Session = Depends(get_db)):
    note = Note(title=note_data.title, content=note_data.content)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.put("/{note_id}", response_model=NoteResponse)
def update_note(note_id: int, note_data: NoteUpdate, db: Session = Depends(get_db)):
    note = get_note_or_404(db, note_id)
    note.title = note_data.title
    note.content = note_data.content
    db.commit()
    db.refresh(note)
    return note


@router.patch("/{note_id}/pin", response_model=NoteResponse)
def toggle_note_pin(note_id: int, db: Session = Depends(get_db)):
    note = get_note_or_404(db, note_id)
    note.is_pinned = not note.is_pinned
    db.commit()
    db.refresh(note)
    return note


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(note_id: int, db: Session = Depends(get_db)):
    note = get_note_or_404(db, note_id)
    db.delete(note)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
