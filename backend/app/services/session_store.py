import json
import logging
import redis.asyncio as redis
from app.config import settings

logger = logging.getLogger("nexusmg.session")

# In-memory fallback for environments without Redis
_memory_store = {}

try:
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
except Exception as e:
    logger.warning(f"Failed to connect to Redis, using in-memory store: {e}")
    redis_client = None


async def get_session(key: str):
    if redis_client:
        try:
            value = await redis_client.get(key)
            if value:
                return json.loads(value)
        except Exception as e:
            logger.error(f"Redis get error: {e}")
    
    return _memory_store.get(key)


async def set_session(key: str, data: dict, ttl_seconds: int) -> None:
    if redis_client:
        try:
            await redis_client.set(key, json.dumps(data), ex=ttl_seconds)
            return
        except Exception as e:
            logger.error(f"Redis set error: {e}")
    
    _memory_store[key] = data


async def delete_session(key: str) -> None:
    if redis_client:
        try:
            await redis_client.delete(key)
        except Exception as e:
            logger.error(f"Redis delete error: {e}")
    
    if key in _memory_store:
        del _memory_store[key]
