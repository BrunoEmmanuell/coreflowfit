# backend/routers/medidas.py
from fastapi import APIRouter, HTTPException, status
from typing import Optional
from pydantic import BaseModel, field_validator, ValidationInfo
from backend.database import execute_query
from backend.utils.metrics import compute_all

router = APIRouter(prefix="/api/v1/medidas", tags=["medidas"])

class MedidaIn(BaseModel):
    aluno_id: str # Ajustado para str (UUID) conforme novo schema
    peso: Optional[float] = None
    altura: Optional[float] = None
    cintura: Optional[float] = None
    quadril: Optional[float] = None
    peitoral: Optional[float] = None
    abdomen: Optional[float] = None
    ombro: Optional[float] = None
    pescoco: Optional[float] = None
    braco_direito: Optional[float] = None
    braco_esquerdo: Optional[float] = None
    antebraco_direito: Optional[float] = None
    antebraco_esquerdo: Optional[float] = None
    coxa_direita: Optional[float] = None
    coxa_esquerda: Optional[float] = None
    panturrilha_direita: Optional[float] = None
    panturrilha_esquerda: Optional[float] = None
    idade: Optional[int] = None
    sexo: Optional[str] = None

    @field_validator('peso')
    @classmethod
    def validate_peso(cls, v):
        if v is not None and (v < 20 or v > 300):
            raise ValueError('Peso deve estar entre 20 e 300 kg')
        return v

    @field_validator('altura')
    @classmethod
    def validate_altura(cls, v):
        if v is not None and (v < 0.5 or v > 3.0): # Ajustei limite sup para 3.0m
            raise ValueError('Altura deve estar entre 0.5 e 3.0 metros')
        return v

    @field_validator(
        'cintura', 'quadril', 'peitoral', 'abdomen', 'ombro', 'pescoco',
        'braco_direito', 'braco_esquerdo', 'antebraco_direito', 'antebraco_esquerdo',
        'coxa_direita', 'coxa_esquerda', 'panturrilha_direita', 'panturrilha_esquerda'
    )
    @classmethod
    def validate_medidas(cls, v, info: ValidationInfo):
        if v is not None:
            if v < 10 or v > 200:
                raise ValueError(f'{info.field_name} deve estar entre 10 e 200 cm')
        return v

@router.post("/", summary="Registrar avaliação / medida", status_code=status.HTTP_201_CREATED)
def registrar_medida(data: MedidaIn):
    try:
        # Pydantic V2 usa model_dump()
        payload = data.model_dump(exclude_unset=True)
        aluno_id = payload.pop("aluno_id")
        
        # Remove campos auxiliares que não vão para o banco (idade, sexo são usados só no compute_all se necessário)
        idade = payload.pop("idade", None)
        sexo = payload.pop("sexo", None)

        # Calcula métricas (IMC, IAC, etc) se possível
        # Passamos uma cópia com peso e altura garantidos
        metrics_payload = payload.copy()
        metrics = compute_all(metrics_payload)
        
        # Adiciona IMC calculado ao payload se existir
        if 'imc' in metrics:
            payload['imc'] = metrics['imc']

        # Constrói Query Dinâmica para INSERT
        columns = list(payload.keys())
        values = list(payload.values())
        
        # Adiciona aluno_id e data
        columns.insert(0, "aluno_id")
        values.insert(0, aluno_id)
        
        placeholders = ["%s"] * len(values)
        col_str = ", ".join(columns)
        val_str = ", ".join(placeholders)
        
        query = f"""
            INSERT INTO medidas_corpo ({col_str}, data_medida)
            VALUES ({val_str}, NOW())
            RETURNING id
        """
        
        result = execute_query(query, tuple(values), fetchone=True)
        
        return {"ok": True, "id": str(result['id']) if result else None, "metrics": metrics}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao salvar medidas: {str(e)}")