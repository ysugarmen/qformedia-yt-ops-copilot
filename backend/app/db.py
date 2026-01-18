from functools import lru_cache
from sqlmodel import SQLModel, create_engine, Session
from fastapi import Depends

from app.core.config import get_settings, Settings

@lru_cache
def get_engine(db_url: str):
    connection_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}
    return create_engine(db_url, echo=False, connect_args=connection_args)


def init_db(engine) -> None:
    SQLModel.metadata.create_all(engine)


def get_session(
        settings: Settings = Depends(get_settings)
):
    engine = get_engine(settings.DATABASE_URL)
    with Session(engine) as session:
        yield session