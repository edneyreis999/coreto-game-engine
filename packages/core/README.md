# @coreto/core

Core game engine logic for TTK (Time-to-Kill) validation - shared between CLI and Electron applications.

## Overview

This package contains the deterministic battle simulation engine for RPG Maker MZ combat balancing. It executes real battles in headless mode to measure TTK and validate game balance, reducing validation cycles from 2-3 days to ≤10 minutes.

## Architecture

The package follows **Hexagonal Architecture** (Ports and Adapters) with these layers:

- **Core Layer** (`src/core/`): Domain entities, value objects, use cases, errors, and port interfaces
- **Infrastructure Layer** (`src/infrastructure/`): Adapters implementing core ports, runtime, simulation, config, DI

## Installation

```bash
pnpm add @coreto/core
```

## Public API

### Domain Types

```typescript
import {
  // Value Objects
  AnchorLevelRange,
  TtkTarget,
  TtkMetrics,
  Warning,
  // Entities
  Trecho,
  PartyConfig,
  BattleResult,
  Report,
  // Domain Services
  WarningCollector,
} from '@coreto/core';
```

### Port Interfaces

```typescript
import type {
  ILogger,
  IFileSystem,
  IConfigLoader,
  ProjectConfig,
  IDataLoader,
  RmmzDatabase,
  IBattleSimulator,
  BattleSetup,
  IReporter,
  IHeadlessRuntime,
} from '@coreto/core';
```

### Use Cases

```typescript
import {
  ExecuteBattleUseCase,
  ValidateTrechoUseCase,
  GenerateReportUseCase,
} from '@coreto/core';
```

### Domain Errors

```typescript
import {
  DomainError,
  ValidationError,
  ConfigError,
  DataLoadError,
  BattleTimeoutError,
  SkillFormulaError,
  FileSystemError,
} from '@coreto/core';
```

### Dependency Injection

```typescript
import {
  registerDependencies,
  resolve,
  container,
  // Tokens
  IConfigLoaderToken,
  IDataLoaderToken,
  IBattleSimulatorToken,
  IReporterToken,
  IHeadlessRuntimeToken,
  ILoggerToken,
  IFileSystemToken,
} from '@coreto/core';
```

### TypeScript Types

```typescript
import type {
  ProjectConfig,
  TrechoConfig,
} from '@coreto/core';

import type {
  ClassData,
  EnemyData,
  ItemData,
  SkillData,
  SystemData,
  TroopData,
  // ... more RMMZ types
} from '@coreto/core';
```

## Usage Example

```typescript
import { registerDependencies, resolve, IConfigLoaderToken, IDataLoaderToken } from '@coreto/core';

// Register DI dependencies
registerDependencies();

// Resolve dependencies
const configLoader = resolve(IConfigLoaderToken);
const dataLoader = resolve(IDataLoaderToken);

// Load configuration
const config = await configLoader.loadConfig('project.config.json');

// Load RPG Maker MZ database
const database = await dataLoader.loadDatabase(config.projectPath);
```

## Key Features

- **Deterministic Battle Simulation**: Fixed RNG seed ensures reproducible results
- **Real Game Engine Execution**: Uses RPG Maker MZ's `BattleManager` in headless mode
- **TTK Measurement**: Dual metric system (turns and actions)
- **Warning System**: Typed warnings with severity levels for validation feedback
- **Read-Only Guarantee**: Never writes to RPG Maker MZ project directory

## License

UNLICENSED - Private package for Coreto Team use only.
