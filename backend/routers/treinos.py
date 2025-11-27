from fastapi import APIRouter, HTTPException, status, Depends, Query
from pydantic import BaseModel
from typing import List, Optional
import json
import uuid
from datetime import datetime

from backend.database import execute_query
from backend.dependencies import TrainerId

router = APIRouter(prefix="/api/v1/treinos", tags=["treinos"])

# Modelos Pydantic para validação
class TreinoResponse(BaseModel):
    id: str
    conteudo_json: dict
    gerado_em: datetime
    nome_aluno: str

class TreinoListResponse(BaseModel):
    id: str
    gerado_em: datetime
    aluno_nome: str
    objetivo: Optional[str] = None
    divisao: Optional[str] = None
    total_exercicios: int = 0

@router.get("/{treino_id}", status_code=status.HTTP_200_OK, response_model=TreinoResponse)
def obter_treino(treino_id: str, instrutor_id: TrainerId):
    """
    Busca um treino específico pelo ID, garantindo que pertença a um aluno do instrutor logado.
    """
    try:
        # Validação do UUID
        try:
            uuid.UUID(treino_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID do treino inválido."
            )

        # Busca o treino + nome do aluno (para exibir no título)
        query = """
            SELECT 
                t.id, 
                t.conteudo_json, 
                t.gerado_em, 
                a.nome as nome_aluno,
                t.conteudo_json->'meta'->'decisions'->>'split_used' as divisao,
                t.conteudo_json->>'objetivo' as objetivo
            FROM treinos_gerados t
            JOIN alunos a ON t.aluno_id = a.id
            WHERE t.id = %s AND a.instrutor_id = %s
        """
        row = execute_query(query, (treino_id, instrutor_id), fetchone=True)
        
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Treino não encontrado ou acesso negado."
            )
            
        # Converte para dicionário
        treino = dict(row)
        
        # Garante que o JSON seja um objeto/lista Python, não uma string
        if isinstance(treino['conteudo_json'], str):
            try:
                treino['conteudo_json'] = json.loads(treino['conteudo_json'])
            except json.JSONDecodeError:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Formato inválido do treino no banco de dados."
                )
        
        # Calcula total de exercícios para frontend
        if isinstance(treino['conteudo_json'], dict):
            plano = treino['conteudo_json'].get('plano', [])
            total_exercicios = sum(len(dia.get('exercicios', [])) for dia in plano)
            treino['total_exercicios'] = total_exercicios
            
        return treino

    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao buscar treino {treino_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao buscar treino."
        )

@router.get("/aluno/{aluno_id}", status_code=status.HTTP_200_OK)
def listar_treinos_aluno(
    aluno_id: str, 
    instrutor_id: TrainerId,
    page: int = Query(1, ge=1, description="Página"),
    limit: int = Query(10, ge=1, le=50, description="Itens por página")
):
    """
    Lista todos os treinos de um aluno específico com paginação.
    """
    try:
        # Validação do UUID do aluno
        try:
            uuid.UUID(aluno_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID do aluno inválido."
            )

        # Verifica se o aluno pertence ao instrutor
        aluno_check = execute_query(
            "SELECT id FROM alunos WHERE id = %s AND instrutor_id = %s",
            (aluno_id, instrutor_id),
            fetchone=True
        )
        
        if not aluno_check:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Aluno não encontrado ou acesso negado."
            )

        # Calcula offset para paginação
        offset = (page - 1) * limit

        # Query para listar treinos com informações resumidas
        query = """
            SELECT 
                t.id,
                t.gerado_em,
                a.nome as aluno_nome,
                t.conteudo_json->'meta'->'decisions'->>'split_used' as divisao,
                t.conteudo_json->>'objetivo' as objetivo,
                jsonb_array_length(t.conteudo_json->'plano') as total_dias,
                (
                    SELECT COUNT(*)
                    FROM jsonb_array_elements(t.conteudo_json->'plano') as dia,
                    jsonb_array_elements(dia->'exercicios') as exercicio
                ) as total_exercicios
            FROM treinos_gerados t
            JOIN alunos a ON t.aluno_id = a.id
            WHERE t.aluno_id = %s
            ORDER BY t.gerado_em DESC
            LIMIT %s OFFSET %s
        """
        
        rows = execute_query(query, (aluno_id, limit, offset), fetchall=True)
        treinos = [dict(row) for row in rows]

        # Conta total de treinos para paginação
        count_query = "SELECT COUNT(*) as total FROM treinos_gerados WHERE aluno_id = %s"
        total_result = execute_query(count_query, (aluno_id,), fetchone=True)
        total_treinos = total_result['total'] if total_result else 0

        return {
            "ok": True,
            "treinos": treinos,
            "paginacao": {
                "pagina_atual": page,
                "itens_por_pagina": limit,
                "total_itens": total_treinos,
                "total_paginas": (total_treinos + limit - 1) // limit
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao listar treinos do aluno {aluno_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao listar treinos."
        )

@router.delete("/{treino_id}", status_code=status.HTTP_200_OK)
def excluir_treino(treino_id: str, instrutor_id: TrainerId):
    """
    Exclui um treino específico, garantindo que pertence ao instrutor.
    """
    try:
        # Validação do UUID
        try:
            uuid.UUID(treino_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID do treino inválido."
            )

        # Verifica se o treino existe e pertence ao instrutor
        check_query = """
            SELECT t.id
            FROM treinos_gerados t
            JOIN alunos a ON t.aluno_id = a.id
            WHERE t.id = %s AND a.instrutor_id = %s
        """
        treino = execute_query(check_query, (treino_id, instrutor_id), fetchone=True)
        
        if not treino:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Treino não encontrado ou acesso negado."
            )

        # Exclui o treino
        delete_query = "DELETE FROM treinos_gerados WHERE id = %s"
        execute_query(delete_query, (treino_id,), fetchone=False)

        return {
            "ok": True,
            "message": "Treino excluído com sucesso.",
            "treino_id": treino_id
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao excluir treino {treino_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao excluir treino."
        )

@router.get("/", status_code=status.HTTP_200_OK)
def listar_treinos_recentes(
    instrutor_id: TrainerId,
    page: int = Query(1, ge=1, description="Página"),
    limit: int = Query(10, ge=1, le=50, description="Itens por página")
):
    """
    Lista os treinos mais recentes de todos os alunos do instrutor.
    """
    try:
        offset = (page - 1) * limit

        query = """
            SELECT 
                t.id,
                t.gerado_em,
                a.nome as aluno_nome,
                a.objetivo,
                t.conteudo_json->'meta'->'decisions'->>'split_used' as divisao,
                t.conteudo_json->>'nivel' as nivel,
                (
                    SELECT COUNT(*)
                    FROM jsonb_array_elements(t.conteudo_json->'plano') as dia,
                    jsonb_array_elements(dia->'exercicios') as exercicio
                ) as total_exercicios
            FROM treinos_gerados t
            JOIN alunos a ON t.aluno_id = a.id
            WHERE a.instrutor_id = %s
            ORDER BY t.gerado_em DESC
            LIMIT %s OFFSET %s
        """
        
        rows = execute_query(query, (instrutor_id, limit, offset), fetchall=True)
        treinos = [dict(row) for row in rows]

        # Total de treinos
        count_query = """
            SELECT COUNT(*) as total
            FROM treinos_gerados t
            JOIN alunos a ON t.aluno_id = a.id
            WHERE a.instrutor_id = %s
        """
        total_result = execute_query(count_query, (instrutor_id,), fetchone=True)
        total_treinos = total_result['total'] if total_result else 0

        return {
            "ok": True,
            "treinos": treinos,
            "paginacao": {
                "pagina_atual": page,
                "itens_por_pagina": limit,
                "total_itens": total_treinos,
                "total_paginas": (total_treinos + limit - 1) // limit
            }
        }

    except Exception as e:
        print(f"Erro ao listar treinos recentes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao listar treinos."
        )

# Health check específico para treinos
@router.get("/health/check", status_code=status.HTTP_200_OK)
def health_check():
    """
    Health check para o serviço de treinos.
    """
    try:
        # Testa uma query simples
        test_query = "SELECT COUNT(*) as total FROM treinos_gerados LIMIT 1"
        result = execute_query(test_query, fetchone=True)
        
        return {
            "ok": True,
            "service": "treinos",
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "database": "connected"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Serviço de treinos indisponível: {str(e)}"
        )