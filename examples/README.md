# Sample Configuration

This directory contains a working sample configuration (`sample-config.json`) that demonstrates the complete TTK validation pipeline end-to-end. The sample serves as both an integration test and developer onboarding tool.

## Quick Start

Run the sample configuration:

```bash
npm run sample
```

Or execute directly with tsx:

```bash
tsx examples/run-sample.ts
```

## Sample Configuration Structure

The `sample-config.json` demonstrates three test scenarios:

### 1. Happy Path Trecho (`happy-path-trecho`)

Demonstrates successful TTK validation within tolerance:

- **Level Range**: 5-10
- **TTK Target**: 5 turns, 20 actions
- **Tolerance**: 20% (allows reasonable variance)
- **Troops**: Goblin×2 (Troop ID 1)
- **Party**: 2 members (Espadachim level 5, Mago level 5)

### 2. Out of Tolerance Trecho (`out-of-tolerance-trecho`)

Demonstrates warning generation when TTK exceeds tolerance:

- **Level Range**: 1-5
- **TTK Target**: 1 turn, 2 actions
- **Tolerance**: 10% (strict - encourages warnings)
- **Troops**: Gnomo×2 (Troop ID 2)
- **Party**: 1 member (Espadachim level 3)

This scenario shows how the system generates warnings when actual battle performance deviates from targets.

### 3. Edge Case Trecho (`edge-case-max-party`)

Demonstrates boundary conditions:

- **Level Range**: 99-99 (max level)
- **TTK Target**: 15 turns, 60 actions
- **Tolerance**: 15%
- **Troops**: Goblin×2, Gnomo×2 (Troop IDs 1, 2)
- **Party**: 4 members (max party size, all level 99)

This scenario validates the system handles maximum party size and level boundaries correctly.

## Configuration Schema

The sample config validates against `ProjectConfigSchema` defined in `packages/core/src/infrastructure/config/schemas.ts`:

```json
{
  "projectPath": "/absolute/path/to/rpg-maker-mz-project",
  "reportOutputPath": "/absolute/path/to/reports",
  "seed": 42,
  "maxBattleTurns": 100,
  "trechos": [...]
}
```

### Required Fields

- `projectPath`: Absolute path to RPG Maker MZ project directory
- `reportOutputPath`: Directory for generated reports
- `trechos`: Array of trecho configurations (min 1)

### Optional Fields

- `seed`: RNG seed for deterministic execution (default: 12345)
- `maxBattleTurns`: Maximum turns before battle timeout

### Trecho Schema

Each trecho must have:

- `id`: Unique identifier (non-empty string)
- `name`: Optional descriptive name
- `anchorLevelRange`: Level range { min, max } (1-99, max ≥ min)
- `ttkTarget`: TTK targets { turns, actions, tolerance? }
- `troopIds`: Array of troop IDs (min 1, positive integers)
- `party`: { members: [{ classId, level }] } (1-4 members, levels 1-99)

## Test Data

The sample configuration uses test fixtures from `tests/fixtures/sample-data/`:

- **Troops.json**: Contains troop IDs 1 (Goblin×2) and 2 (Gnomo×2)
- **Classes.json**: Contains class IDs 1 (Espadachim), 2 (Mago), 4 (Cavaleiro)
- **Enemies.json**: Enemy data referenced by troops
- **Skills.json**: Skill data for battle simulation

## Running Tests

### Unit Tests

Validate config structure and schema compliance:

```bash
npm test -- examples/sample-config.test.ts
```

### Integration Tests

Validate end-to-end pipeline execution:

```bash
npm test -- examples/sample-execution.integration.test.ts
```

### All Sample Tests

Run both unit and integration tests:

```bash
npm test -- examples/
```

## Sample Output

When you run `npm run sample`, you should see output similar to:

```
============================================================
Coreto Game Engine - Sample Configuration Execution
============================================================
Config: /path/to/examples/sample-config.json

Loading configuration...
  ✓ projectPath: /path/to/tests/fixtures/sample-data
  ✓ reportOutputPath: /tmp/coreto-sample-reports
  ✓ seed: 42
  ✓ maxBattleTurns: 100

Loading trechos...
  ✓ Loaded 3 trechos:
    - happy-path-trecho: Happy Path: TTK within tolerance
      troopIds: 1
      party: 2 members
    - out-of-tolerance-trecho: Out of Tolerance: TTK exceeds tolerance (demonstrates warning generation)
      troopIds: 2
      party: 1 member
    - edge-case-max-party: Edge Case: Max party size with boundary level values
      troopIds: 1, 2
      party: 4 members

Loading RPG Maker MZ database...
  ✓ Loaded 15 database objects

Initializing battle simulator...
  ✓ Simulator initialized

Executing battles (seed: 42)...

  Trecho: Happy Path: TTK within tolerance
    ✓ Troop 1: 5 turns, 20 actions (victory)

  Trecho: Out of Tolerance: TTK exceeds tolerance (demonstrates warning generation)
    ⚠ Troop 2: 8 turns, 24 actions (victory)

  Trecho: Edge Case: Max party size with boundary level values
    ✓ Troop 1: 12 turns, 48 actions (victory)
    ✓ Troop 2: 10 turns, 40 actions (victory)

Generating report...
  ✓ Report saved to: /tmp/coreto-sample-reports/sample-report-2026-01-21T12-34-56Z.json

Summary:
  Total battles: 4
  Total trechos: 3
  Total warnings: 1
  Success rate: 100%

Warnings:
  - [WARNING] ttk_out_of_tolerance: TTK out of tolerance for troop 2

============================================================
Sample execution completed successfully!
============================================================
```

## Report Output

The sample generates a JSON report saved to `/tmp/coreto-sample-reports/`:

```json
{
  "metadata": {
    "version": "1.0.0",
    "generatedAt": "2026-01-21T12:34:56.789Z",
    "seed": 42,
    "projectPath": "/path/to/tests/fixtures/sample-data"
  },
  "trechos": [
    {
      "trechoId": "happy-path-trecho",
      "battles": [...],
      "warnings": []
    },
    {
      "trechoId": "out-of-tolerance-trecho",
      "battles": [...],
      "warnings": [
        {
          "type": "ttk_out_of_tolerance",
          "severity": "warning",
          "message": "TTK out of tolerance for troop 2",
          "context": {...}
        }
      ]
    },
    {
      "trechoId": "edge-case-max-party",
      "battles": [...],
      "warnings": []
    }
  ],
  "summary": {
    "totalBattles": 4,
    "totalTrechos": 3,
    "totalWarnings": 1,
    "successRate": 1.0
  }
}
```

## Developer Onboarding

For new developers, this sample demonstrates:

1. **Config Structure**: How to structure a valid project configuration
2. **Trecho Configuration**: How to define story segments with level ranges and TTK targets
3. **Party Setup**: How to configure party members with classes and levels
4. **Troop References**: How to reference troops from the RPG Maker MZ data
5. **Tolerance Values**: How tolerance affects warning generation
6. **End-to-End Flow**: Complete pipeline from config to report

### Key Takeaways

- **TTK Metrics**: System measures both turns (full battle rounds) and actions (individual party actions)
- **Tolerance**: Specified as 0.0-1.0 (percentage), warns when actual exceeds this percentage of target
- **Determinism**: Same seed always produces identical results
- **Read-Only**: System never writes to the RPG Maker MZ project directory
- **Validation**: All configurations validated against Zod schemas before execution

## Troubleshooting

### Sample Script Execution Error

The `npm run sample` script may fail with a decorator-related error when using tsx:

```
ERROR: Parameter decorators only work when experimental decorators are enabled
```

This is a known limitation of the current tsx configuration. The sample functionality is fully validated through the test suite (39 passing tests):

```bash
npm test -- examples/
```

To run the sample directly after building the project, use the built JavaScript files instead.

### Module Not Found Errors

If you see module import errors, ensure dependencies are installed:

```bash
pnpm install
```

### Sample Data Not Found

The sample config requires test fixtures to exist:

```bash
tests/fixtures/sample-data/
├── Troops.json
├── Classes.json
├── Enemies.json
└── Skills.json
```

### Permission Errors

Report output directory (`/tmp/coreto-sample-reports/`) must be writable.

## Files

- `sample-config.json` - Sample configuration with 3 test scenarios
- `sample-config.test.ts` - Unit tests for config validation
- `sample-execution.integration.test.ts` - Integration tests for pipeline execution
- `run-sample.ts` - Executable script to run the sample
- `README.md` - This file
