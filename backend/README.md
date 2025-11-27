# CoreFlowFit 🏋️‍♂️💪

![Python](https://img.shields.io/badge/Python-3.11-blue?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.95+-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Available-2496ED?style=for-the-badge&logo=docker&logoColor=white)

O **CoreFlowFit** é uma plataforma completa de gestão de treinos e saúde, projetada para conectar instrutores e alunos. O sistema utiliza algoritmos inteligentes para gerar treinos personalizados baseados em objetivos, nível de experiência e restrições médicas, além de monitorar métricas de saúde e progresso.

## 🚀 Tecnologias Utilizadas

### Backend
* **Linguagem:** Python 3.11
* **Framework:** FastAPI
* **ORM:** SQLAlchemy (Assíncrono/Síncrono)
* **Banco de Dados:** PostgreSQL (Produção) / SQLite (Testes)
* **Autenticação:** JWT (JSON Web Tokens)
* **Segurança:** Passlib (Hashing), Rate Limiting (SlowAPI)

### Frontend
* **Framework:** React (Vite/CRA)
* **Estilização:** TailwindCSS / CSS Modules (a definir)
* **Gerenciamento de Estado:** Context API / Redux
* **HTTP Client:** Axios

### DevOps & Infraestrutura
* **Containerização:** Docker & Docker Compose
* **CI/CD:** GitHub Actions
* **Servidor Web:** Nginx (Proxy Reverso)

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:
* [Git](https://git-scm.com/)
* [Docker](https://www.docker.com/) & Docker Compose
* [Python 3.11+](https://www.python.org/) (opcional se usar Docker)
* [Node.js 18+](https://nodejs.org/) (opcional se usar Docker)

---

## 🛠️ Configuração do Ambiente

### 1. Clone o Repositório

```bash
git clone [https://github.com/seu-usuario/coreflowfit.git](https://github.com/seu-usuario/coreflowfit.git)
cd coreflowfit