# Codebase Architecture Mapping

**Project:** coreto game-engine
**Date:** 2026-01-04
**Analysis Type:** Phase 1 - Initial Codebase Mapping

---

## Project Overview

**Name:** coreto game-engine
**Purpose:** Deterministic TTK (Time-to-Kill) validation wrapper for RPG Maker MZ combat balancing
**Type:** Node.js CLI tool (planned MVP v1)
**Current State:** Documentation and planning phase - no implementation code yet
**Primary Language:** Not yet implemented (planned: TypeScript/JavaScript)
**Framework:** Planned Node.js with Jest testing framework

---

## Technology Stack

### Core Technologies (Planned)
- **Runtime:** Node.js
- **Language:** TypeScript/JavaScript
- **Testing:** Jest + JSDOM
- **CLI Framework:** Commander.js or Yargs (proposed)
- **Validation:** Zod or Joi (proposed)
- **File System:** Node.js fs module

### Target Platform Integration
- **RPG Maker MZ:** Read-only integration
- **VisuStella MZ Plugins:** Battle Core, Element Status Core, Skills States Core
- **Effekseer:** Particle effects engine (requires mocking)
- **PIXI.js:** Graphics rendering library (requires mocking)

### Development Tools
- **Build Tool:** Not yet determined
- **Version Control:** Git
- **Package Manager:** npm (assumed)

---

## Context Notes

**Analysis Source:** Documentation-only codebase. No implementation files found beyond a single sample JS file for JSON formatting.

### Key Insights from Documentation

#### Architectural Patterns Documented

1. **Wrapper Read-Only Pattern (ADR-001)**
   - The system operates as an external wrapper over RPG Maker MZ
   - Never writes to the MZ project's `data/` directory
   - All game data modifications remain in the MZ Editor
   - Wrapper only reads, validates, and reports

2. **Anchor-Based Design Pattern**
   - Combat balancing uses sparse "anchor points" (key levels: 1, 10, 15, 20, 25, 30)
   - Mathematical interpolation fills gaps between anchors
   - Deterministic curve generation (linear, geometric, logistic sigmoid)

3. **Headless Simulation Architecture**
   - Runs RPG Maker MZ battle engine in Node.js via JSDOM
   - Mocks rendering dependencies (PIXI, Effekseer, Graphics, Canvas)
   - Executes real battles without UI for TTK measurement

4. **Pipeline Sequential Processing**
   - Unidirectional data flow: Config → Loader → Runtime → Simulation → Reporter
   - No feedback loops or bidirectional sync
   - CI-ready automated validation

#### Business Domains Identified

1. **Game Design Domain**
   - Character progression (levels 1-30 for Act 1)
   - Combat balancing (TTK targets per encounter tier)
   - Party composition (5 character classes with Ragnarok Online inspiration)
   - Enemy scaling by story beats

2. **Validation Domain**
   - Deterministic battle simulation
   - TTK measurement (in turns and actions)
   - Formula verification (damage calculations)
   - Warning/anomaly detection

3. **Reporting Domain**
   - JSON report generation
   - Aggregated metrics (average, p95 TTK)
   - AI context export (splitting large JSON files)

#### Technologies Documented vs. Implementation Gap

| Component | Documented | Found in Code | Status |
|-----------|------------|---------------|--------|
| Node.js wrapper | ✅ Extensively | ❌ Not started | Planning phase |
| Jest testing | ✅ Detailed specs | ❌ Not started | Planning phase |
| JSDOM mocks | ✅ Mock strategies | ❌ Not started | Planning phase |
| CLI interface | ✅ Command design | ❌ Not started | Planning phase |
| Config layer | ✅ Schema defined | ❌ Not started | Planning phase |
| RPG Maker MZ | ✅ Target platform | N/A (external) | Integration target |
| VisuStella plugins | ✅ Reverse engineering docs | N/A (external) | Integration target |

#### Critical Findings

**Discrepancies:**
- **Documentation is comprehensive but implementation is absent**: This is a greenfield project in planning stage
- **External dependencies not present**: RPG Maker MZ project must be pointed to via config (documented as `/Users/edney/projects/coreto/projectX/frontend`)
- **Research is thorough**: 35KB+ research document on headless testing architecture exists

**Risks Documented:**
1. **High probability:** Headless runtime incompatibility with VisuStella plugins
2. **Medium probability:** Simulation divergence from actual game behavior
3. **Medium probability:** Performance exceeding 10-minute target
4. **Medium probability:** New VisuStella plugins affecting battles
5. **Medium probability:** High maintenance cost for mocking layer

---

## System Modules

### Module Index

**Current State:** Documentation defines 7 architectural layers. No code modules exist yet.

1. **CLI** - Command-line Interface Layer (Planned)
2. **CONFIG** - Configuration and Validation Layer (Planned)
3. **LOADER** - RPG Maker MZ Data Loader (Planned)
4. **RUNTIME** - Headless Runtime Environment (Planned)
5. **SIMULATION** - Battle Simulation Engine (Planned)
6. **REPORTER** - Report Generation Layer (Planned)
7. **EXPORTER** - AI Context Exporter (Planned)
8. **DOCS** - Documentation Module (Current)

---

### CLI: Command-Line Interface Layer

**Purpose:** Entry point for all user interactions with the validation tool

**Location:** Not yet implemented (planned: `src/cli/` or `cli.js`)

**Key Components:**
- Argument parser (`--config`, `--seed`, `--trecho`, `--verbose`, `--diagnostic`)
- Command orchestrator (`run-ttk`, `export-context`)
- Progress display
- Exit code management

**Technologies:**
- Proposed: Commander.js or Yargs
- Node.js

**Dependencies:**
- Internal: CONFIG, LOADER, SIMULATION, REPORTER, EXPORTER
- External: None

**Patterns:**
- Command pattern for CLI commands
- Facade pattern for simplifying subsystem access

**Key Files:** None (not implemented)

**Scope:** Small (estimated 3-5 files when implemented)

---

### CONFIG: Configuration and Validation Layer

**Purpose:** Load, parse, and validate project configuration and trecho definitions

**Location:** Not yet implemented (planned: `src/config/`)

**Key Components:**
- `project.config.json` schema validator
- Trecho (game section) configuration parser
- Anchor-level range definitions
- TTK target and tolerance settings
- Seed management with CLI override

**Technologies:**
- Proposed: Zod or Joi for schema validation
- JSON parsing (native Node.js)

**Dependencies:**
- Internal: None (base layer)
- External: Validation library (Zod/Joi)

**Patterns:**
- Builder pattern for configuration construction
- Validator pattern for schema enforcement
- Singleton for global config access (optional)

**Data Model (Documented):**
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

**Key Files:** None (not implemented)

**Scope:** Small (estimated 4-6 files when implemented)

---

### LOADER: RPG Maker MZ Data Loader

**Purpose:** Validate RPG Maker MZ project structure and load game data JSON files

**Location:** Not yet implemented (planned: `src/loader/`)

**Key Components:**
- Project structure validator (checks for `game.rmmzproject`, `data/` folder)
- Synchronous JSON loaders for:
  - `Classes.json` (character progression data)
  - `Enemies.json` (enemy statistics)
  - `Troops.json` (enemy group compositions)
  - `Skills.json` (abilities and formulas)
- ID existence validators (troopIds, enemyIds, skillIds, classIds)
- Warning generator for inconsistencies

**Technologies:**
- Node.js `fs` module (readFileSync, existsSync, statSync)
- JSON schema validation

**Dependencies:**
- Internal: CONFIG (for projectPath)
- External: RPG Maker MZ project (read-only access)

**Patterns:**
- Repository pattern for data access abstraction
- Factory pattern for creating data objects
- Null object pattern for missing data handling

**Critical Data Structures (RPG Maker MZ):**

**Classes.json:**
- `params`: 8 arrays × 100 positions (HP, MP, ATK, DEF, MAT, MDF, AGI, LUK for levels 0-99)
- `learnings`: Skills unlocked by level
- `traits`: Character modifiers

**Skills.json:**
- `damage.formula`: JavaScript expressions (e.g., `a.atk * 4 - b.def * 2`)
- `mpCost`, `tpCost`: Resource costs
- `effects`: Stat modifications and buffs

**Enemies.json:**
- `params`: Fixed 8-value array (not level-scaled)
- `actions`: AI behavior and skill choices

**Troops.json:**
- `members`: Array of enemy instances with positioning
- `pages`: Battle events (not priority for MVP)

**Key Files:** None (not implemented)

**Scope:** Medium (estimated 8-12 files when implemented)

---

### RUNTIME: Headless Runtime Environment

**Purpose:** Create JSDOM environment to run RPG Maker MZ battle engine without browser/UI

**Location:** Not yet implemented (planned: `src/runtime/` or `tests/setup/`)

**Key Components:**
- JSDOM setup and initialization
- PIXI.js mock (Container, Sprite stubs)
- Graphics mock (initialize, render, frameCount)
- Effekseer mock (initRuntime, update, release - WASM blocker)
- AudioManager mock
- Canvas mock (using jest-canvas-mock)
- Synchronous database loader override (replaces XMLHttpRequest)
- RPG Maker MZ core script loader:
  - `rmmz_core.js`
  - `rmmz_managers.js`
  - `rmmz_objects.js`
- VisuStella plugin loader (if present):
  - `VisuMZ_0_CoreEngine`
  - `VisuMZ_1_BattleCore`
  - `VisuMZ_ElementStatusCore`
  - `VisuMZ_SkillsStatesCore`

**Technologies:**
- JSDOM (browser environment emulation)
- jest-canvas-mock (Canvas API stubs)
- Custom mock implementations

**Dependencies:**
- Internal: LOADER (for database injection)
- External: RPG Maker MZ scripts, VisuStella plugins

**Patterns:**
- Adapter pattern (adapting browser APIs to Node.js)
- Proxy pattern (intercepting engine calls)
- Mock object pattern (replacing graphics/audio systems)

**Critical Challenge (Documented):**
> "The VisuStella plugins are obfuscated and treat the system as a black box. We control inputs (parameters, notetags) and verify outputs (behavior in tests), but cannot read internal logic."

**Test Handlers Priority (From Research):**
1. JSDOM initialization
2. PIXI Container/Sprite mocks
3. Graphics mock
4. Effekseer mock (WASM loading blocker)
5. Synchronous database loading via fs.readFileSync

**Key Files:** None (not implemented)

**Scope:** Large (estimated 15-20 files when implemented due to mock complexity)

---

### SIMULATION: Battle Simulation Engine

**Purpose:** Execute battles via RPG Maker MZ BattleManager, measure TTK deterministically

**Location:** Not yet implemented (planned: `src/simulation/`)

**Key Components:**
- BattleManager integration wrapper
- Party configuration (classId + level → derive unlocked skills via `learnings`)
- Troop configuration (enemyId mapping to `Troops.json`)
- Turn loop executor (until victory/defeat/timeout)
- Skill selection AI:
  - MVP v1: Choose skill with highest expected damage per action
  - Filter by HP/MP cost only (ignore TP, cooldowns in v1)
- Seed control for deterministic RNG (Math.random override)
- Turn/action logger
- TTK calculator (in turns and in actions)
- Target vs. tolerance comparator

**Technologies:**
- RPG Maker MZ battle engine (BattleManager, Game_Action, Game_Actor, Game_Enemy)
- Custom simulation logic

**Dependencies:**
- Internal: RUNTIME (requires initialized headless environment)
- External: RPG Maker MZ core, VisuStella BattleCore

**Patterns:**
- Strategy pattern (different skill selection strategies)
- State pattern (battle state machine)
- Observer pattern (turn/action event logging)
- Command pattern (action execution)

**Mathematical Foundation (From Research):**
- **TTK (Time to Kill):** Number of turns or actions to defeat enemies
- **EHP (Effective HP):** `HP / (1 - Mitigation%)` for percentage-based defense
- **Expected Damage:** `(BaseDmg × (1 - P_crit - P_miss)) + (CritDmg × P_crit) + (0 × P_miss)`
- **Determinism:** Seed-controlled RNG for reproducible results

**Skill Selection Algorithm (MVP v1 - Documented):**
```
For each party member's turn:
  1. List unlocked skills (from Classes.learnings where level ≤ member.level)
  2. Filter skills: Remove if HP < skill.hpCost OR MP < skill.mpCost
  3. For remaining skills, calculate expected damage per action
  4. Select skill with highest expected damage
  5. Execute via Game_Action.apply()
```

**Key Files:** None (not implemented)

**Scope:** Large (estimated 12-18 files when implemented)

---

### REPORTER: Report Generation Layer

**Purpose:** Collect simulation results, calculate aggregates, generate `report/report.json`

**Location:** Not yet implemented (planned: `src/reporter/`)

**Key Components:**
- Result collector (all battle outcomes)
- Aggregate calculator per trecho:
  - Average TTK (turns and actions)
  - Median (p50)
  - 95th percentile (p95)
  - Max TTK
- Warning generator:
  - `ttk_out_of_tolerance`
  - `troop_not_found`
  - `enemy_not_found`
  - `skill_formula_error`
  - `battle_timeout`
- Success rate calculator (% troops within tolerance)
- JSON serializer (report.json structure)
- Directory manager (create `report/` if needed)

**Technologies:**
- Node.js fs module (writeFileSync)
- JSON serialization

**Dependencies:**
- Internal: SIMULATION (consumes battle results)
- External: None

**Patterns:**
- Builder pattern (constructing complex report structure)
- Strategy pattern (different aggregation strategies)
- Template method pattern (report structure template)

**Report Structure (Documented):**
```json
{
  "timestamp": "ISO-8601",
  "seed": 12345,
  "projectPath": "/path/to/project",
  "summary": {
    "executionTimeMs": 589432,
    "totalTrechos": 6,
    "totalBattles": 48,
    "totalWarnings": 3,
    "warningsByType": {
      "ttk_out_of_tolerance": 2,
      "troop_not_found": 1
    },
    "successRate": 93.75,
    "peakMemoryMB": 1024
  },
  "trechos": [
    {
      "trechoId": "ato1-nivel1-10",
      "executionTimeMs": 45230,
      "results": [ /* per-troop results */ ],
      "aggregates": {
        "avgTtkTurns": 3.2,
        "p95TtkTurns": 4
      },
      "warnings": [ /* warning objects */ ]
    }
  ]
}
```

**Key Files:** None (not implemented)

**Scope:** Medium (estimated 6-10 files when implemented)

---

### EXPORTER: AI Context Exporter

**Purpose:** Split large RPG Maker MZ JSON files into smaller files for AI tool consumption

**Location:** Not yet implemented (planned: `src/exporter/`)

**Key Components:**
- Large JSON file splitter
- Entity-per-file generator:
  - `report/context/skills/skill-{id}.json`
  - `report/context/enemies/enemy-{id}.json`
  - `report/context/troops/troop-{id}.json`
  - `report/context/classes/class-{id}.json`
- Optional ID filter (export only IDs used in configured trechos)
- Directory structure organizer

**Technologies:**
- Node.js fs module
- JSON manipulation

**Dependencies:**
- Internal: LOADER (for accessing loaded data)
- External: None

**Patterns:**
- Iterator pattern (traversing large JSON arrays)
- Visitor pattern (processing each entity type)
- Factory pattern (creating individual entity files)

**Use Case (Documented):**
> "The RPG Maker MZ database is large and difficult to use as context in AI, causing rework and errors in analysis. Splitting into smaller files makes it easier to provide relevant context to AI tools."

**Key Files:** None (not implemented)

**Scope:** Small (estimated 3-5 files when implemented)

---

### DOCS: Documentation Module

**Purpose:** Contains all project documentation, research, and planning artifacts

**Location:** `/Users/edney/projects/coreto/game-engine/docs/`

**Key Components:**
- **PRD (Product Requirements Document):** `PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md` (21KB)
- **HLD (High-Level Design):** `hld-coreto-game-engine.md` (85KB)
- **Planning Mestra Software:** `planilhaMestraSoftware.md` (5KB)
- **Research Documents:**
  - `pesquisas/Balanceamento Determinístico RPG Maker MZ.md` (35KB - comprehensive technical research)
  - `pesquisas/RPG-Maker-MZ_Design-Combate.md` (28KB)
  - `pesquisas/Software-Similar-Planilha-Mestra.md` (5KB)
- **VisuStella Plugin Documentation:**
  - `plugins-visustella/visuMZBattleCore_paraPlanilhaMestraSoftware.md`
  - `plugins-visustella/visuMZElementStatusCore_paraPlanilhaMestraSoftware.md`
  - `plugins-visustella/visuMZSkillsStatesCore_paraPlanilhaMestraSoftware.md`
- **Utility Scripts:**
  - `pesquisas/formatjson/TS_Pretty_JSON.js` (JSON formatter plugin)
  - `pesquisas/formatjson/TS_Pretty_JSON.md` (formatter docs)

**Technologies:**
- Markdown documentation
- JavaScript (single utility script)

**Dependencies:**
- None (documentation is standalone)

**Patterns:**
- Documentation as code (versioned in Git)
- Living documentation (intended to evolve with implementation)

**Documentation Quality Assessment:**
- **PRD:** ✅ Excellent - Comprehensive functional requirements with acceptance criteria
- **HLD:** ✅ Excellent - Detailed architecture with data models, security, observability
- **Research:** ✅ Exceptional - 35KB of academic-quality analysis with 41 cited sources
- **Plugin Docs:** ⚠️ Not reviewed (VisuStella-specific)

**Key Files:**
1. `/Users/edney/projects/coreto/game-engine/docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md` - Requirements
2. `/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md` - Architecture
3. `/Users/edney/projects/coreto/game-engine/docs/planilhaMestraSoftware.md` - Planning summary
4. `/Users/edney/projects/coreto/game-engine/docs/pesquisas/Balanceamento Determinístico RPG Maker MZ.md` - Technical research

**Scope:** Medium (8 markdown files, 1 JS utility, ~200KB total documentation)

---

## Cross-Cutting Concerns

### Infrastructure

**Planned Approach:**
- **Local execution only** (no server/cloud infrastructure in MVP v1)
- **No Docker** (direct Node.js execution)
- **No CI/CD** in MVP v1 (planned for post-MVP)
- **File-based configuration** (`project.config.json`)
- **File-based output** (`report/report.json`, `report/context/`)

**Deployment Model:**
- Installed as local Node.js CLI tool
- Points to external RPG Maker MZ project via config
- Runs on developer/designer workstation

**Performance Targets (Documented):**
- **Execution time:** ≤ 10 minutes for all trechos (excluding bosses)
- **Time per battle:** < 3 seconds (assuming ~200 battles total)
- **Memory usage:** < 2GB RAM
- **Failure tolerance:** < 5% of troops may fail without blocking execution

---

### Authentication & Authorization

**Not Applicable:** Local tool with no network access or user management.

**Access Control:**
- **Read access:** Tool needs read access to RPG Maker MZ project directory
- **Write access:** Tool needs write access to `report/` directory only
- **Security posture:** Read-only enforcement prevents accidental corruption of game data

---

### Data Layer

**RPG Maker MZ Database (External, Read-Only):**

**Source of Truth:** RPG Maker MZ Editor (`/Users/edney/projects/coreto/projectX/frontend/`)

**File Structure:**
```
projectX/frontend/
  ├── game.rmmzproject          # Project marker file
  ├── data/
  │   ├── Classes.json          # Character progression (8×100 stat arrays)
  │   ├── Skills.json           # Abilities with damage formulas
  │   ├── Enemies.json          # Enemy statistics (fixed 8 params)
  │   ├── Troops.json           # Enemy group compositions
  │   └── System.json           # Game settings (optional read)
  └── js/
      ├── plugins.js            # VisuStella plugin configurations
      ├── libs/
      │   ├── rmmz_core.js      # Engine core
      │   ├── rmmz_managers.js  # Battle/data managers
      │   └── rmmz_objects.js   # Game objects
      └── plugins/
          ├── VisuMZ_0_CoreEngine.js
          ├── VisuMZ_1_BattleCore.js
          └── (other VisuStella plugins)
```

**Data Integrity:**
- **Validation strategy:** Wrapper validates ID references before simulation
- **Error handling:** Generate warnings for missing IDs, don't crash
- **Determinism:** All simulations use seeded RNG for reproducibility

**Internal Data (Generated, Ephemeral):**
- `report/report.json` - Simulation results (overwritten each run)
- `report/context/` - AI-friendly split JSON files (regenerated on demand)

---

### API Layer

**Not Applicable:** No REST/GraphQL API. This is a CLI tool.

**Interface Type:** Command-line arguments and flags

**Commands (Planned):**
```bash
# Run TTK validation
node cli.js run-ttk --config project.config.json [--seed 12345] [--trecho id]

# Export context for AI
node cli.js export-context --config project.config.json [--filter-trechos]
```

---

### External Integrations

#### RPG Maker MZ (Read-Only Integration)

**Type:** File system read access
**Purpose:** Load game data for validation
**Technology:** Node.js fs.readFileSync
**Data Format:** JSON (proprietary schema)
**Criticality:** CRITICAL - core dependency
**Error Handling:** Fail-fast if project structure invalid

**Integration Points:**
- Validate `game.rmmzproject` existence
- Read `data/*.json` files
- Optionally parse `js/plugins.js` for VisuStella configs

**Constraints:**
- NEVER write to RPG Maker MZ project directory
- Preserve all metadata (names, graphics references)
- Only extract numerical balancing data

---

#### VisuStella MZ Plugins (Black-Box Integration)

**Type:** Runtime behavior emulation
**Purpose:** Replicate plugin behavior in headless environment
**Technology:** JSDOM + mocking
**Criticality:** HIGH - affects TTK accuracy

**Integration Strategy (Documented):**
> "Treat VisuStella as a Black Box API. Control inputs (parameters, notetags) rigorously. Verify outputs (behavior) through testing. Cannot read internal obfuscated logic."

**Known Plugins:**
1. **VisuMZ_0_CoreEngine** - Engine enhancements
2. **VisuMZ_1_BattleCore** - Combat system overhaul
3. **VisuMZ_ElementStatusCore** - Element/status mechanics
4. **VisuMZ_SkillsStatesCore** - Skill/state management

**Risk (High Priority from HLD Section 10.1):**
> "Harness headless incompatible with plugins or updates: Alta probability, Bloqueio impact"

**Mitigation Strategy:**
- Implement base mocks following research document priorities
- Isolate mocks in separate modules for easy updates
- Create diagnostic mode (`--diagnostic`) for debug
- Maintain list of supported plugin versions

---

## Architectural Decisions (Documented)

The project documentation includes explicit ADRs in the HLD. These are captured here for mapping completeness:

### ADR-001: Wrapper Read-Only Pattern
- **Status:** Decided
- **Decision:** Never write to RPG Maker MZ `data/` directory in MVP v1
- **Rationale:** Prevent data corruption, maintain editor as source of truth
- **Consequence:** Manual workflow (edit in MZ → run validation) required

### ADR-002: Skill Progression - Automatic vs. Manual
- **Status:** MVP v1 Automatic, Future Manual
- **Decision:** Derive skills from `Classes.learnings` by level in MVP
- **Future:** Allow explicit `skillIds` array per party member
- **Rationale:** Simplicity now, flexibility later (for shop-purchased skills)

### ADR-003: Fidelity via Real Battle Engine
- **Status:** Decided
- **Decision:** Run actual RPG Maker MZ BattleManager in headless mode
- **Rationale:** Highest fidelity to final game (includes plugin behavior)
- **Consequence:** Higher maintenance cost for mocking layer

### ADR-004: HP/MP-Only Skill Selection (MVP v1)
- **Status:** MVP v1 Limited, Future Expansion
- **Decision:** Filter skills only by HP/MP cost in MVP
- **Rationale:** 80% coverage with 20% effort
- **Future:** Add TP, cooldowns, AP when critical
- **Consequence:** May diverge from game in advanced scenarios

### ADR-005: ID-Based References
- **Status:** Decided
- **Decision:** Use numeric IDs (not names) in config/reports
- **Rationale:** Eliminate ambiguity, simplify validation
- **Consequence:** Less human-readable, may need UI resolution layer

### ADR-006: No UI/CI in MVP v1
- **Status:** Decided for MVP, Post-MVP Planned
- **Decision:** CLI-only, no Electron UI, no GitHub Actions CI
- **Rationale:** Focus on core validation logic
- **Future:** Electron UI (Section 8.5.4), CI integration (Section 5.3)

---

## Implementation Roadmap (From HLD Section 11.2)

### Phase 1: Foundation (4-6 weeks, Critical)
1. Project setup (TypeScript, Jest, directory structure)
2. Config Layer (parser, validation)
3. Loader Layer (JSON reading, ID validation)
4. Headless Runtime (JSDOM, mocks, engine loading)

### Phase 2: Simulation Engine (3-4 weeks, Critical)
5. Simulation Layer (skill selection, battle loop, TTK measurement)
6. Reporter Layer (aggregates, warnings, JSON serialization)

### Phase 3: CLI and Export (1-2 weeks, High)
7. CLI Layer (commands, flags, progress logging)
8. AI Exporter (JSON splitting)

### Phase 4: Validation & Calibration (2-3 weeks, High)
9. End-to-end tests (reference battles)
10. Documentation (README, troubleshooting, limitations)

### Phase 5: Post-MVP (Medium/Low Priority)
11. Electron UI
12. CI Integration (GitHub Actions)
13. Mechanics expansion (TP, cooldowns, items)
14. Performance optimization (parallelization, caching)

**Total Estimated Effort:** 10-15 weeks for MVP v1

---

## Project Maturity Assessment

**Overall Maturity:** **Planning Phase** (Pre-Alpha)

| Aspect | Status | Quality |
|--------|--------|---------|
| **Requirements** | ✅ Complete | Excellent (comprehensive PRD) |
| **Architecture** | ✅ Complete | Excellent (85KB HLD) |
| **Research** | ✅ Complete | Exceptional (35KB technical deep-dive) |
| **Implementation** | ❌ Not Started | N/A (greenfield) |
| **Testing Strategy** | ✅ Planned | Excellent (Jest/JSDOM detailed) |
| **Documentation** | ✅ Extensive | Excellent (~200KB docs) |
| **External Dependencies** | ⚠️ Identified | RPG Maker MZ project required |

**Strengths:**
- Exceptionally thorough upfront planning and research
- Clear architectural vision with explicit trade-offs documented
- Strong understanding of technical challenges (VisuStella mocking, JSDOM setup)
- Realistic risk assessment with mitigation strategies

**Gaps:**
- No code implementation yet (100% documentation at this stage)
- External RPG Maker MZ project not present in repository
- No package.json, dependencies not yet declared
- No test fixtures or sample data

**Recommended Next Steps:**
1. Initialize Node.js/TypeScript project structure
2. Set up Jest with JSDOM configuration
3. Implement Config Layer as foundation
4. Create sample `project.config.json` for testing
5. Begin Loader Layer with stubbed RPG Maker MZ data

---

## File Count by Type

| Type | Count | Location |
|------|-------|----------|
| **Markdown** | 8 | `/docs/`, `/docs/pesquisas/`, `/docs/plugins-visustella/` |
| **JavaScript** | 1 | `/docs/pesquisas/formatjson/` (utility only) |
| **TypeScript** | 0 | N/A |
| **JSON** | 0 | N/A (config files not created yet) |
| **Git** | Multiple | `.git/` (version control metadata) |
| **Config** | 1 | `.gitignore` |
| **Shell** | 1 | `setup-claude-symlink.sh` |
| **Total Source** | 0 | *No implementation code* |
| **Total Docs** | 8 MD + 1 JS | ~200KB documentation |

---

## Summary

**coreto game-engine** is a **well-architected but unimplemented** Node.js CLI tool designed to revolutionize RPG Maker MZ combat balancing through deterministic, headless battle simulation. The project demonstrates exceptional engineering rigor in its planning phase, with comprehensive PRD/HLD documentation, deep technical research (including 41 academic/technical sources), and realistic risk assessment.

**Current State:** The repository contains only documentation and planning artifacts. No implementation code exists beyond a single JSON formatting utility script. The project is ready to transition from planning to implementation.

**Architectural Highlight:** The unique "wrapper read-only" pattern ensures the RPG Maker MZ editor remains the source of truth, while external Node.js tooling provides automated validation—solving the classic problem of balancing accessibility (visual editor) with rigor (deterministic testing).

**Critical Path to MVP:** Implementing the Headless Runtime layer (JSDOM + mocking) is the highest-risk, highest-value component. Success hinges on effectively replicating the obfuscated VisuStella plugin behavior without access to source code.

**Technology Readiness Level:** Documentation at TRL 3 (analytical proof of concept), Implementation at TRL 1 (basic principles observed). Gap of 2-3 TRL levels to bridge through phased development.
