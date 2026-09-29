import base64
import hashlib
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app.errors import forbidden, unauthorized
from app.models import User

oauth2 = OAuth2PasswordBearer(tokenUrl="/auth/login")
oauth2_optional = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def _prehash(pw: str) -> bytes:
    # bcrypt only reads the first 72 bytes; hash first so long passphrases are fully used.
    return base64.b64encode(hashlib.sha256(pw.encode("utf-8")).digest())


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(_prehash(pw), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(_prehash(pw), hashed.encode())
    except ValueError:
        return False


def create_token(user_id: int) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_minutes)
    return jwt.encode({"sub": str(user_id), "exp": exp}, settings.secret_key, algorithm="HS256")


def _user_from_token(token: str, db: Session) -> User:
    try:
        uid = int(jwt.decode(token, settings.secret_key, algorithms=["HS256"])["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise unauthorized("invalid_token")
    user = db.get(User, uid)
    if not user:
        raise unauthorized("user_not_found")
    return user


def current_user(token: str = Depends(oauth2), db: Session = Depends(get_db)) -> User:
    return _user_from_token(token, db)


def optional_user(token: str | None = Depends(oauth2_optional), db: Session = Depends(get_db)) -> User | None:
    if not token:
        return None
    try:
        return _user_from_token(token, db)
    except Exception:
        return None


def require_role(role: str):
    def dep(user: User = Depends(current_user)) -> User:
        if user.role != role:
            raise forbidden(f"{role}_only")
        return user

    return dep


def require_verified_professor(user: User = Depends(require_role("professor"))) -> User:
    if not user.verified:
        raise forbidden("professor_unverified")
    return user


def require_admin(user: User = Depends(current_user)) -> User:
    if not user.is_admin:
        raise forbidden("admin_only")
    return user
