# backend/routers/perfil.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, validator
from backend.database import get_db_conn, execute_query

router = APIRouter(prefix="/api/v1/perfil", tags=["perfil"])

class PerfilIn(BaseModel):
    aluno_id: int
    experiencia_treino: str = None
    nivel_atividade_diaria: str = None
    qualidade_sono: int = None
    nivel_estresse: int = None
    humor_energia: int = None
    objetivo_principal: str = None
    tempo_disponivel_min: int = None
    dias_por_semana: int = None
    preferencias: dict = None

    @validator('qualidade_sono', 'nivel_estresse', 'humor_energia')
    def validate_scale(cls, v):
        if v is not None and (v < 1 or v > 10):
            raise ValueError('Avaliações devem estar entre 1 e 10')
        return v

    @validator('tempo_disponivel_min')
    def validate_tempo(cls, v):
        if v is not None and (v < 10 or v > 300):
            raise ValueError('Tempo deve estar entre 10 e 300 minutos')
        return v

    @validator('dias_por_semana')
    def validate_dias(cls, v):
        if v is not None and (v < 1 or v > 7):
            raise ValueError('Dias por semana deve estar entre 1 e 7')
        return v    

@router.post("/save")
def salvar_perfil(payload: PerfilIn):
    try:
        with get_db_conn() as (conn, cur):
            cur.execute("SELECT id FROM perfil_comportamental WHERE aluno_id = %s", (payload.aluno_id,))
            row = cur.fetchone()
            if row:
                cur.execute("""
                    UPDATE perfil_comportamental SET
                    experiencia_treino=%s, nivel_atividade_diaria=%s, qualidade_sono=%s, nivel_estresse=%s,
                    humor_energia=%s, objetivo_principal=%s, tempo_disponivel_min=%s, dias_por_semana=%s,
                    preferencias=%s, atualizado_em=NOW()
                    WHERE aluno_id=%s
                """, (
                    payload.experiencia_treino, payload.nivel_atividade_diaria, payload.qualidade_sono,
                    payload.nivel_estresse, payload.humor_energia, payload.objetivo_principal,
                    payload.tempo_disponivel_min, payload.dias_por_semana, payload.preferencias, payload.aluno_id
                ))
            else:
                cur.execute("""
                    INSERT INTO perfil_comportamental (
                        aluno_id, experiencia_treino, nivel_atividade_diaria, qualidade_sono, nivel_estresse,
                        humor_energia, objetivo_principal, tempo_disponivel_min, dias_por_semana, preferencias, atualizado_em
                    ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW())
                """, (
                    payload.aluno_id, payload.experiencia_treino, payload.nivel_atividade_diaria, payload.qualidade_sono,
                    payload.nivel_estresse, payload.humor_energia, payload.objetivo_principal, payload.tempo_disponivel_min,
                    payload.dias_por_semana, payload.preferencias
                ))
            conn.commit()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"ok": True}

@router.get("/aluno/{aluno_id}")
def obter_perfil(aluno_id: int):
    q = "SELECT * FROM perfil_comportamental WHERE aluno_id = %s"
    try:
        res = execute_query(q, (aluno_id,), fetchone=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return dict(res) if res else {}
