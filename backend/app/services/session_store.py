import json
import redis.asyncio as redis
from app.config import settings

redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)


async def get_session(key: str):
    value = await redis_client.get(key)
    if not value:
        return None
    return json.loads(value)


async def set_session(key: str, data: dict, ttl_seconds: int) -> None:
    await redis_client.set(key, json.dumps(data), ex=ttl_seconds)


async def delete_session(key: str) -> None:
    await redis_client.delete(key)
