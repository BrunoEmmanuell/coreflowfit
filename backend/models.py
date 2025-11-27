from sqlalchemy import Column, String, Boolean, Float, Integer, Text, DateTime, ForeignKey, func, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from backend.database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

# --- Modelo Instrutor (Adicionado) ---
class Instrutor(Base):
    __tablename__ = "instrutores"
    
    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    nome_completo = Column(String)
    hashed_password = Column(String, nullable=False)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relacionamentos
    alunos = relationship("Aluno", back_populates="instrutor")

# --- Modelo Aluno ---
class Aluno(Base):
    __tablename__ = "alunos"
    
    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    instrutor_id = Column(UUID(as_uuid=False), ForeignKey("instrutores.id"), index=True)
    nome = Column(String, nullable=False)
    sexo = Column(String)
    objetivo = Column(String)
    nivel_experiencia = Column(String)
    observacoes = Column(Text)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    # Relacionamentos
    instrutor = relationship("Instrutor", back_populates="alunos")
    medidas = relationship("MedidasCorpo", back_populates="aluno", order_by="desc(MedidasCorpo.data_medida)", cascade="all, delete-orphan")
    saude = relationship("SaudeAluno", back_populates="aluno", uselist=False, cascade="all, delete-orphan")
    treinos = relationship("TreinoGerado", back_populates="aluno", order_by="desc(TreinoGerado.gerado_em)")

# --- Modelo Medidas ---
class MedidasCorpo(Base):
    __tablename__ = "medidas_corpo"
    
    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    aluno_id = Column(UUID(as_uuid=False), ForeignKey("alunos.id"), nullable=False)
    
    peso_kg = Column(Float)
    altura_m = Column(Float)
    imc = Column(Float)
    
    ombros = Column(Float)
    peito = Column(Float)
    cintura = Column(Float)
    quadril = Column(Float)
    braco_direito = Column(Float)
    braco_esquerdo = Column(Float)
    coxa_direita = Column(Float)
    coxa_esquerda = Column(Float)
    panturrilha_direita = Column(Float)
    panturrilha_esquerda = Column(Float)
    
    data_medida = Column(DateTime(timezone=True), server_default=func.now())
    aluno = relationship("Aluno", back_populates="medidas")

# --- Modelo Saude ---
class SaudeAluno(Base):
    __tablename__ = "saude_aluno"
    
    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    aluno_id = Column(UUID(as_uuid=False), ForeignKey("alunos.id"), unique=True, nullable=False)
    
    hipertensao = Column(Boolean, default=False)
    diabetes = Column(Boolean, default=False)
    cardiopatia = Column(Boolean, default=False)
    fuma = Column(Boolean, default=False)
    lesoes = Column(Text)
    medicacao = Column(Text)
    
    aluno = relationship("Aluno", back_populates="saude")

# --- Modelo Treino ---
class TreinoGerado(Base):
    __tablename__ = "treinos_gerados"
    
    id = Column(UUID(as_uuid=False), primary_key=True, default=generate_uuid)
    aluno_id = Column(UUID(as_uuid=False), ForeignKey("alunos.id"))
    instrutor_id = Column(UUID(as_uuid=False))
    conteudo_json = Column(JSON)
    gerado_em = Column(DateTime(timezone=True), server_default=func.now())
    
    aluno = relationship("Aluno", back_populates="treinos")