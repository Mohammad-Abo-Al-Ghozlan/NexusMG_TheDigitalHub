"""
Evaluation Notes Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
from app.database import get_db
from app.models.user import User, UserRole
from app.models.evaluation import EvaluationNote
from app.schemas.evaluation_notes import EvaluationNoteResponse, EvaluationNoteUpsertRequest
from app.services.auth import get_current_user, get_current_instructor

router = APIRouter(prefix="/evaluation-notes", tags=["Evaluation Notes"])


async def resolve_trainee(
    trainee_id: int,
    current_user: User,
    db: AsyncSession
) -> User:
    stmt = select(User).where(User.id == trainee_id, User.role == UserRole.TRAINEE)
    if current_user.role != UserRole.ADMIN:
        stmt = stmt.where(User.instructor_id == current_user.id)

    result = await db.execute(stmt)
    trainee = result.scalar_one_or_none()
    if not trainee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trainee not found")
    return trainee


@router.get("/me", response_model=List[EvaluationNoteResponse])
async def get_my_notes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get evaluation notes for the current trainee."""
    if current_user.role != UserRole.TRAINEE:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access restricted to trainees")

    result = await db.execute(
        select(EvaluationNote)
        .options(selectinload(EvaluationNote.instructor))
        .where(EvaluationNote.trainee_id == current_user.id)
    )
    return result.scalars().all()


@router.get("/trainees/{trainee_id}", response_model=List[EvaluationNoteResponse])
async def get_trainee_notes(
    trainee_id: int,
    current_user: User = Depends(get_current_instructor),
    db: AsyncSession = Depends(get_db)
):
    """Get evaluation notes for a trainee (instructor/admin only)."""
    await resolve_trainee(trainee_id, current_user, db)

    result = await db.execute(
        select(EvaluationNote)
        .options(selectinload(EvaluationNote.instructor))
        .where(EvaluationNote.trainee_id == trainee_id)
    )
    return result.scalars().all()


@router.put("/trainees/{trainee_id}", response_model=List[EvaluationNoteResponse])
async def upsert_trainee_notes(
    trainee_id: int,
    payload: EvaluationNoteUpsertRequest,
    current_user: User = Depends(get_current_instructor),
    db: AsyncSession = Depends(get_db)
):
    """Create or update evaluation notes for a trainee."""
    await resolve_trainee(trainee_id, current_user, db)

    existing_result = await db.execute(
        select(EvaluationNote).where(EvaluationNote.trainee_id == trainee_id)
    )
    existing = {note.module: note for note in existing_result.scalars().all()}

    for note_input in payload.notes:
        note = existing.get(note_input.module)
        if note:
            note.note = note_input.note
            note.instructor_id = current_user.id
        else:
            note = EvaluationNote(
                trainee_id=trainee_id,
                instructor_id=current_user.id,
                module=note_input.module,
                note=note_input.note,
            )
            db.add(note)

    await db.commit()

    refreshed = await db.execute(
        select(EvaluationNote)
        .options(selectinload(EvaluationNote.instructor))
        .where(EvaluationNote.trainee_id == trainee_id)
    )
    return refreshed.scalars().all()
