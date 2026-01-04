# Coreto Game Engine

**Sistema de validação determinística de TTK (Time-to-Kill) para balanceamento de combate em RPG Maker MZ**

[![Status](https://img.shields.io/badge/status-pre--implementation-yellow)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)]()
[![Node.js](https://img.shields.io/badge/Node.js-LTS-green)]()

## 📋 Visão Geral

O Coreto Game Engine é um wrapper read-only sobre projetos RPG Maker MZ que executa batalhas reais em modo headless para medir Time-to-Kill (TTK) e validar balanceamento de combate. Reduz o ciclo de validação de **2-3 dias** para **≤10 minutos**.

### Características Principais

- 🔒 **Read-Only**: Nunca modifica o projeto RPG Maker MZ (ADR-001)
- ⚡ **Headless Execution**: Executa batalhas reais via engine em JSDOM
- 🎯 **Deterministic**: Seed fixa garante reprodutibilidade (ADR-018)
- 📊 **Detailed Reports**: Gera relatórios JSON com métricas e warnings
- 🤖 **AI-Friendly**: Export de JSONs divididos para contexto de IA
- 🧩 **VisuStella Support**: Compatível com plugins VisuStella em headless

## 🚀 Status do Projeto

**⚠️ PRE-IMPLEMENTATION PHASE**

Este projeto está atualmente em fase de design e planejamento. Toda a arquitetura foi documentada, mas a implementação ainda não começou.

### O que está pronto

- ✅ Product Requirements Document (PRD)
- ✅ High-Level Design (HLD) completo
- ✅ 28 Architecture Decision Records (ADRs)
- ✅ Documentação técnica e de pesquisa
- ✅ Serena MCP onboarding completo

### Próximos passos

- ⬜ Setup inicial do projeto (package.json, tsconfig.json)
- ⬜ Implementação das camadas base (Config, Loader)
- ⬜ Headless runtime setup (JSDOM + mocks)
- ⬜ Simulation engine
- ⬜ Reporter e AI Exporter

## 📁 Estrutura do Projeto

```
game-engine/
├── docs/                      # Documentação completa
│   ├── adrs/                 # 28 ADRs organizadas por módulo
│   ├── pesquisas/            # Documentos de pesquisa
│   ├── PRD_*.md             # Product Requirements Document
│   └── hld-*.md             # High-Level Design
├── .serena/                   # Serena MCP configuration
│   └── memories/             # Project knowledge base
└── README.md                  # Este arquivo
```

## 📚 Documentação

### Documentos Essenciais

| Documento | Descrição | Caminho |
|-----------|-----------|---------|
| **PRD** | Requisitos do produto | [`docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md`](docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md) |
| **HLD** | Design de alto nível (1638 linhas) | [`docs/hld-coreto-game-engine.md`](docs/hld-coreto-game-engine.md) |
| **ADRs** | 28 decisões arquiteturais | [`docs/adrs/INDEX.md`](docs/adrs/INDEX.md) |
| **Research** | Pesquisas técnicas | [`docs/pesquisas/`](docs/pesquisas/) |

### Arquitetura em Camadas (HLD Section 2)

```
CLI Layer           → Interface de linha de comando
  ↓
Config Layer        → Validação de configurações (Zod)
  ↓
Loader Layer        → Carregamento do banco RPG Maker MZ
  ↓
Headless Runtime    → JSDOM + Mocks (PIXI, Graphics, Effekseer)
  ↓
Simulation Layer    → Execução de batalhas e medição de TTK
  ↓
Reporter Layer      → Geração de report.json
  ↓
AI Exporter Layer   → Export de contexto para IA
```

## 🔧 Tech Stack (Planejado)

| Categoria | Tecnologia | ADR |
|-----------|-----------|-----|
| **Language** | TypeScript 5.x | ADR-028 |
| **Runtime** | Node.js LTS | - |
| **CLI** | Oclif | ADR-007 |
| **Testing** | Jest + JSDOM | ADR-014 |
| **Validation** | Zod | ADR-008 |
| **Mocking** | jest-canvas-mock | ADR-026 |

## 🎯 Uso Planejado (CLI)

```bash
# Validar TTK para todos os trechos
node cli.js run-ttk --config project.config.json

# Validar com seed customizada
node cli.js run-ttk --config project.config.json --seed 42

# Validar trecho específico
node cli.js run-ttk --config project.config.json --trecho ato1-nivel1-10

# Modo verbose para debug
node cli.js run-ttk --config project.config.json --verbose

# Modo diagnóstico (headless troubleshooting)
node cli.js run-ttk --config project.config.json --diagnostic

# Export de contexto para IA
node cli.js export-context --config project.config.json
```

## 📊 Exemplo de Configuração

```json
{
  "projectPath": "/path/to/rpg-maker-mz/project",
  "seed": 12345,
  "trechos": [
    {
      "id": "ato1-nivel1-10",
      "name": "Prólogo e Mundo Comum",
      "anchorLevelRange": { "min": 1, "max": 10 },
      "ttkTarget": { "turns": 3, "actions": 4 },
      "tolerance": { "turns": 1, "actions": 1 },
      "troopIds": [1, 2, 3],
      "party": {
        "members": [
          { "classId": 1, "level": 5 },
          { "classId": 2, "level": 5 }
        ]
      }
    }
  ]
}
```

## 📖 ADRs por Módulo

| Módulo | ADRs | Descrição |
|--------|------|-----------|
| **FOUNDATION** | 3 | Princípios arquiteturais (read-only, refs por ID, sem UI) |
| **SIMULATION** | 7 | Mecânicas de batalha e TTK |
| **RUNTIME** | 6 | Ambiente headless (JSDOM, mocks, diagnostics) |
| **REPORTER** | 4 | Geração de relatórios e warnings |
| **CONFIG** | 3 | Validação e configuração (Zod, JSON, TypeScript) |
| **DOCS** | 4 | Padrões de documentação |
| **CLI** | 1 | Framework Oclif |

**Total: 28 ADRs** - [Ver INDEX completo](docs/adrs/INDEX.md)

## 🔑 Decisões Arquiteturais Chave

### ADR-001: Wrapper Read-Only

O sistema **NUNCA** escreve no projeto RPG Maker MZ. Todas as alterações de fórmulas e dados continuam sendo feitas no editor do RPG Maker.

### ADR-003: Fidelidade via Batalha Real

Executa batalhas reais via `BattleManager` e engine do RPG Maker MZ (não simulação matemática) para máxima fidelidade ao jogo final.

### ADR-018: Determinismo com Seed

Seed fixa controla `Math.random` para garantir execuções reproduzíveis e determinísticas.

### ADR-028: TypeScript

Linguagem primária de implementação com strict mode e target ES2022.

## 🤝 Contribuindo

### Workflow de Desenvolvimento (Planejado)

1. **Setup**: `npm install`
2. **Development**: `npm run dev` (watch mode)
3. **Testing**: `npm test` ou `npm run test:watch`
4. **Quality**: `npm run lint` e `npm run type-check`
5. **Build**: `npm run build`

### Commit Convention

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat(simulation): implement TTK measurement
fix(loader): validate troopId existence
docs(adr): add ADR-029 for parallel execution
refactor(config): simplify schema validation
```

## 👥 Time

- **Edney Antonio Reis Filho**
- **Arquitetura**: Documentada via ADR management plugin

---

**Última Atualização**: 2026-01-04
**Fase Atual**: Pre-Implementation / Design Phase
**Próximo Milestone**: MVP v1 Implementation
