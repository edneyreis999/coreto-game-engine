# Configuration Module

This module provides runtime validation for JSON configuration files using Zod schemas.

## Overview

Implements:
- **ADR-008**: Zod for schema validation
- **ADR-021**: JSON-based configuration format

## Schemas

### AnchorLevelRangeSchema

Validates character level ranges for RPG Maker MZ.

**Constraints:**
- `min`: 1-99 (integer)
- `max`: 1-99 (integer)
- `max >= min` (refinement)

**Example:**
```typescript
import { AnchorLevelRangeSchema } from '@/infrastructure/config';

const range = AnchorLevelRangeSchema.parse({
  min: 1,
  max: 10
});
```

### TtkTargetSchema

Validates Time-to-Kill target metrics.

**Constraints:**
- `turns`: positive integer
- `actions`: positive integer
- `tolerance`: 0.0-1.0 (default: 0.15 = 15%)

**Example:**
```typescript
import { TtkTargetSchema } from '@/infrastructure/config';

const target = TtkTargetSchema.parse({
  turns: 10,
  actions: 40
  // tolerance defaults to 0.15
});
```

### PartyConfigSchema

Validates party composition.

**Constraints:**
- `members`: 1-4 party members (RPG Maker MZ max party size)
- Each member:
  - `classId`: positive integer (references Classes.json)
  - `level`: 1-99 (integer)

**Example:**
```typescript
import { PartyConfigSchema } from '@/infrastructure/config';

const party = PartyConfigSchema.parse({
  members: [
    { classId: 1, level: 5 },
    { classId: 2, level: 5 }
  ]
});
```

### TrechoSchema

Validates story segment configuration.

**Constraints:**
- `id`: non-empty string (unique identifier)
- `name`: optional descriptive name
- `anchorLevelRange`: validated level range
- `ttkTarget`: validated TTK metrics
- `troopIds`: at least one troop ID (references Troops.json)
- `party`: validated party configuration

**Example:**
```typescript
import { TrechoSchema } from '@/infrastructure/config';

const trecho = TrechoSchema.parse({
  id: 'ato1-nivel1-10',
  name: 'Ato 1: Tutorial',
  anchorLevelRange: { min: 1, max: 10 },
  ttkTarget: { turns: 8, actions: 32, tolerance: 0.2 },
  troopIds: [1, 2, 3],
  party: {
    members: [{ classId: 1, level: 5 }]
  }
});
```

### ProjectConfigSchema

Validates root project configuration.

**Constraints:**
- `projectPath`: non-empty string, no path traversal (..)
- `seed`: integer RNG seed (default: 12345, per ADR-018)
- `trechos`: at least one trecho configuration

**Example:**
```typescript
import { ProjectConfigSchema } from '@/infrastructure/config';

const config = ProjectConfigSchema.parse({
  projectPath: '/path/to/rpg-maker-project',
  seed: 42,
  trechos: [
    // ... trecho configurations
  ]
});
```

## Type Inference

All TypeScript types are automatically inferred from Zod schemas:

```typescript
import type { ProjectConfig, TrechoConfig } from '@/infrastructure/config';

// Types are perfectly synced with validation logic
const config: ProjectConfig = ProjectConfigSchema.parse(rawJson);
```

## Error Handling

Zod throws `ZodError` on validation failure with detailed error messages:

```typescript
import { ProjectConfigSchema } from '@/infrastructure/config';
import { ZodError } from 'zod';

try {
  const config = ProjectConfigSchema.parse(rawJson);
} catch (error) {
  if (error instanceof ZodError) {
    console.error('Validation errors:', error.errors);
    // errors: Array<{ path: string[], message: string, ... }>
  }
}
```

## Usage in ConfigLoader

```typescript
import { injectable } from 'tsyringe';
import { ProjectConfigSchema, type ProjectConfig } from '@/infrastructure/config';
import { ConfigError } from '@/core/errors';
import type { IConfigLoader } from '@/core/ports';

@injectable()
export class ConfigLoader implements IConfigLoader {
  async load(path: string): Promise<ProjectConfig> {
    const rawJson = await fs.readFile(path, 'utf-8');
    const parsed = JSON.parse(rawJson);

    try {
      return ProjectConfigSchema.parse(parsed);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ConfigError(
          'Invalid configuration',
          { path, errors: error.errors }
        );
      }
      throw error;
    }
  }
}
```

## Sample Configuration

See `examples/sample-config.json` for a complete working example.

## Testing

All schemas have 100% test coverage. See `tests/unit/infrastructure/config/schemas.test.ts` for comprehensive examples.

## References

- [ADR-008: Schema Validation Library](../../../docs/adrs/ADR-008-schema-validation-library.md)
- [ADR-021: JSON-Based Configuration Format](../../../docs/adrs/ADR-021-json-based-configuration-format.md)
- [Zod Documentation](https://zod.dev/)
