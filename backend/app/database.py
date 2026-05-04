import logging
import time
from sqlalchemy import event
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.config import settings

db_logger = logging.getLogger("nexusmg.db")
DB_SLOW_QUERY_THRESHOLD_MS = 250.0

engine = create_async_engine(
    settings.ASYNC_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=settings.DEBUG
)

def _trim_statement(statement: str, max_len: int = 300) -> str:
    compact = " ".join(statement.split())
    if len(compact) <= max_len:
        return compact
    return f"{compact[:max_len]}..."


@event.listens_for(engine.sync_engine, "before_cursor_execute")
def _before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    conn.info.setdefault("query_start_time", []).append(time.perf_counter())


@event.listens_for(engine.sync_engine, "after_cursor_execute")
def _after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    start_time = conn.info["query_start_time"].pop(-1)
    duration_ms = (time.perf_counter() - start_time) * 1000.0
    if duration_ms >= DB_SLOW_QUERY_THRESHOLD_MS:
        db_logger.warning(
            "db.query.slow duration_ms=%.2f statement=%s",
            duration_ms,
            _trim_statement(statement)
        )
    else:
        db_logger.debug(
            "db.query duration_ms=%.2f statement=%s",
            duration_ms,
            _trim_statement(statement)
        )

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False
)

Base = declarative_base()


async def get_db() -> AsyncSession:
    """Dependency to get async database session."""
    async with AsyncSessionLocal() as session:
        yield session


def init_db() -> None:
    """No-op: use Alembic migrations for schema management."""
    return None
