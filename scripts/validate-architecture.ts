#!/usr/bin/env npx tsx
/**
 * Architecture Validation Script
 *
 * Validates DDD + Hexagonal Architecture constraints:
 * - Domain layer MUST NOT import from application/infrastructure/cli layers
 * - Ports MUST NOT contain implementation details (no Zod, no fs, no JSDOM)
 * - Infrastructure classes MUST implement port interfaces
 * - Port imports MUST use `type` keyword for compile-time only dependency
 *
 * Usage: npm run validate:architecture
 * Exit codes: 0 = valid, 1 = violations found
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname and __filename, with fallback for Jest/test environment
const getModulePaths = () => {
  try {
    // Try ESM import.meta.url (works with tsx/node)
    const filename = fileURLToPath(import.meta.url);
    const dirname = path.dirname(filename);
    return { __filename: filename, __dirname: dirname };
  } catch {
    // Fallback for CommonJS/Jest test environment
    const filename = __filename || process.argv[1];
    const dirname = __dirname || path.dirname(filename);
    return { __filename: filename, __dirname: dirname };
  }
};

const { __filename: _filename, __dirname: _dirname } = getModulePaths();
const rootDir = path.dirname(_dirname);

/** Violation types detected by the validator */
export type ViolationType =
  | 'domain_imports_infrastructure'
  | 'domain_imports_application'
  | 'domain_imports_cli'
  | 'port_leaks_implementation'
  | 'port_import_not_type_only'
  | 'infrastructure_missing_port'
  | 'core_imports_violation';

/** Architecture violation record */
export interface ArchitectureViolation {
  type: ViolationType;
  file: string;
  line: number;
  message: string;
  details: string;
}

/** Validation result */
export interface ValidationResult {
  success: boolean;
  violations: ArchitectureViolation[];
  summary: Record<ViolationType, number>;
}

/** Layer boundaries */
const LAYERS = {
  domain: 'packages/core/src/core/domain',
  ports: 'packages/core/src/core/ports',
  useCases: 'packages/core/src/core/use-cases',
  infrastructure: 'packages/core/src/infrastructure',
  cli: 'packages/cli',
} as const;

/** Implementation detail keywords that should NOT appear in ports */
const IMPLEMENTATION_KEYWORDS = [
  'zod',
  'fs.',
  'fs\'',
  'jsdom',
  'pixi',
  'effekseer',
  'canvas',
  'winston',
  'reflect-metadata',
];

/**
 * Get all TypeScript files in a directory recursively
 */
function getTypeScriptFiles(dir: string): string[] {
  const files: string[] = [];
  const fullPath = path.join(rootDir, dir);

  if (!fs.existsSync(fullPath)) {
    return files;
  }

  const entries = fs.readdirSync(fullPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(fullPath, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules and dist directories
      if (entry.name !== 'node_modules' && entry.name !== 'dist') {
        files.push(...getTypeScriptFiles(path.join(dir, entry.name)));
      }
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.mts'))) {
      files.push(entryPath);
    }
  }

  return files;
}

/**
 * Determine which layer a file belongs to
 */
function getLayer(filePath: string): keyof typeof LAYERS | null {
  const relativePath = path.relative(rootDir, filePath);

  for (const [layerName, layerPath] of Object.entries(LAYERS)) {
    if (relativePath.startsWith(layerPath)) {
      return layerName as keyof typeof LAYERS;
    }
  }

  return null;
}

/**
 * Check if an import statement violates architecture rules
 */
function checkImportViolation(
  importLine: string,
  sourceLayer: keyof typeof LAYERS | null,
  filePath: string,
  lineNumber: number
): ArchitectureViolation | null {
  // Extract import path
  const importMatch = importLine.match(/import\s+(?:type\s+)?{[^}]*}\s+from\s+['"]([^'"]+)['"]/) ||
    importLine.match(/import\s+(?:type\s+)?\w+\s+from\s+['"]([^'"]+)['"]/);

  if (!importMatch) {
    return null;
  }

  const importPath = importMatch[1];

  // Check if it's a relative import or package import
  const isRelativeImport = importPath.startsWith('.');
  if (!isRelativeImport) {
    return null; // External library, skip
  }

  // Determine target layer
  const fullPath = path.resolve(path.dirname(filePath), importPath);
  const targetLayer = getLayer(fullPath);

  if (!targetLayer) {
    return null;
  }

  // Check for domain importing from outer layers (Dependency Rule violation)
  if (sourceLayer === 'domain') {
    if (targetLayer === 'infrastructure' || targetLayer === 'cli' || targetLayer === 'useCases') {
      return {
        type: 'domain_imports_infrastructure',
        file: filePath,
        line: lineNumber,
        message: `Domain layer importing from ${targetLayer} layer`,
        details: `Domain entities must not depend on ${targetLayer}. Import: ${importPath}`,
      };
    }
  }

  // Check for ports importing implementation details
  if (sourceLayer === 'ports') {
    const lowerImport = importLine.toLowerCase();
    for (const keyword of IMPLEMENTATION_KEYWORDS) {
      if (lowerImport.includes(keyword)) {
        return {
          type: 'port_leaks_implementation',
          file: filePath,
          line: lineNumber,
          message: `Port importing implementation detail: ${keyword}`,
          details: `Ports must not import infrastructure libraries. Import: ${importLine}`,
        };
      }
    }

    // Check if port imports are type-only
    if (!importLine.includes('import type') && !importLine.includes('import { type')) {
      // Port files in the ports directory
      if (filePath.includes('/ports/') && importPath.startsWith('../domain/')) {
        return {
          type: 'port_import_not_type_only',
          file: filePath,
          line: lineNumber,
          message: 'Port import not using `type` keyword',
          details: `Port imports should use \`import type\` for compile-time only dependency. Import: ${importLine}`,
        };
      }
    }
  }

  return null;
}

/**
 * Validate a single file for architecture violations
 */
function validateFile(filePath: string): ArchitectureViolation[] {
  const violations: ArchitectureViolation[] = [];
  const layer = getLayer(filePath);

  if (!layer) {
    return violations;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue; // Skip empty lines
    const lineNumber = i + 1;

    // Check import statements
    if (line.trim().startsWith('import')) {
      const violation = checkImportViolation(line, layer, filePath, lineNumber);
      if (violation) {
        violations.push(violation);
      }
    }

    // Check port files for implementation keywords in content (not just imports)
    if (layer === 'ports') {
      const lowerLine = line.toLowerCase();
      for (const keyword of IMPLEMENTATION_KEYWORDS) {
        // Skip comments
        if (lowerLine.trim().startsWith('//') || lowerLine.trim().startsWith('*')) {
          continue;
        }
        // Check for implementation details in port interfaces
        if (lowerLine.includes(keyword) && !lowerLine.includes('import') && !lowerLine.includes('deprecated')) {
          violations.push({
            type: 'port_leaks_implementation',
            file: filePath,
            line: lineNumber,
            message: `Port contains implementation detail: ${keyword}`,
            details: `Ports must be pure contracts without infrastructure references.`,
          });
        }
      }
    }
  }

  return violations;
}

/**
 * Check if infrastructure adapter implements a port
 */
function checkInfrastructureImplementsPort(filePath: string): ArchitectureViolation | null {
  const layer = getLayer(filePath);

  // Only check infrastructure adapters
  if (layer !== 'infrastructure' || !filePath.includes('/adapters/')) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  // Check if file implements a port interface
  const implementsMatch = content.match(/implements\s+(I\w+)/);

  if (!implementsMatch) {
    // Check if it's a class (should implement a port)
    const classMatch = content.match(/export\s+class\s+(\w+)\s+/);
    if (classMatch && classMatch[1] && !content.includes('export enum') && !content.includes('export type')) {
      const className = classMatch[1];

      // Skip known helper classes that don't need ports
      const knownHelpers = [
        'IntegrityValidator',
        'RmmzProjectValidator',
        'ValidationError',
        'DataLoadError',
      ];

      if (!knownHelpers.includes(className)) {
        return {
          type: 'infrastructure_missing_port',
          file: filePath,
          line: 1,
          message: `Infrastructure class ${className} does not implement a port interface`,
          details: 'Infrastructure adapters should implement corresponding port interfaces for dependency inversion.',
        };
      }
    }
  }

  return null;
}

/**
 * Main validation function
 */
export function validateArchitecture(_options: { jsonOutput?: boolean } = {}): ValidationResult {
  const violations: ArchitectureViolation[] = [];

  // 1. Check all TypeScript files for import violations
  const allFiles = [
    ...getTypeScriptFiles(LAYERS.domain),
    ...getTypeScriptFiles(LAYERS.ports),
    ...getTypeScriptFiles(LAYERS.useCases),
    ...getTypeScriptFiles(LAYERS.infrastructure),
  ];

  for (const file of allFiles) {
    violations.push(...validateFile(file));
  }

  // 2. Check infrastructure classes implement ports
  const infrastructureFiles = getTypeScriptFiles(LAYERS.infrastructure);
  for (const file of infrastructureFiles) {
    const violation = checkInfrastructureImplementsPort(file);
    if (violation) {
      violations.push(violation);
    }
  }

  // Build summary
  const summary = {
    domain_imports_infrastructure: 0,
    domain_imports_application: 0,
    domain_imports_cli: 0,
    port_leaks_implementation: 0,
    port_import_not_type_only: 0,
    infrastructure_missing_port: 0,
    core_imports_violation: 0,
  } as Record<ViolationType, number>;

  for (const violation of violations) {
    summary[violation.type] = (summary[violation.type] || 0) + 1;
  }

  const success = violations.length === 0;

  return {
    success,
    violations,
    summary,
  };
}

/**
 * Print validation results to console
 */
function printResults(result: ValidationResult): void {
  console.log('='.repeat(70));
  console.log('🏗️  Architecture Validation');
  console.log('='.repeat(70));

  if (result.success) {
    console.log('\n✅ No architecture violations found!\n');
    console.log('All constraints satisfied:');
    console.log('  • Domain layer does not import from outer layers');
    console.log('  • Ports do not leak implementation details');
    console.log('  • Infrastructure classes implement port interfaces');
    console.log('  • Port imports use `type` keyword for compile-time dependency\n');
  } else {
    console.log(`\n❌ Found ${result.violations.length} architecture violation(s):\n`);

    // Group violations by type
    const grouped = result.violations.reduce((acc, v) => {
      acc[v.type] = acc[v.type] || [];
      acc[v.type].push(v);
      return acc;
    }, {} as Record<ViolationType, ArchitectureViolation[]>);

    for (const [type, violations] of Object.entries(grouped)) {
      console.log(`\n📌 ${type} (${violations.length}):`);
      for (const v of violations.slice(0, 5)) {
        const relativeFile = path.relative(rootDir, v.file);
        console.log(`   [${relativeFile}:${v.line}]`);
        console.log(`     ${v.message}`);
        console.log(`     → ${v.details}`);
      }
      if (violations.length > 5) {
        console.log(`   ... and ${violations.length - 5} more`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('Summary:');
    for (const [type, count] of Object.entries(result.summary)) {
      if (count > 0) {
        console.log(`  • ${type}: ${count}`);
      }
    }
    console.log('='.repeat(70));
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json') || args.includes('-j');

  const result = validateArchitecture({ jsonOutput });

  if (jsonOutput) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printResults(result);
  }

  process.exit(result.success ? 0 : 1);
}

// Run if called directly
// Check if this file is being executed directly (not imported)
const isDirectExecution = (): boolean => {
  try {
    // ESM check using import.meta
    return import.meta.url === `file://${process.argv[1]}`;
  } catch {
    // CommonJS fallback - check if require.main is this module
    const modulePath = _filename;
    return require.main === module ||
      (require.main && require.main.filename === modulePath);
  }
};

if (isDirectExecution()) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { main };
