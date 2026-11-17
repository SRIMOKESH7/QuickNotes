from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class NoteFields(BaseModel):
    """Fields shared by note create, update, and response schemas."""

    title: str = Field(min_length=1)
    content: str = ""

    @field_validator("title")
    @classmethod
    def title_must_not_be_blank(cls, value: str) -> str:
        title = value.strip()
        if not title:
            raise ValueError("Title cannot be blank.")
        return title


class NoteCreate(NoteFields):
    """Data accepted when a new note is created."""


class NoteUpdate(NoteFields):
    """Data required when a note is replaced."""

    content: str


class NoteResponse(NoteFields):
    """Data returned to the frontend after reading a note."""

    id: int
    is_pinned: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TaskFields(BaseModel):
    """Fields shared by task create, update, and response schemas."""

    title: str = Field(min_length=1)

    @field_validator("title")
    @classmethod
    def title_must_not_be_blank(cls, value: str) -> str:
        title = value.strip()
        if not title:
            raise ValueError("Title cannot be blank.")
        return title


class TaskCreate(TaskFields):
    """Data accepted when a task is created."""


class TaskUpdate(TaskFields):
    """Data accepted when a task title is edited."""


class TaskResponse(TaskFields):
    """Data returned to the frontend for a task."""

    id: int
    is_completed: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


TaskStatus = Literal["all", "pending", "completed"]


class DashboardStatsResponse(BaseModel):
    """The four counts displayed on the dashboard."""

    total_notes: int
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
