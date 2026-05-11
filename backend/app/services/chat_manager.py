import asyncio
from typing import Dict, Set, Any
from fastapi import WebSocket


class ChatManager:
    def __init__(self) -> None:
        self._connections: Dict[int, Set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections.setdefault(user_id, set()).add(websocket)

    async def disconnect(self, user_id: int, websocket: WebSocket) -> None:
        async with self._lock:
            sockets = self._connections.get(user_id)
            if not sockets:
                return
            sockets.discard(websocket)
            if not sockets:
                self._connections.pop(user_id, None)

    async def send_to_user(self, user_id: int, payload: Dict[str, Any]) -> None:
        sockets = list(self._connections.get(user_id, set()))
        for socket in sockets:
            try:
                await socket.send_json(payload)
            except Exception:
                await self.disconnect(user_id, socket)


chat_manager = ChatManager()
