from fastapi import APIRouter, HTTPException, status, Depends
from typing import Dict, Any
import logging
import os
from datetime import datetime, timedelta

from passlib.context import CryptContext
from jose import jwt, JWTError
from pydantic import BaseModel
from dotenv import load_dotenv
import pathlib

# guarantee .env loaded (helps when uvicorn reloads)
load_dotenv(dotenv_path=str(pathlib.Path(__file__).resolve().parent / ".env"))

SECRET_KEY = os.getenv("SECRET_KEY", "change_this_secret")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_SECONDS = int(os.getenv("ACCESS_TOKEN_EXPIRE_SECONDS", "86400"))

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/auth", tags=["Autenticação"])

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Mock database - substituir por banco real
users_db = {}

# Pydantic schemas (minimal) - replace with your project's schemas if necessary
class UserRegister(BaseModel):
    telefone: str
    password: str
    nome: str | None = None
    tipo: str | None = None

class UserLogin(BaseModel):
    telefone: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

# --------------------
# Auth helper functions
# --------------------
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(subject: str, expires_delta: int | None = None) -> str:
    to_encode = {"sub": str(subject)}
    expire = datetime.utcnow() + timedelta(seconds=(expires_delta or ACCESS_TOKEN_EXPIRE_SECONDS))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Dependency to get current user id (returns subject as stored in token)
def get_current_user(token: str = Depends(lambda: None)):
    """
    This is a simplified dependency placeholder.
    In FastAPI you'd normally use OAuth2PasswordBearer to extract token from header.
    Some routers in this project may use get_current_user differently.
    If your routers expect OAuth2, consider replacing this with the standard OAuth2PasswordBearer flow.
    """
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="get_current_user is a placeholder dependency. Use OAuth2PasswordBearer or adapt routers to pass token.")

# --------------------
# Router endpoints
# --------------------
@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserRegister) -> Dict[str, Any]:
    """Registro de novo usuário"""
    if user_data.telefone in users_db:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Usuário já existe")
    user_id = len(users_db) + 1
    hashed = hash_password(user_data.password)
    users_db[user_data.telefone] = {
        "id": user_id,
        "telefone": user_data.telefone,
        "nome": user_data.nome or "",
        "tipo": user_data.tipo or "aluno",
        "hashed_password": hashed,
    }
    access_token = create_access_token(subject=user_id)
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin) -> Dict[str, Any]:
    """Login"""
    user = users_db.get(credentials.telefone)
    if not user or not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais inválidas")
    access_token = create_access_token(subject=user["id"])
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
async def read_current_user(current_user: int = Depends(lambda: 1)):
    """Retorna informações do usuário atual (placeholder)"""
    # This endpoint uses a placeholder dependency; adapt to your token flow if needed.
    for user in users_db.values():
        if user["id"] == current_user:
            return {
                "user_id": user["id"],
                "telefone": user["telefone"],
                "nome": user["nome"],
                "tipo": user["tipo"]
            }
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")
