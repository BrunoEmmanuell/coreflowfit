# backend/ia/decision.py - ATUALIZADO
from __future__ import annotations
from typing import Dict, Any, List, Optional, Tuple

def build_decisions_seguras(
    objetivo: Optional[str],
    nivel_atividade: Optional[str],
    sexo: Optional[str],
    idade: Optional[int],
    lesoes: Optional[List[str]] = None,
    comorbidades: Optional[List[str]] = None,
) -> Tuple[Dict[str, Any], List[str]]:
    """Versão mais segura das decisões"""
    
    explicacoes: List[str] = []
    lesoes = lesoes or []
    comorbidades = comorbidades or []

    # Normalizações com validação
    objetivo_norm = _normaliza_objetivo(objetivo)
    nivel_norm = _normaliza_nivel(nivel_atividade)
    sexo_norm = _normaliza_sexo(sexo)

    # Configuração base mais conservadora
    base_cfg = OBJETIVO_CONFIG.get(objetivo_norm, OBJETIVO_CONFIG["hipertrofia"])
    series_base = base_cfg["series_base"]
    reps_range = base_cfg["reps_range"]
    volume_factor = 1.0
    max_impacto = "medio"  # Padrão mais seguro

    # VALIDAÇÕES DE SEGURANÇA CRÍTICAS
    restricoes_graves = False
    
    # 1. Verificar condições críticas
    for comorb in comorbidades:
        comorb_lower = comorb.lower()
        if any(c in comorb_lower for c in ["cardiopatia", "infarto", "avc"]):
            max_impacto = "baixo"
            volume_factor *= 0.6
            restricoes_graves = True
            explicacoes.append("CONDIÇÃO CARDÍACA GRAVE: Volume e impacto drasticamente reduzidos")
            
        elif "gestante" in comorb_lower or "gravidez" in comorb_lower:
            max_impacto = "baixo"
            volume_factor *= 0.7
            restricoes_graves = True
            explicacoes.append("GRAVIDEZ: Protocolo especial aplicado")

    # 2. Idade - ajustes mais conservadores
    if idade:
        if idade >= 65:
            max_impacto = "baixo"
            volume_factor *= 0.7
            explicacoes.append("Idade ≥65 anos: protocolo senior aplicado")
        elif idade >= 55:
            max_impacto = "medio"
            volume_factor *= 0.8
            explicacoes.append("Idade 55-64: ajustes conservadores")
        elif idade <= 16:
            max_impacto = "medio"
            volume_factor *= 0.8
            explicacoes.append("Adolescente: volume controlado")

    # 3. Lesões - validação mais rigorosa
    if lesoes and not restricoes_graves:
        lesoes_graves = any(l in ["coluna", "lombar", "hérnia", "cirurgia"] for l in lesoes)
        if lesoes_graves:
            max_impacto = "baixo"
            volume_factor *= 0.7
            explicacoes.append("Lesão grave: protocolo especial")

    # 4. Nível - ajustes seguros
    if nivel_norm == "iniciante":
        volume_factor *= 0.7
        max_impacto = "medio"
        explicacoes.append("Iniciante: volume reduzido para adaptação")
        
    elif nivel_norm == "avancado" and not restricoes_graves:
        volume_factor *= 1.1

    # Decisões finais
    decisions = {
        "objetivo": objetivo_norm,
        "nivel": nivel_norm,
        "sexo": sexo_norm,
        "series_base": int(series_base),
        "reps_range": reps_range,
        "volume_factor": float(volume_factor),
        "max_impacto": max_impacto,
        "restricoes_graves": restricoes_graves,
        "idade": idade,
        "explicacoes": explicacoes.copy()
    }

    return decisions, explicacoes

# Substituir a função original
build_decisions = build_decisions_seguras