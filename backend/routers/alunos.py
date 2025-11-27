from fastapi import APIRouter, HTTPException, status, Depends, Request
from sqlalchemy.orm import Session
from typing import Optional
import logging
import uuid
import json
from sqlalchemy import func

from pydantic import BaseModel
from backend.database import get_db
from backend.dependencies import TrainerId
from backend.models import Aluno, MedidasCorpo, SaudeAluno
from backend.security_config import limiter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/alunos", tags=["alunos"])

class AlunoCompletoCreate(BaseModel):
    nome: str
    idade: Optional[str] = None
    sexo: str = "Masculino"
    objetivo: str = "Hipertrofia"
    nivel: str = "Iniciante"
    divisao: str = "Auto"
    observacoes: Optional[str] = None
    peso_kg: Optional[float] = None
    altura_m: Optional[float] = None
    ombros: Optional[float] = None
    peito: Optional[float] = None
    cintura: Optional[float] = None
    quadril: Optional[float] = None
    braco_direito: Optional[float] = None
    braco_esquerdo: Optional[float] = None
    coxa_direita: Optional[float] = None
    coxa_esquerda: Optional[float] = None
    panturrilha_direita: Optional[float] = None
    panturrilha_esquerda: Optional[float] = None
    hipertensao: bool = False
    diabetes: bool = False
    cardiopatia: bool = False
    fuma: bool = False
    lesoes: Optional[str] = None
    medicacao: Optional[str] = None

@router.get("/", status_code=status.HTTP_200_OK)
def listar_alunos(instrutor_id: TrainerId, db: Session = Depends(get_db)):
    try:
        alunos_db = db.query(Aluno).filter(Aluno.instrutor_id == instrutor_id).order_by(Aluno.criado_em.desc()).all()
        
        resultado = []
        for aluno in alunos_db:
            ultima_medida = aluno.medidas[0] if aluno.medidas else None
            resultado.append({
                "id": aluno.id,
                "nome": aluno.nome,
                "objetivo": aluno.objetivo,
                "nivel_experiencia": aluno.nivel_experiencia,
                "sexo": aluno.sexo,
                "criado_em": aluno.criado_em,
                "peso_kg": ultima_medida.peso_kg if ultima_medida else None,
                "altura_m": ultima_medida.altura_m if ultima_medida else None
            })
        return {"ok": True, "alunos": resultado}
    except Exception as e:
        logger.error(f"Erro ao listar alunos: {e}")
        return {"ok": False, "alunos": []}

@router.post("/completo", status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
def criar_aluno_completo(
    request: Request, 
    payload: AlunoCompletoCreate, 
    instrutor_id: TrainerId, 
    db: Session = Depends(get_db)
):
    existente = db.query(Aluno).filter(
        func.lower(Aluno.nome) == payload.nome.strip().lower(),
        Aluno.instrutor_id == instrutor_id
    ).first()
    
    if existente:
        raise HTTPException(400, "Aluno já existe.")

    obs = payload.observacoes or ""
    if payload.idade: obs += f" | Idade: {payload.idade}"
    if payload.divisao: obs += f" | Divisão: {payload.divisao}"
    
    altura = payload.altura_m
    if altura and altura > 3.0: altura = altura / 100.0

    try:
        novo_id = str(uuid.uuid4())
        
        novo_aluno = Aluno(
            id=novo_id,
            instrutor_id=instrutor_id,
            nome=payload.nome,
            sexo=payload.sexo,
            objetivo=payload.objetivo,
            nivel_experiencia=payload.nivel,
            observacoes=obs
        )
        db.add(novo_aluno)
        
        nova_medida = MedidasCorpo(
            aluno_id=novo_id,
            peso_kg=payload.peso_kg,
            altura_m=altura,
            ombros=payload.ombros,
            peito=payload.peito,
            cintura=payload.cintura,
            quadril=payload.quadril,
            braco_direito=payload.braco_direito,
            braco_esquerdo=payload.braco_esquerdo,
            coxa_direita=payload.coxa_direita,
            coxa_esquerda=payload.coxa_esquerda,
            panturrilha_direita=payload.panturrilha_direita,
            panturrilha_esquerda=payload.panturrilha_esquerda
        )
        db.add(nova_medida)
        
        nova_saude = SaudeAluno(
            aluno_id=novo_id,
            hipertensao=payload.hipertensao,
            diabetes=payload.diabetes,
            cardiopatia=payload.cardiopatia,
            fuma=payload.fuma,
            lesoes=payload.lesoes,
            medicacao=payload.medicacao
        )
        db.add(nova_saude)
        
        db.commit()
        return {"ok": True, "id": novo_id}
        
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao criar aluno: {e}")
        raise HTTPException(500, "Erro interno.")

@router.delete("/{aluno_id}")
def excluir_aluno(aluno_id: str, instrutor_id: TrainerId, db: Session = Depends(get_db)):
    aluno = db.query(Aluno).filter(Aluno.id == aluno_id, Aluno.instrutor_id == instrutor_id).first()
    if not aluno:
        raise HTTPException(404, "Não encontrado")
    db.delete(aluno)
    db.commit()
    return {"ok": True}