from fastapi import APIRouter
from . import auth, users, instructors, readiness
from app.routes.evaluations import router as evaluations_router

router = APIRouter()

router.include_router(auth.router)
router.include_router(users.router)
router.include_router(instructors.router)
router.include_router(readiness.router)
router.include_router(evaluations_router)
