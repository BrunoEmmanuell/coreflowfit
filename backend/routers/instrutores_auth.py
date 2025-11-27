from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field

from backend.database import get_db
from backend.models import Instrutor # Importa do models.py unificado
from backend.auth import hash_password, verify_password, create_access_token
from backend.security_config import limiter # Importa o limiter

router = APIRouter(prefix="/api/v1/auth", tags=["Autenticação"])

# Schema para Registro (Compatível com Schema SQL Elite 4.0)
class InstrutorCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    nome_completo: str | None = None
    password: str = Field(..., min_length=6)

class TokenResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    ok: bool = True
    instrutor_id: str

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_instrutor(
    instrutor_data: InstrutorCreate,
    db: Session = Depends(get_db),
):
    # Verifica duplicidade de usuário ou email
    existente = db.query(Instrutor).filter(
        (Instrutor.username == instrutor_data.username) | 
        (Instrutor.email == instrutor_data.email)
    ).first()

    if existente:
        raise HTTPException(
            status_code=400,
            detail="Username ou Email já cadastrados.",
        )

    novo_instrutor = Instrutor(
        username=instrutor_data.username,
        email=instrutor_data.email,
        nome_completo=instrutor_data.nome_completo,
        hashed_password=hash_password(instrutor_data.password),
    )

    db.add(novo_instrutor)
    try:
        db.commit()
        db.refresh(novo_instrutor)
        return {"ok": True, "id": str(novo_instrutor.id), "username": novo_instrutor.username}
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Erro ao criar instrutor: {str(e)}")

@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute") # Proteção contra Brute-Force
def login_instrutor(
    request: Request, # Necessário para o limiter funcionar
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    # O form_data do FastAPI coloca o usuário no campo 'username'
    instrutor = db.query(Instrutor).filter(Instrutor.username == form_data.username).first()

    if not instrutor or not verify_password(form_data.password, instrutor.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Credenciais inválidas.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=str(instrutor.id))

    return {
        "token": access_token,
        "token_type": "bearer",
        "ok": True,
        "instrutor_id": str(instrutor.id),
    }