from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db

router = APIRouter()

@router.get("/")
def listar_treinos(db: Session = Depends(get_db)):
    return {"treinos": []}

@router.post("/")
def criar_treino(db: Session = Depends(get_db)):
    return {"message": "Treino criado"}

@router.get("/{treino_id}")
def obter_treino(treino_id: int, db: Session = Depends(get_db)):
    return {"treino": {"id": treino_id, "nome": "Treino exemplo"}}

@router.put("/{treino_id}")
def atualizar_treino(treino_id: int, db: Session = Depends(get_db)):
    return {"message": f"Treino {treino_id} atualizado"}

@router.delete("/{treino_id}")
def deletar_treino(treino_id: int, db: Session = Depends(get_db)):
    return {"message": f"Treino {treino_id} deletado"}