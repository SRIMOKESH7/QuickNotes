from pathlib import Path
import sys

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


# Add the backend folder so this test works from any current directory.
BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app import database
from app.models import Note, Task


@pytest.fixture
def client(tmp_path, monkeypatch):
    test_db_path = tmp_path / "dashboard_api_test.db"
    test_engine = create_engine(
        f"sqlite:///{test_db_path.as_posix()}",
        connect_args={"check_same_thread": False},
    )
    TestSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=test_engine,
    )

    # Register both models and create tables only in this temporary database.
    database.Base.metadata.create_all(bind=test_engine)
    monkeypatch.setattr(database, "engine", test_engine)
    monkeypatch.setattr(database, "SessionLocal", TestSessionLocal)

    from app.main import app

    with TestClient(app) as test_client:
        yield test_client

    test_engine.dispose()


def test_empty_dashboard_counts_are_zero(client):
    response = client.get("/api/dashboard/stats")

    assert response.status_code == 200
    assert response.json() == {
        "total_notes": 0,
        "total_tasks": 0,
        "completed_tasks": 0,
        "pending_tasks": 0,
    }


def test_dashboard_counts_and_notes_tasks_regression(client):
    note_response = client.post(
        "/api/notes",
        json={"title": "Project notes", "content": "First draft"},
    )
    assert note_response.status_code == 201
    note_id = note_response.json()["id"]

    first_task_response = client.post(
        "/api/tasks",
        json={"title": "Review the draft"},
    )
    second_task_response = client.post(
        "/api/tasks",
        json={"title": "Send the draft"},
    )
    assert first_task_response.status_code == 201
    assert second_task_response.status_code == 201
    first_task_id = first_task_response.json()["id"]
    second_task_id = second_task_response.json()["id"]

    assert client.get("/api/dashboard/stats").json() == {
        "total_notes": 1,
        "total_tasks": 2,
        "completed_tasks": 0,
        "pending_tasks": 2,
    }

    updated_note = client.put(
        f"/api/notes/{note_id}",
        json={"title": "Updated project notes", "content": "Revised draft"},
    )
    assert updated_note.status_code == 200
    assert updated_note.json()["title"] == "Updated project notes"
    assert client.patch(f"/api/notes/{note_id}/pin").json()["is_pinned"] is True
    assert client.get("/api/notes").json()[0]["id"] == note_id

    updated_task = client.put(
        f"/api/tasks/{first_task_id}",
        json={"title": "Review the revised draft"},
    )
    assert updated_task.status_code == 200
    assert updated_task.json()["title"] == "Review the revised draft"
    assert client.patch(f"/api/tasks/{first_task_id}/toggle").json()[
        "is_completed"
    ] is True
    assert [task["id"] for task in client.get("/api/tasks?status=completed").json()] == [
        first_task_id
    ]
    assert [task["id"] for task in client.get("/api/tasks?status=pending").json()] == [
        second_task_id
    ]

    assert client.get("/api/dashboard/stats").json() == {
        "total_notes": 1,
        "total_tasks": 2,
        "completed_tasks": 1,
        "pending_tasks": 1,
    }

    assert client.delete(f"/api/notes/{note_id}").status_code == 204
    assert client.delete(f"/api/tasks/{first_task_id}").status_code == 204
    assert client.delete(f"/api/tasks/{second_task_id}").status_code == 204
    assert client.get("/api/dashboard/stats").json() == {
        "total_notes": 0,
        "total_tasks": 0,
        "completed_tasks": 0,
        "pending_tasks": 0,
    }
