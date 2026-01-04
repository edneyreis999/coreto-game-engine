# Coreto Game Engine

**Sistema de validacao deterministica de TTK (Time-to-Kill) para balanceamento de combate em RPG Maker MZ**

[![Status](https://img.shields.io/badge/status-in--development-blue)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)]()
[![Node.js](https://img.shields.io/badge/Node.js-%3E=20-green)]()
[![Tests](https://img.shields.io/badge/tests-501%20passing-brightgreen)]()

## Visao Geral

O Coreto Game Engine e um wrapper read-only sobre projetos RPG Maker MZ que executa batalhas reais em modo headless para medir Time-to-Kill (TTK) e validar balanceamento de combate. Reduz o ciclo de validacao de **2-3 dias** para **<=10 minutos**.

### Caracteristicas Principais

- **Read-Only**: Nunca modifica o projeto RPG Maker MZ (ADR-001)
- **Headless Execution**: Executa batalhas reais via engine em JSDOM
- **Deterministic**: Seed fixa garante reprodutibilidade (ADR-018)
- **Detailed Reports**: Gera relatorios JSON com metricas e warnings
- **Type-Safe**: TypeScript strict mode com Zod validation

## Status do Projeto

**FASE 4/9 CONCLUIDA - 17/37 tasks implementadas**

| Fase | Descricao | Status | Testes |
|------|-----------|--------|--------|
| FASE 1 | Foundation | Completa | 86+ |
| FASE 2 | Core Domain | Completa | 324 |
| FASE 3 | Config & CLI | Completa | 439 |
| FASE 4 | Data Loading | Completa | 501 |
| FASE 5 | Headless Runtime | Pendente | - |
| FASE 6 | Simulation Core | Pendente | - |
| FASE 7 | Reporter & Warnings | Pendente | - |
| FASE 8 | CLI Commands | Pendente | - |
| FASE 9 | Polish & Docs | Pendente | - |

### O que esta implementado

- **DI Container**: TSyringe com tokens tipados
- **Clean Architecture**: Domain, Ports, Use Cases, Infrastructure
- **CLI Base**: Oclif framework configurado
- **Config Validation**: Zod schemas com path sanitization
- **Data Loading**: Carregamento completo de DB do RPG Maker MZ
- **Security**: PathSanitizer + ReadOnlyGuard (ADR-001)
- **501 testes passando** com TypeScript strict mode

## Instalacao

```bash
# Clone o repositorio
git clone <repo-url>
cd game-engine

# Instale dependencias
npm install

# Verifique a instalacao
npm test
npm run type-check
```

## Comandos Disponiveis

```bash
# Desenvolvimento
npm run dev          # Watch mode com tsx
npm run build        # Compilar TypeScript
npm run type-check   # Verificar tipos

# Testes
npm test             # Rodar todos os testes
npm run test:watch   # Testes em watch mode
npm run test:coverage # Testes com coverage

# Qualidade
npm run lint         # ESLint
npm run format       # Prettier

# CLI (apos build)
npx coreto-engine hello --name=World
```

## Estrutura do Projeto

```
game-engine/
├── src/
│   ├── cli/                    # Oclif CLI commands
│   │   └── commands/           # hello.ts (implementado)
│   ├── core/
│   │   ├── domain/             # Entities e Value Objects
│   │   ├── errors/             # Domain exceptions
│   │   ├── ports/              # Interfaces (IDataLoader, IConfigLoader, etc)
│   │   └── use-cases/          # ExecuteBattle, ValidateTrecho, GenerateReport
│   ├── infrastructure/
│   │   ├── adapters/
│   │   │   ├── data/           # RmmzDataLoader, IntegrityValidator
│   │   │   ├── filesystem/     # NodeFileSystem
│   │   │   └── logger/         # ConsoleLogger
│   │   ├── config/             # ZodConfigLoader, Zod schemas
│   │   ├── di/                 # TSyringe container e tokens
│   │   └── security/           # PathSanitizer, ReadOnlyGuard
│   └── types/                  # rmmz-data.ts (tipos RPG Maker MZ)
├── tests/
│   ├── unit/                   # Testes unitarios
│   ├── integration/            # Testes de integracao
│   └── fixtures/               # Sample data RPG Maker MZ
├── docs/
│   ├── adrs/                   # 31 ADRs
│   ├── hld-coreto-game-engine.md
│   └── PRD_*.md
└── planos/                     # Task tracking
```

## Configuracao (project.config.json)

```json
{
  "projectPath": "/path/to/rpg-maker-mz/project",
  "seed": 12345,
  "trechos": [
    {
      "id": "ato1-nivel1-10",
      "name": "Prologo e Mundo Comum",
      "anchorLevelRange": { "min": 1, "max": 10 },
      "ttkTarget": { "turns": 3, "actions": 4 },
      "tolerance": 0.15,
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

## Arquitetura

### Pipeline de Execucao (Top-Down)

```
CLI Layer (Oclif)
  |
Config Layer (Zod validation)
  |
Loader Layer (fs.readFileSync + ID validation)
  |
Headless Runtime (JSDOM + mocks) [pendente]
  |
Simulation Layer (BattleManager + TTK) [pendente]
  |
Reporter Layer (report.json) [pendente]
```

### Decisoes Arquiteturais Chave

| ADR | Decisao |
|-----|---------|
| ADR-001 | Wrapper Read-Only - nunca escreve no projeto MZ |
| ADR-003 | Fidelidade via batalha real (BattleManager) |
| ADR-008 | Zod para validacao de schemas |
| ADR-013 | Warnings em vez de exceptions para validacao |
| ADR-016 | Loading sincrono (fs.readFileSync) |
| ADR-018 | Determinismo com seed fixa |
| ADR-028 | TypeScript como linguagem primaria |

[Ver todas as 31 ADRs](docs/adrs/INDEX.md)

## Tech Stack

| Categoria | Tecnologia |
|-----------|------------|
| Language | TypeScript 5.x (strict mode) |
| Runtime | Node.js >= 20 |
| CLI | Oclif v4 |
| Validation | Zod 3.x |
| DI | TSyringe |
| Testing | Jest + ts-jest |
| DOM | JSDOM (headless) |

## Documentacao

| Documento | Descricao |
|-----------|-----------|
| [PRD](docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md) | Requisitos do produto |
| [HLD](docs/hld-coreto-game-engine.md) | Design de alto nivel |
| [ADRs](docs/adrs/INDEX.md) | 31 decisoes arquiteturais |
| [CLAUDE.md](CLAUDE.md) | Guia para Claude Code |
| [Tasks](planos/002-implementacao-mvp/tasks/tasks.md) | Tracking de implementacao |

## Proximos Passos

**FASE 5: Headless Runtime**

- JSDOM Setup + HeadlessRuntimeBootstrapper
- PIXI/Graphics/Effekseer/AudioManager Mocks
- Core Scripts Loader (rmmz_core.js)
- SyncWarpLoop para execucao de alta velocidade

## Contribuindo

```bash
# Workflow
npm install          # Setup
npm run dev          # Desenvolvimento
npm test             # Validar mudancas
npm run type-check   # Verificar tipos
npm run lint         # Qualidade

# Commits (Conventional Commits)
feat(simulation): implement TTK measurement
fix(loader): validate troopId existence
docs(adr): add ADR-032 for new feature
```

---

**Ultima Atualizacao**: 2026-01-04
**Fase Atual**: FASE 4 Concluida - Data Loading
**Testes**: 501 passing + 6 skipped
