// frontend/src/types/api.ts
export interface Instrutor {
    id: string;
    username: string;
    email: string;
    nome_completo?: string;
    criado_em: string;
}

export interface MedidasCorpo {
    id: string;
    aluno_id: string;
    peso_kg?: number;
    altura_m?: number;
    imc?: number;
    ombros?: number;
    peito?: number;
    cintura?: number;
    quadril?: number;
    braco_direito?: number;
    braco_esquerdo?: number;
    coxa_direita?: number;
    coxa_esquerda?: number;
    panturrilha_direita?: number;
    panturrilha_esquerda?: number;
    data_medida: string;
    data_curta?: string;
}

export interface SaudeAluno {
    id: string;
    aluno_id: string;
    hipertensao: boolean;
    diabetes: boolean;
    cardiopatia: boolean;
    fuma: boolean;
    lesoes?: string;
    medicacao?: string;
}

export interface ExercicioTreino {
    exercicio: string;
    series: string | number;
    repeticoes: string | number;
    descanso: string;
    grupo?: string;
}

export interface DiaTreino {
    dia: string;
    nome_dia: string;
    exercicios: ExercicioTreino[];
}

export interface TreinoGerado {
    id: string;
    aluno_id: string;
    instrutor_id: string;
    conteudo_json: DiaTreino[]; 
    objetivo?: string;
    divisao?: string;
    gerado_em: string;
    aluno_nome?: string;
    total_exercicios?: number;
}

export interface Aluno {
    id: string;
    instrutor_id?: string;
    nome: string;
    sexo?: string;
    objetivo?: string;
    nivel_experiencia?: string;
    observacoes?: string;
    criado_em: string;
    medidas?: MedidasCorpo[];
    saude?: SaudeAluno;
    treinos?: TreinoGerado[];
}

export interface DashboardStats {
    stats: {
        treinosTotal: number;
        progresso: number;
    };
    proximoTreino: string | null;
    recentes: TreinoGerado[];
}