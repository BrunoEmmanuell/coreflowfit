# backend/seed_evolution.py
import uuid
import random
from datetime import datetime, timedelta
from backend.database import execute_query

def seed_evolution():
    print("🌱 Semeando dados de evolução fictícios...")
    
    # 1. Pega o aluno mais recente (sem usar fetchone)
    result = execute_query(
        "SELECT id, nome FROM alunos ORDER BY criado_em DESC LIMIT 1"
    )
    
    if not result:
        print("❌ Nenhum aluno encontrado. Crie um aluno no site primeiro!")
        return

    aluno = result[0]  # Pega o primeiro resultado da lista
    aluno_id = str(aluno['id'])
    print(f"👤 Gerando histórico para: {aluno['nome']}")

    # 2. Gerar 6 meses de histórico (Do passado para o presente)
    peso_base = 70.0
    cintura_base = 90.0
    braco_base = 30.0
    peito_base = 95.0
    
    # Loop de 6 meses atrás até hoje
    for i in range(6, -1, -1): 
        # Data retroativa
        data = datetime.now() - timedelta(days=i*30)
        
        # Fator de progresso (0 a 6)
        progresso = 6 - i 
        
        # Simula mudanças graduais
        peso = peso_base + (progresso * 0.5) + random.uniform(-0.3, 0.3)
        cintura = cintura_base - (progresso * 0.8) + random.uniform(-0.5, 0.5)
        braco = braco_base + (progresso * 0.4) + random.uniform(-0.1, 0.1)
        peito = peito_base + (progresso * 0.6) + random.uniform(-0.2, 0.2)
        
        # Insere no banco usando parâmetros nomeados (compatível com database.py atual)
        execute_query("""
            INSERT INTO medidas_corpo (
                id, aluno_id, data_medida, 
                peso_kg, altura_m, 
                ombros, peito, cintura, quadril,
                braco_direito, braco_esquerdo,
                coxa_direita, coxa_esquerda,
                panturrilha_direita, panturrilha_esquerda,
                criado_em
            ) VALUES (
                :id, :aluno_id, :data_medida,
                :peso, 1.75,
                115, :peito, :cintura, 100,
                :braco, :braco,
                60, 60,
                40, 40,
                NOW()
            )
        """, {
            'id': str(uuid.uuid4()),
            'aluno_id': aluno_id,
            'data_medida': data,
            'peso': round(peso, 2),
            'peito': round(peito, 2),
            'cintura': round(cintura, 2),
            'braco': round(braco, 2)
        })
        
        data_fmt = data.strftime('%d/%m/%Y')
        print(f"   📅 {data_fmt}: Peso {peso:.1f}kg | Braço {braco:.1f}cm | Cintura {cintura:.1f}cm")

    print("\n✅ Histórico gerado! Agora vá na página de Evolução.")

if __name__ == "__main__":
    seed_evolution()