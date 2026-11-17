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


@pytest.fixture
def client(tmp_path, monkeypatch):
    test_db_path = tmp_path / "notes_api_test.db"
    test_engine = create_engine(
        f"sqlite:///{test_db_path.as_posix()}",
        connect_args={"check_same_thread": False},
    )
    from app import models

    database.Base.metadata.create_all(bind=test_engine)

    TestSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=test_engine,
    )

    # Replace the app's database objects before importing the app. The app's
    # startup table creation will therefore use only this temporary database.
    monkeypatch.setattr(database, "engine", test_engine)
    monkeypatch.setattr(database, "SessionLocal", TestSessionLocal)

    from app.main import app

    with TestClient(app) as test_client:
        yield test_client

    test_engine.dispose()


def test_notes_endpoints_validation_and_not_found(client):
    assert client.get("/api/notes").status_code == 200
    assert client.get("/api/notes").json() == []

    invalid_note = client.post("/api/notes", json={"title": "   "})
    assert invalid_note.status_code == 422

    created_note_response = client.post(
        "/api/notes",
        json={"title": "  Meeting notes  "},
    )
    assert created_note_response.status_code == 201
    created_note = created_note_response.json()
    note_id = created_note["id"]
    assert created_note["title"] == "Meeting notes"
    assert created_note["content"] == ""
    assert created_note["is_pinned"] is False
    assert created_note["created_at"]
    assert created_note["updated_at"]

    second_note_response = client.post(
        "/api/notes",
        json={"title": "Shopping list", "content": "milk and bread"},
    )
    assert second_note_response.status_code == 201
    second_note_id = second_note_response.json()["id"]

    assert client.get(f"/api/notes/{note_id}").json()["title"] == "Meeting notes"
    assert client.get("/api/notes?search=milk").json()[0]["id"] == second_note_id
    assert client.get("/api/notes?search=missing").json() == []
    assert client.put(
        f"/api/notes/{note_id}",
        json={"title": "   ", "content": ""},
    ).status_code == 422

    pinned_response = client.patch(f"/api/notes/{second_note_id}/pin")
    assert pinned_response.status_code == 200
    assert pinned_response.json()["is_pinned"] is True
    ordered_notes = client.get("/api/notes").json()
    assert ordered_notes[0]["id"] == second_note_id

    unpinned_response = client.patch(f"/api/notes/{second_note_id}/pin")
    assert unpinned_response.json()["is_pinned"] is False

    updated_response = client.put(
        f"/api/notes/{note_id}",
        json={"title": "Updated meeting", "content": "New details"},
    )
    assert updated_response.status_code == 200
    assert updated_response.json()["title"] == "Updated meeting"
    assert updated_response.json()["content"] == "New details"

    assert client.get("/api/notes/999999").status_code == 404
    assert client.put(
        "/api/notes/999999",
        json={"title": "Missing", "content": ""},
    ).status_code == 404
    assert client.patch("/api/notes/999999/pin").status_code == 404
    assert client.delete("/api/notes/999999").status_code == 404

    assert client.delete(f"/api/notes/{note_id}").status_code == 204
    assert client.get(f"/api/notes/{note_id}").status_code == 404
    assert client.delete(f"/api/notes/{second_note_id}").status_code == 204
