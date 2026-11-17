from fastapi import FastAPI

from . import models  # Import models so SQLAlchemy registers their tables.
from .database import Base, engine
from .routers.dashboard import router as dashboard_router
from .routers.notes import router as notes_router
from .routers.tasks import router as tasks_router

# Create the tables when the backend starts. This is enough for the first version.
Base.metadata.create_all(bind=engine)

app = FastAPI()
app.include_router(notes_router)
app.include_router(tasks_router)
app.include_router(dashboard_router)


@app.get("/")
def read_root():
    return {"message": "Hello from QuickNotes API"}
