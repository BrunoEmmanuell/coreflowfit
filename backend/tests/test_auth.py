# backend/tests/test_auth.py
import pytest
from fastapi import status
from backend.auth import hash_password, verify_password, create_access_token
from backend.utils.validation import DataValidator

class TestAuthentication:
    """Testes para o sistema de autenticação"""
    
    def test_hash_and_verify_password(self):
        """Testa hash e verificação de senha"""
        password = "minha_senha_secreta_123"
        hashed = hash_password(password)
        
        assert verify_password(password, hashed) is True
        assert verify_password("senha_errada", hashed) is False
    
    def test_password_strength_validator(self):
        """Testa validador de força de senha"""
        validator = DataValidator()
        
        # Senha fraca
        weak_result = validator.validate_password_strength("123")
        assert weak_result["valid"] is False
        assert weak_result["score"] < 3
        
        # Senha forte
        strong_result = validator.validate_password_strength("SenhaForte123!@#")
        assert strong_result["valid"] is True
        assert strong_result["score"] >= 4
    
    def test_jwt_token_creation(self):
        """Testa criação e validação de token JWT"""
        user_id = "123e4567-e89b-12d3-a456-426614174000"
        token = create_access_token(user_id)
        
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_login_success(self, client, test_instrutor):
        """Testa login bem-sucedido"""
        login_data = {
            "telefone": "testuser",
            "password": "testpassword123"
        }
        
        response = client.post("/api/v1/auth/login", data=login_data)
        
        assert response.status_code == status.HTTP_200_OK
        assert "token" in response.json()
        assert response.json()["ok"] is True
    
    def test_login_wrong_password(self, client, test_instrutor):
        """Testa login com senha errada"""
        login_data = {
            "telefone": "testuser",
            "password": "senha_errada"
        }
        
        response = client.post("/api/v1/auth/login", data=login_data)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "credenciais" in response.json()["detail"].lower()
    
    def test_protected_route_without_token(self, client):
        """Testa acesso a rota protegida sem token"""
        response = client.get("/api/v1/alunos/")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_protected_route_with_token(self, client, auth_headers):
        """Testa acesso a rota protegida com token válido"""
        response = client.get("/api/v1/alunos/", headers=auth_headers)
        
        # Pode retornar 200 (com lista vazia) ou 404, mas não 401
        assert response.status_code != status.HTTP_401_UNAUTHORIZED

class TestDataValidation:
    """Testes para validação de dados"""
    
    def test_telefone_validation(self):
        """Testa validação de telefone"""
        validator = DataValidator()
        
        valid_telefones = [
            "user@example.com",
            "test.user+tag@example.co.uk",
            "user123@subdomain.example.com"
        ]
        
        invalid_telefones = [
            "invalid",
            "user@",
            "@example.com",
            "user@.com"
        ]
        
        for telefone in valid_telefones:
            assert validator.validate_telefone(telefone) is True
        
        for telefone in invalid_telefones:
            assert validator.validate_telefone(telefone) is False
    
    def test_uuid_validation(self):
        """Testa validação de UUID"""
        validator = DataValidator()
        
        valid_uuids = [
            "123e4567-e89b-12d3-a456-426614174000",
            "00000000-0000-0000-0000-000000000000"
        ]
        
        invalid_uuids = [
            "invalid-uuid",
            "123e4567-e89b-12d3-a456-42661417400",  # muito curto
            "123e4567-e89b-12d3-a456-4266141740000" # muito longo
        ]
        
        for uuid_str in valid_uuids:
            assert validator.validate_uuid(uuid_str) is True
        
        for uuid_str in invalid_uuids:
            assert validator.validate_uuid(uuid_str) is False
    
    def test_user_data_validation(self):
        """Testa validação de dados de usuário"""
        validator = DataValidator()
        
        valid_data = {
            "nome": "João Silva",
            "telefone": "joao@example.com",
            "idade": "30"
        }
        
        invalid_data = {
            "nome": "J",  # nome muito curto
            "telefone": "invalid-telefone",
            "idade": "150"  # idade inválida
        }
        
        valid_errors = validator.validate_user_data(valid_data)
        invalid_errors = validator.validate_user_data(invalid_data)
        
        assert len(valid_errors) == 0
        assert len(invalid_errors) > 0