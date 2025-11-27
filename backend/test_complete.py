# test_complete.py
import requests
import json

def test_complete_flow():
    print("🧪 Testando fluxo completo da aplicação...")
    
    # 1. Teste básico
    print("1. Testando API básica...")
    try:
        response = requests.get("http://localhost:8000/")
        print(f"   ✅ API: {response.json()}")
    except Exception as e:
        print(f"   ❌ API: {e}")
        return
    
    # 2. Registrar usuário
    print("2. Registrando usuário...")
    try:
        reg_data = {
            "username": "trainer123",
            "password": "senha123456"
        }
        response = requests.post("http://localhost:8000/api/v1/auth/register", json=reg_data)
        print(f"   ✅ Registro: {response.json()}")
    except Exception as e:
        print(f"   ❌ Registro: {e}")
    
    # 3. Login
    print("3. Fazendo login...")
    try:
        login_data = {
            "username": "trainer123",
            "password": "senha123456"
        }
        response = requests.post("http://localhost:8000/api/v1/auth/login", data=login_data)
        token = response.json().get("token")
        if token:
            print("   ✅ Login: Token obtido")
            headers = {"Authorization": f"Bearer {token}"}
        else:
            print("   ❌ Login: Token não recebido")
            return
    except Exception as e:
        print(f"   ❌ Login: {e}")
        return
    
    # 4. Testar IA
    print("4. Testando geração de treino...")
    try:
        treino_data = {
            "aluno_id": "teste-railway",
            "divisao_preferida": "abc"
        }
        response = requests.post(
            "http://localhost:8000/api/v1/ia/gerar-treino",
            json=treino_data,
            headers=headers
        )
        result = response.json()
        if result.get("ok"):
            print("   ✅ IA: Treino gerado com sucesso!")
            print(f"   📊 Exercícios: {sum(len(dia['exercicios']) for dia in result['plano'])}")
        else:
            print(f"   ❌ IA: {result.get('erro', 'Erro desconhecido')}")
    except Exception as e:
        print(f"   ❌ IA: {e}")
    
    print("🎉 Teste completo finalizado!")

if __name__ == "__main__":
    test_complete_flow()