from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db

router = APIRouter()

@router.get("/")
def listar_alunos(db: Session = Depends(get_db)):
    return {"alunos": []}

@router.post("/")
def criar_aluno(db: Session = Depends(get_db)):
    return {"message": "Aluno criado"}

@router.get("/{aluno_id}")
def obter_aluno(aluno_id: int, db: Session = Depends(get_db)):
    return {"aluno": {"id": aluno_id, "nome": "Aluno exemplo"}}

@router.put("/{aluno_id}")
def atualizar_aluno(aluno_id: int, db: Session = Depends(get_db)):
    return {"message": f"Aluno {aluno_id} atualizado"}

@router.delete("/{aluno_id}")
def deletar_aluno(aluno_id: int, db: Session = Depends(get_db)):
    return {"message": f"Aluno {aluno_id} deletado"}