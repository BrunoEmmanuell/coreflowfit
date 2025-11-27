# backend/ml/predict_feedback.py
import joblib
import pandas as pd
import logging
import json
import unicodedata
from pathlib import Path
import sys

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- Constantes ---
script_dir = Path(__file__).resolve().parent
backend_dir = script_dir.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

MODEL_FILE = script_dir / "feedback_predictor_model.joblib"
# Ajuste o mapa conforme as classes que o seu modelo conhece (log anterior mostrou [2, 3, 4, 5])
FEEDBACK_MAP = {
    1: "Ruim", 
    2: "Médio", 
    3: "Bom", 
    4: "Excelente", 
    5: "Excelente+"
}

# --- Variáveis Globais ---
model = None
model_columns = []
model_classes = []

# --- Carregar Modelo Inteligente ---
try:
    if MODEL_FILE.exists():
        loaded_artifact = joblib.load(MODEL_FILE)
        
        # Verifica se é o formato novo (dicionário)
        if isinstance(loaded_artifact, dict):
            model = loaded_artifact.get("model")
            model_columns = loaded_artifact.get("columns", [])
            model_classes = loaded_artifact.get("classes", []) 
            logger.info(f"Modelo V2 carregado. Classes conhecidas: {model_classes}")
        else:
            # Fallback para modelo antigo
            model = loaded_artifact
            logger.warning("Modelo V1 (antigo) carregado.")
            
            # Tenta carregar colunas do json antigo
            cols_file = script_dir / "trained_model_columns.json"
            if cols_file.exists():
                with open(cols_file, 'r') as f:
                    model_columns = json.load(f)
    else:
        logger.warning(f"Modelo não encontrado em {MODEL_FILE}")

except Exception as e:
    logger.exception(f"Erro ao inicializar modelo: {e}")

# --- Funções Auxiliares ---
def normalize_text(text: str) -> str:
    if not isinstance(text, str): return ""
    try:
        nfkd = unicodedata.normalize('NFD', text)
        return "".join([c for c in nfkd if not unicodedata.combining(c)]).lower().strip()
    except: return ""

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

def extract_workout_features(plano: dict | None):
    features = {
        'num_total_exercicios': 0, 'num_dias': 0, 'avg_ex_por_dia': 0.0,
        'prop_compostos': 0.0, 'num_tec_biset': 0, 'num_tec_piramide': 0, 'num_tec_drop': 0
    }
    if not isinstance(plano, dict): return features
    try:
        dias = plano.get("dias_treino", {})
        features['num_dias'] = len(dias)
        if not dias: return features
        
        total = 0; compostos = 0; isolados = 0
        for dia in dias.values():
            exs = dia.get("exercicios", [])
            if isinstance(exs, list):
                total += len(exs)
                for item in exs:
                    tec = normalize_text(item.get("nome_tecnica", ""))
                    if "biset" in tec: features['num_tec_biset'] += 1
                    if "piramide" in tec: features['num_tec_piramide'] += 1
                    if "drop" in tec: features['num_tec_drop'] += 1
                    
                    ex = item.get("exercicio") or item.get("exercicio_1")
                    if ex:
                        tipo = normalize_text(ex.get("tipo", ""))
                        if "composto" in tipo: compostos += 1
                        elif "isolado" in tipo: isolados += 1
        
        features['num_total_exercicios'] = total
        if features['num_dias'] > 0: features['avg_ex_por_dia'] = total / features['num_dias']
        if (compostos + isolados) > 0: features['prop_compostos'] = compostos / (compostos + isolados)
        
    except: pass
    return features

# --- Função Principal de Predição ---
def predict_plan_feedback(aluno_info: dict, plano_gerado: dict) -> str | None:
    if model is None:
        logger.error("Modelo não carregado. Pulando predição.")
        return None

    try:
        # 1. Flags de Saúde
        txt_lesoes = normalize_text(aluno_info.get('historico_lesoes', ''))
        comorbs = aluno_info.get('comorbidades', [])
        if isinstance(comorbs, list):
            txt_lesoes += " " + " ".join([str(c) for c in comorbs])
            
        saude_flags = simplificar_lesao_ou_condicao(txt_lesoes)
        
        # 2. Features Aluno
        nivel_num = map_nivel_numerico(aluno_info.get('nivel', ''))
        
        features = {
            'idade': float(aluno_info.get('idade', 25)),
            'peso': float(aluno_info.get('peso', 70)),
            'altura': float(aluno_info.get('altura', 1.70)),
            'imc': 0.0,
            'aluno_nivel': normalize_text(aluno_info.get('nivel', '')),
            'aluno_sexo': normalize_text(aluno_info.get('sexo', '')),
            'aluno_foco': normalize_text(aluno_info.get('foco_treino', '')),
            'nivel_numerico': nivel_num,
            'dia_key': 'Geral', 
            **saude_flags
        }
        
        if features['altura'] > 0:
            features['imc'] = features['peso'] / (features['altura']**2)

        # 3. Features Treino
        features.update(extract_workout_features(plano_gerado))
        # Evitar divisão por zero
        features['intensidade_relativa'] = features['num_total_exercicios'] / (nivel_num if nivel_num > 0 else 1)

        # 4. DataFrame & Encoding
        input_df = pd.DataFrame([features])
        cat_cols = ['aluno_nivel', 'aluno_sexo', 'aluno_foco', 'dia_key']
        input_df = pd.get_dummies(input_df, columns=cat_cols, prefix=cat_cols, dummy_na=False)

        # 5. Alinhamento de Colunas (CRUCIAL)
        if model_columns:
            # Garante todas as colunas que o modelo espera, preenchendo com 0
            df_aligned = input_df.reindex(columns=model_columns, fill_value=0)
        else:
            df_aligned = input_df 

        # 6. Previsão
        raw_pred = model.predict(df_aligned)
        
        if raw_pred.ndim > 1:
            pred_idx = raw_pred.argmax(axis=1)[0]
        else:
            pred_idx = int(raw_pred[0])
            
        # 7. Decodificação (0 -> Nota Real)
        nota_real = pred_idx
        if model_classes:
            # Se o pred_idx for válido no array de classes
            if 0 <= pred_idx < len(model_classes):
                nota_real = model_classes[pred_idx]
            else:
                nota_real = pred_idx # Fallback
            
        logger.info(f"IA Predição: Índice={pred_idx} -> Nota={nota_real}")
        
        return FEEDBACK_MAP.get(nota_real, f"Nota {nota_real}")

    except Exception as e:
        logger.exception(f"Erro na predição: {e}")
        return None

# --- BLOCO DE TESTE (Executa apenas se rodar o arquivo diretamente) ---
if __name__ == "__main__":
    print("\n🧪 --- TESTE DE PREVISÃO IA ---")
    
    # Aluno com Diabetes e Iniciante (Cenário de Risco)
    aluno_teste = {
        "id": "teste_123",
        "nivel": "iniciante",
        "sexo": "Masculino",
        "idade": 45,
        "peso": 90,
        "altura": 1.75,
        "foco_treino": "emagrecimento",
        # A IA deve detetar isto:
        "comorbidades": ["diabetes", "hipertensão"], 
        "historico_lesoes": "nenhuma"
    }

    # Treino Volumoso (Inadequado para o perfil acima)
    treino_teste = {
        "dias_treino": {
            "A": {
                "exercicios": [
                    {"nome_tecnica": "", "exercicio": {"tipo": "Composto"}},
                    {"nome_tecnica": "", "exercicio": {"tipo": "Composto"}},
                    {"nome_tecnica": "", "exercicio": {"tipo": "Isolado"}},
                    {"nome_tecnica": "biset", "exercicio": {"tipo": "Isolado"}},
                    {"nome_tecnica": "", "exercicio": {"tipo": "Isolado"}},
                    {"nome_tecnica": "", "exercicio": {"tipo": "Isolado"}},
                    {"nome_tecnica": "", "exercicio": {"tipo": "Isolado"}},
                    {"nome_tecnica": "", "exercicio": {"tipo": "Isolado"}},
                    {"nome_tecnica": "", "exercicio": {"tipo": "Isolado"}},
                    {"nome_tecnica": "", "exercicio": {"tipo": "Isolado"}},
                ]
            }
        }
    }

    print(f"👤 Aluno: {aluno_teste['nivel']} com {aluno_teste['comorbidades']}")
    print(f"🏋️ Treino: {len(treino_teste['dias_treino']['A']['exercicios'])} exercícios (Volume Alto)")
    
    resultado = predict_plan_feedback(aluno_teste, treino_teste)
    
    print(f"\n🔮 Previsão da IA: {resultado}")
    print("------------------------------")