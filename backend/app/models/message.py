from sqlalchemy import Column, Integer, ForeignKey, Text, DateTime, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Message(Base):
    __tablename__ = "messages"
    __table_args__ = (
        Index("ix_messages_sender_recipient_created", "sender_id", "recipient_id", "created_at"),
        Index("ix_messages_recipient_created", "recipient_id", "created_at"),
        Index("ix_messages_sender_created", "sender_id", "created_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    recipient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    read_at = Column(DateTime(timezone=True), nullable=True)

    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    recipient = relationship("User", foreign_keys=[recipient_id], back_populates="received_messages")
