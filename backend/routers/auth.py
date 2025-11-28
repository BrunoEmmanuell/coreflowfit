from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db

router = APIRouter()

@router.post("/login")
def login():
    return {"message": "Endpoint de login"}

@router.post("/register")
def register():
    return {"message": "Endpoint de registro"}

@router.get("/me")
def get_current_user():
    return {"message": "Dados do usuário atual"}