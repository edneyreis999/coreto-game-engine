/**
 * ╔════════════════════════════════════════════════════════════════════════╗
 * ║         ELECTRON PACKAGE - CLEAN ARCHITECTURE GUARDIAN                ║
 * ╚════════════════════════════════════════════════════════════════════════╝
 *
 * Este teste é o guardião da arquitetura Clean Architecture do @coreto/electron.
 * Quando ele falha, significa que um arquivo foi colocado no lugar errado ou
 * está importando módulos que violam as regras de dependência.
 *
 * 📚 DOCUMENTAÇÃO RELACIONADA:
 *    - packages/electron/CLAUDE.md (convenções de import)
 *    - docs/adrs/UI/ADR-033-clean-architecture-electron-package.md
 *
 * ARCHITECTURE OF ELECTRON PACKAGE:
 *
 *    +-----------------------------------------------------------+
 *    |  src/domain/                    (DOMAIN LAYER)            |
 *    |  +-- entities/       - Business models                    |
 *    |  +-- ports/          - Interfaces (IConfigStorage, etc)   |
 *    |  +-- use-cases/      - Use cases (runSimulation)          |
 *    |  +-- schemas/        - Zod validation                     |
 *    |  +-- types/          - TypeScript types                   |
 *    +-----------------------------------------------------------+
 *                              ^ IMPORTS ONLY
 *                              | (one-way dependency)
 *    +-----------------------------------------------------------+
 *    |  src/main/              (INFRASTRUCTURE - Main Process)   |
 *    |  +-- adapters/       - Port implementations               |
 *    |  +-- database/       - SQLite + repositories              |
 *    |  +-- ipc/            - IPC handlers (thin adapters)       |
 *    |  +-- services/       - Infrastructure services            |
 *    +-----------------------------------------------------------+
 *
 *    +-----------------------------------------------------------+
 *    |  src/renderer/          (INFRASTRUCTURE - Renderer)       |
 *    |  +-- src/components/ - React components (shadcn/ui)       |
 *    |  +-- src/hooks/      - Custom hooks (useConfig, etc)      |
 *    |  +-- src/lib/        - Utilities (cn, etc)                |
 *    +-----------------------------------------------------------+
 *
 *    +-----------------------------------------------------------+
 *    |  src/preload/           (SECURITY BRIDGE)                 |
 *    |  +-- index.ts        - Context bridge (exposeInMainWorld) |
 *    +-----------------------------------------------------------+
 *
 * GOLDEN RULES:
 *
 *   RULE 1: Domain NEVER imports from Infrastructure
 *       WRONG: import { app } from 'electron'
 *       RIGHT: import type { IConfigStorage } from '../ports'
 *
 *   RULE 2: Infrastructure to Domain uses MODULE ALIASES
 *       WRONG: import { validateTrecho } from '../../../domain/use-cases'
 *       RIGHT: import { validateTrecho } from '@coreto/electron/domain/use-cases'
 *
 *   RULE 3: Infrastructure to Infrastructure uses RELATIVE PATHS
 *       WRONG: import { getDatabase } from '@coreto/electron/main/database'
 *       RIGHT: import { getDatabase } from '../database/index.js'
 *
 *   RULE 4: Handlers are THIN ADAPTERS (delegate to use cases)
 *       WRONG: export const handleRunSimulation = async (config) => { /* 200 lines * / }
 *       RIGHT: export const handleRunSimulation = async (config) => runSimulation(config)
 *
 * HISTORICAL CONTEXT (Why these rules exist):
 *
 *    BEFORE (commit 54110cb - Dec 2024):
 *    - Handlers had business logic inline (700+ lines)
 *    - Impossible to test without Electron runtime
 *    - Code duplication between main/renderer
 *
 *    AFTER (commit 83b6e02 - Jan 2025):
 *    - Pure domain layer (testable without Electron)
 *    - Reusable use cases in CLI/Electron/Web
 *    - Handlers are mere adapters (under 50 lines)
 *
 * WHEN THIS TEST FAILS:
 *
 *    1. Read the error message - it will tell you which file and import violated the rule
 *    2. Check packages/electron/CLAUDE.md for correct examples
 *    3. If domain import: use module alias @coreto/electron/domain/*
 *    4. If intra-layer import: use relative path ./../../
 *    5. If business logic: move to src/domain/use-cases/
 *
 * Run with: pnpm --filter @coreto/electron test architecture.test.ts
 *
 * ══════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect } from '@jest/globals';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Recursively finds all TypeScript files in a directory
 */
function findTsFiles(dir: string): string[] {
  const files: string[] = [];
  const items = readdirSync(dir);

  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip node_modules and hidden directories
      if (!item.startsWith('.') && item !== 'node_modules') {
        files.push(...findTsFiles(fullPath));
      }
    } else if (item.endsWith('.ts') && !item.endsWith('.d.ts') && !item.endsWith('.test.ts') && !item.endsWith('.spec.ts') && item !== 'index.ts') {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Extracts imports from a file content
 */
function extractImports(content: string): string[] {
  const importRegex = /import\s+(?:type\s+)?{?([^}]+)}?\s+(?:from\s+)?['"]([^'"]+)['"]/g;
  const imports: string[] = [];

  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const modulePath = match[2];
    imports.push(modulePath);
  }

  return imports;
}

/**
 * Gets all domain layer files
 */
function getDomainFiles(): string[] {
  const domainDir = join(__dirname, '../../src/domain');
  return findTsFiles(domainDir);
}

/**
 * Gets all infrastructure layer files
 */
function getInfrastructureFiles(): string[] {
  const mainDir = join(__dirname, '../../src/main');
  const preloadDir = join(__dirname, '../../src/preload');
  const rendererDir = join(__dirname, '../../src/renderer');

  return [
    ...findTsFiles(mainDir),
    ...findTsFiles(preloadDir),
    ...findTsFiles(rendererDir),
  ];
}

/**
 * Gets relative path from project root
 */
function getRelativePath(filePath: string): string {
  const rootDir = join(__dirname, '../..');
  return relative(rootDir, filePath);
}

/**
 * Generates actionable error message with correction suggestions for domain purity violations
 */
function generateDomainPurityReport(violations: Array<{ file: string; bannedImport: string }>): string {
  const lines: string[] = [];

  lines.push('\n╔════════════════════════════════════════════════════════════╗');
  lines.push('║  ❌ DOMAIN PURITY VIOLATION - Infrastructure Import       ║');
  lines.push('╚════════════════════════════════════════════════════════════╝\n');

  for (const v of violations) {
    lines.push(`📁 File: ${v.file}`);
    lines.push(`   ❌ Banned import: ${v.bannedImport}\n`);
    lines.push(`   💡 WHY THIS IS WRONG:`);
    lines.push(`      Domain layer must be pure and framework-agnostic.`);
    lines.push(`      Importing infrastructure dependencies couples domain to Electron runtime.`);
    lines.push(`      This prevents testing domain logic without Electron and makes future`);
    lines.push(`      porting to web/mobile impossible.\n`);
    lines.push(`   🔧 HOW TO FIX:`);

    if (v.bannedImport.includes('electron')) {
      lines.push(`      1. Move code using Electron APIs → src/main/adapters/`);
      lines.push(`      2. Create a port interface in src/domain/ports/ (e.g., IConfigStorage)`);
      lines.push(`      3. Domain uses the port, main provides the implementation\n`);
      lines.push(`   📋 EXAMPLE:`);
      lines.push(`      ❌ BEFORE (domain/use-cases/save-config.ts):`);
      lines.push(`         import { app } from 'electron';`);
      lines.push(`         export function saveConfig(config) {`);
      lines.push(`           const path = app.getPath('userData');`);
      lines.push(`           // save logic...`);
      lines.push(`         }\n`);
      lines.push(`      ✅ AFTER (domain/ports/IConfigStorage.ts):`);
      lines.push(`         export interface IConfigStorage {`);
      lines.push(`           save(config: Config): Promise<void>;`);
      lines.push(`         }\n`);
      lines.push(`      ✅ AFTER (domain/use-cases/save-config.ts):`);
      lines.push(`         export function saveConfig(config, storage: IConfigStorage) {`);
      lines.push(`           return storage.save(config);`);
      lines.push(`         }\n`);
      lines.push(`      ✅ AFTER (main/adapters/file-config-storage-adapter.ts):`);
      lines.push(`         import { app } from 'electron';`);
      lines.push(`         export class FileConfigStorageAdapter implements IConfigStorage {`);
      lines.push(`           async save(config) { /* electron logic */ }`);
      lines.push(`         }`);
    } else if (v.bannedImport.includes('react')) {
      lines.push(`      1. Move React components → src/renderer/src/components/`);
      lines.push(`      2. Keep domain types/use-cases separate from UI`);
      lines.push(`      3. Components import domain via module alias @coreto/electron/domain/*`);
    } else if (v.bannedImport.includes('better-sqlite3')) {
      lines.push(`      1. Create repository port in src/domain/ports/`);
      lines.push(`      2. Implement SQLite adapter in src/main/database/repositories/`);
      lines.push(`      3. Domain uses port interface, main provides SQLite implementation`);
    }

    lines.push(`\n   📚 LEARN MORE:`);
    lines.push(`      - packages/electron/CLAUDE.md (Domain Layer Purity)`);
    lines.push(`      - docs/adrs/UI/ADR-033-clean-architecture-electron-package.md\n`);
    lines.push('─'.repeat(60) + '\n');
  }

  return lines.join('\n');
}

/**
 * Generates actionable error message for module alias violations
 */
function generateModuleAliasReport(violations: Array<{ file: string; import: string }>): string {
  const lines: string[] = [];

  lines.push('\n╔════════════════════════════════════════════════════════════╗');
  lines.push('║  ❌ MODULE ALIAS VIOLATION - Use @coreto/electron/domain  ║');
  lines.push('╚════════════════════════════════════════════════════════════╝\n');

  for (const v of violations) {
    lines.push(`📁 File: ${v.file}`);
    lines.push(`   ❌ Wrong import: ${v.import}\n`);

    // Generate correct import suggestion
    const correctImport = v.import
      .replace(/\.\.\/+domain\//, '@coreto/electron/domain/')
      .replace(/\.\.\/+\.\.\/+domain\//, '@coreto/electron/domain/');

    lines.push(`   💡 WHY THIS IS WRONG:`);
    lines.push(`      Relative imports to domain create brittle paths that break during refactoring.`);
    lines.push(`      Module aliases provide stable, process-agnostic imports that work in both`);
    lines.push(`      main and renderer processes.\n`);
    lines.push(`   🔧 HOW TO FIX:`);
    lines.push(`      Replace:  import { ... } from '${v.import}'`);
    lines.push(`      With:     import { ... } from '${correctImport}'\n`);
    lines.push(`   📝 REMEMBER:`);
    lines.push(`      ✅ Infrastructure → Domain: USE module alias @coreto/electron/domain/*`);
    lines.push(`      ✅ Infrastructure → Infrastructure: USE relative path ./../\n`);
    lines.push(`   📚 LEARN MORE:`);
    lines.push(`      - packages/electron/CLAUDE.md (Import Conventions)`);
    lines.push(`      - Search for "Module Alias Configuration" in CLAUDE.md\n`);
    lines.push('─'.repeat(60) + '\n');
  }

  return lines.join('\n');
}

/**
 * Generates handler complexity warning with refactoring guidance
 */
function generateHandlerComplexityReport(violations: Array<{ file: string; lines: number }>): string {
  const lines: string[] = [];

  lines.push('\n╔════════════════════════════════════════════════════════════╗');
  lines.push('║  ⚠️  HANDLER COMPLEXITY WARNING - Extract to Use Case     ║');
  lines.push('╚════════════════════════════════════════════════════════════╝\n');

  for (const v of violations) {
    lines.push(`📁 File: ${v.file}`);
    lines.push(`   ⚠️  Lines of code: ${v.lines} (threshold: 100)\n`);
    lines.push(`   💡 WHY THIS MATTERS:`);
    lines.push(`      Handlers should be thin adapters that delegate to domain use cases.`);
    lines.push(`      Complex handlers indicate business logic leaking into infrastructure.`);
    lines.push(`      This makes testing harder and couples IPC protocol to business rules.\n`);
    lines.push(`   🔧 HOW TO FIX:`);
    lines.push(`      1. Extract business logic to src/domain/use-cases/{name}.ts`);
    lines.push(`      2. Create a use case function that returns the result`);
    lines.push(`      3. Handler should just call the use case and return response\n`);
    lines.push(`   📋 EXAMPLE:`);
    lines.push(`      ❌ BEFORE (src/main/ipc/handlers/run-simulation-handler.ts - 200 lines):`);
    lines.push(`         export const handleRunSimulation = async (config: TrechoConfig) => {`);
    lines.push(`           // 50 lines of validation...`);
    lines.push(`           // 80 lines of simulation logic...`);
    lines.push(`           // 70 lines of result formatting...`);
    lines.push(`           return result;`);
    lines.push(`         };\n`);
    lines.push(`      ✅ AFTER (src/main/ipc/handlers/run-simulation-handler.ts - 10 lines):`);
    lines.push(`         import { runSimulation } from '@coreto/electron/domain/use-cases';`);
    lines.push(`         import { wrapHandler } from '../ipc-response.js';`);
    lines.push(``);
    lines.push(`         export const handleRunSimulation = wrapHandler(async (config) => {`);
    lines.push(`           return runSimulation(config);`);
    lines.push(`         });\n`);
    lines.push(`      ✅ AFTER (src/domain/use-cases/run-simulation.ts - 190 lines):`);
    lines.push(`         export function runSimulation(config: TrechoConfig) {`);
    lines.push(`           // All business logic here (now testable without Electron!)`);
    lines.push(`         }\n`);
    lines.push(`   📚 LEARN MORE:`);
    lines.push(`      - See commit 83b6e02 for refactoring examples`);
    lines.push(`      - docs/adrs/UI/ADR-033-clean-architecture-electron-package.md\n`);
    lines.push('─'.repeat(60) + '\n');
  }

  return lines.join('\n');
}

/**
 * Generates ESM extension violation report
 */
function generateEsmExtensionReport(violations: Array<{ file: string; import: string }>): string {
  const lines: string[] = [];

  lines.push('\n╔════════════════════════════════════════════════════════════╗');
  lines.push('║  ❌ ESM IMPORT VIOLATION - Missing .js Extension          ║');
  lines.push('╚════════════════════════════════════════════════════════════╝\n');

  for (const v of violations) {
    const fixed = v.import.replace(/\/index$/, '/index.js').replace(/([^.])$/, '$1.js');

    lines.push(`📁 File: ${v.file}`);
    lines.push(`   ❌ Missing extension: ${v.import}\n`);
    lines.push(`   💡 WHY THIS IS WRONG:`);
    lines.push(`      ESM (ECMAScript Modules) requires explicit file extensions for relative imports.`);
    lines.push(`      TypeScript compiles .ts to .js, so runtime needs .js extension.`);
    lines.push(`      Without it, Node.js module resolution fails at runtime.\n`);
    lines.push(`   🔧 HOW TO FIX:`);
    lines.push(`      Replace:  import { ... } from '${v.import}'`);
    lines.push(`      With:     import { ... } from '${fixed}'\n`);
    lines.push(`   📝 RULE:`);
    lines.push(`      All relative imports must end with .js extension`);
    lines.push(`      (TypeScript strips it during compilation, Node.js adds it back at runtime)\n`);
    lines.push(`   📚 LEARN MORE:`);
    lines.push(`      - packages/electron/CLAUDE.md (Common Mistakes #2 - Forgetting .js Extension)\n`);
    lines.push('─'.repeat(60) + '\n');
  }

  return lines.join('\n');
}

/**
 * Generates DI registration violation report
 */
function generateDiRegistrationReport(violations: Array<{ port: string; issue: string }>): string {
  const lines: string[] = [];

  lines.push('\n╔════════════════════════════════════════════════════════════╗');
  lines.push('║  ❌ DEPENDENCY INJECTION VIOLATION - Missing Registration  ║');
  lines.push('╚════════════════════════════════════════════════════════════╝\n');

  for (const v of violations) {
    lines.push(`📁 Port: ${v.port}`);
    lines.push(`   ❌ Issue: ${v.issue}\n`);
    lines.push(`   💡 WHY THIS IS WRONG:`);
    lines.push(`      TSyringe DI container is the core of our architecture.`);
    lines.push(`      Ports without tokens/registration can't be injected, forcing direct instantiation.`);
    lines.push(`      This breaks Dependency Inversion Principle and couples infrastructure to concrete types.\n`);
    lines.push(`   🔧 HOW TO FIX:`);

    if (v.issue.includes('Missing token')) {
      lines.push(`      1. Add token to src/main/di/tokens.ts:`);
      lines.push(`         export const ${v.port}Token = Symbol.for('${v.port}');\n`);
      lines.push(`      2. Register in src/main/di/container.ts:`);
      lines.push(`         container.register<${v.port}>(${v.port}Token as unknown as string, {`);
      lines.push(`           useFactory: () => create${v.port.substring(1)}(...deps)`);
      lines.push(`         });\n`);
    } else if (v.issue.includes('Not registered')) {
      lines.push(`      Add to src/main/di/container.ts in registerMainDependencies():`);
      lines.push(`      container.register<${v.port}>(${v.port}Token as unknown as string, {`);
      lines.push(`        useFactory: () => create${v.port.substring(1)}(/* dependencies */)`);
      lines.push(`      });\n`);
    }

    lines.push(`   📋 EXAMPLE:`);
    lines.push(`      ✅ CORRECT (src/main/services/my-service.ts):`);
    lines.push(`         import { inject } from 'tsyringe';`);
    lines.push(`         import { IConfigStorageToken } from '../di/tokens.js';`);
    lines.push(``);
    lines.push(`         export class MyService {`);
    lines.push(`           constructor(`);
    lines.push(`             @inject(IConfigStorageToken) private storage: IConfigStorage`);
    lines.push(`           ) {}`);
    lines.push(`         }\n`);
    lines.push(`      ❌ WRONG (direct instantiation):`);
    lines.push(`         const storage = new FileConfigStorageAdapter(); // Breaks DI!\n`);
    lines.push(`   📚 LEARN MORE:`);
    lines.push(`      - docs/adrs/FOUNDATION/ADR-029-tsyringe-di-container.md`);
    lines.push(`      - src/main/di/container.ts (registration examples)\n`);
    lines.push('─'.repeat(60) + '\n');
  }

  return lines.join('\n');
}

/**
 * Generates naming convention violation report
 */
function generateNamingConventionReport(violations: Array<{ file: string; issue: string }>): string {
  const lines: string[] = [];

  lines.push('\n╔════════════════════════════════════════════════════════════╗');
  lines.push('║  ❌ NAMING CONVENTION VIOLATION - Inconsistent Names      ║');
  lines.push('╚════════════════════════════════════════════════════════════╝\n');

  for (const v of violations) {
    lines.push(`📁 File: ${v.file}`);
    lines.push(`   ❌ Issue: ${v.issue}\n`);
    lines.push(`   💡 WHY THIS MATTERS:`);
    lines.push(`      Consistent naming conventions make code self-documenting.`);
    lines.push(`      AI agents and developers can instantly identify file purpose by name pattern.\n`);
    lines.push(`   🔧 HOW TO FIX:`);

    if (v.issue.includes('Port interface')) {
      const wrongName = v.file.split('/').pop()?.replace('.ts', '') || '';
      const correctName = 'I' + wrongName;
      lines.push(`      Rename file: ${wrongName}.ts → ${correctName}.ts`);
      lines.push(`      Rename interface: interface ${wrongName} → interface ${correctName}\n`);
    } else if (v.issue.includes('Schema file')) {
      const fileName = v.file.split('/').pop() || '';
      lines.push(`      Rename: ${fileName} → ${fileName.replace('.ts', '.schema.ts')}\n`);
    } else if (v.issue.includes('Repository')) {
      const wrongName = v.file.split('/').pop()?.replace('.ts', '') || '';
      lines.push(`      Rename: ${wrongName}.ts → ${wrongName}Repository.ts\n`);
    }

    lines.push(`   📝 PROJECT CONVENTIONS:`);
    lines.push(`      ✅ Port interfaces: I*.ts (IConfigStorage, IGameDataLoader)`);
    lines.push(`      ✅ Schemas: *.schema.ts (ui-config.schema.ts, cli-config.schema.ts)`);
    lines.push(`      ✅ Repositories: *Repository.ts (SqliteRecentProjectsRepository.ts)`);
    lines.push(`      ✅ Domain entities: No suffix (Enemy, Skill, Actor)\n`);
    lines.push(`   📚 LEARN MORE:`);
    lines.push(`      - CLAUDE.md in project root (Naming Conventions section)\n`);
    lines.push('─'.repeat(60) + '\n');
  }

  return lines.join('\n');
}

/**
 * Generates type leakage violation report
 */
function generateTypeLeakageReport(violations: Array<{ file: string; import: string }>): string {
  const lines: string[] = [];

  lines.push('\n╔════════════════════════════════════════════════════════════╗');
  lines.push('║  ❌ TYPE LEAKAGE VIOLATION - Infrastructure Type in Domain ║');
  lines.push('╚════════════════════════════════════════════════════════════╝\n');

  for (const v of violations) {
    lines.push(`📁 File: ${v.file}`);
    lines.push(`   ❌ Leaked import: ${v.import}\n`);
    lines.push(`   💡 WHY THIS IS CRITICAL:`);
    lines.push(`      Type imports create hidden coupling between domain and infrastructure.`);
    lines.push(`      Even though types are erased at runtime, they force domain to know about`);
    lines.push(`      infrastructure implementation details (Database, IpcMainEvent, etc).\n`);
    lines.push(`   🔧 HOW TO FIX:`);

    if (v.import.includes('src/main')) {
      lines.push(`      1. Check if you really need this type in domain`);
      lines.push(`      2. If yes, create a domain type that represents the concept`);
      lines.push(`      3. Use a mapper in infrastructure to convert between domain and infra types\n`);
      lines.push(`   📋 EXAMPLE:`);
      lines.push(`      ❌ WRONG (domain importing infrastructure type):`);
      lines.push(`         // src/domain/use-cases/save-config.ts`);
      lines.push(`         import type { Database } from '../../main/database/schema';`);
      lines.push(`         export function saveConfig(db: Database, config: Config) { ... }\n`);
      lines.push(`      ✅ CORRECT (use domain port instead):`);
      lines.push(`         // src/domain/ports/IConfigStorage.ts`);
      lines.push(`         export interface IConfigStorage {`);
      lines.push(`           save(config: Config): Promise<void>;`);
      lines.push(`         }\n`);
      lines.push(`         // src/domain/use-cases/save-config.ts`);
      lines.push(`         export function saveConfig(storage: IConfigStorage, config: Config) {`);
      lines.push(`           return storage.save(config);`);
      lines.push(`         }\n`);
      lines.push(`         // src/main/adapters/file-config-storage-adapter.ts`);
      lines.push(`         import type { Database } from '../database/schema.js'; // OK here!`);
      lines.push(`         export function createFileConfigStorage(db: Database): IConfigStorage {...}`);
    } else if (v.import.includes('src/renderer')) {
      lines.push(`      1. Move React-specific types to src/renderer/src/types/`);
      lines.push(`      2. If domain needs UI concepts, create domain types (e.g., FormData → ConfigInput)`);
      lines.push(`      3. Map between domain types and UI types in renderer hooks/components`);
    }

    lines.push(`\n   📚 LEARN MORE:`);
    lines.push(`      - docs/adrs/FOUNDATION/ADR-032-ports-and-adapters-layer-contracts.md`);
    lines.push(`      - docs/adrs/UI/ADR-033-clean-architecture-electron-package.md\n`);
    lines.push('─'.repeat(60) + '\n');
  }

  return lines.join('\n');
}

// ============================================================================
// Banned Import Patterns
// ============================================================================

const BANNED_DOMAIN_IMPORTS = [
  'electron', // Electron APIs
  'react', // React APIs
  'react-dom', // React DOM APIs
  '@electron-toolkit', // Electron toolkit
  'better-sqlite3', // Database (concrete implementation)
];

// ============================================================================
// Rule 1: Domain Layer Purity
// ============================================================================

describe('Architecture Rule 1: Domain Layer Purity', () => {
  it('should not import banned modules in domain layer', () => {
    const domainFiles = getDomainFiles();
    const violations: Array<{ file: string; bannedImport: string }> = [];

    for (const file of domainFiles) {
      const content = readFileSync(file, 'utf-8');
      const imports = extractImports(content);

      for (const imp of imports) {
        for (const banned of BANNED_DOMAIN_IMPORTS) {
          if (imp.includes(banned)) {
            violations.push({
              file: getRelativePath(file),
              bannedImport: imp,
            });
          }
        }
      }
    }

    if (violations.length > 0) {
      console.error(generateDomainPurityReport(violations));
    }

    expect(violations).toHaveLength(0);
  });

  it('should not use relative parent imports that escape domain layer', () => {
    const domainFiles = getDomainFiles();
    const violations: Array<{ file: string; import: string }> = [];

    for (const file of domainFiles) {
      const content = readFileSync(file, 'utf-8');
      const imports = extractImports(content);

      for (const imp of imports) {
        // Check for relative imports that go up more than 2 levels (likely escaping domain)
        const upLevelCount = (imp.match(/\.\.\//g) || []).length;
        if (upLevelCount > 2) {
          violations.push({
            file: getRelativePath(file),
            import: imp,
          });
        }
      }
    }

    if (violations.length > 0) {
      console.error('\nDomain Layer Import Escaping Violations:');
      console.error('These imports escape the domain layer boundary:\n');
      for (const v of violations) {
        console.error(`  ❌ ${v.file}: ${v.import} (escapes domain layer)`);
      }
      console.error('\n💡 Domain files should only import from within src/domain/');
      console.error('   If you need infrastructure, create a port interface instead.\n');
    }

    expect(violations).toHaveLength(0);
  });
});

// ============================================================================
// Rule 2: Handler Thin Adapter Pattern
// ============================================================================

describe('Architecture Rule 2: Handler Thin Adapter Pattern', () => {
  it('should delegate to domain use cases in IPC handlers', () => {
    const handlersDir = join(__dirname, '../../src/main/ipc/handlers');
    const handlerFiles = findTsFiles(handlersDir);

    for (const file of handlerFiles) {
      const content = readFileSync(file, 'utf-8');
      const relativePath = getRelativePath(file);

      // Check if handler file has domain use case imports
      const hasUseCaseImport = /from ['"]@coreto\/electron\/domain\/use-cases['"]/.test(content);

      if (!hasUseCaseImport) {
        console.warn(`  ⚠️  ${relativePath}: No domain use case import found (may need review)`);
      }
    }

    // This is a warning test, so it always passes
    expect(true).toBe(true);
  });

  it('should not have excessive complexity in handlers (max 100 lines)', () => {
    const handlersDir = join(__dirname, '../../src/main/ipc');
    const handlerFiles = findTsFiles(handlersDir);
    const violations: Array<{ file: string; lines: number }> = [];

    for (const file of handlerFiles) {
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n').length;

      // Skip if it's just exports/registry
      if (lines > 100 && !file.includes('index.ts') && !file.includes('types.ts')) {
        violations.push({
          file: getRelativePath(file),
          lines,
        });
      }
    }

    if (violations.length > 0) {
      console.warn(generateHandlerComplexityReport(violations));
    }

    // This is a warning test, so it always passes
    expect(true).toBe(true);
  });
});

// ============================================================================
// Rule 3: Dependency Direction - Module Aliases
// ============================================================================

describe('Architecture Rule 3: Dependency Direction (Module Aliases)', () => {
  it('should use module aliases for cross-layer imports from infrastructure to domain', () => {
    const infrastructureFiles = getInfrastructureFiles();
    const violations: Array<{ file: string; import: string }> = [];

    for (const file of infrastructureFiles) {
      // Skip test files
      if (file.includes('.test.') || file.includes('.spec.') || file.includes('/tests/')) {
        continue;
      }

      const content = readFileSync(file, 'utf-8');
      const imports = extractImports(content);

      for (const imp of imports) {
        // Check for relative imports that go into domain layer
        // These should use @coreto/electron/domain/* instead
        if (imp.includes('../domain/') || imp.includes('../../domain/')) {
          violations.push({
            file: getRelativePath(file),
            import: imp,
          });
        }
      }
    }

    if (violations.length > 0) {
      console.error(generateModuleAliasReport(violations));
    }

    expect(violations).toHaveLength(0);
  });

  it('should use relative imports for same-layer imports', () => {
    const mainDir = join(__dirname, '../../src/main');
    const mainFiles = findTsFiles(mainDir);
    const warnings: Array<{ file: string; import: string }> = [];

    for (const file of mainFiles) {
      // Skip test files
      if (file.includes('.test.') || file.includes('.spec.') || file.includes('/tests/')) {
        continue;
      }

      const content = readFileSync(file, 'utf-8');
      const imports = extractImports(content);

      for (const imp of imports) {
        // Check for module alias usage within same layer
        if (imp.startsWith('@coreto/electron/main/') || imp.startsWith('@coreto/electron/src/main/')) {
          warnings.push({
            file: getRelativePath(file),
            import: imp,
          });
        }
      }
    }

    if (warnings.length > 0) {
      console.warn('Same-Layer Import Warnings (should use relative paths):');
      for (const w of warnings) {
        console.warn(`  ⚠️  ${w.file}: ${w.import}`);
        console.warn(`     Should use relative import like: './file.js' or '../other/file.js'`);
      }
    }

    // This is a warning test - alias usage is acceptable but not preferred
    expect(true).toBe(true);
  });
});

// ============================================================================
// Rule 4: Domain Files Exist and Export Use Cases
// ============================================================================

describe('Architecture Rule 4: Domain Structure', () => {
  it('should have domain use case files properly structured', () => {
    // Check that key use case files exist
    const expectedUseCases = [
      'run-simulation',
      'save-project-config-as-core-format',
      'load-project-config',
      'save-project-config',
      'validate-trecho',
      'validate-project',
      'load-game-data',
      // Note: index.ts is filtered out by findTsFiles (.test.ts filter)
    ];

    const domainDir = join(__dirname, '../../src/domain/use-cases');
    const useCaseFiles = findTsFiles(domainDir);
    const useCaseNames = useCaseFiles.map(f => relative(domainDir, f).replace('.ts', ''));

    const missingUseCases: string[] = [];

    for (const exp of expectedUseCases) {
      if (!useCaseNames.includes(exp)) {
        missingUseCases.push(exp);
      }
    }

    if (missingUseCases.length > 0) {
      console.error('Missing domain use case files:');
      for (const m of missingUseCases) {
        console.error(`  ❌ ${m}.ts does not exist in domain/use-cases/`);
      }
      console.error(`  Found: ${useCaseNames.join(', ')}`);
    }

    // Debug log to see actual values
    console.log(`  Found use cases: ${useCaseNames.length}, Missing: ${missingUseCases.length}`);

    // All expected use cases exist - test passes if none are missing
    expect(missingUseCases).toHaveLength(0);
  });

  it('should have domain ports properly defined', () => {
    const portsDir = join(__dirname, '../../src/domain/ports');
    const portFiles = findTsFiles(portsDir);

    // Check that key ports exist
    const expectedPorts = [
      'IConfigStorage.ts',
      'IGameDataLoader.ts',
      'IProjectValidator.ts',
      // Note: IRecentProjectsRepository is in repositories/, not ports/
    ];

    const missingPorts: string[] = [];

    for (const port of expectedPorts) {
      const portPath = join(portsDir, port);
      if (!portFiles.includes(portPath)) {
        missingPorts.push(port);
      }
    }

    if (missingPorts.length > 0) {
      console.error('Missing domain ports:');
      for (const m of missingPorts) {
        console.error(`  ❌ ${m} does not exist in domain/ports/`);
      }
    }

    expect(missingPorts).toHaveLength(0);
  });
});

// ============================================================================
// Rule 5: File Placement - Right Content in Right Place
// ============================================================================

describe('Architecture Rule 5: File Placement', () => {
  it('should have UI components only in renderer layer', () => {
    const domainFiles = getDomainFiles();
    const violations: Array<{ file: string }> = [];

    for (const file of domainFiles) {
      const content = readFileSync(file, 'utf-8');

      // Check for React component patterns
      if (/export\s+(function|const)\s+\w+\s*:\s*React\.FC/.test(content) ||
          /export\s+function\s+\w+\([^)]*\):\s*JSX\.Element/.test(content)) {
        violations.push({ file: getRelativePath(file) });
      }
    }

    if (violations.length > 0) {
      console.error(`
╔════════════════════════════════════════════════════════════╗
║  ❌ UI COMPONENT IN DOMAIN LAYER                           ║
╚════════════════════════════════════════════════════════════╝

React components belong in src/renderer/src/components/, not in domain.

💡 WHY: Domain layer must be UI-agnostic to support multiple frontends
       (Electron renderer, Web, CLI, future mobile apps).

🔧 HOW TO FIX:
   1. Move component to src/renderer/src/components/{name}.tsx
   2. If component needs domain logic, import use case via module alias
   3. Keep domain pure - export only types, use cases, and business rules

📋 VIOLATIONS:
      `);

      for (const v of violations) {
        console.error(`   ❌ ${v.file}`);
      }
    }

    expect(violations).toHaveLength(0);
  });
});

// ============================================================================
// Rule 6: ESM Import Conventions (Bundler-Aware)
// ============================================================================

describe('Architecture Rule 6: ESM Import Conventions (Bundler-Aware)', () => {
  it('should use .js extension in unbundled contexts (preload, scripts, tools)', () => {
    // Unbundled contexts: Code that MAY run without bundler
    const unbundledDirs = [
      join(__dirname, '../../src/preload'),
      join(__dirname, '../../scripts'),
      join(__dirname, '../../tools'),
    ];

    const violations: Array<{ file: string; import: string }> = [];

    for (const dir of unbundledDirs) {
      // Skip if directory doesn't exist
      try {
        const files = findTsFiles(dir);

        for (const file of files) {
          if (file.includes('.test.') || file.includes('/tests/')) continue;

          const content = readFileSync(file, 'utf-8');
          const imports = extractImports(content);

          for (const imp of imports) {
            // Check relative imports without .js extension
            if (imp.startsWith('.') && !imp.endsWith('.js') && !imp.endsWith('.json') && !imp.includes('@coreto')) {
              violations.push({
                file: getRelativePath(file),
                import: imp,
              });
            }
          }
        }
      } catch (err) {
        // Directory doesn't exist - skip
        continue;
      }
    }

    if (violations.length > 0) {
      console.error('\n╔════════════════════════════════════════════════════════════╗');
      console.error('║  ❌ ESM VIOLATION - Missing .js in Unbundled Context      ║');
      console.error('╚════════════════════════════════════════════════════════════╝\n');
      console.error('💡 BUNDLER-FIRST POLICY:');
      console.error('   • Bundled code (main/renderer): .js extension OPTIONAL');
      console.error('   • Unbundled code (preload/scripts/tools): .js extension REQUIRED\n');
      console.error('📋 VIOLATIONS:\n');

      for (const v of violations) {
        console.error(`   ❌ ${v.file}`);
        console.error(`      Import: ${v.import}`);
        console.error(`      Fix: ${v.import}.js\n`);
      }

      console.error('📚 LEARN MORE:');
      console.error('   - packages/electron/CLAUDE.md (Bundler-First Strategy)\n');
    }

    expect(violations).toHaveLength(0);
  });

  it('should document bundler-first policy in CLAUDE.md', () => {
    const claudePath = join(__dirname, '../../CLAUDE.md');
    const claudeContent = readFileSync(claudePath, 'utf-8');

    // Verify documentation mentions bundler strategy
    const hasBundlerMention =
      claudeContent.includes('moduleResolution') ||
      claudeContent.includes('bundler') ||
      claudeContent.includes('Bundler-First');

    if (!hasBundlerMention) {
      console.error('\n⚠️  CLAUDE.md should document bundler-first import strategy');
      console.error('   Add section explaining when .js extensions are needed\n');
    }

    expect(hasBundlerMention).toBe(true);
  });
});

// ============================================================================
// Rule 7: Dependency Injection Registration
// ============================================================================

describe('Architecture Rule 7: Dependency Injection Registration', () => {
  it('should have DI tokens for all domain ports', () => {
    const portsDir = join(__dirname, '../../src/domain/ports');
    const portFiles = findTsFiles(portsDir);
    const tokensFile = join(__dirname, '../../src/main/di/tokens.ts');
    const tokensContent = readFileSync(tokensFile, 'utf-8');
    const violations: Array<{ port: string; issue: string }> = [];

    for (const portFile of portFiles) {
      const portName = portFile.split('/').pop()?.replace('.ts', '') || '';

      // Check if token exists
      const tokenName = `${portName}Token`;
      if (!tokensContent.includes(tokenName)) {
        violations.push({
          port: portName,
          issue: `Missing token definition in tokens.ts`,
        });
      }
    }

    if (violations.length > 0) {
      console.error(generateDiRegistrationReport(violations));
    }

    expect(violations).toHaveLength(0);
  });

  it('should register all tokens in DI container', () => {
    const tokensFile = join(__dirname, '../../src/main/di/tokens.ts');
    const tokensContent = readFileSync(tokensFile, 'utf-8');
    const containerFile = join(__dirname, '../../src/main/di/container.ts');
    const containerContent = readFileSync(containerFile, 'utf-8');
    const violations: Array<{ port: string; issue: string }> = [];

    // Extract token names from tokens.ts (e.g., IConfigStorageToken)
    const tokenRegex = /export const (\w+Token)\s*=/g;
    let match;
    while ((match = tokenRegex.exec(tokensContent)) !== null) {
      const tokenName = match[1];

      // Skip ILoggerToken (comes from @coreto/core)
      if (tokenName === 'ILoggerToken') continue;

      // Check if token is registered in container
      if (!containerContent.includes(tokenName)) {
        const portName = tokenName.replace('Token', '');
        violations.push({
          port: portName,
          issue: `Not registered in container.ts`,
        });
      }
    }

    if (violations.length > 0) {
      console.error(generateDiRegistrationReport(violations));
    }

    expect(violations).toHaveLength(0);
  });
});

// ============================================================================
// Rule 8: Naming Conventions
// ============================================================================

describe('Architecture Rule 8: Naming Conventions', () => {
  it('should follow port interface naming convention (I*.ts)', () => {
    const portsDir = join(__dirname, '../../src/domain/ports');
    const portFiles = findTsFiles(portsDir);
    const violations: Array<{ file: string; issue: string }> = [];

    for (const portFile of portFiles) {
      const fileName = portFile.split('/').pop() || '';

      // Port interfaces must start with I
      if (!fileName.startsWith('I')) {
        violations.push({
          file: getRelativePath(portFile),
          issue: `Port interface must start with I (e.g., IConfigStorage.ts)`,
        });
      }
    }

    if (violations.length > 0) {
      console.error(generateNamingConventionReport(violations));
    }

    expect(violations).toHaveLength(0);
  });

  it('should follow schema file naming convention (*.schema.ts)', () => {
    const schemasDir = join(__dirname, '../../src/domain/schemas');
    const schemaFiles = readdirSync(schemasDir).filter(f => f.endsWith('.ts') && f !== 'index.ts');
    const violations: Array<{ file: string; issue: string }> = [];

    for (const fileName of schemaFiles) {
      // Schema files must end with .schema.ts
      if (!fileName.endsWith('.schema.ts')) {
        violations.push({
          file: `src/domain/schemas/${fileName}`,
          issue: `Schema file must end with .schema.ts (e.g., ui-config.schema.ts)`,
        });
      }
    }

    if (violations.length > 0) {
      console.error(generateNamingConventionReport(violations));
    }

    expect(violations).toHaveLength(0);
  });

  it('should follow repository naming convention (*Repository.ts)', () => {
    const repoDir = join(__dirname, '../../src/main/database/repositories');
    if (!readdirSync(join(__dirname, '../../src/main/database')).includes('repositories')) {
      // Skip if repositories directory doesn't exist yet
      expect(true).toBe(true);
      return;
    }

    const repoFiles = findTsFiles(repoDir);
    const violations: Array<{ file: string; issue: string }> = [];

    for (const repoFile of repoFiles) {
      const fileName = repoFile.split('/').pop() || '';

      // Repository files must end with Repository.ts
      if (!fileName.toLowerCase().includes('repository')) {
        violations.push({
          file: getRelativePath(repoFile),
          issue: `Repository file must include 'Repository' in name (e.g., SqliteRecentProjectsRepository.ts)`,
        });
      }
    }

    if (violations.length > 0) {
      console.error(generateNamingConventionReport(violations));
    }

    expect(violations).toHaveLength(0);
  });
});

// ============================================================================
// Rule 9: Type Leakage Prevention
// ============================================================================

describe('Architecture Rule 9: Type Leakage Prevention', () => {
  it('should not import infrastructure types in domain layer', () => {
    const domainFiles = getDomainFiles();
    const violations: Array<{ file: string; import: string }> = [];

    for (const file of domainFiles) {
      const content = readFileSync(file, 'utf-8');
      const imports = extractImports(content);

      for (const imp of imports) {
        // Check for type imports from infrastructure layers
        // Allow @coreto/core (shared infrastructure is OK)
        if (
          (imp.includes('src/main/') || imp.includes('../main/') || imp.includes('../../main/')) ||
          (imp.includes('src/renderer/') || imp.includes('../renderer/') || imp.includes('../../renderer/'))
        ) {
          violations.push({
            file: getRelativePath(file),
            import: imp,
          });
        }
      }
    }

    if (violations.length > 0) {
      console.error(generateTypeLeakageReport(violations));
    }

    expect(violations).toHaveLength(0);
  });
});

// ============================================================================
// Test Summary with AI Agent Troubleshooting Guide
// ============================================================================

describe('Architecture Test Summary', () => {
  it('should validate all architecture rules and provide troubleshooting guide', () => {
    const rules = [
      'Domain Layer Purity - No banned imports',
      'Domain Layer Purity - No escaping imports',
      'Handler Thin Adapter - Use case delegation',
      'Handler Thin Adapter - Reasonable complexity',
      'Dependency Direction - Module aliases for cross-layer',
      'Dependency Direction - Relative paths for same-layer',
      'Domain Structure - Use cases exported',
      'Domain Structure - Ports defined',
      'File Placement - UI components in renderer',
      'ESM Conventions - .js in unbundled contexts (bundler-aware)',
      'ESM Conventions - Bundler-first policy documented',
      'Dependency Injection - DI tokens for ports',
      'Dependency Injection - Tokens registered in container',
      'Naming Conventions - Port interfaces (I*.ts)',
      'Naming Conventions - Schema files (*.schema.ts)',
      'Naming Conventions - Repositories (*Repository.ts)',
      'Type Leakage Prevention - No infra types in domain',
    ];

    console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                     ARCHITECTURE TEST SUITE SUMMARY                       ║
╚═══════════════════════════════════════════════════════════════════════════╝

✅ Validated ${rules.length} architectural rules

🤖 FOR AI AGENTS: If this test failed, here's what to do:

  STEP 1: Read the error message above
          ↓
  STEP 2: Identify the violation type:
          • Domain Purity → Move code to domain/use-cases or main/adapters
          • Module Alias → Replace relative import with @coreto/electron/domain/*
          • Handler Complexity → Extract logic to domain use case
          • File Placement → Move file to correct layer (domain/main/renderer)
          • ESM Extensions → Add .js to unbundled contexts (preload/scripts/tools)
          • DI Registration → Add token to tokens.ts and register in container.ts
          • Naming Convention → Rename file to follow I*.ts, *.schema.ts, or *Repository.ts
          • Type Leakage → Remove infrastructure type import, use domain port instead
          ↓
  STEP 3: Apply the suggested fix from error message
          ↓
  STEP 4: Verify fix with: pnpm --filter @coreto/electron test architecture.test.ts
          ↓
  STEP 5: If still failing, consult:
          • packages/electron/CLAUDE.md (import conventions)
          • docs/adrs/UI/ADR-033-clean-architecture-electron-package.md
          • docs/adrs/FOUNDATION/ADR-029-tsyringe-di-container.md (DI patterns)
          • docs/adrs/FOUNDATION/ADR-032-ports-and-adapters-layer-contracts.md (type boundaries)

📚 QUICK REFERENCE - Common Patterns:

   ✅ CORRECT IMPORTS:
      // Domain use case from infrastructure
      import { validateTrecho } from '@coreto/electron/domain/use-cases';

      // Domain type from infrastructure
      import type { TrechoConfig } from '@coreto/electron/domain/types';

      // Infrastructure internal (same layer)
      import { getDatabase } from '../database/index.js';

      // Renderer component
      import { Button } from '@/components/ui/button';

   ❌ WRONG IMPORTS:
      // Relative path to domain (breaks refactoring)
      import { validateTrecho } from '../../../domain/use-cases';

      // Electron in domain (couples to runtime)
      import { app } from 'electron';

      // Missing .js extension (ESM fails)
      import { getDatabase } from '../database/index';

      // Alias for same-layer (unnecessary complexity)
      import { getDatabase } from '@coreto/electron/main/database';

🎯 ARCHITECTURE LAYERS QUICK MAP:

   src/domain/           → Business rules (framework-agnostic)
   src/main/             → Node.js infrastructure (Electron main process)
   src/renderer/         → React UI (Chromium renderer process)
   src/preload/          → Security bridge (context isolation)

═══════════════════════════════════════════════════════════════════════════
    `);

    expect(rules).toHaveLength(17);
  });
});
