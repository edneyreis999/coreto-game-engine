# Tech Stack

## Core Technologies (Planned for MVP v1)

### Runtime & Language

- **Node.js**: Runtime environment
- **TypeScript**: Primary implementation language (ADR-028)
  - Target: ES2022
  - Strict type checking

### CLI Framework

- **Oclif** (ADR-007): CLI framework
  - Commands: `run-ttk`, `export-context`
  - Flags: `--config`, `--seed`, `--trecho`, `--verbose`, `--diagnostic`

### Testing & Headless Environment

- **Jest**: Testing framework
- **JSDOM** (ADR-014): Browser emulation for headless runtime
- **jest-canvas-mock** (ADR-026): Canvas API stubbing

### Validation & Configuration

- **Zod** (ADR-008): Schema validation library
- **JSON**: Configuration format (ADR-021)

### RPG Maker MZ Integration

- **RPG Maker MZ Core Scripts**: rmmz_core.js, rmmz_managers.js, rmmz_objects.js
- **VisuStella Plugins**: Core Engine, Battle Core, Skills States Core, Element Status Core

## Development Tools (To Be Configured)

### Code Quality

- ESLint (not configured yet)
- Prettier (not configured yet)
- TypeScript strict mode

### Build System

- TypeScript compiler (tsc)
- Source maps for debugging

## Mocking Strategy

Custom mocks for headless runtime:

- PIXI.js (Container, Sprite) - ADR-015
- Graphics API - ADR-015
- Effekseer (particle effects)
- AudioManager
- Database loading override (synchronous via fs.readFileSync) - ADR-016

## Report Output

- JSON format (ADR-011)
- Synchronous file writes (ADR-024)
- Statistical aggregation (ADR-012)
- Typed warning system (ADR-013)
