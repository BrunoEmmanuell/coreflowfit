-- coreflowfit/backend/db/schema.sql
-- VERSÃO 4.0 (ELITE) - Com Medidas Corporais Completas

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================
-- 1) TABELAS PRINCIPAIS
-- ============================

CREATE TABLE IF NOT EXISTS instrutores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        TEXT NOT NULL UNIQUE,
    email           TEXT NOT NULL UNIQUE,
    nome_completo   TEXT,
    hashed_password TEXT NOT NULL,
    is_admin        BOOLEAN NOT NULL DEFAULT FALSE,
    ativo           BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alunos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instrutor_id    UUID REFERENCES instrutores(id) ON DELETE SET NULL,
    nome            TEXT NOT NULL,
    data_nascimento DATE,
    sexo            TEXT,
    objetivo        TEXT,
    nivel_experiencia TEXT,
    historico_lesoes  TEXT,
    observacoes     TEXT,
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS saude_aluno (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id        UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    hipertensao     BOOLEAN DEFAULT FALSE,
    cardiopatia     BOOLEAN DEFAULT FALSE,
    diabetes        BOOLEAN DEFAULT FALSE,
    gestante        BOOLEAN DEFAULT FALSE,
    lesoes          TEXT,
    medicacao       TEXT,
    alergias        TEXT,
    fuma            BOOLEAN DEFAULT FALSE,
    alcool          BOOLEAN DEFAULT FALSE,
    ultimo_checkup  DATE,
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABELA MEDIDAS AGORA COMPLETA
CREATE TABLE IF NOT EXISTS medidas_corpo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id        UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    data_medida     TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- BÁSICO
    peso_kg             NUMERIC(6,2),
    altura_m            NUMERIC(4,2),
    imc                 NUMERIC(5,2),
    
    -- SUPERIORES
    ombros              NUMERIC(5,2),
    peito               NUMERIC(5,2),
    cintura             NUMERIC(5,2),
    abdomen             NUMERIC(5,2),
    quadril             NUMERIC(5,2),
    
    -- MEMBROS (Para detetar assimetria)
    braco_direito       NUMERIC(5,2),
    braco_esquerdo      NUMERIC(5,2),
    antebraco_direito   NUMERIC(5,2),
    antebraco_esquerdo  NUMERIC(5,2),
    
    coxa_direita        NUMERIC(5,2),
    coxa_esquerda       NUMERIC(5,2),
    panturrilha_direita NUMERIC(5,2),
    panturrilha_esquerda NUMERIC(5,2),
    
    criado_em           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================
-- 2) TABELAS DE TREINO E IA
-- ============================

CREATE TABLE IF NOT EXISTS ciclos_treino (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    fase TEXT NOT NULL,
    data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    data_fim_prevista DATE,
    semanas_planeadas INT,
    observacoes TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS treinos_gerados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id        UUID REFERENCES alunos(id) ON DELETE SET NULL,
    instrutor_id    UUID REFERENCES instrutores(id) ON DELETE SET NULL,
    ciclo_id        UUID REFERENCES ciclos_treino(id) ON DELETE SET NULL,
    conteudo_json   JSONB,
    gerado_em       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    treino_id   UUID REFERENCES treinos_gerados(id) ON DELETE SET NULL,
    aluno_id    UUID REFERENCES alunos(id) ON DELETE CASCADE,
    nota        SMALLINT CHECK (nota >= 1 AND nota <= 5),
    comentario  TEXT,
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS historico_cargas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    exercicio_nome TEXT NOT NULL,
    grupo_muscular TEXT,
    data_treino DATE NOT NULL DEFAULT CURRENT_DATE,
    carga_kg NUMERIC(6,2),
    repeticoes_feitas INT,
    rpe SMALLINT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- IA Metadata
CREATE TABLE IF NOT EXISTS ia_model_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome            TEXT,
    versao          TEXT,
    caminho_modelo  TEXT,
    columns_json    JSONB,
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ia_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_version   TEXT,
    metric_name     TEXT,
    metric_value    NUMERIC,
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger IMC
CREATE OR REPLACE FUNCTION coreflowfit_calc_imc()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.altura_m IS NOT NULL AND NEW.altura_m > 0 AND NEW.peso_kg IS NOT NULL THEN
        NEW.imc := ROUND(NEW.peso_kg / (NEW.altura_m * NEW.altura_m)::numeric, 2);
    ELSE
        NEW.imc := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trig_calc_imc ON medidas_corpo;
CREATE TRIGGER trig_calc_imc
BEFORE INSERT OR UPDATE ON medidas_corpo
FOR EACH ROW
EXECUTE FUNCTION coreflowfit_calc_imc();