"""Tiny in-process sliding-window rate limiter.

Good enough for one API instance. Behind several instances, swap the store for Redis.
"""
import threading
import time
from collections import defaultdict, deque

from fastapi import Request

from app.config import settings
from app.errors import AppError

_lock = threading.Lock()
_hits: dict[str, deque[float]] = defaultdict(deque)


def client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def hit(key: str, limit: int, window: float) -> bool:
    """Record a hit; return False when the key is over its limit."""
    now = time.monotonic()
    with _lock:
        q = _hits[key]
        while q and now - q[0] > window:
            q.popleft()
        if len(q) >= limit:
            return False
        q.append(now)
        return True


def reset() -> None:
    with _lock:
        _hits.clear()


def rate_limit(name: str, limit: int, window: float = 60.0):
    """FastAPI dependency factory: ``Depends(rate_limit("login", 10))``."""

    def dep(request: Request) -> None:
        if not settings.rate_limit_enabled:
            return
        if not hit(f"{name}:{client_ip(request)}", limit, window):
            raise AppError(429, "rate_limited", "Too many requests. Please slow down.")

    return dep
