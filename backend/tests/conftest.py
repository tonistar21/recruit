import os

os.environ["RECRUIT_DATABASE_URL"] = "sqlite+pysqlite:///./test.db"
os.environ["RECRUIT_SECRET_KEY"] = "test-secret-key-that-is-longer-than-32-characters"

import pytest
from fastapi.testclient import TestClient

from app.core.database import Base, engine
from app.main import app
from app.core.rate_limit import limiter
from app.seed import run_seed


@pytest.fixture(scope="session", autouse=True)
def database():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    run_seed()
    yield
    Base.metadata.drop_all(engine)


@pytest.fixture
def client():
    limiter.clear()
    with TestClient(app) as value:
        yield value
