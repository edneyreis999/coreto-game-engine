# Coreto Game Engine

**Sistema de validacao deterministica de TTK (Time-to-Kill) para balanceamento de combate em RPG Maker MZ**

[![Status](https://img.shields.io/badge/status-in--development-blue)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)]()
[![Node.js](https://img.shields.io/badge/Node.js-%3E=20-green)]()
[![Tests](https://img.shields.io/badge/tests-523%20passing-brightgreen)]()

## Visao Geral

O Coreto Game Engine e um wrapper read-only sobre projetos RPG Maker MZ que executa batalhas reais em modo headless para medir Time-to-Kill (TTK) e validar balanceamento de combate.

### Caracteristicas Principais

- **Read-Only**: Nunca modifica o projeto RPG Maker MZ (ADR-001)
- **Headless Execution**: Executa batalhas reais via engine em JSDOM
- **Deterministic**: Seed fixa garante reprodutibilidade (ADR-018)
- **Type-Safe**: TypeScript strict mode com Zod validation

## Status do Projeto

**FASE 4/9 CONCLUIDA - 523 testes passando**

| Fase | Descricao | Status |
|------|-----------|--------|
| FASE 1-4 | Foundation, Core, Config, Data Loading | ✅ Completa |
| FASE 5-9 | Headless Runtime, Simulation, Reporter | Pendente |

### Funcionalidades Implementadas

- Validacao de estrutura de projetos RPG Maker MZ
- Carregamento completo do database (10 arquivos JSON)
- Validacao de referencias cruzadas (enemies, skills, classes)
- Protecao contra path traversal
- CLI base com Oclif

## Instalacao

```bash
npm install
npm run build
npm test
```

## Comandos

```bash
# Validar projeto RPG Maker MZ
npm run validate -- /caminho/para/projeto

# Desenvolvimento
npm run dev           # Watch mode
npm run build         # Compilar
npm run type-check    # Verificar tipos

# Testes
npm test              # Todos os testes
npm test -- tests/qa/ # Testes QA

# CLI
npx coreto-engine hello --name=World
```

## Validar Projeto Real

```bash
npm run validate -- /Users/edney/projects/coreto/projectX/frontend
```

Saida esperada:
```
🎮 CORETO GAME ENGINE - Validacao de Projeto

1️⃣  Validando estrutura do projeto...
   ✅ Estrutura valida: true

2️⃣  Carregando database...
   ✅ Database carregado com sucesso!
   📊 Classes: 8 | Skills: 235 | Enemies: 100 | Troops: 30

3️⃣  Validando integridade das referencias...
   ✅ Nenhum problema encontrado!
```

## Estrutura

```
game-engine/
├── src/
│   ├── cli/commands/          # Oclif commands
│   ├── core/
│   │   ├── domain/            # Entities, Value Objects
│   │   ├── errors/            # Domain exceptions
│   │   ├── ports/             # Interfaces
│   │   └── use-cases/         # Business logic
│   └── infrastructure/
│       ├── adapters/data/     # RmmzDataLoader
│       ├── config/            # Zod schemas
│       └── security/          # PathSanitizer
├── scripts/
│   └── validate-project.mts   # CLI de validacao
├── tests/
│   ├── unit/
│   ├── integration/
│   └── qa/                    # Testes manuais
└── docs/
    ├── adrs/                  # 31 ADRs
    └── hld-coreto-game-engine.md
```

## Configuracao (project.config.json)

```json
{
  "projectPath": "/path/to/rpg-maker-mz/project",
  "seed": 12345,
  "trechos": [
    {
      "id": "ato1-nivel1-10",
      "anchorLevelRange": { "min": 1, "max": 10 },
      "ttkTarget": { "turns": 3, "actions": 4 },
      "tolerance": 0.15,
      "troopIds": [1, 2, 3],
      "party": {
        "members": [{ "classId": 1, "level": 5 }]
      }
    }
  ]
}
```

## Arquitetura

```
CLI Layer (Oclif)
  ↓
Config Layer (Zod validation)
  ↓
Loader Layer (fs.readFileSync)
  ↓
Headless Runtime [pendente]
  ↓
Simulation Layer [pendente]
  ↓
Reporter Layer [pendente]
```

### ADRs Principais

| ADR | Decisao |
|-----|---------|
| ADR-001 | Wrapper Read-Only |
| ADR-003 | Batalha real (BattleManager) |
| ADR-008 | Zod para validacao |
| ADR-018 | Determinismo com seed |

[Ver 31 ADRs](docs/adrs/INDEX.md)

## Tech Stack

| Categoria | Tecnologia |
|-----------|------------|
| Language | TypeScript 5.x (strict) |
| Runtime | Node.js >= 20 |
| CLI | Oclif v4 |
| Validation | Zod 3.x |
| DI | TSyringe |
| Testing | Jest |

## Documentacao

- [PRD](docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md)
- [HLD](docs/hld-coreto-game-engine.md)
- [ADRs](docs/adrs/INDEX.md)
- [QA Guide](tests/qa/MANUAL_QA_GUIDE.md)

## Proximos Passos

**FASE 5: Headless Runtime**
- JSDOM + PIXI/Graphics mocks
- Core Scripts Loader
- BattleManager execution

---

**Ultima Atualizacao**: 2026-01-04 | **Testes**: 523 passing
