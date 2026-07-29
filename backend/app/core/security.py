import hashlib
import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt, JWTError
from app.core.config import settings

def get_password_hash(password: str) -> str:
    # Use PBKDF2 with SHA256 and salt for clean, zero-dependency password hashing
    salt = hashlib.sha256(settings.SECRET_KEY.encode()).hexdigest()[:16]
    hashed = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return f"pbkdf2_sha256${salt}${hashed.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password or "$" not in hashed_password:
        return False
    parts = hashed_password.split("$")
    if len(parts) != 3 or parts[0] != "pbkdf2_sha256":
        return False
    salt = parts[1]
    expected_hash = parts[2]
    computed_hash = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt.encode('utf-8'), 100000).hex()
    return computed_hash == expected_hash

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
