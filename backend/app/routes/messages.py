"""
Messages routes and WebSocket handler
"""
from datetime import datetime, timezone
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload
from app.database import get_db, AsyncSessionLocal
from app.models.user import User, UserRole
from app.models.message import Message
from app.schemas.messages import ContactResponse, MessageCreate, MessageResponse
from app.services.auth import get_current_user, decode_token
from app.services.chat_manager import chat_manager

router = APIRouter(prefix="/messages", tags=["Messages"])


def _allowed_roles_for(user: User) -> List[UserRole]:
    if user.role == UserRole.TRAINEE:
        return [UserRole.TRAINEE, UserRole.INSTRUCTOR, UserRole.ADMIN]
    if user.role == UserRole.INSTRUCTOR:
        return [UserRole.TRAINEE, UserRole.INSTRUCTOR, UserRole.ADMIN]
    return [UserRole.TRAINEE, UserRole.INSTRUCTOR, UserRole.ADMIN]


def _can_message(sender: User, recipient: User) -> bool:
    if sender.id == recipient.id:
        return False
    return recipient.role in _allowed_roles_for(sender)


def _serialize_user(user: User) -> Dict[str, Any]:
    return {
        "id": user.id,
        "full_name": user.full_name,
        "role": user.role.value,
        "avatar_url": user.avatar_url,
    }


def _serialize_message(message: Message) -> Dict[str, Any]:
    return {
        "id": message.id,
        "sender_id": message.sender_id,
        "recipient_id": message.recipient_id,
        "content": message.content,
        "created_at": message.created_at.isoformat() if message.created_at else None,
        "sender": _serialize_user(message.sender),
        "recipient": _serialize_user(message.recipient),
    }


@router.get("/contacts", response_model=List[ContactResponse])
async def list_contacts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    roles = _allowed_roles_for(current_user)
    result = await db.execute(
        select(User)
        .where(User.role.in_(roles), User.id != current_user.id)
        .order_by(User.full_name.asc())
    )
    return result.scalars().all()


@router.get("/history/{contact_id}", response_model=List[MessageResponse])
async def get_history(
    contact_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    recipient_result = await db.execute(select(User).where(User.id == contact_id))
    recipient = recipient_result.scalar_one_or_none()
    if not recipient or not _can_message(current_user, recipient):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not available")

    result = await db.execute(
        select(Message)
        .options(selectinload(Message.sender), selectinload(Message.recipient))
        .where(
            or_(
                and_(Message.sender_id == current_user.id, Message.recipient_id == contact_id),
                and_(Message.sender_id == contact_id, Message.recipient_id == current_user.id),
            )
        )
        .order_by(Message.created_at.asc())
    )
    messages = result.scalars().all()
    return [_serialize_message(msg) for msg in messages]


@router.post("/send", response_model=MessageResponse)
async def send_message(
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    content = payload.content.strip()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message content is required")

    recipient_result = await db.execute(select(User).where(User.id == payload.recipient_id))
    recipient = recipient_result.scalar_one_or_none()
    if not recipient or not _can_message(current_user, recipient):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not available")

    message = Message(
        sender_id=current_user.id,
        recipient_id=recipient.id,
        content=content,
        created_at=datetime.now(timezone.utc)
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)

    message.sender = current_user
    message.recipient = recipient

    payload_data = {
        "type": "message",
        "message": _serialize_message(message)
    }
    await chat_manager.send_to_user(current_user.id, payload_data)
    await chat_manager.send_to_user(recipient.id, payload_data)

    return _serialize_message(message)


@router.websocket("/ws")
async def messages_ws(websocket: WebSocket):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008)
        return

    async with AsyncSessionLocal() as db:
        token_data = decode_token(token)
        if not token_data:
            await websocket.close(code=1008)
            return
        result = await db.execute(select(User).where(User.id == token_data.user_id))
        current_user = result.scalar_one_or_none()
        if not current_user or not current_user.is_active:
            await websocket.close(code=1008)
            return

    await chat_manager.connect(current_user.id, websocket)

    try:
        while True:
            data = await websocket.receive_json()
            recipient_id = data.get("recipient_id")
            content = (data.get("content") or "").strip()

            if recipient_id is None or not content:
                await websocket.send_json({"type": "error", "message": "Invalid message payload"})
                continue

            try:
                recipient_id = int(recipient_id)
            except (TypeError, ValueError):
                await websocket.send_json({"type": "error", "message": "Invalid recipient"})
                continue

            async with AsyncSessionLocal() as db:
                recipient_result = await db.execute(select(User).where(User.id == recipient_id))
                recipient = recipient_result.scalar_one_or_none()
                if not recipient or not _can_message(current_user, recipient):
                    await websocket.send_json({"type": "error", "message": "Contact not available"})
                    continue

                message = Message(
                    sender_id=current_user.id,
                    recipient_id=recipient.id,
                    content=content,
                    created_at=datetime.now(timezone.utc)
                )
                db.add(message)
                await db.commit()
                await db.refresh(message)

                message.sender = current_user
                message.recipient = recipient

                payload_data = {
                    "type": "message",
                    "message": _serialize_message(message)
                }
                await chat_manager.send_to_user(current_user.id, payload_data)
                await chat_manager.send_to_user(recipient.id, payload_data)
    except WebSocketDisconnect:
        await chat_manager.disconnect(current_user.id, websocket)
    except Exception:
        await chat_manager.disconnect(current_user.id, websocket)
        await websocket.close(code=1011)
