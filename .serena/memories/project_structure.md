# Project Structure

## Current Directory Layout

```
game-engine/
├── .serena/                    # Serena MCP configuration
│   ├── memories/              # Project memories
│   ├── project.yml            # Serena project config
│   └── .gitignore
├── .claude/                    # Claude Code configuration (gitignored)
├── docs/                       # Comprehensive documentation
│   ├── adrs/                  # Architecture Decision Records (28 ADRs)
│   │   ├── CLI/              # 1 ADR - Command-line interface
│   │   ├── CONFIG/           # 3 ADRs - Configuration, validation
│   │   ├── DOCS/             # 4 ADRs - Documentation standards
│   │   ├── FOUNDATION/       # 3 ADRs - Core principles
│   │   ├── REPORTER/         # 4 ADRs - Report generation
│   │   ├── RUNTIME/          # 6 ADRs - Headless runtime
│   │   ├── SIMULATION/       # 7 ADRs - Battle simulation
│   │   ├── INDEX.md          # Complete index with cross-references
│   │   └── README.md         # ADRs overview
│   ├── pesquisas/            # Research documents
│   │   ├── Balanceamento Determinístico RPG Maker MZ.md
│   │   ├── RPG-Maker-MZ_Design-Combate.md
│   │   ├── Arquitetura CLI Node.js RPG Maker MZ.md
│   │   └── formatjson/
│   ├── plugins-visustella/   # VisuStella plugin documentation
│   ├── PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md
│   ├── hld-coreto-game-engine.md
│   └── planilhaMestraSoftware.md
├── planos/                    # Project plans (gitignored)
├── .gitignore
└── setup-claude-symlink.sh

```

## Planned Implementation Structure (Not Yet Created)

Based on HLD documentation, future structure will be:

```
game-engine/
├── src/                       # Source code (TypeScript)
│   ├── cli/                  # CLI Layer
│   ├── config/               # Config Layer
│   ├── loader/               # Loader Layer
│   ├── runtime/              # Headless Runtime
│   │   ├── mocks/           # PIXI, Graphics, Effekseer mocks
│   │   └── setup/
│   ├── simulation/           # Simulation Layer
│   ├── reporter/             # Reporter Layer
│   └── exporter/             # AI Exporter Layer
├── tests/                     # Jest tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── config/                    # Configuration templates
│   └── project.config.json.example
├── report/                    # Generated reports (not versioned)
│   ├── report.json
│   └── context/              # AI-friendly exports
│       ├── skills/
│       ├── enemies/
│       └── troops/
├── package.json
├── tsconfig.json
├── jest.config.js
├── .eslintrc.js
└── .prettierrc
```

## Documentation Organization

**Three-Layer Architecture** (ADR-010):

1. **Strategic Layer**: PRD, HLD - High-level vision
2. **Tactical Layer**: ADRs - Architectural decisions
3. **Operational Layer**: Code comments, API docs - Implementation details

## Key Files (Existing)

- `docs/hld-coreto-game-engine.md`: Complete high-level design (1638 lines)
- `docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md`: Product requirements
- `docs/adrs/INDEX.md`: Complete ADR index with cross-references

## Git Ignore Patterns

- `.claude/` - Claude Code config (local only)
- `planos/` - Project plans (local only)
- `.DS_Store` - macOS system files
