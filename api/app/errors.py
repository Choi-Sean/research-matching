"""Uniform, machine-readable errors.

The web client translates ``detail.code`` into the visitor's language, so every
error we raise on purpose carries a stable code. ``message`` is an English fallback.
"""
from typing import Any

from fastapi import HTTPException


class AppError(HTTPException):
    def __init__(self, status_code: int, code: str, message: str | None = None, **extra: Any):
        super().__init__(status_code=status_code, detail={"code": code, "message": message or code, **extra})


def bad_request(code: str, message: str | None = None, **extra: Any) -> AppError:
    return AppError(400, code, message, **extra)


def unauthorized(code: str = "invalid_token", message: str | None = None) -> AppError:
    return AppError(401, code, message or "Please sign in again.")


def forbidden(code: str = "forbidden", message: str | None = None, **extra: Any) -> AppError:
    return AppError(403, code, message or "You don't have access to this.", **extra)


def not_found(code: str = "not_found", message: str | None = None) -> AppError:
    return AppError(404, code, message or "Not found.")


def conflict(code: str, message: str | None = None) -> AppError:
    return AppError(409, code, message)


def unprocessable(code: str, message: str | None = None, **extra: Any) -> AppError:
    return AppError(422, code, message, **extra)


def quota_exceeded(feature: str, limit: int) -> AppError:
    return AppError(402, "quota_exceeded", "You've used your free allowance for this feature.",
                    feature=feature, limit=limit)


def upstream(code: str = "upstream_unavailable", message: str | None = None) -> AppError:
    return AppError(502, code, message or "An upstream service is unavailable. Please try again.")
