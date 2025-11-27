# backend/routers/saude.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
from typing import Optional
from backend.database import get_db_conn, execute_query

router = APIRouter(prefix="/api/v1/saude", tags=["saude"])

class SaudeIn(BaseModel):
    aluno_id: str # Ajustado para str (UUID)
    possui_lesoes: Optional[bool] = False
    lesoes_descricao: Optional[str] = None
    problemas_coracao: Optional[bool] = False
    problemas_respiratorios: Optional[bool] = False
    problemas_articulares: Optional[bool] = False
    diabetes: Optional[bool] = False
    hipertensao: Optional[bool] = False
    colesterol_alto: Optional[bool] = False
    medicamentos_uso: Optional[str] = None
    cirurgia_recente: Optional[bool] = False
    cirurgia_descricao: Optional[str] = None
    restricoes_medicas: Optional[str] = None
    risco_cardio: Optional[str] = None
    observacoes: Optional[str] = None

    @field_validator('lesoes_descricao', 'medicamentos_uso', 'cirurgia_descricao', 'restricoes_medicas', 'observacoes')
    @classmethod
    def validate_text_length(cls, v):
        if v and len(v) > 1000:
            raise ValueError('Texto muito longo (máximo 1000 caracteres)')
        return v

@router.post("/save", summary="Salvar/atualizar dados de saúde")
def salvar_saude(payload: SaudeIn):
    try:
        # Verifica se existe registro para UPDATE ou faz INSERT
        check_q = "SELECT id FROM saude_aluno WHERE aluno_id = %s"
        existing = execute_query(check_q, (payload.aluno_id,), fetchone=True)
        
        if existing:
            query = """
                UPDATE saude_aluno SET
                possui_lesoes=%s, lesoes_descricao=%s, problemas_coracao=%s, problemas_respiratorios=%s,
                problemas_articulares=%s, diabetes=%s, hipertensao=%s, colesterol_alto=%s,
                medicamentos_uso=%s, cirurgia_recente=%s, cirurgia_descricao=%s,
                restricoes_medicas=%s, risco_cardio=%s, observacoes=%s
                WHERE aluno_id=%s
            """
            params = (
                payload.possui_lesoes, payload.lesoes_descricao, payload.problemas_coracao,
                payload.problemas_respiratorios, payload.problemas_articulares, payload.diabetes,
                payload.hipertensao, payload.colesterol_alto, payload.medicamentos_uso,
                payload.cirurgia_recente, payload.cirurgia_descricao, payload.restricoes_medicas,
                payload.risco_cardio, payload.observacoes, payload.aluno_id
            )
            execute_query(query, params, fetch=False)
        else:
            query = """
                INSERT INTO saude_aluno (
                    aluno_id, possui_lesoes, lesoes_descricao, problemas_coracao, problemas_respiratorios,
                    problemas_articulares, diabetes, hipertensao, colesterol_alto, medicamentos_uso,
                    cirurgia_recente, cirurgia_descricao, restricoes_medicas, risco_cardio, observacoes
                ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """
            params = (
                payload.aluno_id, payload.possui_lesoes, payload.lesoes_descricao, payload.problemas_coracao,
                payload.problemas_respiratorios, payload.problemas_articulares, payload.diabetes,
                payload.hipertensao, payload.colesterol_alto, payload.medicamentos_uso,
                payload.cirurgia_recente, payload.cirurgia_descricao, payload.restricoes_medicas,
                payload.risco_cardio, payload.observacoes
            )
            execute_query(query, params, fetch=False)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"ok": True}

@router.get("/aluno/{aluno_id}", summary="Obter dados de saúde")
def obter_saude(aluno_id: str):
    q = "SELECT * FROM saude_aluno WHERE aluno_id = %s"
    try:
        res = execute_query(q, (aluno_id,), fetchone=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return dict(res) if res else {}