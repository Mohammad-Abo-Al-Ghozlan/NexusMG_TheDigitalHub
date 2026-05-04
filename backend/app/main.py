"""
NexusMG API - AI-Powered Developer Readiness Platform
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import time
import uuid
from app.config import settings
from app.routes import router
from app.rate_limiter import limiter
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logging.getLogger("nexusmg").info("Starting NexusMG API")
    yield
    # Shutdown
    logging.getLogger("nexusmg").info("Shutting down NexusMG API")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-Powered Developer Readiness Platform API",
    lifespan=lifespan
)


@app.middleware("http")
async def audit_request_middleware(request: Request, call_next):
    logger = logging.getLogger("nexusmg.audit")
    request_id = request.headers.get("X-Request-Id", str(uuid.uuid4()))
    start_time = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        logger.exception(
            "request.failed method=%s path=%s status=500 duration_ms=%.2f request_id=%s",
            request.method,
            request.url.path,
            duration_ms,
            request_id
        )
        raise
    duration_ms = (time.perf_counter() - start_time) * 1000.0
    response.headers["X-Request-Id"] = request_id
    logger.info(
        "request.completed method=%s path=%s status=%s duration_ms=%.2f request_id=%s",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
        request_id
    )
    return response

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
