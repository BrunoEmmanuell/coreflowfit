# backend/utils/validation.py
import re
import uuid
from typing import Any, Dict, List, Optional
from datetime import datetime, date
import logging

logger = logging.getLogger("coreflowfit.validation")

class DataValidator:
    """Validador centralizado para dados do sistema"""
    
    @staticmethod
    def validate_uuid(uuid_str: str) -> bool:
        """Valida formato UUID"""
        try:
            uuid.UUID(uuid_str)
            return True
        except (ValueError, AttributeError):
            return False
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Valida formato de email"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))
    
    @staticmethod
    def validate_password_strength(password: str) -> Dict[str, Any]:
        """Valida força da senha"""
        checks = {
            "length": len(password) >= 8,
            "lowercase": bool(re.search(r'[a-z]', password)),
            "uppercase": bool(re.search(r'[A-Z]', password)),
            "digit": bool(re.search(r'\d', password)),
            "special": bool(re.search(r'[!@#$%^&*(),.?":{}|<>]', password))
        }
        
        is_valid = all(checks.values())
        score = sum(checks.values())
        
        return {
            "valid": is_valid,
            "score": score,
            "checks": checks
        }
    
    @staticmethod
    def validate_user_data(user_data: Dict[str, Any]) -> List[str]:
        """Valida dados de usuário"""
        errors = []
        
        # Nome
        if not user_data.get('nome') or len(user_data['nome'].strip()) < 2:
            errors.append("Nome deve ter pelo menos 2 caracteres")
        
        # Email
        if user_data.get('telefone') and not DataValidator.validate_email(user_data['telefone']):
            errors.append("Email inválido")
        
        # Idade
        if user_data.get('idade'):
            try:
                idade = int(user_data['idade'])
                if idade < 10 or idade > 120:
                    errors.append("Idade deve estar entre 10 e 120 anos")
            except (ValueError, TypeError):
                errors.append("Idade deve ser um número válido")
        
        return errors
    
    @staticmethod
    def validate_health_data(health_data: Dict[str, Any]) -> List[str]:
        """Valida dados de saúde"""
        errors = []
        
        # Peso
        if health_data.get('peso_kg'):
            try:
                peso = float(health_data['peso_kg'])
                if peso < 20 or peso > 300:
                    errors.append("Peso deve estar entre 20kg e 300kg")
            except (ValueError, TypeError):
                errors.append("Peso deve ser um número válido")
        
        # Altura
        if health_data.get('altura_m'):
            try:
                altura = float(health_data['altura_m'])
                if altura < 0.5 or altura > 2.5:
                    errors.append("Altura deve estar entre 0.5m e 2.5m")
            except (ValueError, TypeError):
                errors.append("Altura deve ser um número válido")
        
        # Medidas corporais
        medidas = ['ombros', 'peito', 'cintura', 'quadril', 'braco_direito', 
                  'braco_esquerdo', 'coxa_direita', 'coxa_esquerda']
        
        for medida in medidas:
            if health_data.get(medida):
                try:
                    valor = float(health_data[medida])
                    if valor < 10 or valor > 200:
                        errors.append(f"{medida} deve estar entre 10cm e 200cm")
                except (ValueError, TypeError):
                    errors.append(f"{medida} deve ser um número válido")
        
        return errors
    
    @staticmethod
    def validate_training_parameters(params: Dict[str, Any]) -> List[str]:
        """Valida parâmetros para geração de treino"""
        errors = []
        
        # Objetivo válido
        objetivos_validos = ['hipertrofia', 'forca', 'resistencia', 'emagrecimento', 'definicao']
        if params.get('objetivo') and params['objetivo'].lower() not in objetivos_validos:
            errors.append(f"Objetivo deve ser um dos: {', '.join(objetivos_validos)}")
        
        # Nível válido
        niveis_validos = ['iniciante', 'intermediario', 'avancado']
        if params.get('nivel') and params['nivel'].lower() not in niveis_validos:
            errors.append(f"Nível deve ser um dos: {', '.join(niveis_validos)}")
        
        # Sexo válido
        sexos_validos = ['masculino', 'feminino']
        if params.get('sexo') and params['sexo'].lower() not in sexos_validos:
            errors.append(f"Sexo deve ser um dos: {', '.join(sexos_validos)}")
        
        # Divisão válida
        divisoes_validas = ['auto', 'fullbody', 'abc', 'abcd', 'abcde', 'ab']
        if params.get('divisao_preferida') and params['divisao_preferida'].lower() not in divisoes_validas:
            errors.append(f"Divisão deve ser um dos: {', '.join(divisoes_validas)}")
        
        return errors
    
    @staticmethod
    def sanitize_string(text: str) -> str:
        """Remove caracteres potencialmente perigosos"""
        if not text:
            return ""
        
        # Remove tags HTML/XML
        text = re.sub(r'<[^>]*>', '', text)
        
        # Remove caracteres de controle
        text = re.sub(r'[\x00-\x1F\x7F]', '', text)
        
        # Remove caracteres potencialmente perigosos para SQL
        text = re.sub(r"[\'\";\\]", '', text)
        
        return text.strip()
    
    @staticmethod
    def validate_date_range(start_date: date, end_date: date) -> bool:
        """Valida se datas estão em ordem correta"""
        return start_date <= end_date

# Instância global
validator = DataValidator()