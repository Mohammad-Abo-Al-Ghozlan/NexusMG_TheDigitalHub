from fastapi import APIRouter
from app.routes import auth, users
from app.routes.evaluations import router as evaluations_router

router = APIRouter()

router.include_router(auth.router)
router.include_router(users.router)
router.include_router(evaluations_router)
