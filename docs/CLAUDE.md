# Docs Navigation Guide

## Quick Start

**Primary Entry Point:** `adrs/INDEX.md` - Complete index of 32 ADRs with cross-references

## Structure

```
docs/
├── PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md  # Product requirements
├── hld-coreto-game-engine.md                             # High-level design
├── planilhaMestraSoftware.md                             # Balance spreadsheet spec
├── adrs/                                                 # Architecture Decision Records
│   ├── INDEX.md                                          # START HERE - Full ADR index
│   ├── README.md                                         # ADR process guide
│   ├── {MODULE}/ADR-{N}-{name}.md                       # 32 ADRs in 8 modules
│   └── potential-adrs/                                   # ADR workflow artifacts
├── pesquisas/                                            # Research docs (Electron, CLI, headless)
└── plugins-visustella/                                   # VisuStella plugin specs
```

## Find Information

- **Architecture decisions** → `adrs/INDEX.md` (32 ADRs by module)
- **Requirements** → `PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md`
- **System design** → `hld-coreto-game-engine.md`
- **Tech research** → `pesquisas/{topic}.md`
- **Plugin specs** → `plugins-visustella/visuMZ{Plugin}_paraPlanilhaMestraSoftware.md`
