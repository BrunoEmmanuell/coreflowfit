# backend/ml/data_preparation.py
import psycopg2
import pandas as pd
import json
import sys
import logging
from pathlib import Path
import unicodedata
import numpy as np

# --- Configuração de Logging ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- Ajuste de Path ---
script_dir = Path(__file__).resolve().parent
backend_dir = script_dir.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

try:
    from database import get_db_connection
except ImportError as e:
    logger.critical(f"Erro ao importar 'get_db_connection': {e}")
    sys.exit(1)

# --- Constantes ---
OUTPUT_CSV_FILE = script_dir / "prepared_training_data.csv"

# --- Funções Auxiliares ---
def normalize_text(text: str) -> str:
    if not isinstance(text, str): return ""
    try:
        nfkd = unicodedata.normalize('NFD', text)
        sem_acentos = "".join([c for c in nfkd if not unicodedata.combining(c)])
        return sem_acentos.lower().strip()
    except Exception:
        return ""

def simplificar_lesao_ou_condicao(texto_completo: str) -> dict:
    t = normalize_text(texto_completo)
    flags = {
        "has_lesao_joelho": 0, "has_lesao_ombro": 0, "has_lesao_coluna": 0,
        "has_lesao_punho": 0, "has_tendinite": 0, "has_condicao_cardiaca": 0,
        "has_condicao_diabetes": 0, "has_condicao_hipertensao": 0,
        "has_hernia": 0, "has_osteoporose": 0
    }
    
    if not t or t == "nenhuma": return flags
    
    if any(x in t for x in ["joelho", "patela", "menisco", "lca"]): flags["has_lesao_joelho"] = 1
    if any(x in t for x in ["ombro", "manguito", "clavicula"]): flags["has_lesao_ombro"] = 1
    if any(x in t for x in ["lombar", "costas", "coluna", "disco"]): flags["has_lesao_coluna"] = 1
    if any(x in t for x in ["pulso", "punho", "mao"]): flags["has_lesao_punho"] = 1
    if "tendinite" in t or "tendao" in t: flags["has_tendinite"] = 1
    if any(x in t for x in ["coracao", "cardio", "arritmia"]): flags["has_condicao_cardiaca"] = 1
    if any(x in t for x in ["diabete", "glicose", "insulina"]): flags["has_condicao_diabetes"] = 1
    if any(x in t for x in ["pressao", "hipertensao"]): flags["has_condicao_hipertensao"] = 1
    if "hernia" in t: flags["has_hernia"] = 1
    if "osteoporose" in t: flags["has_osteoporose"] = 1
    return flags

def map_nivel_numerico(nivel_texto: str) -> int:
    n = normalize_text(nivel_texto)
    if "iniciante" in n: return 1
    if "intermediario" in n: return 2
    if "avancado" in n: return 3
    return 2

def extract_workout_features(plano):
    features = {
        'num_total_exercicios': 0, 'num_dias': 0, 'avg_ex_por_dia': 0.0,
        'prop_compostos': 0.0, 'num_tec_biset': 0, 'num_tec_piramide': 0, 'num_tec_drop': 0
    }
    
    if isinstance(plano, str):
        try:
            plano = json.loads(plano)
        except:
            return features
            
    if not isinstance(plano, dict): return features
    
    try:
        dias_treino = plano.get("dias_treino", {})
        features['num_dias'] = len(dias_treino)
        if not dias_treino: return features
        
        total_exercicios = 0; num_compostos = 0; num_isolados = 0
        for dia_info in dias_treino.values():
            exercicios = dia_info.get("exercicios", [])
            if isinstance(exercicios, list):
                total_exercicios += len(exercicios)
                for item in exercicios:
                    if not isinstance(item, dict): continue
                    
                    # Contar Técnicas
                    tipo_item = item.get("tipo_item", "")
                    if tipo_item == "tecnica":
                        nome_tec = normalize_text(item.get("nome_tecnica", ""))
                        if "biset" in nome_tec: features['num_tec_biset'] += 1
                        if "piramide" in nome_tec: features['num_tec_piramide'] += 1
                        if "drop" in nome_tec: features['num_tec_drop'] += 1
                    
                    # Contar Tipos
                    ex_info = item.get("exercicio") or item.get("exercicio_1")
                    if ex_info:
                        tipo_ex = normalize_text(ex_info.get("tipo", ""))
                        if "composto" in tipo_ex: num_compostos += 1
                        elif "isolado" in tipo_ex: num_isolados += 1
                        
        features['num_total_exercicios'] = total_exercicios
        if features['num_dias'] > 0: features['avg_ex_por_dia'] = round(total_exercicios / features['num_dias'], 2)
        total_identificados = num_compostos + num_isolados
        if total_identificados > 0: features['prop_compostos'] = round(num_compostos / total_identificados, 2)
    except Exception: pass
    return features

# --- Função Principal ---
def prepare_data():
    logger.info("Iniciando preparação de dados...")
    
    try:
        with get_db_connection() as (conn, cur):
            if not conn: raise ConnectionError("Sem conexão DB")

            # --- SQL CORRIGIDO COM BASE NO SCHEMA REAL ---
            # - a.nivel -> a.nivel_experiencia
            # - a.foco_treino -> a.objetivo
            # - a.idade -> Calculado a partir de data_nascimento
            # - a.historico_lesoes -> Removido (usando sa.lesoes e a.observacoes)
            sql_query = """
            SELECT
                tg.id as treino_id, tg.aluno_id, 
                tg.conteudo_json as treino_json,
                'Geral' as dia_key,
                f.nota as feedback_score_raw, 
                a.nivel_experiencia as aluno_nivel, -- CORRIGIDO
                a.sexo as aluno_sexo, 
                DATE_PART('year', AGE(CURRENT_DATE, a.data_nascimento)) as aluno_idade, -- CORRIGIDO (cálculo de idade)
                a.objetivo as aluno_foco, -- CORRIGIDO
                
                -- Concatena sa.lesoes e a.observacoes para achar palavras-chave
                COALESCE(sa.lesoes, '') || ' ' || COALESCE(sa.medicacao, '') || ' ' || COALESCE(a.observacoes, '') as texto_saude_completo,
                
                sa.hipertensao as db_hipertensao,
                sa.diabetes as db_diabetes,
                sa.cardiopatia as db_cardiopatia,
                m.peso_kg, m.altura_m, m.imc
            FROM treinos_gerados tg
            JOIN feedbacks f ON tg.id = f.treino_id
            JOIN alunos a ON tg.aluno_id = a.id
            LEFT JOIN saude_aluno sa ON a.id = sa.aluno_id
            LEFT JOIN LATERAL (
                SELECT peso_kg, altura_m, imc FROM medidas_corpo WHERE aluno_id = a.id ORDER BY data_medida DESC LIMIT 1
            ) m ON true
            WHERE f.nota IS NOT NULL
            ORDER BY tg.gerado_em DESC;
            """
            
            df = pd.read_sql_query(sql_query, conn)
            
            if df.empty:
                logger.warning("Nenhum dado encontrado na tabela 'feedbacks'. Verifique se há feedbacks salvos.")
                return

            # --- PROCESSAMENTO ---
            workout_feats = df['treino_json'].apply(lambda x: pd.Series(extract_workout_features(x)))
            df = pd.concat([df, workout_feats], axis=1)

            # Target
            df['feedback_score'] = df['feedback_score_raw'].fillna(3).astype(int)

            # Renomear colunas para bater com o esperado por alguns scripts de treino (opcional, mas seguro)
            # aluno_idade -> idade, aluno_sexo -> sexo, etc.
            df['idade'] = df['aluno_idade']
            df['peso'] = df['peso_kg']
            df['altura'] = df['altura_m']

            # Features Numéricas
            df['nivel_numerico'] = df['aluno_nivel'].apply(map_nivel_numerico)
            df['intensidade_relativa'] = df['num_total_exercicios'] / df['nivel_numerico']

            # Features de Saúde
            saude_flags = df['texto_saude_completo'].apply(lambda x: pd.Series(simplificar_lesao_ou_condicao(x)))
            df = pd.concat([df, saude_flags], axis=1)

            # Unir com flags do DB
            if 'db_hipertensao' in df.columns:
                df['has_condicao_hipertensao'] = df['has_condicao_hipertensao'] | df['db_hipertensao'].fillna(False).astype(int)
            if 'db_diabetes' in df.columns:
                df['has_condicao_diabetes'] = df['has_condicao_diabetes'] | df['db_diabetes'].fillna(False).astype(int)
            if 'db_cardiopatia' in df.columns:
                df['has_condicao_cardiaca'] = df['has_condicao_cardiaca'] | df['db_cardiopatia'].fillna(False).astype(int)

            # Categóricas
            cat_cols = ['aluno_nivel', 'aluno_sexo', 'aluno_foco', 'dia_key']
            for c in cat_cols: df[c] = df[c].fillna('N/A').astype(str).apply(normalize_text)
            df = pd.get_dummies(df, columns=cat_cols, dummy_na=False)

            # Limpeza
            drop_cols = ['treino_id', 'treino_json', 'feedback_score_raw', 'texto_saude_completo', 'db_hipertensao', 'db_diabetes', 'db_cardiopatia']
            df_final = df.drop(columns=drop_cols, errors='ignore')

            # Preencher Vazios
            num_cols = df_final.select_dtypes(include=['number']).columns
            df_final[num_cols] = df_final[num_cols].fillna(df_final[num_cols].median())

            # Salvar
            df_final.to_csv(OUTPUT_CSV_FILE, index=False)
            logger.info(f"Dataset salvo com sucesso! Shape: {df_final.shape}")

            # Salvar colunas
            feature_cols = [c for c in df_final.columns if c not in ['feedback_score', 'aluno_id']]
            with open(script_dir / "trained_model_columns.json", 'w') as f:
                json.dump(feature_cols, f)

    except Exception as e:
        logger.exception(f"Erro na preparação: {e}")

if __name__ == "__main__":
    prepare_data()