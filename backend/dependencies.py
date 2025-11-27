# backend/dependencies.py - ATUALIZADO
from fastapi import Depends, HTTPException, status
from backend.auth import get_current_user
from typing import Annotated

async def get_current_trainer_id(user_id: str = Depends(get_current_user)):
    """Dependência que retorna o UUID do instrutor logado."""
    return user_id

TrainerId = Annotated[str, Depends(get_current_trainer_id)]