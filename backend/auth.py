import os
import datetime
from typing import Optional, List
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "demo-secret-change-in-production-min32chars!")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("JWT_EXPIRE_MINUTES", "480"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

DEMO_USERS = {
    "admin@demo-expertbay.org": {"email": "admin@demo-expertbay.org", "role": "admin", "full_name": "Demo Administrator"},
    "coordinator@demo-expertbay.org": {"email": "coordinator@demo-expertbay.org", "role": "pilot_coordinator", "full_name": "Demo Coordinator"},
    "techreviewer@demo-expertbay.org": {"email": "techreviewer@demo-expertbay.org", "role": "technical_reviewer", "full_name": "Demo Technical Reviewer"},
    "domainreviewer@demo-expertbay.org": {"email": "domainreviewer@demo-expertbay.org", "role": "domain_reviewer", "full_name": "Demo Domain Reviewer"},
    "adjudicator@demo-expertbay.org": {"email": "adjudicator@demo-expertbay.org", "role": "adjudicator", "full_name": "Demo Adjudicator"},
    "stakeholder@demo-expertbay.org": {"email": "stakeholder@demo-expertbay.org", "role": "stakeholder", "full_name": "Demo Stakeholder"},
}

WRITE_ROLES = ["admin", "pilot_coordinator", "technical_reviewer", "domain_reviewer", "adjudicator"]
VERIFICATION_ROLES = ["admin", "pilot_coordinator"]
SIGNOFF_ROLES = ["admin"]
ADJUDICATION_ROLES = ["admin", "adjudicator"]


def authenticate_user(email, password):
    user = DEMO_USERS.get(email)
    if not user or not password:
        return None
    return user


def create_access_token(data, expires_delta=None):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + (expires_delta or datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: Optional[str] = Depends(oauth2_scheme)):
    exc = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Could not validate credentials. Please log in.",
                        headers={"WWW-Authenticate": "Bearer"})
    if not token:
        raise exc
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        role = payload.get("role")
        if not email or not role:
            raise exc
        return {"email": email, "role": role, "full_name": payload.get("full_name", email)}
    except JWTError:
        raise exc


def require_roles(allowed_roles):
    def _checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                                detail=f"Access denied. Required: {allowed_roles}. Your role: {current_user['role']}.")
        return current_user
    return _checker


require_write = require_roles(WRITE_ROLES)
require_verification = require_roles(VERIFICATION_ROLES)
require_signoff = require_roles(SIGNOFF_ROLES)
require_adjudication = require_roles(ADJUDICATION_ROLES)
require_any = get_current_user
