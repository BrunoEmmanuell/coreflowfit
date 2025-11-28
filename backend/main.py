import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import do banco
from backend.database import Base, engine

# LOGGING
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("coreflowfit")

# ==========================================
# 1. Inicializar FastAPI
# ==========================================

app = FastAPI(
    title="CoreFlowFit API",
    version="1.0.0",
    description="Backend do sistema CoreFlowFit",
)

# ==========================================
# 2. CORS (IMPORTANTE para o frontend no Render)
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # depois trocamos para domínios específicos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 3. EVENTO DE STARTUP
# ==========================================

@app.on_event("startup")
def startup():
    logger.info("🔄 Iniciando API e verificando tabelas do banco...")
    try:
        # Criar tabelas automaticamente
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Tabelas verificadas/criadas com sucesso.")
    except Exception as e:
        logger.error(f"❌ Erro ao criar/verificar tabelas: {e}")
        raise

    logger.info("🚀 API CoreFlowFit iniciada com sucesso!")

# ==========================================
# 4. REGISTRAR ROTAS (IMPORTS DENTRO DA FUNÇÃO PARA EVITAR ERROS)
# ==========================================

@app.get("/", tags=["Status"])
def root():
    return {
        "status": "online",
        "api": "CoreFlowFit",
        "message": "Backend funcionando 🚀"
    }

# Importar e registrar rotas após a inicialização básica
try:
    from backend.routes import auth as auth_router
    from backend.routes import alunos as alunos_router
    from backend.routes import treinos as treinos_router
    from backend.ia import api as ia_router
    
    app.include_router(auth_router.router, prefix="/auth", tags=["Auth"])
    app.include_router(alunos_router.router, prefix="/alunos", tags=["Alunos"])
    app.include_router(treinos_router.router, prefix="/treinos", tags=["Treinos"])
    app.include_router(ia_router.router, prefix="/ia", tags=["IA"])
    
    logger.info("✅ Todas as rotas registradas com sucesso!")
    
except ImportError as e:
    logger.warning(f"⚠️ Algumas rotas não puderam ser carregadas: {e}")