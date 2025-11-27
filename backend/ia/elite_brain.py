# backend/ia/elite_brain.py - ATUALIZADO
import logging
from datetime import date
from typing import Dict, Any
import sys
from pathlib import Path
from backend.database import get_db_connection

logger = logging.getLogger(__name__)

class EliteBrain:
    def __init__(self, aluno_id: str):
        self.aluno_id = aluno_id
        self.contexto = self._carregar_contexto()

    def _carregar_contexto(self) -> Dict[str, Any]:
        contexto = {
            "fase_atual": "adaptacao",
            "semana_do_ciclo": 1,
            "feedback_medio_recente": 3.0,
            "assimetria": {"braços": False, "pernas": False},
            "saude": {
                "hipertensao": False,
                "diabetes": False,
                "cardiopatia": False,
                "lesoes_texto": ""
            }
        }
        
        try:
            with get_db_connection() as (conn, cur):
                # 1. Ciclo e Fase
                cur.execute("""
                    SELECT fase, data_inicio FROM ciclos_treino 
                    WHERE aluno_id = %s AND ativo = TRUE ORDER BY criado_em DESC LIMIT 1
                """, (self.aluno_id,))
                ciclo = cur.fetchone()
                if ciclo:
                    contexto["fase_atual"] = ciclo['fase']
                    if ciclo['data_inicio']:
                        dias = (date.today() - ciclo['data_inicio']).days
                        contexto["semana_do_ciclo"] = (dias // 7) + 1

                # 2. Feedback
                cur.execute("""
                    SELECT AVG(nota) as media FROM (
                        SELECT nota FROM feedbacks WHERE aluno_id = %s ORDER BY criado_em DESC LIMIT 3
                    ) as sub
                """, (self.aluno_id,))
                res_fb = cur.fetchone()
                if res_fb and res_fb['media']:
                    contexto["feedback_medio_recente"] = float(res_fb['media'])

                # 3. Medidas e Assimetria
                cur.execute("""
                    SELECT braco_direito, braco_esquerdo, coxa_direita, coxa_esquerda
                    FROM medidas_corpo WHERE aluno_id = %s ORDER BY data_medida DESC LIMIT 1
                """, (self.aluno_id,))
                medidas = cur.fetchone()
                if medidas:
                    # Lógica de assimetria
                    bd = medidas['braco_direito'] or 0
                    be = medidas['braco_esquerdo'] or 0
                    cd = medidas['coxa_direita'] or 0
                    ce = medidas['coxa_esquerda'] or 0
                    
                    if bd > 0 and be > 0 and abs(bd - be) > 1.5: 
                        contexto["assimetria"]["braços"] = True
                    if cd > 0 and ce > 0 and abs(cd - ce) > 2.0: 
                        contexto["assimetria"]["pernas"] = True

                # 4. Saúde
                cur.execute("""
                    SELECT hipertensao, diabetes, cardiopatia, lesoes 
                    FROM saude_aluno WHERE aluno_id = %s LIMIT 1
                """, (self.aluno_id,))
                saude = cur.fetchone()
                if saude:
                    contexto["saude"]["hipertensao"] = saude['hipertensao']
                    contexto["saude"]["diabetes"] = saude['diabetes']
                    contexto["saude"]["cardiopatia"] = saude['cardiopatia']
                    contexto["saude"]["lesoes_texto"] = (saude['lesoes'] or "").lower()

        except Exception as e:
            logger.error(f"Erro ao carregar contexto Elite: {e}")
        
        return contexto

    def definir_estrategia(self) -> Dict[str, Any]:
        ctx = self.contexto
        fase = ctx.get("fase_atual", "adaptacao")
        saude = ctx.get("saude", {})
        lesoes = saude.get("lesoes_texto", "")
        
        # Estratégia Base
        estrategia = {
            "reps_range": "8-12",
            "series_base": 3,
            "tecnicas_avancadas": [],
            "foco_fase": "padrao",
            "tempo_descanso": "60s",
            "rpe_target": "8",
            "tecnicas_proibidas": [],
            "prioridade_unilateral": []
        }

        # --- 1. Adaptação por Assimetria ---
        if ctx["assimetria"]["braços"]:
            estrategia["prioridade_unilateral"].extend(["biceps", "triceps"])
        if ctx["assimetria"]["pernas"]:
            estrategia["prioridade_unilateral"].extend(["quadriceps", "posterior"])

        # --- 2. Adaptação por Fase ---
        if fase == 'forca':
            estrategia.update({"reps_range": "3-6", "series_base": 4, "tempo_descanso": "180s", "rpe_target": "9"})
        elif fase == 'resistencia':
            estrategia.update({"reps_range": "15-20", "tempo_descanso": "30s", "rpe_target": "7"})

        # --- 3. Adaptação de Segurança (SAÚDE) ---
        
        # Hipertensão/Cardíaco
        if saude.get("hipertensao") or saude.get("cardiopatia"):
            estrategia["tecnicas_proibidas"].extend(["falha_total", "isometria_longa", "valsalva"])
            current_rest = int(''.join(filter(str.isdigit, estrategia["tempo_descanso"])))
            if current_rest < 90:
                estrategia["tempo_descanso"] = "90s"
            if int(estrategia["rpe_target"]) > 8:
                estrategia["rpe_target"] = "7"

        # Diabetes
        if saude.get("diabetes"):
            estrategia["series_base"] = max(3, estrategia["series_base"])

        # Lesões Específicas
        if "ombro" in lesoes:
            estrategia["tecnicas_proibidas"].append("desenvolvimento_nuca")
            estrategia["observacao_seguranca"] = "Evitar amplitude extrema em empurrar vertical."
        
        if "joelho" in lesoes:
            estrategia["tecnicas_proibidas"].append("extensora_carga_maxima")
            if fase == 'forca':
                estrategia["reps_range"] = "8-10"

        if "lombar" in lesoes or "coluna" in lesoes:
            estrategia["tecnicas_proibidas"].extend(["terra_pesado", "remada_curvada_livre"])
            estrategia["prioridade_unilateral"].append("core_estabilidade")

        logger.info(f"Estratégia Elite definida para aluno {self.aluno_id}: {estrategia}")
        return estrategia