# backend/tests/test_ia.py
import pytest
from unittest.mock import patch, MagicMock
from backend.ia.gerador_treino_ia import gerar_treino_ia_seguro
from backend.ia.decision import build_decisions_seguras

class TestGeradorTreinoIA:
    """Testes para o gerador de treinos da IA"""
    
    def test_gerar_treino_parametros_obrigatorios(self):
        """Testa que objetivo, nivel_atividade e sexo são obrigatórios"""
        result = gerar_treino_ia_seguro(
            objetivo=None,
            nivel_atividade="intermediario",
            sexo="masculino",
            idade=25,
            peso=70,
            altura=1.75
        )
        
        assert result["ok"] is False
        assert "obrigatórios" in result["erro"].lower()
    
    def test_gerar_treino_iniciante_fullbody(self):
        """Testa geração de treino para iniciante"""
        result = gerar_treino_ia_seguro(
            objetivo="hipertrofia",
            nivel_atividade="iniciante",
            sexo="masculino",
            idade=25,
            peso=70,
            altura=1.75,
            divisao_preferida="auto"
        )
        
        assert result["ok"] is True
        assert "plano" in result
        assert len(result["plano"]) > 0
        
        # Verifica se é um FullBody para iniciante
        primeiro_dia = result["plano"][0]
        assert "fullbody" in primeiro_dia["nome_dia"].lower() or "full body" in primeiro_dia["nome_dia"].lower()
    
    def test_gerar_treino_com_lesoes(self):
        """Testa geração de treino com restrições de lesões"""
        result = gerar_treino_ia_seguro(
            objetivo="hipertrofia",
            nivel_atividade="intermediario",
            sexo="masculino",
            idade=30,
            peso=80,
            altura=1.80,
            lesoes=["ombro", "joelho"],
            comorbidades=[]
        )
        
        assert result["ok"] is True
        assert result["meta"]["lesoes_consideradas"] == ["ombro", "joelho"]
    
    def test_gerar_treino_feminino_abc(self):
        """Testa geração de treino ABC para mulher"""
        result = gerar_treino_ia_seguro(
            objetivo="emagrecimento",
            nivel_atividade="intermediario",
            sexo="feminino",
            idade=28,
            peso=65,
            altura=1.65,
            divisao_preferida="abc"
        )
        
        assert result["ok"] is True
        assert len(result["plano"]) == 3  # ABC tem 3 dias
        
        # Verifica se tem foco em glúteos e pernas
        dias_nomes = [dia["nome_dia"].lower() for dia in result["plano"]]
        assert any("glúteo" in nome or "gluteo" in nome for nome in dias_nomes)
    
    @patch('backend.ia.gerador_treino_ia._load_exercicios')
    def test_gerar_treino_sem_exercicios(self, mock_load):
        """Testa comportamento quando não há exercícios disponíveis"""
        mock_load.return_value = []
        
        result = gerar_treino_ia_seguro(
            objetivo="hipertrofia",
            nivel_atividade="intermediario",
            sexo="masculino",
            idade=25,
            peso=70,
            altura=1.75
        )
        
        assert result["ok"] is False
        assert "nenhum exercício" in result["erro"].lower()
    
    def test_build_decisions_idoso(self):
        """Testa decisões de segurança para idosos"""
        decisions, explicacoes = build_decisions_seguras(
            objetivo="hipertrofia",
            nivel_atividade="intermediario",
            sexo="masculino",
            idade=70,
            lesoes=[],
            comorbidades=[]
        )
        
        assert decisions["max_impacto"] == "baixo"
        assert decisions["volume_factor"] < 1.0
        assert any("idoso" in exp.lower() or "65" in exp for exp in explicacoes)
    
    def test_build_decisions_cardiopatia(self):
        """Testa decisões de segurança para cardiopatas"""
        decisions, explicacoes = build_decisions_seguras(
            objetivo="hipertrofia",
            nivel_atividade="intermediario",
            sexo="feminino",
            idade=45,
            lesoes=[],
            comorbidades=["cardiopatia"]
        )
        
        assert decisions["max_impacto"] == "baixo"
        assert decisions["volume_factor"] <= 0.6
        assert any("cardíaca" in exp.lower() for exp in explicacoes)

class TestDecisionLogic:
    """Testes para a lógica de decisão"""
    
    def test_volume_factor_iniciante(self):
        """Testa redução de volume para iniciantes"""
        decisions, _ = build_decisions_seguras(
            objetivo="hipertrofia",
            nivel_atividade="iniciante",
            sexo="masculino",
            idade=25,
            lesoes=[],
            comorbidades=[]
        )
        
        assert decisions["volume_factor"] == 0.7
    
    def test_prioridade_feminino(self):
        """Testa prioridades de grupos para mulheres"""
        decisions, _ = build_decisions_seguras(
            objetivo="hipertrofia",
            nivel_atividade="intermediario",
            sexo="feminino",
            idade=30,
            lesoes=[],
            comorbidades=[]
        )
        
        group_weights = decisions["group_weights"]
        assert group_weights["gluteo"] > group_weights["peito"]
    
    def test_prioridade_masculino(self):
        """Testa prioridades de grupos para homens"""
        decisions, _ = build_decisions_seguras(
            objetivo="hipertrofia",
            nivel_atividade="intermediario",
            sexo="masculino",
            idade=30,
            lesoes=[],
            comorbidades=[]
        )
        
        group_weights = decisions["group_weights"]
        assert group_weights["peito"] > group_weights["gluteo"]