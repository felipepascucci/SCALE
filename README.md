# APSScale — Simulador de Cálculo de Emergia

![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)
![Pytest](https://img.shields.io/badge/Testes-Pytest%20%2B%20Jest-green?style=flat)

> **Disciplina:** Engenharia de Software — Análise Prática Supervisionada (APS)
> **Tema:** Desenvolvimento de Aplicação Web Full-Stack com Arquitetura em Camadas

---

## Visão Geral

O **APSScale** é uma aplicação web acadêmica para análise emergética de sistemas produtivos, inspirada no projeto [SCALE](https://www.sciencedirect.com/science/article/pii/S1364032116300491) *(Software for CALculating Emergy based on Life Cycle Inventories — Marvuglia et al., 2013)*.

**Emergia** quantifica a memória energética acumulada necessária para produzir um bem ou serviço — toda a energia solar equivalente gasta ao longo da cadeia produtiva, medida em **solar emjoules (sej)**. O conceito adota a perspectiva *donor-oriented* formalizada por H.T. Odum (1996), diferenciando-se da Análise do Ciclo de Vida convencional ao avaliar o custo imposto à natureza, e não o benefício percebido pelo consumidor.

O sistema recebe como entrada uma **Matriz de Inventário do Ciclo de Vida (LCI)** no formato CSV ou Excel, constrói um grafo orientado dos processos e aplica as três regras da álgebra emergética via busca em profundidade (DFS) para calcular a emergia total do produto alvo.

---

## Arquitetura e Stack Tecnológico

```
┌──────────────────────┐      HTTP/REST       ┌────────────────────────┐
│   Frontend (React)   │ ◄──────────────────► │   Backend (FastAPI)    │
│                      │                       │                        │
│  • ReactFlow (grafo) │                       │  • Router (API v1)     │
│  • Recharts (pizza)  │                       │  • Service Layer (DFS) │
│  • xlsx / html2canvas│                       │  • Repository Layer    │
└──────────────────────┘                       └──────────┬─────────────┘
                                                          │ SQLAlchemy ORM
                                               ┌──────────▼─────────────┐
                                               │   PostgreSQL 15         │
                                               │  projects / processes   │
                                               │  flows / uevs           │
                                               └────────────────────────┘
```

### Tabela de Tecnologias

| Camada | Tecnologia | Finalidade |
|--------|-----------|-----------|
| **Backend** | Python 3.11, FastAPI | Framework web assíncrono com tipagem forte |
| **Backend** | SQLAlchemy + Alembic | ORM e migrações declarativas do banco |
| **Backend** | Pydantic v2 | Validação de entrada e variáveis de ambiente |
| **Backend** | NetworkX | Representação e travessia do grafo LCI |
| **Frontend** | React 18 + Vite | Interface SPA com renderização eficiente |
| **Frontend** | ReactFlow + dagre | Visualização interativa do grafo de processos |
| **Frontend** | Recharts | Gráfico de pizza com contribuições por fonte |
| **Frontend** | xlsx + html2canvas | Exportação client-side para Excel e PNG |
| **Banco** | PostgreSQL 15 | Persistência relacional de projetos e resultados |
| **Infra** | Docker + Docker Compose | Orquestração dos containers (db, backend, frontend) |
| **Testes** | Pytest + FastAPI TestClient | Testes unitários e de integração do backend |
| **Testes** | Jest + React Testing Library | Testes de componentes do frontend |

---

## Funcionalidades Principais

- **Ingestão de Matriz LCI** — upload de arquivo CSV ou Excel (`.xlsx`/`.xls`); inferência automática dos tipos de nó (SOURCE, PROCESS, TARGET) a partir da estrutura da matriz
- **Motor de Cálculo Emergético** — algoritmo *track-summing* via DFS recursivo aplicando as 3 regras de Odum (1996); parâmetro `minflow` para poda de caminhos irrelevantes
- **Visualização Interativa do Grafo** — layout automático com dagre (LR), coloração semântica por tipo de nó, labels nas arestas com os valores de fluxo
- **Relatório de Emergia** — total em sej, gráfico de pizza com contribuição percentual por fonte, tabela detalhada de contribuições
- **Histórico de Projetos** — listagem persistida no banco, seleção, recarregamento e exclusão de projetos anteriores
- **Exportação Avançada** — relatório completo em Excel (`.xlsx`) com cabeçalho + tabela e exportação do gráfico em PNG, ambos gerados 100% no cliente
- **Landing Page Educativa** — apresentação do projeto com explicação das 3 regras emergéticas e do conceito de LCI
- **Testes Automatizados** — cobertura das 3 regras algébricas (Pytest) e renderização de componentes (Jest)

---

## Como Executar o Projeto

### Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (inclui Docker Compose v2)
- Git

### Passo 1 — Clonar o repositório

```bash
git clone <url-do-repositorio> APSScale
cd APSScale
```

### Passo 2 — Criar o arquivo de variáveis de ambiente

```bash
# Linux / macOS
cp .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env
```

Os valores padrão do `.env.example` funcionam sem alteração para ambiente de desenvolvimento local.

### Passo 3 — Subir todos os serviços

```bash
docker compose up --build
```

| Container | Serviço | Porta |
|-----------|---------|-------|
| `db` | PostgreSQL 15 | 5432 |
| `backend` | FastAPI (auto-reload) | 8000 |
| `frontend` | React + Vite | 5173 |

### Passo 4 — Aplicar as migrações do banco de dados

Com os containers em execução, abra um segundo terminal:

```bash
docker compose exec backend alembic upgrade head
```

Verifique se as tabelas foram criadas:

```bash
docker compose exec db psql -U apsscale -d apsscale -c "\dt"
# Resultado esperado: alembic_version, flows, processes, projects, uevs
```

### Acessar a aplicação

| URL | Descrição |
|-----|-----------|
| http://localhost:5173 | Interface Web (Landing Page → Dashboard) |
| http://localhost:8000/docs | Swagger UI — documentação interativa da API REST |
| http://localhost:8000/health | Health check do backend (`{"status": "ok"}`) |

---

## Como Rodar os Testes

### Backend (Pytest)

```bash
docker compose exec backend pip install -r requirements-dev.txt
docker compose exec backend pytest backend/tests/ -v
```

Cobertura dos testes:

| Arquivo | O que testa |
|---------|-------------|
| `test_emergy_rules.py` | Regra 1 (soma), Regra 2 (não-dupla-contagem), Regra 3 (co-produto integral) com grafos construídos programaticamente |
| `test_api.py` | Endpoints `/template` e `/uevs` via `TestClient` com banco SQLite in-memory |

### Frontend (Jest)

```bash
docker compose exec frontend npm test
```

Cobertura dos testes:

| Arquivo | O que testa |
|---------|-------------|
| `App.test.jsx` | Renderização das abas de navegação (Início, Dashboard) |
| `UEVManager.test.jsx` | Renderização do título e botão de adição da tabela de UEVs |

---

## Estrutura do Projeto

```
APSScale/
├── .env.example
├── docker-compose.yml
├── README.md
├── CLAUDE.md                      # Diretrizes para o assistente de IA
│
├── backend/
│   ├── main.py                    # Entrypoint FastAPI + registro de routers
│   ├── requirements.txt
│   ├── requirements-dev.txt       # pytest, httpx
│   ├── api/v1/
│   │   ├── projects.py            # /template, /upload, /{id}/graph, /{id}/calculate
│   │   └── uevs.py                # CRUD de transformidades
│   ├── core/
│   │   ├── config.py              # Pydantic BaseSettings (lê .env)
│   │   └── database.py            # Engine + SessionLocal + Base
│   ├── models/                    # ORM SQLAlchemy (projects, processes, flows, uevs)
│   ├── schemas/                   # Pydantic request/response schemas
│   ├── repositories/              # Camada de queries — Repository Pattern
│   ├── services/                  # Lógica de negócio — Strategy Pattern
│   │   ├── emergy_engine.py       # Motor DFS — HOMOLOGADO
│   │   ├── graph_builder.py       # Construção do grafo networkx
│   │   ├── lci_matrix.py          # Parser da matriz tecnológica
│   │   ├── uev_database.py        # Store de UEVs com defaults Odum 1996
│   │   └── report_generator.py    # Consolidação do resultado final
│   └── tests/
│       ├── conftest.py            # Fixtures: SQLite in-memory, TestClient
│       ├── test_emergy_rules.py   # Validação das 3 regras algébricas
│       └── test_api.py            # Testes de integração dos endpoints REST
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── App.jsx                # Orquestrador: estado global, roteamento de abas
        ├── components/
        │   ├── LandingPage.jsx    # Apresentação acadêmica do projeto
        │   ├── LCIUploader.jsx    # Formulário de upload + download de template
        │   ├── ProjectList.jsx    # Histórico de projetos salvos
        │   ├── NetworkViewer.jsx  # Grafo interativo (ReactFlow + dagre)
        │   └── EmergyReport.jsx   # Relatório + exportação Excel/PNG
        └── __tests__/
            ├── App.test.jsx
            └── UEVManager.test.jsx
```

---

## Regras da Álgebra Emergética (Odum, 1996)

O núcleo computacional do sistema é o motor de cálculo em `backend/services/emergy_engine.py`, que implementa o algoritmo *track-summing* aplicando as três regras fundamentais:

| Nº | Nome | Descrição | Implementação |
|----|------|-----------|---------------|
| **1** | **Soma de co-geração** | Fluxos de **fontes independentes** que convergem num processo têm suas emergias **somadas** | DFS acumula contribuições de cada aresta de entrada |
| **2** | **Não-dupla-contagem** | O mesmo fluxo original chegando por dois caminhos paralelos (bifurcação anterior) é contado **apenas uma vez** | Conjunto `visited_sources` compartilhado entre ramos do DFS |
| **3** | **Co-produto integral** | Em processos com múltiplas saídas, **cada co-produto recebe a emergia total** do processo, sem rateio | Chamadas `calculate()` independentes por nó TARGET |

O parâmetro `minflow` (padrão `1e-10`) descarta arestas com fração de fluxo abaixo do limiar, mantendo o custo computacional tratável em grafos grandes.

---

## Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/health` | Health check |
| `GET` | `/api/v1/projects` | Lista todos os projetos (ordenados por data) |
| `GET` | `/api/v1/projects/template` | Baixa template CSV de exemplo |
| `POST` | `/api/v1/projects/upload` | Faz upload de matriz LCI e cria projeto |
| `GET` | `/api/v1/projects/{id}/graph` | Retorna nós e arestas no formato ReactFlow |
| `POST` | `/api/v1/projects/{id}/calculate` | Executa o motor emergético |
| `DELETE` | `/api/v1/projects/{id}` | Remove projeto e dados associados (cascade) |
| `GET` | `/api/v1/uevs` | Lista transformidades cadastradas |
| `POST` | `/api/v1/uevs` | Cadastra nova transformidade |
| `PUT` | `/api/v1/uevs/{id}` | Atualiza valor e unidade de uma transformidade |

---

## Referências

- ODUM, H.T. *Environmental Accounting: Emergy and Environmental Decision Making*. Wiley, 1996.
- MARVUGLIA, A. et al. *SCALE: A software tool implementing emergy algebra rules*. Renewable and Sustainable Energy Reviews, v. 54, 2016.
- BROWN, M.T.; ULGIATI, S. *Emergy evaluations and environmental loading of electricity production systems*. Journal of Cleaner Production, v. 10, 2002.
