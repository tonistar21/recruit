import threading
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request


class InMemoryRateLimiter:
    """Fixed-window-like limiter for a single demonstration backend instance."""

    def __init__(self) -> None:
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def check(self, key: str, limit: int, window_seconds: int) -> None:
        now = time.monotonic()
        with self._lock:
            hits = self._hits[key]
            while hits and hits[0] <= now - window_seconds:
                hits.popleft()
            if len(hits) >= limit:
                retry_after = max(1, int(window_seconds - (now - hits[0])) + 1)
                raise HTTPException(status_code=429, detail="Забагато запитів. Спробуйте пізніше.", headers={"Retry-After": str(retry_after)})
            hits.append(now)

    def clear(self) -> None:
        with self._lock:
            self._hits.clear()


limiter = InMemoryRateLimiter()


def client_ip(request: Request) -> str:
    # X-Forwarded-For навмисно не приймається напряму від клієнта.
    # Nginx передає фактичну адресу як X-Real-IP.
    direct = request.client.host if request.client else "unknown"
    if direct in {"127.0.0.1", "::1"} or direct.startswith("172.") or direct.startswith("10."):
        return request.headers.get("x-real-ip", direct).split(",", 1)[0].strip()
    return direct


def enforce(request: Request, scope: str, limit: int, window_seconds: int, identifier: str = "") -> None:
    limiter.check(f"{scope}:{client_ip(request)}:{identifier.lower().strip()}", limit, window_seconds)
