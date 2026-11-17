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
from app.models import Task


@pytest.fixture
def client(tmp_path, monkeypatch):
    test_db_path = tmp_path / "tasks_api_test.db"
    test_engine = create_engine(
        f"sqlite:///{test_db_path.as_posix()}",
        connect_args={"check_same_thread": False},
    )
    TestSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=test_engine,
    )

    # Create tables and replace app sessions before using the API.
    database.Base.metadata.create_all(bind=test_engine)
    monkeypatch.setattr(database, "engine", test_engine)
    monkeypatch.setattr(database, "SessionLocal", TestSessionLocal)

    from app.main import app

    with TestClient(app) as test_client:
        yield test_client

    test_engine.dispose()


def test_task_endpoints_filters_validation_and_not_found(client):
    assert client.get("/api/tasks").status_code == 200
    assert client.get("/api/tasks").json() == []
    assert client.get("/api/tasks?status=completed").json() == []

    invalid_task = client.post("/api/tasks", json={"title": "   "})
    assert invalid_task.status_code == 422

    first_response = client.post("/api/tasks", json={"title": "Pay the bill"})
    assert first_response.status_code == 201
    first_task = first_response.json()
    first_task_id = first_task["id"]
    assert first_task["title"] == "Pay the bill"
    assert first_task["is_completed"] is False
    assert first_task["created_at"]
    assert first_task["updated_at"]

    second_response = client.post(
        "/api/tasks",
        json={"title": "Buy groceries"},
    )
    assert second_response.status_code == 201
    second_task_id = second_response.json()["id"]

    all_tasks = client.get("/api/tasks?status=all").json()
    assert len(all_tasks) == 2
    assert all_tasks[0]["id"] == second_task_id
    assert {task["is_completed"] for task in all_tasks} == {False}
    assert len(client.get("/api/tasks?status=pending").json()) == 2
    assert client.get("/api/tasks?status=unknown").status_code == 422

    completed_response = client.patch(f"/api/tasks/{first_task_id}/toggle")
    assert completed_response.status_code == 200
    assert completed_response.json()["is_completed"] is True
    assert [task["id"] for task in client.get("/api/tasks?status=completed").json()] == [
        first_task_id
    ]
    assert [task["id"] for task in client.get("/api/tasks?status=pending").json()] == [
        second_task_id
    ]

    toggled_back = client.patch(f"/api/tasks/{first_task_id}/toggle")
    assert toggled_back.json()["is_completed"] is False

    updated_response = client.put(
        f"/api/tasks/{first_task_id}",
        json={"title": "Pay the phone bill"},
    )
    assert updated_response.status_code == 200
    assert updated_response.json()["title"] == "Pay the phone bill"

    assert client.put(
        f"/api/tasks/{first_task_id}",
        json={"title": "   "},
    ).status_code == 422

    assert client.put(
        "/api/tasks/999999",
        json={"title": "Missing task"},
    ).status_code == 404
    assert client.patch("/api/tasks/999999/toggle").status_code == 404
    assert client.delete("/api/tasks/999999").status_code == 404

    assert client.delete(f"/api/tasks/{first_task_id}").status_code == 204
    assert client.delete(f"/api/tasks/{second_task_id}").status_code == 204
    assert client.get("/api/tasks").json() == []
