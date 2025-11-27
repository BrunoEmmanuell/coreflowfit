# backend/utils/metrics.py
import math
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


def calc_imc(peso_kg: Optional[float], altura_cm: Optional[float]) -> Optional[float]:
    if peso_kg is None or altura_cm is None or altura_cm == 0:
        return None
    altura_m = altura_cm / 100.0
    imc = peso_kg / (altura_m * altura_m)
    return round(imc, 2)

def imc_categoria(imc: Optional[float]) -> Optional[str]:
    if imc is None:
        return None
    if imc < 18.5:
        return "baixo_peso"
    if 18.5 <= imc < 25:
        return "normal"
    if 25 <= imc < 30:
        return "sobrepeso"
    if 30 <= imc < 35:
        return "obesidade_I"
    if 35 <= imc < 40:
        return "obesidade_II"
    return "obesidade_III"

def calc_whr(cintura_cm: Optional[float], quadril_cm: Optional[float]) -> Optional[float]:
    if cintura_cm is None or quadril_cm is None or quadril_cm == 0:
        return None
    whr = cintura_cm / quadril_cm
    return round(whr, 3)

def calc_tmb(peso_kg: Optional[float], altura_cm: Optional[float], idade: Optional[int], sexo: Optional[str]) -> Optional[float]:
    """
    Mifflin-St Jeor:
    Homens: TMB = 10*p + 6.25*h - 5*age + 5
    Mulheres: TMB = 10*p + 6.25*h - 5*age - 161
    Retorna kcal/dia arredondado.
    """
    if None in (peso_kg, altura_cm, idade, sexo):
        return None
    sexo = (sexo or "").lower()
    try:
        if sexo.startswith("m"):  # masculino
            tmb = 10 * peso_kg + 6.25 * altura_cm - 5 * idade + 5
        else:
            tmb = 10 * peso_kg + 6.25 * altura_cm - 5 * idade - 161
        return round(tmb, 2)
    except Exception:
        return None

def calc_bodyfat_navy(sexo: Optional[str], altura_cm: Optional[float], cintura_cm: Optional[float],
                      pescoco_cm: Optional[float], quadril_cm: Optional[float]=None) -> Optional[float]:
    """
    Método Navy (US Navy):
    Para homens: %fat = 86.010*log10(waist-neck) - 70.041*log10(height) + 36.76
    Para mulheres: %fat = 163.205*log10(waist+hip-neck) - 97.684*log10(height) - 78.387
    """

    if None in (sexo, altura_cm, cintura_cm, pescoco_cm):
        return None
    sexo = sexo.lower()
    try:
        h = altura_cm
        w = cintura_cm
        n = pescoco_cm
        if sexo.startswith("m"):
            # exige: waist - neck > 0
            if w - n <= 0:
                return None
            bf = 86.010 * math.log10(w - n) - 70.041 * math.log10(h) + 36.76
        else:
            # precisa quadril (hip)
            if quadril_cm is None:
                return None
            bf = 163.205 * math.log10(w + quadril_cm - n) - 97.684 * math.log10(h) - 78.387
        return round(bf, 2)
    except Exception:
        return None

def compute_all(data: Dict[str, Any]) -> Dict[str, Any]:
    """Calcula todas as métricas com tratamento de erro"""
    try:
        metrics = {}
        
        # IMC
        peso = data.get('peso')
        altura = data.get('altura')
        if peso and altura and altura > 0:
            imc = peso / (altura ** 2)
            metrics['imc'] = round(imc, 2)
            metrics['imc_categoria'] = _classify_imc(imc)
        else:
            metrics['imc'] = None
            metrics['imc_categoria'] = 'Dados insuficientes'

        # WHR (Waist-to-Hip Ratio)
        cintura = data.get('cintura')
        quadril = data.get('quadril')
        if cintura and quadril and quadril > 0:
            whr = cintura / quadril
            metrics['whr'] = round(whr, 2)
            metrics['whr_categoria'] = _classify_whr(whr, data.get('sexo'))
        else:
            metrics['whr'] = None
            metrics['whr_categoria'] = 'Dados insuficientes'

        # Gordura Naval
        if all([peso, altura, cintura, data.get('pescoco'), data.get('sexo')]):
            try:
                gordura_naval = _navy_body_fat(peso, altura, cintura, data['pescoco'], data['sexo'])
                metrics['gordura_percentual_navy'] = round(gordura_naval, 2)
            except Exception as e:
                logger.error(f"Erro no cálculo de gordura naval: {e}")
                metrics['gordura_percentual_navy'] = None
        else:
            metrics['gordura_percentual_navy'] = None

        # TMB (Taxa Metabólica Basal)
        if all([peso, altura, data.get('idade'), data.get('sexo')]):
            try:
                tmb = _calculate_tmb(peso, altura, data['idade'], data['sexo'])
                metrics['tmb'] = round(tmb, 2)
            except Exception as e:
                logger.error(f"Erro no cálculo da TMB: {e}")
                metrics['tmb'] = None
        else:
            metrics['tmb'] = None

        return metrics

    except Exception as e:
        logger.error(f"Erro geral no cálculo de métricas: {e}")
        return {"erro": "Falha no cálculo de métricas"}

