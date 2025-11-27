# backend/ia/api.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import json
import uuid
import logging
from datetime import datetime

# Imports internos
from backend.database import execute_query

# Tenta importar a IA de forma segura
try:
    from backend.ia.gerador_treino_ia import gerar_treino_ia
except ImportError:
    print("CRÍTICO: Gerador IA não encontrado. Verifique se 'backend/ia/gerador_treino_ia.py' existe.")
    gerar_treino_ia = None

logger = logging.getLogger("coreflowfit.ia")
router = APIRouter(prefix="/ia", tags=["ia"])

class GerarTreinoRequest(BaseModel):
    aluno_id: str
    divisao_preferida: Optional[str] = "auto"

def get_aluno_profile(aluno_id: str) -> Optional[Dict[str, Any]]:
    """Busca todos os dados do aluno necessários para a IA."""
    query = """
        SELECT 
            a.id, a.nome, a.sexo, a.nivel_experiencia, a.objetivo, a.observacoes,
            m.peso_kg, m.altura_m,
            s.hipertensao, s.diabetes, s.cardiopatia, s.lesoes
        FROM alunos a
        LEFT JOIN saude_aluno s ON a.id = s.aluno_id
        LEFT JOIN (
            SELECT peso_kg, altura_m FROM medidas_corpo 
            WHERE aluno_id = %s ORDER BY data_medida DESC LIMIT 1
        ) m ON true
        WHERE a.id = %s
    """
    # O execute_query agora retorna dict, então podemos usar direto
    perfil = execute_query(query, (aluno_id, aluno_id), fetchone=True)
    
    if not perfil:
        return None

    # Processamento de dados (converte strings do banco para formatos úteis)
    idade = 30
    if "Idade:" in (perfil.get("observacoes") or ""):
        try:
            idade = int(perfil["observacoes"].split("Idade:")[1].split("|")[0].strip())
        except: pass

    comorbidades = []
    if perfil.get("hipertensao"): comorbidades.append("hipertensão")
    if perfil.get("diabetes"): comorbidades.append("diabetes")
    if perfil.get("cardiopatia"): comorbidades.append("cardiopatia")

    lesoes = [l.strip() for l in (perfil.get("lesoes") or "").split(",") if l.strip()]

    return {
        "id": str(perfil["id"]),
        "nome": perfil["nome"],
        "sexo": perfil.get("sexo", "Masculino"),
        "idade": idade,
        "peso": float(perfil.get("peso_kg") or 70),
        "altura": float(perfil.get("altura_m") or 1.70),
        "nivel": perfil.get("nivel_experiencia", "Iniciante"),
        "objetivo": perfil.get("objetivo", "Hipertrofia"),
        "comorbidades": comorbidades,
        "lesoes": lesoes
    }

@router.post("/gerar-treino")
def gerar_treino_endpoint(payload: GerarTreinoRequest):
    try:
        # 1. Busca Perfil
        perfil = get_aluno_profile(payload.aluno_id)
        if not perfil:
            raise HTTPException(status_code=404, detail="Aluno não encontrado.")

        # 2. Verifica se a IA está ativa
        if not gerar_treino_ia:
            raise HTTPException(status_code=500, detail="Sistema de IA indisponível no servidor.")

        # 3. Gera Treino
        resultado = gerar_treino_ia(
            aluno_id=perfil["id"],
            objetivo=perfil["objetivo"],
            nivel_atividade=perfil["nivel"],
            sexo=perfil["sexo"],
            idade=perfil["idade"],
            peso=perfil["peso"],
            altura=perfil["altura"],
            lesoes=perfil["lesoes"],
            comorbidades=perfil["comorbidades"],
            divisao_preferida=payload.divisao_preferida
        )

        if not resultado.get("ok"):
            raise HTTPException(status_code=500, detail=f"Falha na IA: {resultado.get('error', 'Erro desconhecido')}")

        # 4. Salva no Banco (COM RETURNING ID para não dar erro)
        novo_id = str(uuid.uuid4())
        conteudo_json = json.dumps(resultado["plano"], ensure_ascii=False)
        
        row = execute_query(
            """
            INSERT INTO treinos_gerados (id, aluno_id, conteudo_json, gerado_em)
            VALUES (%s, %s, %s, NOW())
            RETURNING id
            """,
            (novo_id, payload.aluno_id, conteudo_json),
            fetchone=True
        )
        
        if not row:
             raise HTTPException(status_code=500, detail="Erro ao salvar treino no banco.")

        return {
            "ok": True,
            "message": "Treino gerado!",
            "treino_id": row["id"],
            "plano": resultado["plano"]
        }

    except Exception as e:
        logger.exception("Erro ao gerar treino")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")