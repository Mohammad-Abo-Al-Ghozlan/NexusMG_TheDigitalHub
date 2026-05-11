import logging
from email.message import EmailMessage
from typing import Optional
import aiosmtplib
from app.config import settings

email_logger = logging.getLogger("nexusmg.email")


def _build_message(to_email: str, subject: str, html: str, text: Optional[str]) -> EmailMessage:
    message = EmailMessage()
    message["From"] = settings.SMTP_FROM
    message["To"] = to_email
    message["Subject"] = subject
    if text:
        message.set_content(text)
    message.add_alternative(html, subtype="html")
    return message


async def send_email(to_email: str, subject: str, html: str, text: Optional[str] = None) -> None:
    if not settings.SMTP_HOST or not settings.SMTP_FROM:
        raise RuntimeError("SMTP settings are not configured")

    message = _build_message(to_email, subject, html, text)

    try:
        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD.get_secret_value() if settings.SMTP_PASSWORD else None,
            start_tls=settings.SMTP_USE_TLS,
            timeout=15,
        )
        email_logger.info("email.sent to=%s", to_email)
    except Exception as exc:
        email_logger.exception("email.failed to=%s error=%s", to_email, exc)
        raise
