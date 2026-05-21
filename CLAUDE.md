# APSScale — Emergy Calculation Web Application

Academic software engineering project. Inspired by SCALE (Software for CALculating Emergy based on Life Cycle Inventories). Calculates emergy using LCI (Life Cycle Inventory) databases.

---

## Diretrizes Estritas de Comportamento

- **Foco Absoluto:** FAÇA APENAS O QUE EU PEDI, NÃO APROVEITE PARA FAZER NADA ALÉM DO SOLICITADO. Não tente adivinhar funcionalidades, não expanda o escopo e NÃO FAÇA MELHORIAS ou refatorações não solicitadas no código.
- **Proteção do Core:** EVITE DE MEXER NOS SCRIPTS PRINCIPAIS E NA LÓGICA CENTRAL DE CÁLCULO (Core Business Logic) que já estiverem funcionando, a menos que eu solicite expressamente.
- **Código Limpo e Direto:** Tire os comentários inúteis ou óbvios. Comente apenas lógicas de negócios complexas da álgebra emergética.
- **Correções Cirúrgicas:** Se a tarefa for corrigir um erro, corrija estritamente o erro sem alterar estilizações ou outras partes do código.

## Stack Tecnológico e Infraestrutura

- **Backend:** Python com FastAPI (incluindo configuração de CORS).
- **Frontend:** JavaScript com React (utilizando `reactflow` para os grafos).
- **Banco de Dados:** PostgreSQL (acessado via SQLAlchemy ou SQLModel) com **Alembic** para migrações.
- **Manipulação e Validação:** `pandas` e `numpy` para matrizes; uso agressivo do **Pydantic** para validação estrita dos dados de entrada e gerenciamento de variáveis de ambiente.
- **Testes:** `pytest` (backend) e `Jest` (frontend).
- **Ambiente:** Docker e Docker Compose para orquestrar os containers, utilizando arquivos `.env`.
- **Deploy:** Estrutura pronta para deploy (frontend na Vercel).

## Arquitetura e Padrões de Projeto

1. **Controller/Routers (FastAPI):** Exposição dos endpoints REST, fortemente tipados.
2. **Service/Business Logic:** Onde residirá a lógica de cálculo. Utilize o **Strategy Pattern** para encapsular diferentes regras de cálculo.
3. **Repository Pattern:** Isolamento das queries com o PostgreSQL.
4. **Factory Pattern:** Para a ingestão de diferentes formatos de arquivos LCI.

---

## Database Tables

| Table      | Purpose                                      |
|------------|----------------------------------------------|
| projects   | Top-level user project container             |
| processes  | Unit processes belonging to a project        |
| flows      | Input/output flows between processes         |
| results    | Computed emergy results per project          |

## Backend Layout

```
backend/
├── main.py              # FastAPI app entry point + router registration
├── core/
│   ├── config.py        # Pydantic BaseSettings (.env)
│   └── database.py      # SQLAlchemy engine + session
├── api/
│   └── v1/
│       ├── projects.py  # GET /template, POST /upload, GET /{id}/graph, POST /{id}/calculate
│       └── uevs.py      # GET /, POST /, PUT /{id} — CRUD de transformidades
├── schemas/             # Pydantic request/response schemas
├── models/              # SQLAlchemy ORM models
├── repositories/        # DB query layer (Repository Pattern)
├── services/            # Business logic (Strategy Pattern) — HOMOLOGADO
└── tests/
    ├── conftest.py      # Fixtures: db_session (SQLite), client (TestClient), empty_graph
    ├── test_emergy_rules.py  # Regras 1, 2 e 3 da álgebra emergética
    └── test_api.py      # Endpoints /template e /uevs
```

> **Integração UEV ↔ Cálculo:** o endpoint `POST /{id}/calculate` carrega os UEVs diretamente da tabela `uevs` do banco (via `db.query(UEV).all()`), garantindo que edições feitas pelo usuário na aba "Transformidades" sejam refletidas nos cálculos. O `UEVDatabase.load_defaults()` funciona apenas como fallback quando o banco está vazio.

## Running Locally

See README.md for full step-by-step instructions.

---

## Domínio: Análise Emergética

**Emergia** quantifica a "memória" do trabalho exergético da geobiosfera necessário para produzir um produto ou serviço — toda a energia solar equivalente gasta ao longo da cadeia produtiva. Unidade: **solar emjoule (sej)**. Perspectiva *donor-oriented* (centrada na natureza), diferente do LCA tradicional.

**Transformidade (UEV — Unit Emergy Value):** fator de conversão entre uma unidade física (J, kg, m³) e sej. Representa quanto trabalho solar foi necessário para gerar aquela unidade de recurso.

---

## Regras da Álgebra Emergética (Core Business Logic)

Estas regras são a lógica central do sistema. **Não alterar sem solicitação explícita.**

| # | Nome | Descrição |
|---|------|-----------|
| 1 | **Soma de co-geração** | Fluxos de **origens independentes** que convergem num processo têm suas emergias **somadas**. |
| 2 | **Não-dupla-contagem** | O **mesmo fluxo original** chegando por dois caminhos paralelos (bifurcação anterior) é contado **apenas uma vez** — pelo caminho de maior fração. |
| 3 | **Co-produto integral** | Em processos com múltiplas saídas, **cada co-produto recebe a emergia total** do processo (sem rateio). |

A Regra 2 é o maior desafio computacional: exige rastrear a *origem* de cada fluxo por toda a rede para detectar bifurcações.

---

## Arquitetura de Módulos do Motor de Cálculo

```
[1. Entrada LCI]  →  [2. Grafo de Processos]  →  [3. Motor de Cálculo]
                                                         ↑
                                                 [4. Banco de UEVs]
                                                         ↓
                                               [5. Saída / Relatórios]
```

| Módulo | Responsabilidade | Localização |
|--------|-----------------|-------------|
| 1. LCI Ingestor | Importa matriz tecnológica (CSV / EcoSpold). Factory Pattern por formato. | `services/lci_matrix.py` |
| 2. Process Graph | Constrói grafo orientado (nós SOURCE / PROCESS / TARGET) a partir da matriz | `services/graph_builder.py` |
| 3. Emergy Engine | DFS recursivo com as 3 regras da álgebra emergética. Parâmetro `minflow` para poda. | `services/emergy_engine.py` |
| 4. UEV Database | Tabela de transformidades (sej/unidade). Consultada pelo engine para nós SOURCE. | `services/uev_database.py` |
| 5. Report Generator | Consolida resultados: total em sej + contribuição por fonte/categoria. | `services/report_generator.py` |

### Representação da Matriz Tecnológica

A matriz **A** é **n × n** (n = número de processos):
- `A[i][j] > 0` → processo `j` **produz** produto `i`
- `A[i][j] < 0` → processo `j` **consome** produto `i`

### Tipos de Nó no Grafo

- **SOURCE:** entrada primária da natureza (sol, vento, chuva, mineral). Tem UEV associada. Sem predecessores.
- **PROCESS:** processo tecnológico intermediário. Consome e produz fluxos.
- **TARGET:** produto final estudado.

### Parâmetro `minflow`

Limiar de corte de fluxo para eficiência computacional. Fluxos abaixo deste valor são descartados. Valores típicos: `10⁻⁸` a `10⁻¹²`. Controla precisão vs. custo computacional.
