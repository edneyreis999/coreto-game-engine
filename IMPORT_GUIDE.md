# Guia de Imports do Monorepo

## Problema: Imports com subcaminhos não funcionam

**Erro:** `Cannot find module '@coreto/core/infrastructure/security/PathSanitizer.js'`

**Causa Raiz:** O `package.json` do `@coreto/core` só exporta o entry point principal (`.`), não subcaminhos. Isso significa que:

```json
// packages/core/package.json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
    // ❌ NÃO há exports para subcaminhos como "./infrastructure/*"
  }
}
```

**Consequência:** Imports como `@coreto/core/infrastructure/X` falham no `tsc --noEmit`, mesmo que funcionem no Jest (que tem `moduleNameMapper`).

## Solução: Exportar infraestrutura no index principal

Para que módulos de infraestrutura sejam importáveis via `@coreto/core`, eles precisam ser exportados em `src/index.ts`:

```typescript
// src/index.ts
export * from './infrastructure/adapters/data/index.js';      // RmmzDataLoader, etc
export * from './infrastructure/adapters/filesystem/index.js'; // NodeFileSystem
export * from './infrastructure/adapters/reporter/index.js';   // JsonReporter
export * from './infrastructure/security/index.js';            // PathSanitizer, ReadOnlyGuard
export * from './infrastructure/runtime/index.js';             // HeadlessRuntimeBootstrapper, etc
export * from './infrastructure/simulation/index.js';          // HeadlessBattleSimulator, etc
export * from './infrastructure/config/index.js';              // ZodConfigLoader
```

## Regras de Import

### ✅ CORRETO - Usar `@coreto/core` para TUDO exportado:

```typescript
// Domain
import { TtkMetrics, BattleResult, Warning } from '@coreto/core';

// Errors
import { ValidationError, DataLoadError } from '@coreto/core';

// Use Cases
import { ExecuteBattleUseCase } from '@coreto/core';

// Infraestrutura (agora exportada)
import { RmmzDataLoader, NodeFileSystem, PathSanitizer } from '@coreto/core';
import { JsonReporter, ReportSchema } from '@coreto/core';
import { HeadlessBattleSimulator, DeterministicRNG } from '@coreto/core';
import { HeadlessRuntimeBootstrapper, DatabaseLoader } from '@coreto/core';
import { ZodConfigLoader } from '@coreto/core';

// Types
import type { RmmzDatabase, IConfigLoader } from '@coreto/core';
```

### ✅ CORRETO - Usar sufixo DTO para tipos Zod:

Quando há conflito de nomes entre tipos de domínio e tipos de schema:

```typescript
// ❌ Isto causa ambiguidade:
import { type Warning, type BattleResult } from '@coreto/core';
// Warning pode ser a classe de domínio OU o tipo do schema

// ✅ CORRETO - Usar DTO suffix para Zod types:

// Config DTOs:
import {
  AnchorLevelRangeDTO,
  TtkTargetDTO,
  PartyMemberDTO,
  PartyConfigDTO,
  TrechoDTO,
  ProjectConfigDTO,
} from '@coreto/core';

// Report DTOs:
import type {
  WarningTypeDTO,
  WarningSeverityDTO,
  WarningDTO,
  ActorDTO,
  ActionDTO,
  TurnDTO,
  BattleResultDTO,
  TrechoAggregatesDTO,
  TrechoReportDTO,
  ReportMetadataDTO,
  ReportSummaryDTO,
  ReportDTO,
} from '@coreto/core';

// Domain classes continuam sem sufixo:
import {
  AnchorLevelRange,
  TtkTarget,
  PartyConfig,
  Trecho,
  Warning,      // classe de domínio
  BattleResult, // classe de domínio
} from '@coreto/core';

// Port interfaces continuam sem sufixo:
import type {
  ProjectConfig,     // IConfigLoader.ProjectConfig (não tem trechos)
  IConfigLoader,
  WarningType,       // Port enum
  WarningSeverity,   // Port enum
} from '@coreto/core';
```

### ❌ INCORRETO - Nunca usar:

```typescript
// Subcaminhos não funcionam em type-check
import { PathSanitizer } from '@coreto/core/infrastructure/security/PathSanitizer.js';

// Duplicação de /core/
import { TtkMetrics } from '@coreto/core/core/domain/TtkMetrics';
```

## Conflitos de Nomes

### Schemas vs Domain

| Schema (com sufixo) | DTO Type (com sufixo) | Domain (sem sufixo) | Conflito? |
|---------------------|----------------------|---------------------|-----------|
| `WarningSchema` | `WarningDTO` | `Warning` (classe) | ❌ Não |
| `BattleResultSchema` | `BattleResultDTO` | `BattleResult` (classe) | ❌ Não |
| `WarningTypeSchema` | `WarningTypeDTO` | `WarningType` (port enum) | ❌ Não |
| `WarningSeveritySchema` | `WarningSeverityDTO` | `WarningSeverity` (port enum) | ❌ Não |

**Regra:** Todos os tipos Zod usam sufixo "DTO" para evitar conflito com classes de domínio e interfaces de port.

### Zod DTOs vs Domain/Port Types

#### Config DTOs

| Zod Type (DTO) | Domain/Port | Source |
|----------------|-------------|---------|
| `AnchorLevelRangeDTO` | `AnchorLevelRange` | Domain class |
| `TtkTargetDTO` | `TtkTarget` | Domain class |
| `PartyMemberDTO` | - | Schema only |
| `PartyConfigDTO` | `PartyConfig` | Domain entity |
| `TrechoDTO` | `Trecho` | Domain entity |
| `ProjectConfigDTO` | `ProjectConfig` | Port interface |

#### Report DTOs

| Zod Type (DTO) | Domain/Port | Source |
|----------------|-------------|---------|
| `WarningTypeDTO` | `WarningType` | Port enum |
| `WarningSeverityDTO` | `WarningSeverity` | Port enum |
| `WarningDTO` | `Warning` | Domain class |
| `ActorDTO` | - | Schema only |
| `ActionDTO` | - | Schema only |
| `TurnDTO` | - | Schema only |
| `BattleResultDTO` | `BattleResult` | Domain class |
| `TrechoAggregatesDTO` | - | Schema only |
| `TrechoReportDTO` | - | Schema only |
| `ReportMetadataDTO` | - | Schema only |
| `ReportSummaryDTO` | - | Schema only |
| `ReportDTO` | `Report` | Domain entity |

**Regra:** Todos os tipos inferidos de Zod schemas usam sufixo "DTO" para evitar conflito com classes de domínio e interfaces de port.

## Verificação

```bash
# Type-check completo (detecta erros de import)
pnpm --filter @coreto/core type-check

# Testes
pnpm --filter @coreto/core test

# Verificar imports com subcaminhos (não deve retornar nada)
grep -r "from '@coreto/core/infrastructure/" packages/core/tests --include="*.ts"
```

## Adicionando Novas Exportações

Ao adicionar um novo módulo de infraestrutura que precisa ser usado em testes:

1. **Criar/verificar index barrel** no módulo:
   ```typescript
   // infrastructure/xxx/index.ts
   export { MyModule } from './MyModule.js';
   ```

2. **Adicionar ao index principal** (`src/index.ts`):
   ```typescript
   export * from './infrastructure/xxx/index.js';
   ```

3. **Rebuild** do core:
   ```bash
   pnpm --filter @coreto/core build
   ```

4. **Usar em testes**:
   ```typescript
   import { MyModule } from '@coreto/core';
   ```

## Resumo da Iteração

### Problemas Encontrados:
1. ❌ Imports com subcaminhos falham no type-check
2. ❌ `moduleNameMapper` do Jest não resolve imports em `tsc`
3. ❌ Conflitos de nomes entre domain e schema types
4. ❌ Aliases confusos como `ProjectConfigConfig`

### Soluções Aplicadas:
1. ✅ Exportar infraestrutura em `src/index.ts`
2. ✅ Usar `@coreto/core` para todos os módulos exportados
3. ✅ Usar sufixo "DTO" para tipos Zod (ex: `AnchorLevelRangeDTO`)
4. ✅ Remover arquivo placeholder `types/config.ts`
5. ✅ Remover aliases confusos como `ProjectConfigConfig`

### Arquivos Modificados:
- `packages/core/src/index.ts` - Exportações de config DTOs e report DTOs com sufixo DTO
- `packages/core/src/infrastructure/config/schemas.ts` - Tipos renomeados com sufixo DTO
- `packages/core/src/infrastructure/schemas/report.schema.ts` - Tipos inferidos de Zod
- `packages/core/src/types/config.ts` - **REMOVIDO** (era placeholder obsoleto)
- `packages/core/tests/unit/infrastructure/config/schemas.test.ts` - Imports atualizados
- `packages/core/tests/unit/infrastructure/schemas/report.schema.test.ts` - Import com subcaminho corrigido
- `packages/core/tests/unit/infrastructure/runtime/shims/pixi_shim.test.ts` - Import relativo para Graphics

### Convenção Final de Nomes:

| Tipo | Sufixo | Exemplo |
|------|--------|---------|
| Domain Class | nenhum | `AnchorLevelRange`, `TtkTarget`, `Warning`, `BattleResult` |
| Domain Entity | nenhum | `PartyConfig`, `Trecho`, `Report` |
| Port Interface | nenhum | `IConfigLoader.ProjectConfig` |
| Port Enum | nenhum | `WarningType`, `WarningSeverity` |
| Zod Schema Type | `*DTO` | `AnchorLevelRangeDTO`, `WarningDTO`, `BattleResultDTO` |
| Zod Schema | `*Schema` | `AnchorLevelRangeSchema`, `WarningSchema`, `BattleResultSchema` |

### Resultado:
- Type-check: ✅ Passando
- Test Suites: 56 passando
- Zero imports com subcaminhos inválidos
- Convenção de nomes clara e consistente
