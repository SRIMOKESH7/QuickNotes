from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker


# Keep the database file in the backend folder, regardless of the launch folder.
DATABASE_PATH = Path(__file__).resolve().parent.parent / "quicknotes.db"
DATABASE_URL = f"sqlite:///{DATABASE_PATH.as_posix()}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Create one database session and close it when the caller is done."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
