from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

# Importando apenas as políticas confirmadas na versão 1.0+
from secure import (
    Secure,
    StrictTransportSecurity,
    ReferrerPolicy,
    ContentSecurityPolicy,
    XFrameOptions
)

from backend.ia import api as ia_router
from backend.routers import (
    instrutores_auth, 
    alunos, 
    medidas, 
    saude, 
    perfil, 
    treinos
)
from backend.security_config import limiter
from backend.database import engine, Base  # <--- IMPORTANTE: Engine e Base para criar tabelas
from backend import models # <--- IMPORTANTE: Importar models para registrar as tabelas no Base

# --- Configuração de Security Headers ---
# 1. Definindo as políticas
csp = (
    ContentSecurityPolicy()
    .default_src("'self'")
    .img_src("'self'", "data:", "https:")
    # .script_src("'self'", "'unsafe-inline'") # Descomente se precisar de scripts inline
)

hsts = StrictTransportSecurity().include_subdomains().preload().max_age(31536000)
referrer = ReferrerPolicy().strict_origin_when_cross_origin()
xfo = XFrameOptions().deny()

# 2. Instanciando o Secure com as políticas
secure_headers = Secure(
    csp=csp,
    hsts=hsts,
    referrer=referrer,
    xfo=xfo
)

app = FastAPI(title="CoreFlowFit API")

# --- MÁGICA: CRIA AS TABELAS AO INICIAR ---
@app.on_event("startup")
def startup():
    # Cria todas as tabelas definidas no models.py se elas não existirem
    print("🔄 Verificando/Criando tabelas no banco de dados...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tabelas verificadas/criadas com sucesso!")

# --- Rate Limiting ---
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Middleware de Headers Seguros ---
@app.middleware("http")
async def set_secure_headers(request: Request, call_next):
    response = await call_next(request)
    # CORREÇÃO: secure_headers.set_headers não é assíncrono, removemos o 'await'
    secure_headers.set_headers(response)
    return response

# --- Rotas ---
app.include_router(instrutores_auth.router)
app.include_router(alunos.router)
app.include_router(medidas.router)
app.include_router(saude.router)
app.include_router(perfil.router)
app.include_router(treinos.router)
app.include_router(ia_router.router)

@app.get("/")
def root():
    return {"message": "API CoreFlowFit Online 🚀"}