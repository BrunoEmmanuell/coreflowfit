from __future__ import annotations

import json
import random
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from .decision import build_decisions

try:
    from .elite_brain import EliteBrain
except ImportError:
    EliteBrain = None

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
DEFAULT_EXERCICIOS_PATH = BASE_DIR / "exercicios.json"

_exercicios_cache = None
_cache_last_modified = None

# ===========================
# FUNÇÕES AUXILIARES
# ===========================

def _norm(s: str) -> str:
    """Normaliza string para comparação"""
    return s.strip().lower() if s else ""

def _load_exercicios() -> List[Dict[str, Any]]:
    """Carrega exercícios do JSON com cache"""
    global _exercicios_cache, _cache_last_modified
    
    try:
        current_modified = DEFAULT_EXERCICIOS_PATH.stat().st_mtime
        if (_exercicios_cache is None or 
            _cache_last_modified is None or 
            current_modified != _cache_last_modified):
            
            with open(DEFAULT_EXERCICIOS_PATH, 'r', encoding='utf-8') as f:
                _exercicios_cache = json.load(f)
            _cache_last_modified = current_modified
            logger.info(f"Carregados {len(_exercicios_cache)} exercícios")
        
        return _exercicios_cache
    except Exception as e:
        logger.error(f"Erro ao carregar exercícios: {e}")
        return []

def _checa_impacto(exercicio: Dict[str, Any], max_impacto: str) -> bool:
    """Verifica se o exercício está dentro do impacto permitido"""
    impacto_ex = _norm(exercicio.get("impacto", "medio"))
    niveis_impacto = {"baixo": 0, "medio": 1, "alto": 2}
    
    nivel_max = niveis_impacto.get(_norm(max_impacto), 2)
    nivel_ex = niveis_impacto.get(impacto_ex, 1)
    
    return nivel_ex <= nivel_max

def _is_exercicio_proibido_por_sexo(exercicio: Dict[str, Any], sexo: Optional[str]) -> bool:
    """Verifica se exercício é proibido para o sexo"""
    if not sexo:
        return False
        
    proibicoes = exercicio.get("proibido_para", [])
    if isinstance(proibicoes, str):
        proibicoes = [proibicoes]
    
    return any(_norm(proib) == _norm(sexo) for proib in proibicoes)

def _selecionar_exercicios_variados(scored: List, num_ex: int, grupo: str) -> List[Dict[str, Any]]:
    """Seleciona exercícios variados evitando repetição"""
    selecionados = []
    equipamentos_usados = set()
    
    for score, ex in scored:
        if len(selecionados) >= num_ex:
            break
            
        equipamento = _norm(ex.get("equipamento", ""))
        
        # Se já usou muito esse equipamento, pular
        if equipamento in equipamentos_usados and len(equipamentos_usados) > 1:
            continue
            
        selecionados.append(ex)
        equipamentos_usados.add(equipamento)
    
    # Se não conseguiu preencher, pega os melhores independente do equipamento
    if len(selecionados) < num_ex:
        for score, ex in scored:
            if ex not in selecionados:
                selecionados.append(ex)
            if len(selecionados) >= num_ex:
                break
                
    return selecionados

# ===========================
# NOVO SISTEMA DE SPLITS AVANÇADOS
# ===========================

def _estrutura_fullbody_iniciante(sexo: Optional[str]) -> List[Dict[str, Any]]:
    """FullBody otimizado para primeiro dia de academia"""
    return [{
        "dia": "A",
        "nome_dia": "Full Body - Iniciante",
        "grupos_musculares": {
            "Peito": 2, "Costas": 2, "Quadriceps": 2, 
            "Ombros": 1, "Biceps": 1, "Triceps": 1, "Core": 1
        },
        "dificuldade": "iniciante",
        "obs": "Treino completo para adaptação inicial"
    }]

def _estrutura_abc_masculino(objetivo: str) -> List[Dict[str, Any]]:
    """ABC otimizado para homens"""
    base_structure = [
        {
            "dia": "A",
            "nome_dia": "Peito, Ombros e Tríceps",
            "grupos_musculares": {
                "Peito": 4, "Ombros": 3, "Triceps": 3
            }
        },
        {
            "dia": "B", 
            "nome_dia": "Costas e Bíceps",
            "grupos_musculares": {
                "Costas": 4, "Biceps": 3, "Antebraco": 1
            }
        },
        {
            "dia": "C",
            "nome_dia": "Pernas Completo", 
            "grupos_musculares": {
                "Quadriceps": 3, "Posterior": 2, "Gluteo": 1,
                "Panturrilha": 2, "Core": 2
            }
        },
    ]
    
    # Ajustes por objetivo
    if objetivo == "forca":
        for dia in base_structure:
            for grupo in dia["grupos_musculares"]:
                dia["grupos_musculares"][grupo] = max(2, dia["grupos_musculares"][grupo] - 1)
    
    return base_structure

def _estrutura_abc_feminino(objetivo: str) -> List[Dict[str, Any]]:
    """ABC otimizado para mulheres - foco em lower body"""
    base_structure = [
        {
            "dia": "A",
            "nome_dia": "Glúteos e Posterior",
            "grupos_musculares": {
                "Gluteo": 4, "Posterior": 3, "Panturrilha": 2
            }
        },
        {
            "dia": "B",
            "nome_dia": "Superiores Completo",
            "grupos_musculares": {
                "Costas": 3, "Peito": 2, "Ombros": 2, "Biceps": 1, "Triceps": 1
            }
        },
        {
            "dia": "C",
            "nome_dia": "Quadríceps e Core",
            "grupos_musculares": {
                "Quadriceps": 4, "Core": 3, "Panturrilha": 1
            }
        },
    ]
    
    if objetivo == "emagrecimento":
        # Mais volume para queima calórica
        for dia in base_structure:
            for grupo in dia["grupos_musculares"]:
                dia["grupos_musculares"][grupo] += 1
    
    return base_structure

def _estrutura_abcde_masculino(objetivo: str) -> List[Dict[str, Any]]:
    """ABCDE para homens avançados"""
    return [
        {
            "dia": "A",
            "nome_dia": "Peito",
            "grupos_musculares": {"Peito": 5, "Triceps": 2, "Core": 1}
        },
        {
            "dia": "B",
            "nome_dia": "Costas",
            "grupos_musculares": {"Costas": 5, "Biceps": 3, "Antebraco": 1}
        },
        {
            "dia": "C",
            "nome_dia": "Pernas - Quadríceps",
            "grupos_musculares": {"Quadriceps": 5, "Panturrilha": 3}
        },
        {
            "dia": "D",
            "nome_dia": "Ombros",
            "grupos_musculares": {"Ombros": 5, "Trapézio": 2, "Core": 2}
        },
        {
            "dia": "E",
            "nome_dia": "Braços e Posteriores",
            "grupos_musculares": {"Biceps": 3, "Triceps": 3, "Posterior": 3}
        },
    ]

def _estrutura_abcde_feminino(objetivo: str) -> List[Dict[str, Any]]:
    """ABCDE para mulheres avançadas"""
    return [
        {
            "dia": "A",
            "nome_dia": "Glúteos",
            "grupos_musculares": {"Gluteo": 6, "Panturrilha": 2}
        },
        {
            "dia": "B",
            "nome_dia": "Costas e Bíceps",
            "grupos_musculares": {"Costas": 4, "Biceps": 2, "Core": 1}
        },
        {
            "dia": "C",
            "nome_dia": "Quadríceps",
            "grupos_musculares": {"Quadriceps": 5, "Panturrilha": 2}
        },
        {
            "dia": "D",
            "nome_dia": "Peito e Ombros",
            "grupos_musculares": {"Peito": 3, "Ombros": 3, "Triceps": 2}
        },
        {
            "dia": "E",
            "nome_dia": "Posteriores e Core",
            "grupos_musculares": {"Posterior": 4, "Core": 3}
        },
    ]

def _select_structure_avancada(
    split: str, sexo: Optional[str], objetivo: str, nivel: str
) -> List[Dict[str, Any]]:
    """Sistema avançado de seleção de splits"""
    s = _norm(sexo or "")
    split_norm = _norm(split)
    
    # Primeiro dia sempre FullBody iniciante
    if nivel == "iniciante" or "primeira" in nivel.lower():
        return _estrutura_fullbody_iniciante(sexo)
    
    if split_norm == "fullbody":
        return _estrutura_fullbody_iniciante(sexo)
    
    elif split_norm == "abc":
        if s == "feminino":
            return _estrutura_abc_feminino(objetivo)
        else:
            return _estrutura_abc_masculino(objetivo)
    
    elif split_norm in ["abcde", "abcd"]:
        if s == "feminino":
            return _estrutura_abcde_feminino(objetivo)
        else:
            return _estrutura_abcde_masculino(objetivo)
    
    # Fallback
    return _estrutura_abc_masculino(objetivo) if s != "feminino" else _estrutura_abc_feminino(objetivo)

# ===========================
# SISTEMA DE VOLUME INTELIGENTE
# ===========================

def _calcular_volume_inteligente(
    grupo: str,
    objetivo: str,
    sexo: str,
    nivel: str,
    idade: Optional[int],
    estrutura_dia: Optional[Dict[str, Any]] = None
) -> int:
    """Calcula volume considerando múltiplos fatores"""
    
    # Volume base por objetivo
    volumes_base = {
        "hipertrofia": {"masculino": 12, "feminino": 10},
        "forca": {"masculino": 8, "feminino": 6},
        "resistencia": {"masculino": 15, "feminino": 12},
        "emagrecimento": {"masculino": 14, "feminino": 16}
    }
    
    # Prioridades por gênero
    prioridades_masculino = {
        "peito": 1.3, "costas": 1.4, "ombros": 1.2, "biceps": 1.1,
        "triceps": 1.1, "quadriceps": 1.0, "posterior": 0.9,
        "gluteo": 0.8, "core": 0.8, "panturrilha": 0.7
    }
    
    prioridades_feminino = {
        "gluteo": 1.6, "quadriceps": 1.4, "posterior": 1.3, 
        "core": 1.1, "costas": 1.0, "panturrilha": 1.0,
        "peito": 0.8, "ombros": 0.9, "biceps": 0.7, "triceps": 0.7
    }
    
    # Configurações
    objetivo_norm = _norm(objetivo)
    sexo_norm = _norm(sexo)
    nivel_norm = _norm(nivel)
    grupo_norm = _norm(grupo)
    
    # Volume base
    base_config = volumes_base.get(objetivo_norm, volumes_base["hipertrofia"])
    volume_base = base_config.get(sexo_norm, 10)
    
    # Ajuste por prioridade de gênero
    prioridades = prioridades_masculino if sexo_norm == "masculino" else prioridades_feminino
    multiplicador_grupo = prioridades.get(grupo_norm, 1.0)
    
    # Ajuste por nível
    ajuste_nivel = {"iniciante": 0.6, "intermediario": 1.0, "avancado": 1.3}
    multiplicador_nivel = ajuste_nivel.get(nivel_norm, 1.0)
    
    # Ajuste por idade
    multiplicador_idade = 1.0
    if idade:
        if idade > 50: multiplicador_idade = 0.8
        elif idade > 40: multiplicador_idade = 0.9
        elif idade < 18: multiplicador_idade = 0.7
    
    # Cálculo final
    series_semana = volume_base * multiplicador_grupo * multiplicador_nivel * multiplicador_idade
    
    # Se tem estrutura específica, usa ela
    if estrutura_dia and "grupos_musculares" in estrutura_dia:
        grupo_config = estrutura_dia["grupos_musculares"]
        for grupo_chave, quantidade in grupo_config.items():
            if _norm(grupo_chave) == grupo_norm:
                logger.debug(f"Usando volume específico: {grupo} -> {quantidade}")
                return max(1, quantidade)
    
    # Conversão para número de exercícios
    num_exercicios = max(1, min(6, int(round(series_semana / 3.0))))
    
    # Garante mínimo para grupos prioritários
    if sexo_norm == "feminino" and grupo_norm in ["gluteo", "quadriceps"]:
        num_exercicios = max(3, num_exercicios)
    elif sexo_norm == "masculino" and grupo_norm in ["peito", "costas"]:
        num_exercicios = max(3, num_exercicios)
    
    return num_exercicios

# ===========================
# SISTEMA DE SEGURANÇA MELHORADO
# ===========================

def _validar_restricoes_seguranca(
    exercicio: Dict[str, Any],
    lesoes: List[str],
    comorbidades: List[str],
    idade: Optional[int],
    sexo: Optional[str]
) -> bool:
    """Validação completa de segurança"""
    
    # 1. Verificar lesões
    if lesoes:
        contraind = exercicio.get("contraindicacoes") or []
        if isinstance(contraind, str):
            contraind = [contraind]
        
        contra_lower = [c.lower() for c in contraind]
        for lesao in lesoes:
            if not lesao: continue
            if any(lesao.lower() in c for c in contra_lower):
                logger.debug(f"Exercício {exercicio.get('nome')} contraindicado para lesão: {lesao}")
                return False
    
    # 2. Verificar comorbidades
    if comorbidades:
        equipamento = _norm(exercicio.get("equipamento", ""))
        impacto = _norm(exercicio.get("impacto", "medio"))
        
        # Cardiopatias - evitar alto impacto e Valsalva
        if any(c in ["cardiopatia", "hipertensao", "hipertensão"] for c in comorbidades):
            if impacto == "alto":
                return False
            if "barra" in equipamento and exercicio.get("tecnica") == "valsalva":
                return False
        
        # Problemas articulares
        if any(c in ["artrite", "artrose", "osteoporose"] for c in comorbidades):
            if impacto == "alto" or "plyometrico" in _norm(exercicio.get("categoria", "")):
                return False
    
    # 3. Verificar idade
    if idade and idade > 60:
        if _norm(exercicio.get("impacto")) == "alto":
            return False
    
    return True

def _escolher_exercicios_seguros(
    grupo: str,
    exercicios: List[Dict[str, Any]],
    objetivo_norm: str,
    decisions: Dict[str, Any],
    sexo: Optional[str],
    lesoes: List[str],
    comorbidades: List[str],
    idade: Optional[int],
    prioridade_unilateral: List[str] = [],
    estrutura_dia: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    """Seleção de exercícios com segurança aprimorada"""
    
    max_impacto = decisions.get("max_impacto", "alto")
    grupo_alvo = _norm(grupo)
    nivel = decisions.get("nivel", "intermediario")
    
    # Calcula número ideal de exercícios
    num_ex = _calcular_volume_inteligente(
        grupo, objetivo_norm, sexo or "masculino", nivel, idade, estrutura_dia
    )
    
    candidatos: List[Dict[str, Any]] = []
    
    for ex in exercicios:
        if not ex.get("grupo"):
            continue
            
        # Validações de segurança
        if not _checa_impacto(ex, max_impacto):
            continue
            
        if not _validar_restricoes_seguranca(ex, lesoes, comorbidades, idade, sexo):
            continue
            
        if _is_exercicio_proibido_por_sexo(ex, sexo):
            continue
        
        # Match de grupo muscular
        grupo_ex = _norm(ex.get("grupo"))
        if _verificar_match_grupo(grupo_alvo, grupo_ex, ex):
            candidatos.append(ex)
    
    if not candidatos:
        logger.warning(f"Nenhum candidato seguro para grupo: {grupo}")
        return _get_exercicios_fallback(grupo, exercicios)
    
    # Scoring e seleção
    scored = [
        (
            _score_exercicio_avancado(
                ex, grupo, objetivo_norm, decisions, sexo, prioridade_unilateral, idade
            ),
            ex,
        )
        for ex in candidatos
    ]
    scored.sort(key=lambda x: x[0], reverse=True)
    
    # Seleção inteligente
    selecionados = _selecionar_exercicios_variados(scored, num_ex, grupo)
    
    logger.debug(f"Selecionados {len(selecionados)} exercícios para {grupo}")
    return selecionados

def _score_exercicio_avancado(
    ex: Dict[str, Any],
    grupo_dia: str,
    objetivo_norm: str,
    decisions: Dict[str, Any],
    sexo: Optional[str],
    prioridade_unilateral: List[str] = [],
    idade: Optional[int] = None
) -> float:
    """Scoring avançado considerando múltiplos fatores"""
    score = 0.0

    # Prioridade base
    prioridade = float(ex.get("prioridade") or 1.0)
    score += prioridade * 10.0

    # Matching de grupo
    grupo_ex = _norm(ex.get("grupo"))
    grupo_dia_l = _norm(grupo_dia)
    
    if grupo_dia_l and grupo_dia_l in grupo_ex:
        score += 20.0
    
    # Objetivo específico
    foco_lista = [f.lower() for f in (ex.get("foco") or [])]
    if objetivo_norm in foco_lista:
        score += 15.0

    # Correção de assimetria
    precisa_corrigir = any(g in grupo_ex for g in prioridade_unilateral)
    if precisa_corrigir:
        equipamento = _norm(ex.get("equipamento"))
        if equipamento in ["halter", "cabo", "unilateral", "máquina unilateral"]:
            score += 25.0

    # Adequação por idade
    if idade:
        dificuldade = _norm(ex.get("dificuldade") or "intermediario")
        if idade > 50 and dificuldade == "iniciante":
            score += 10.0
        elif idade < 18 and dificuldade != "avancado":
            score += 5.0

    # Variedade de equipamentos
    equipamento = ex.get("equipamento", "")
    if equipamento in ["halter", "barra", "máquina"]:
        score += 3.0

    # Pequena aleatoriedade controlada
    score += random.uniform(0.0, 5.0)
    
    return score

def _verificar_match_grupo(grupo_alvo: str, grupo_ex: str, exercicio: Dict[str, Any]) -> bool:
    """Verifica match avançado de grupos musculares"""
    
    mapping_grupos = {
        "quadriceps": ["quadriceps", "perna", "pernas", "coxa"],
        "gluteo": ["gluteo", "glúteo", "quadril"],
        "posterior": ["posterior", "isquiotibial", "perna posterior"],
        "peito": ["peito", "peitoral"],
        "costas": ["costas", "dorsal"],
        "ombros": ["ombro", "deltoide"],
        "biceps": ["biceps", "bíceps"],
        "triceps": ["triceps", "tríceps"],
        "core": ["core", "abdomen", "abdômen", "abdominal"],
        "panturrilha": ["panturrilha", "gastrocnêmio"]
    }
    
    for grupo_chave, sinonimos in mapping_grupos.items():
        if grupo_alvo == grupo_chave:
            return any(sin in grupo_ex for sin in sinonimos)
    
    return grupo_alvo in grupo_ex

def _get_exercicios_fallback(grupo: str, exercicios: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Exercícios fallback quando não encontra opções específicas"""
    exercicios_simples = [
        ex for ex in exercicios 
        if _norm(ex.get("dificuldade", "")) == "iniciante"
        and _norm(ex.get("impacto", "")) != "alto"
    ]
    
    # Pega os 2 primeiros exercícios simples do grupo
    fallbacks = []
    for ex in exercicios_simples:
        if len(fallbacks) >= 2:
            break
        grupo_ex = _norm(ex.get("grupo", ""))
        if _norm(grupo) in grupo_ex:
            fallbacks.append(ex)
    
    return fallbacks

def _montar_plano_seguro(
    estrutura: List[Dict[str, Any]],
    exercicios: List[Dict[str, Any]],
    decisions: Dict[str, Any],
    sexo: Optional[str],
    objetivo: str,
    lesoes: List[str],
    comorbidades: List[str],
    idade: Optional[int]
) -> List[Dict[str, Any]]:
    """Monta o plano de treino com segurança"""
    plano = []
    
    for dia in estrutura:
        grupos_musculares = dia.get("grupos_musculares", {})
        exercicios_dia = []
        
        for grupo, volume in grupos_musculares.items():
            exercicios_grupo = _escolher_exercicios_seguros(
                grupo=grupo,
                exercicios=exercicios,
                objetivo_norm=_norm(objetivo),
                decisions=decisions,
                sexo=sexo,
                lesoes=lesoes,
                comorbidades=comorbidades,
                idade=idade,
                estrutura_dia=dia
            )
            
            # Limita o número de exercícios pelo volume definido na estrutura
            exercicios_grupo = exercicios_grupo[:volume]
            
            for ex in exercicios_grupo:
                exercicios_dia.append({
                    "exercicio": ex.get("nome"),
                    "grupo": grupo,
                    "series": _definir_series(objetivo, decisions.get("nivel", "intermediario")),
                    "repeticoes": _definir_repeticoes(objetivo, decisions.get("nivel", "intermediario")),
                    "descanso": _definir_descanso(objetivo, decisions.get("nivel", "intermediario"))
                })
        
        plano.append({
            "dia": dia.get("dia"),
            "nome_dia": dia.get("nome_dia"),
            "exercicios": exercicios_dia
        })
    
    return plano

def _definir_series(objetivo: str, nivel: str) -> str:
    """Define o número de séries baseado no objetivo e nível"""
    if objetivo == "forca":
        return "3-5"
    elif objetivo == "hipertrofia":
        return "3-4"
    elif objetivo == "emagrecimento":
        return "3-4"
    else:  # resistencia
        return "2-3"

def _definir_repeticoes(objetivo: str, nivel: str) -> str:
    """Define o número de repetições baseado no objetivo e nível"""
    if objetivo == "forca":
        return "1-5"
    elif objetivo == "hipertrofia":
        return "8-12"
    elif objetivo == "emagrecimento":
        return "12-15"
    else:  # resistencia
        return "15-20"

def _definir_descanso(objetivo: str, nivel: str) -> str:
    """Define o tempo de descanso baseado no objetivo e nível"""
    if objetivo == "forca":
        return "2-3 min"
    elif objetivo == "hipertrofia":
        return "60-90 seg"
    elif objetivo == "emagrecimento":
        return "30-45 seg"
    else:  # resistencia
        return "20-30 seg"

# ===========================
# FUNÇÃO PRINCIPAL
# ===========================

def gerar_treino_ia_seguro(
    objetivo: Optional[str],
    nivel_atividade: Optional[str],
    sexo: Optional[str],
    idade: Optional[int],
    peso: Optional[float],
    altura: Optional[float],
    lesoes: Optional[List[str]] = None,
    comorbidades: Optional[List[str]] = None,
    divisao_preferida: Optional[str] = "auto",
    aluno_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Versão melhorada e mais segura da geração de treinos"""
    
    # Validações iniciais
    if not objetivo or not nivel_atividade or not sexo:
        return {
            "ok": False,
            "erro": "Parâmetros obrigatórios: objetivo, nivel_atividade e sexo",
            "gerado_em": datetime.utcnow().isoformat() + "Z"
        }
    
    try:
        exercicios = _load_exercicios()
        if not exercicios:
            return {
                "ok": False,
                "erro": "Nenhum exercício disponível",
                "gerado_em": datetime.utcnow().isoformat() + "Z"
            }

        # Decisões base
        decisions, explicacoes = build_decisions(
            objetivo, nivel_atividade, sexo, idade, lesoes or [], comorbidades or []
        )

        # Estrutura avançada
        estrutura = _select_structure_avancada(
            divisao_preferida, sexo, objetivo, nivel_atividade
        )
        
        # Montagem do plano com segurança
        plano = _montar_plano_seguro(
            estrutura, exercicios, decisions, sexo, objetivo, 
            lesoes or [], comorbidades or [], idade
        )
        
        return {
            "ok": True,
            "objetivo": objetivo,
            "nivel": nivel_atividade,
            "plano": plano,
            "meta": {
                "split_usado": divisao_preferida,
                "explicacoes": explicacoes,
                "idade_considerada": idade,
                "lesoes_consideradas": lesoes or []
            },
            "gerado_em": datetime.utcnow().isoformat() + "Z",
        }
        
    except Exception as e:
        logger.error(f"Erro na geração segura: {e}")
        return {
            "ok": False,
            "erro": f"Erro interno: {str(e)}",
            "gerado_em": datetime.utcnow().isoformat() + "Z"
        }

# Alias para compatibilidade
gerar_treino_ia = gerar_treino_ia_seguro