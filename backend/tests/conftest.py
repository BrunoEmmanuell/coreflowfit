# backend/tests/conftest.py
import pytest
import asyncio
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.main import app
from backend.database import get_db, Base
from backend.auth import hash_password

# Configuração do banco de testes
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    """Override da dependência do banco para testes"""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

# Aplica override
app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session")
def event_loop():
    """Event loop para testes assíncronos"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="function")
def client():
    """Cliente de teste para a API"""
    # Cria todas as tabelas
    Base.metadata.create_all(bind=engine)
    
    with TestClient(app) as test_client:
        yield test_client
    
    # Limpa após teste
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session():
    """Sessão de banco para testes"""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def test_instrutor(db_session):
    """Cria instrutor de teste"""
    from backend.database import Instrutor
    
    instrutor = Instrutor(
        username="testuser",
        email="test@coreflowfit.com",
        hashed_password=hash_password("testpassword123"),
        nome_completo="Test User"
    )
    
    db_session.add(instrutor)
    db_session.commit()
    db_session.refresh(instrutor)
    
    return instrutor

@pytest.fixture(scope="function")
def auth_headers(test_instrutor, client):
    """Headers de autenticação para testes"""
    # Login para obter token
    login_data = {
        "username": "testuser",
        "password": "testpassword123"
    }
    
    response = client.post("/api/v1/auth/login", data=login_data)
    token = response.json()["token"]
    
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="function")
def test_aluno(db_session, test_instrutor):
    """Cria aluno de teste"""
    from backend.database import Aluno
    
    aluno = Aluno(
        nome="Aluno Teste",
        instrutor_id=test_instrutor.id,
        sexo="Masculino",
        objetivo="Hipertrofia",
        nivel_experiencia="Iniciante"
    )
    
    db_session.add(aluno)
    db_session.commit()
    db_session.refresh(aluno)
    
    return aluno