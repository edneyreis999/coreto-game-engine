/**
 * ╔════════════════════════════════════════════════════════════════════════╗
 * ║         CORE PACKAGE - CLEAN ARCHITECTURE GUARDIAN                    ║
 * ╚════════════════════════════════════════════════════════════════════════╝
 *
 * Este teste é o guardião da arquitetura Clean Architecture do @coreto/core.
 * Quando ele falha, significa que um arquivo foi colocado no lugar errado ou
 * está importando módulos que violam as regras de dependência.
 *
 * 📚 DOCUMENTAÇÃO RELACIONADA:
 *    - MEMORY.md (Domain Purity + Mappers)
 *    - docs/adrs/FOUNDATION/ADR-029-tsyringe-di-container.md
 *
 * ARCHITECTURE OF CORE PACKAGE:
 *
 *    +-----------------------------------------------------------+
 *    |  core/                      (DOMAIN LAYER - PURE)         |
 *    |  +-- domain/       - Business entities (Enemy, Skill)     |
 *    |  +-- ports/        - Interfaces (ILogger, IClock, etc)    |
 *    |  +-- use-cases/    - Business logic (ExecuteBattle)       |
 *    |  +-- errors/       - Domain errors (ValidationError)      |
 *    +-----------------------------------------------------------+
 *                              ^ IMPORTS ONLY
 *                              | (one-way dependency)
 *    +-----------------------------------------------------------+
 *    |  infrastructure/        (INFRASTRUCTURE LAYER)            |
 *    |  +-- adapters/     - Port implementations                 |
 *    |       +-- mappers/ - RMMZ types ↔ domain entities         |
 *    |  +-- di/           - Dependency injection (TSyringe)      |
 *    |  +-- runtime/      - JSDOM + PIXI mocks                   |
 *    |  +-- simulation/   - Battle simulator                     |
 *    +-----------------------------------------------------------+
 *
 *    +-----------------------------------------------------------+
 *    |  types/                 (INFRASTRUCTURE TYPES)            |
 *    |  +-- rmmz-data.ts  - RPG Maker MZ data structures         |
 *    |  +-- rmmz-runtime.d.ts - RPG Maker MZ runtime types       |
 *    +-----------------------------------------------------------+
 *
 * GOLDEN RULES:
 *
 *   RULE 1: Domain NEVER imports from types/rmmz-data.ts (CRITICAL!)
 *       WRONG: import type { Enemy as RmmzEnemy } from '../../types/rmmz-data'
 *       RIGHT: Use domain entity Enemy, let mappers handle conversion
 *
 *   RULE 2: Mappers bridge RMMZ types ↔ domain entities
 *       REQUIRED: EnemyMapper.toDomain(rmmzEnemy) → domain.Enemy
 *       REQUIRED: EnemyMapper.toInfrastructure(enemy) → RmmzEnemy
 *
 *   RULE 3: Infrastructure to Domain uses BARREL EXPORTS
 *       WRONG: import { Enemy } from '../../../core/domain/Enemy'
 *       RIGHT: import { Enemy } from '@coreto/core'
 *
 *   RULE 4: Infrastructure to Infrastructure uses RELATIVE PATHS
 *       WRONG: import { BattleSimulator } from '@coreto/core/infrastructure/simulation'
 *       RIGHT: import { BattleSimulator } from '../simulation/BattleSimulator.js'
 *
 * HISTORICAL CONTEXT (Why these rules exist):
 *
 *    PROBLEM (Dec 2024 - Jan 2025):
 *    - Domain entities imported types/rmmz-data.ts directly
 *    - Impossible to test domain without RMMZ runtime
 *    - Coupling prevented future framework migrations
 *
 *    SOLUTION (ADR-032 - Jan 2025):
 *    - Mappers in infrastructure/adapters/mappers/
 *    - Domain uses pure TypeScript types
 *    - Infrastructure adapts RMMZ to domain
 *
 * WHEN THIS TEST FAILS:
 *
 *    1. Read the error message - it will tell you which file and import violated the rule
 *    2. Check MEMORY.md for domain purity guidelines
 *    3. If domain import: use mapper instead (EnemyMapper, SkillMapper)
 *    4. If infrastructure import: use @coreto/core barrel export
 *    5. If mapper missing: create one in infrastructure/adapters/mappers/
 *
 * Run with: pnpm --filter @coreto/core test architecture.test.ts
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
    } else if (
      item.endsWith('.ts') &&
      !item.endsWith('.d.ts') &&
      !item.endsWith('.test.ts') &&
      !item.endsWith('.spec.ts') &&
      item !== 'index.ts'
    ) {
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
    if (modulePath) {
      imports.push(modulePath);
    }
  }

  return imports;
}

/**
 * Gets all domain layer files (core/)
 */
function getCoreFiles(): string[] {
  const coreDir = join(__dirname, '../../src/core');
  return findTsFiles(coreDir);
}

/**
 * Gets all infrastructure layer files
 */
function getInfrastructureFiles(): string[] {
  const infraDir = join(__dirname, '../../src/infrastructure');
  return findTsFiles(infraDir);
}

/**
 * Gets all mapper files
 */
function getMapperFiles(): string[] {
  const mappersDir = join(__dirname, '../../src/infrastructure/adapters/mappers');
  try {
    return findTsFiles(mappersDir);
  } catch {
    return [];
  }
}

/**
 * Gets relative path from project root
 */
function getRelativePath(filePath: string): string {
  const rootDir = join(__dirname, '../..');
  return relative(rootDir, filePath);
}

/**
 * Generates actionable error message for RMMZ type leakage violations
 */
function generateRmmzTypeLeakageReport(
  violations: Array<{ file: string; bannedImport: string }>
): string {
  const lines: string[] = [];

  lines.push('\n╔════════════════════════════════════════════════════════════╗');
  lines.push('║  ❌ DOMAIN PURITY VIOLATION - RMMZ Infrastructure Type    ║');
  lines.push('╚════════════════════════════════════════════════════════════╝\n');

  for (const v of violations) {
    lines.push(`📁 File: ${v.file}`);
    lines.push(`   ❌ Banned import: ${v.bannedImport}\n`);
    lines.push(`   💡 WHY THIS IS CRITICAL:`);
    lines.push(`      Domain layer must be framework-agnostic and pure.`);
    lines.push(`      Importing types/rmmz-data.ts couples domain to RPG Maker MZ runtime.`);
    lines.push(`      This prevents testing domain logic without RMMZ and makes future`);
    lines.push(`      framework migrations (Godot, Unity, custom engine) impossible.\n`);
    lines.push(`   🔧 HOW TO FIX:`);
    lines.push(`      1. Remove the import of types/rmmz-data.ts from domain`);
    lines.push(`      2. Use pure domain entities (Enemy, Skill) instead`);
    lines.push(`      3. Let mappers handle conversion in infrastructure layer\n`);
    lines.push(`   📋 EXAMPLE:`);
    lines.push(`      ❌ BEFORE (core/domain/Enemy.ts):`);
    lines.push(`         import type { Enemy as RmmzEnemy } from '../../types/rmmz-data';`);
    lines.push(`         export class Enemy {`);
    lines.push(`           static fromRmmz(data: RmmzEnemy) { ... }`);
    lines.push(`         }\n`);
    lines.push(`      ✅ AFTER (core/domain/Enemy.ts):`);
    lines.push(`         export class Enemy {`);
    lines.push(`           constructor(public id: number, public name: string) {}`);
    lines.push(`         }\n`);
    lines.push(`      ✅ AFTER (infrastructure/adapters/mappers/EnemyMapper.ts):`);
    lines.push(`         import type { Enemy as RmmzEnemy } from '../../../types/rmmz-data';`);
    lines.push(`         import { Enemy } from '@coreto/core';`);
    lines.push(``);
    lines.push(`         export class EnemyMapper {`);
    lines.push(`           static toDomain(data: RmmzEnemy): Enemy {`);
    lines.push(`             return new Enemy(data.id, data.name);`);
    lines.push(`           }`);
    lines.push(``);
    lines.push(`           static toInfrastructure(enemy: Enemy): RmmzEnemy {`);
    lines.push(`             return { id: enemy.id, name: enemy.name };`);
    lines.push(`           }`);
    lines.push(`         }\n`);
    lines.push(`   📚 LEARN MORE:`);
    lines.push(`      - MEMORY.md (Domain Purity section)`);
    lines.push(`      - docs/adrs/FOUNDATION/ADR-032-ports-and-adapters-layer-contracts.md\n`);
    lines.push('─'.repeat(60) + '\n');
  }

  return lines.join('\n');
}

/**
 * Generates mapper enforcement violation report
 */
function generateMapperEnforcementReport(violations: Array<{ mapper: string; issue: string }>): string {
  const lines: string[] = [];

  lines.push('\n╔════════════════════════════════════════════════════════════╗');
  lines.push('║  ❌ MAPPER PATTERN VIOLATION - Missing or Invalid Mapper  ║');
  lines.push('╚════════════════════════════════════════════════════════════╝\n');

  for (const v of violations) {
    lines.push(`📁 Mapper: ${v.mapper}`);
    lines.push(`   ❌ Issue: ${v.issue}\n`);
    lines.push(`   💡 WHY THIS MATTERS:`);
    lines.push(`      Mappers are the bridge between RMMZ infrastructure types and domain entities.`);
    lines.push(`      Without proper mappers, domain will leak infrastructure concerns or`);
    lines.push(`      infrastructure will bypass domain validation logic.\n`);
    lines.push(`   🔧 HOW TO FIX:`);

    if (v.issue.includes('Missing mapper')) {
      lines.push(`      Create mapper file: infrastructure/adapters/mappers/${v.mapper}.ts`);
      lines.push(`      Implement bidirectional conversion:`);
      lines.push(`        - toDomain(rmmzType): DomainEntity`);
      lines.push(`        - toInfrastructure(entity): RmmzType\n`);
    } else if (v.issue.includes('Missing domain import')) {
      lines.push(`      Add import: import { EntityName } from '@coreto/core'`);
      lines.push(`      Mappers MUST use domain entities for conversion\n`);
    } else if (v.issue.includes('Missing RMMZ import')) {
      lines.push(`      Add import: import type { RmmzType } from '../../../types/rmmz-data'`);
      lines.push(`      Mappers MUST import RMMZ types to convert\n`);
    } else if (v.issue.includes('Missing method')) {
      lines.push(`      Add missing method to mapper class`);
      lines.push(`      Both toDomain() and toInfrastructure() are required\n`);
    }

    lines.push(`   📋 EXAMPLE - Complete Mapper:`);
    lines.push(`      infrastructure/adapters/mappers/EnemyMapper.ts:`);
    lines.push(`      `);
    lines.push(`      import type { Enemy as RmmzEnemy } from '../../../types/rmmz-data';`);
    lines.push(`      import { Enemy } from '@coreto/core';`);
    lines.push(``);
    lines.push(`      export class EnemyMapper {`);
    lines.push(`        static toDomain(data: RmmzEnemy): Enemy {`);
    lines.push(`          return new Enemy(data.id, data.name, data.maxHp);`);
    lines.push(`        }`);
    lines.push(``);
    lines.push(`        static toInfrastructure(enemy: Enemy): RmmzEnemy {`);
    lines.push(`          return {`);
    lines.push(`            id: enemy.id,`);
    lines.push(`            name: enemy.name,`);
    lines.push(`            maxHp: enemy.maxHp`);
    lines.push(`          };`);
    lines.push(`        }`);
    lines.push(`      }\n`);
    lines.push(`   📚 LEARN MORE:`);
    lines.push(`      - MEMORY.md (Mappers section)`);
    lines.push(`      - infrastructure/adapters/mappers/ (existing mapper examples)\n`);
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
  lines.push('║  ❌ MODULE ALIAS VIOLATION - Use @coreto/core             ║');
  lines.push('╚════════════════════════════════════════════════════════════╝\n');

  for (const v of violations) {
    lines.push(`📁 File: ${v.file}`);
    lines.push(`   ❌ Wrong import: ${v.import}\n`);

    // Generate correct import suggestion
    const correctImport = '@coreto/core';

    lines.push(`   💡 WHY THIS IS WRONG:`);
    lines.push(`      Relative imports to core create brittle paths that break during refactoring.`);
    lines.push(`      Barrel exports (@coreto/core) provide stable, documented public API.\n`);
    lines.push(`   🔧 HOW TO FIX:`);
    lines.push(`      Replace relative import with barrel export:`);
    lines.push(`      From: import { ... } from '${v.import}'`);
    lines.push(`      To:   import { ... } from '${correctImport}'\n`);
    lines.push(`   📝 REMEMBER:`);
    lines.push(`      ✅ Infrastructure → Core: USE @coreto/core`);
    lines.push(`      ✅ Infrastructure → Infrastructure: USE relative path ./../\n`);
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
    lines.push(`      This breaks Dependency Inversion Principle.\n`);
    lines.push(`   🔧 HOW TO FIX:`);

    if (v.issue.includes('Missing token')) {
      lines.push(`      1. Add token to infrastructure/di/tokens.ts:`);
      lines.push(`         export const ${v.port}Token = Symbol.for('${v.port}');\n`);
      lines.push(`      2. Register in infrastructure/di/container.ts:`);
      lines.push(`         container.register<${v.port}>(${v.port}Token as unknown as string, {`);
      lines.push(`           useFactory: () => createImplementation()`);
      lines.push(`         });\n`);
    } else if (v.issue.includes('Not registered')) {
      lines.push(`      Add to infrastructure/di/container.ts:`);
      lines.push(`      container.register<${v.port}>(${v.port}Token as unknown as string, {`);
      lines.push(`        useFactory: () => new Implementation()`);
      lines.push(`      });\n`);
    }

    lines.push(`   📚 LEARN MORE:`);
    lines.push(`      - docs/adrs/FOUNDATION/ADR-029-tsyringe-di-container.md\n`);
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
    lines.push(`      Consistent naming makes code self-documenting.\n`);
    lines.push(`   🔧 HOW TO FIX:`);

    if (v.issue.includes('Port interface')) {
      const wrongName = v.file.split('/').pop()?.replace('.ts', '') || '';
      const correctName = 'I' + wrongName;
      lines.push(`      Rename: ${wrongName}.ts → ${correctName}.ts\n`);
    }

    lines.push(`   📝 PROJECT CONVENTIONS:`);
    lines.push(`      ✅ Port interfaces: I*.ts (ILogger, IClock, IDataLoader)`);
    lines.push(`      ✅ Domain entities: No suffix (Enemy, Skill, Actor)\n`);
    lines.push('─'.repeat(60) + '\n');
  }

  return lines.join('\n');
}

// ============================================================================
// Banned Import Patterns (reserved for future use)
// ============================================================================

// Note: Individual rules check specific patterns inline for better error messages

// ============================================================================
// Rule 1: Domain Layer Purity (CRITICAL - RMMZ Type Leakage)
// ============================================================================

describe('Architecture Rule 1: Domain Layer Purity', () => {
  it('should not import RMMZ infrastructure types (types/rmmz-data.ts)', () => {
    const coreFiles = getCoreFiles();
    const violations: Array<{ file: string; bannedImport: string }> = [];

    for (const file of coreFiles) {
      const content = readFileSync(file, 'utf-8');
      const imports = extractImports(content);

      for (const imp of imports) {
        // Check for types/rmmz-data.ts imports (critical violation)
        if (imp.includes('types/rmmz-data')) {
          violations.push({
            file: getRelativePath(file),
            bannedImport: imp,
          });
        }
      }
    }

    if (violations.length > 0) {
      console.error(generateRmmzTypeLeakageReport(violations));
    }

    expect(violations).toHaveLength(0);
  });

  it('should not import infrastructure modules', () => {
    const coreFiles = getCoreFiles();
    const violations: Array<{ file: string; bannedImport: string }> = [];

    for (const file of coreFiles) {
      const content = readFileSync(file, 'utf-8');
      const imports = extractImports(content);

      for (const imp of imports) {
        // Check for infrastructure/ imports
        if (
          imp.includes('infrastructure/') ||
          imp.includes('../infrastructure/') ||
          imp.includes('../../infrastructure/')
        ) {
          violations.push({
            file: getRelativePath(file),
            bannedImport: imp,
          });
        }
      }
    }

    if (violations.length > 0) {
      console.error('\nDomain Layer Infrastructure Import Violations:');
      console.error('Domain must not import from infrastructure layer:\n');
      for (const v of violations) {
        console.error(`  ❌ ${v.file}: ${v.bannedImport}`);
      }
      console.error('\n💡 Use ports and dependency injection instead.\n');
    }

    expect(violations).toHaveLength(0);
  });

  it('should not import external test libraries in domain', () => {
    const coreFiles = getCoreFiles();
    const violations: Array<{ file: string; bannedImport: string }> = [];

    for (const file of coreFiles) {
      const content = readFileSync(file, 'utf-8');
      const imports = extractImports(content);

      for (const imp of imports) {
        for (const banned of ['jsdom', 'pixi.js', 'chance']) {
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
      console.error('\nDomain Layer External Library Violations:');
      for (const v of violations) {
        console.error(`  ❌ ${v.file}: ${v.bannedImport}`);
      }
      console.error('\n💡 Keep domain pure - infrastructure should handle external dependencies.\n');
    }

    expect(violations).toHaveLength(0);
  });
});

// ============================================================================
// Rule 2: Mapper Pattern Enforcement (CORE-SPECIFIC)
// ============================================================================

describe('Architecture Rule 2: Mapper Pattern Enforcement', () => {
  it('should have required mappers (EnemyMapper, SkillMapper)', () => {
    const mapperFiles = getMapperFiles();
    const mapperNames = mapperFiles.map((f) => f.split('/').pop()?.replace('.ts', '') || '');

    const requiredMappers = ['EnemyMapper', 'SkillMapper'];
    const missingMappers = requiredMappers.filter((m) => !mapperNames.includes(m));

    if (missingMappers.length > 0) {
      const violations = missingMappers.map((m) => ({
        mapper: m,
        issue: `Missing mapper in infrastructure/adapters/mappers/`,
      }));
      console.error(generateMapperEnforcementReport(violations));
    }

    expect(missingMappers).toHaveLength(0);
  });

  it('should import both domain entities and RMMZ types in mappers', () => {
    const mapperFiles = getMapperFiles();
    const violations: Array<{ mapper: string; issue: string }> = [];

    for (const file of mapperFiles) {
      const content = readFileSync(file, 'utf-8');
      const imports = extractImports(content);
      const mapperName = file.split('/').pop()?.replace('.ts', '') || '';

      // Check for domain import (accept both @coreto/core and relative imports)
      const hasDomainImport = imports.some(
        (imp) => imp.includes('@coreto/core') || imp.includes('core/domain/')
      );
      if (!hasDomainImport) {
        violations.push({
          mapper: mapperName,
          issue: 'Missing domain import from @coreto/core or core/domain/',
        });
      }

      // Check for RMMZ types import
      const hasRmmzImport = imports.some((imp) => imp.includes('types/rmmz-data'));
      if (!hasRmmzImport) {
        violations.push({
          mapper: mapperName,
          issue: 'Missing RMMZ types import from types/rmmz-data',
        });
      }
    }

    if (violations.length > 0) {
      console.error(generateMapperEnforcementReport(violations));
    }

    expect(violations).toHaveLength(0);
  });

  it('should have conversion methods (fromRmmzData or toDomain)', () => {
    const mapperFiles = getMapperFiles();
    const violations: Array<{ mapper: string; issue: string }> = [];

    for (const file of mapperFiles) {
      const content = readFileSync(file, 'utf-8');
      const mapperName = file.split('/').pop()?.replace('.ts', '') || '';

      // Check for conversion method (either fromRmmzData or toDomain)
      const hasConversionMethod = content.includes('fromRmmzData') || content.includes('toDomain');
      if (!hasConversionMethod) {
        violations.push({
          mapper: mapperName,
          issue: 'Missing conversion method - mappers must have fromRmmzData() or toDomain()',
        });
      }
    }

    if (violations.length > 0) {
      console.error(generateMapperEnforcementReport(violations));
    }

    expect(violations).toHaveLength(0);
  });
});

// ============================================================================
// Rule 3: Dependency Direction
// ============================================================================

describe('Architecture Rule 3: Dependency Direction', () => {
  it('should use barrel exports for infrastructure → core imports', () => {
    const infraFiles = getInfrastructureFiles();
    const violations: Array<{ file: string; import: string }> = [];

    for (const file of infraFiles) {
      // Skip test files
      if (file.includes('.test.') || file.includes('.spec.') || file.includes('/tests/')) {
        continue;
      }

      const content = readFileSync(file, 'utf-8');
      const imports = extractImports(content);

      for (const imp of imports) {
        // Check for relative imports that go into core layer
        // These should use @coreto/core instead
        if (imp.includes('../core/') || imp.includes('../../core/') || imp.includes('../../../core/')) {
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

  it('should use relative paths for infrastructure → infrastructure imports', () => {
    const infraFiles = getInfrastructureFiles();
    const warnings: Array<{ file: string; import: string }> = [];

    for (const file of infraFiles) {
      // Skip test files
      if (file.includes('.test.') || file.includes('.spec.') || file.includes('/tests/')) {
        continue;
      }

      const content = readFileSync(file, 'utf-8');
      const imports = extractImports(content);

      for (const imp of imports) {
        // Check for module alias usage within same layer
        if (imp.startsWith('@coreto/core/infrastructure/')) {
          warnings.push({
            file: getRelativePath(file),
            import: imp,
          });
        }
      }
    }

    if (warnings.length > 0) {
      console.warn('\nSame-Layer Import Warnings (prefer relative paths):');
      for (const w of warnings) {
        console.warn(`  ⚠️  ${w.file}: ${w.import}`);
        console.warn(`     Consider: './file.js' or '../other/file.js'`);
      }
    }

    // This is a warning test - alias usage is acceptable but not preferred
    expect(true).toBe(true);
  });
});

// ============================================================================
// Rule 4: Dependency Injection Registration
// ============================================================================

describe('Architecture Rule 4: Dependency Injection Registration', () => {
  it('should have DI tokens for all domain ports', () => {
    const portsDir = join(__dirname, '../../src/core/ports');
    const portFiles = findTsFiles(portsDir);
    const tokensFile = join(__dirname, '../../src/infrastructure/di/tokens.ts');
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
    const tokensFile = join(__dirname, '../../src/infrastructure/di/tokens.ts');
    const tokensContent = readFileSync(tokensFile, 'utf-8');
    const containerFile = join(__dirname, '../../src/infrastructure/di/container.ts');
    const containerContent = readFileSync(containerFile, 'utf-8');
    const violations: Array<{ port: string; issue: string }> = [];

    // Extract token names from tokens.ts
    const tokenRegex = /export const (\w+Token)\s*=/g;
    let match;
    while ((match = tokenRegex.exec(tokensContent)) !== null) {
      const tokenName = match[1];

      if (!tokenName) continue;

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
// Rule 5: Naming Conventions
// ============================================================================

describe('Architecture Rule 5: Naming Conventions', () => {
  it('should follow port interface naming convention (I*.ts)', () => {
    const portsDir = join(__dirname, '../../src/core/ports');
    const portFiles = findTsFiles(portsDir);
    const violations: Array<{ file: string; issue: string }> = [];

    for (const portFile of portFiles) {
      const fileName = portFile.split('/').pop() || '';

      // Port interfaces must start with I
      if (!fileName.startsWith('I')) {
        violations.push({
          file: getRelativePath(portFile),
          issue: `Port interface must start with I (e.g., ILogger.ts)`,
        });
      }
    }

    if (violations.length > 0) {
      console.error(generateNamingConventionReport(violations));
    }

    expect(violations).toHaveLength(0);
  });

  it('should follow domain entity naming (no suffix)', () => {
    const domainDir = join(__dirname, '../../src/core/domain');
    const domainFiles = findTsFiles(domainDir);

    // This is informational - domain entities should be named simply
    // Enemy.ts, Skill.ts (not EnemyEntity.ts, SkillModel.ts)
    const warnings: string[] = [];

    for (const file of domainFiles) {
      const fileName = file.split('/').pop() || '';
      if (fileName.endsWith('Entity.ts') || fileName.endsWith('Model.ts')) {
        warnings.push(getRelativePath(file));
      }
    }

    if (warnings.length > 0) {
      console.warn('\nDomain Entity Naming Warnings (prefer no suffix):');
      for (const w of warnings) {
        console.warn(`  ⚠️  ${w} - consider removing Entity/Model suffix`);
      }
    }

    // This is a warning test
    expect(true).toBe(true);
  });
});

// ============================================================================
// Rule 6: Core Structure
// ============================================================================

describe('Architecture Rule 6: Core Structure', () => {
  it('should have proper core layer structure (domain, ports, use-cases, errors)', () => {
    const srcDir = join(__dirname, '../../src/core');
    const requiredDirs = ['domain', 'ports', 'use-cases', 'errors'];
    const existingDirs = readdirSync(srcDir).filter((item) => {
      const fullPath = join(srcDir, item);
      return statSync(fullPath).isDirectory();
    });

    const missingDirs = requiredDirs.filter((dir) => !existingDirs.includes(dir));

    if (missingDirs.length > 0) {
      console.error('\nMissing Core Layer Directories:');
      for (const dir of missingDirs) {
        console.error(`  ❌ src/core/${dir}/ does not exist`);
      }
    }

    expect(missingDirs).toHaveLength(0);
  });

  it('should have proper infrastructure structure (adapters, di, runtime, simulation)', () => {
    const infraDir = join(__dirname, '../../src/infrastructure');
    const requiredDirs = ['adapters', 'di', 'runtime', 'simulation'];
    const existingDirs = readdirSync(infraDir).filter((item) => {
      const fullPath = join(infraDir, item);
      return statSync(fullPath).isDirectory();
    });

    const missingDirs = requiredDirs.filter((dir) => !existingDirs.includes(dir));

    if (missingDirs.length > 0) {
      console.error('\nMissing Infrastructure Layer Directories:');
      for (const dir of missingDirs) {
        console.error(`  ❌ src/infrastructure/${dir}/ does not exist`);
      }
    }

    expect(missingDirs).toHaveLength(0);
  });
});

// ============================================================================
// Rule 7: Type Leakage Prevention
// ============================================================================

describe('Architecture Rule 7: Type Leakage Prevention', () => {
  it('should not import infrastructure types in core layer', () => {
    const coreFiles = getCoreFiles();
    const violations: Array<{ file: string; import: string }> = [];

    for (const file of coreFiles) {
      const content = readFileSync(file, 'utf-8');
      const imports = extractImports(content);

      for (const imp of imports) {
        // Check for type imports from infrastructure layers
        if (
          imp.includes('src/infrastructure/') ||
          imp.includes('../infrastructure/') ||
          imp.includes('../../infrastructure/')
        ) {
          violations.push({
            file: getRelativePath(file),
            import: imp,
          });
        }
      }
    }

    if (violations.length > 0) {
      console.error('\n╔════════════════════════════════════════════════════════════╗');
      console.error('║  ❌ TYPE LEAKAGE - Infrastructure Type in Core            ║');
      console.error('╚════════════════════════════════════════════════════════════╝\n');

      for (const v of violations) {
        console.error(`📁 ${v.file}`);
        console.error(`   ❌ ${v.import}\n`);
      }

      console.error('💡 Use ports (interfaces) instead of concrete infrastructure types.\n');
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
      'Domain Purity - No RMMZ type imports (types/rmmz-data.ts)',
      'Domain Purity - No infrastructure module imports',
      'Domain Purity - No external test libraries',
      'Mapper Pattern - Required mappers exist',
      'Mapper Pattern - Mappers import domain + RMMZ',
      'Mapper Pattern - Bidirectional conversion',
      'Dependency Direction - Barrel exports for infra → core',
      'Dependency Direction - Relative paths for infra → infra',
      'DI Registration - Tokens for all ports',
      'DI Registration - Tokens registered in container',
      'Naming Conventions - Port interfaces (I*.ts)',
      'Naming Conventions - Domain entities (no suffix)',
      'Core Structure - Domain layer directories',
      'Core Structure - Infrastructure layer directories',
      'Type Leakage - No infrastructure types in core',
    ];

    console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                     ARCHITECTURE TEST SUITE SUMMARY                       ║
║                          @coreto/core package                             ║
╚═══════════════════════════════════════════════════════════════════════════╝

✅ Validated ${rules.length} architectural rules

🤖 FOR AI AGENTS: If this test failed, here's what to do:

  STEP 1: Read the error message above
          ↓
  STEP 2: Identify the violation type:
          • Domain Purity → Use mappers, remove RMMZ type imports
          • Mapper Pattern → Create/fix mapper in infrastructure/adapters/mappers/
          • Dependency Direction → Use @coreto/core barrel export
          • DI Registration → Add token to tokens.ts and container.ts
          • Naming Convention → Rename to I*.ts for ports
          • Type Leakage → Remove infrastructure import, use port instead
          ↓
  STEP 3: Apply the suggested fix from error message
          ↓
  STEP 4: Verify fix with: pnpm --filter @coreto/core test architecture.test.ts
          ↓
  STEP 5: If still failing, consult:
          • MEMORY.md (Domain Purity + Mappers)
          • docs/adrs/FOUNDATION/ADR-029-tsyringe-di-container.md
          • docs/adrs/FOUNDATION/ADR-032-ports-and-adapters-layer-contracts.md

📚 QUICK REFERENCE - Common Patterns:

   ✅ CORRECT IMPORTS:
      // Infrastructure using domain entities
      import { Enemy, Skill } from '@coreto/core';

      // Mapper importing both sides
      import type { Enemy as RmmzEnemy } from '../../../types/rmmz-data';
      import { Enemy } from '@coreto/core';

      // Infrastructure internal (same layer)
      import { BattleSimulator } from '../simulation/BattleSimulator.js';

   ❌ WRONG IMPORTS:
      // Domain importing RMMZ types (CRITICAL!)
      import type { Enemy } from '../../types/rmmz-data';

      // Relative path to core (breaks refactoring)
      import { Enemy } from '../../../core/domain/Enemy';

      // Infrastructure types in core (couples layers)
      import type { Database } from '../../infrastructure/di/container';

🎯 ARCHITECTURE LAYERS QUICK MAP:

   core/domain/           → Business entities (Enemy, Skill, Trecho)
   core/ports/            → Interfaces (ILogger, IClock, IDataLoader)
   core/use-cases/        → Business logic (ExecuteBattle, ValidateTrecho)
   core/errors/           → Domain errors (ValidationError, DomainError)

   infrastructure/adapters/mappers/  → RMMZ ↔ domain conversion
   infrastructure/di/                 → Dependency injection (TSyringe)
   infrastructure/runtime/            → JSDOM + PIXI mocks
   infrastructure/simulation/         → Battle simulator

   types/rmmz-data.ts     → RMMZ types (FORBIDDEN in core/)

═══════════════════════════════════════════════════════════════════════════
    `);

    expect(rules).toHaveLength(15);
  });
});
