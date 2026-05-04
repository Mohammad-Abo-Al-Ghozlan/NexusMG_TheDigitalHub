from fastapi import APIRouter
from app.routes.evaluations import cv, github, linkedin, idea, interview, english, history

router = APIRouter()

router.include_router(cv.router)
router.include_router(github.router)
router.include_router(linkedin.router)
router.include_router(idea.router)
router.include_router(interview.router)
router.include_router(english.router)
router.include_router(history.router)
