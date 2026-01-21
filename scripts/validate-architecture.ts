#!/usr/bin/env npx tsx
/**
 * Architecture Validation Script
 *
 * Validates DDD + Hexagonal Architecture constraints using ts-morph for AST parsing:
 * - Domain layer MUST NOT import from application/infrastructure/cli layers
 * - Application layer MUST NOT import from infrastructure/cli layers
 * - Infrastructure MUST NOT instantiate domain/use-case classes directly (use DI)
 * - Ports MUST NOT contain implementation details (no Zod, no fs, no JSDOM)
 * - Infrastructure classes MUST implement port interfaces
 * - Port imports MUST use `type` keyword for compile-time only dependency
 *
 * Usage: npm run validate:architecture
 * Exit codes: 0 = valid, 1 = violations found
 */

import { Project, SyntaxKind, type SourceFile, type ImportDeclaration, type NewExpression, type ClassDeclaration } from 'ts-morph';
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
  | 'application_imports_infrastructure'
  | 'application_imports_cli'
  | 'no_di_violation'
  | 'port_leaks_implementation'
  | 'port_import_not_type_only'
  | 'infrastructure_missing_port';

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

/** Known classes that are allowed to skip port implementation (helpers, errors, etc.) */
const KNOWN_HELPERS = [
  'IntegrityValidator',
  'RmmzProjectValidator',
  'ValidationError',
  'DataLoadError',
  'BattleTimeoutError',
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
 * Get the target layer from an import path
 */
function getTargetLayer(importPath: string, sourceFilePath: string): keyof typeof LAYERS | null {
  // Resolve the full path of the import
  const fullPath = path.resolve(path.dirname(sourceFilePath), importPath);
  return getLayer(fullPath);
}

/**
 * Check if an import statement violates layer architecture rules
 */
function checkImportViolation(
  importDecl: ImportDeclaration,
  sourceFile: SourceFile
): ArchitectureViolation | null {
  const sourceLayer = getLayer(sourceFile.getFilePath());
  if (!sourceLayer) {
    return null;
  }

  const importPath = importDecl.getModuleSpecifierValue();
  const lineNumber = importDecl.getStartLineNumber();

  // Skip external library imports (non-relative)
  if (!importPath.startsWith('.')) {
    return null;
  }

  const targetLayer = getTargetLayer(importPath, sourceFile.getFilePath());
  if (!targetLayer) {
    return null;
  }

  // Check for domain importing from outer layers (Dependency Rule violation)
  if (sourceLayer === 'domain') {
    if (targetLayer === 'infrastructure' || targetLayer === 'cli' || targetLayer === 'useCases') {
      return {
        type: `domain_imports_${targetLayer === 'useCases' ? 'application' : targetLayer}` as ViolationType,
        file: sourceFile.getFilePath(),
        line: lineNumber,
        message: `Domain layer importing from ${targetLayer} layer`,
        details: `Domain entities must not depend on ${targetLayer}. Import: ${importPath}`,
      };
    }
  }

  // Check for application layer importing from outer layers
  if (sourceLayer === 'useCases' || sourceLayer === 'ports') {
    if (targetLayer === 'infrastructure' || targetLayer === 'cli') {
      return {
        type: `application_imports_${targetLayer}` as ViolationType,
        file: sourceFile.getFilePath(),
        line: lineNumber,
        message: `Application layer importing from ${targetLayer} layer`,
        details: `Application layer must not depend on ${targetLayer}. Import: ${importPath}`,
      };
    }
  }

  return null;
}

/**
 * Check if port imports are type-only
 */
function checkPortImportTypeOnly(
  importDecl: ImportDeclaration,
  sourceFile: SourceFile
): ArchitectureViolation | null {
  const sourceLayer = getLayer(sourceFile.getFilePath());
  if (sourceLayer !== 'ports') {
    return null;
  }

  const importPath = importDecl.getModuleSpecifierValue();

  // Only check imports from domain layer
  if (!importPath.startsWith('../domain/')) {
    return null;
  }

  // Check if it's a type-only import
  const isTypeOnly = importDecl.isTypeOnly();

  if (!isTypeOnly) {
    return {
      type: 'port_import_not_type_only',
      file: sourceFile.getFilePath(),
      line: importDecl.getStartLineNumber(),
      message: 'Port import not using `type` keyword',
      details: `Port imports should use \`import type\` for compile-time only dependency. Import: ${importPath}`,
    };
  }

  return null;
}

/**
 * Check for implementation details in port files
 */
function checkPortImplementationLeaks(sourceFile: SourceFile): ArchitectureViolation[] {
  const violations: ArchitectureViolation[] = [];
  const sourceLayer = getLayer(sourceFile.getFilePath());

  if (sourceLayer !== 'ports') {
    return violations;
  }

  // Check imports for implementation keywords
  const imports = sourceFile.getImportDeclarations();
  for (const importDecl of imports) {
    const importText = importDecl.getText().toLowerCase();
    const lineNumber = importDecl.getStartLineNumber();

    for (const keyword of IMPLEMENTATION_KEYWORDS) {
      if (importText.includes(keyword)) {
        violations.push({
          type: 'port_leaks_implementation',
          file: sourceFile.getFilePath(),
          line: lineNumber,
          message: `Port importing implementation detail: ${keyword}`,
          details: `Ports must not import infrastructure libraries. Import: ${importDecl.getText()}`,
        });
        break;
      }
    }
  }

  return violations;
}

/**
 * Check for direct instantiation without DI (no-di-violation)
 * Detects 'new Class()' in infrastructure layer for classes that should use DI
 */
function checkNoDIViolations(sourceFile: SourceFile): ArchitectureViolation[] {
  const violations: ArchitectureViolation[] = [];
  const sourceLayer = getLayer(sourceFile.getFilePath());

  // Only check infrastructure layer for DI violations
  if (sourceLayer !== 'infrastructure') {
    return violations;
  }

  const newExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.NewExpression);

  for (const newExpr of newExpressions) {
    const expression = newExpr.getExpression();
    const className = expression.getText();
    const lineNumber = newExpr.getStartLineNumber();

    // Skip known allowed instantiations (data structures, built-ins, etc.)
    const allowedClasses = [
      'Map', 'Set', 'Array', 'Object', 'Error', 'Date', 'Promise',
      'IntegrityValidator', 'RmmzProjectValidator',
    ];

    if (allowedClasses.includes(className)) {
      continue;
    }

    // Skip instantiations inside factory methods or builder patterns
    const parentFunction = newExpr.getFirstAncestorByKind(SyntaxKind.FunctionDeclaration);
    if (parentFunction) {
      const functionName = parentFunction.getName();
      if (functionName?.toLowerCase().includes('create') ||
          functionName?.toLowerCase().includes('build') ||
          functionName?.toLowerCase().includes('factory')) {
        continue;
      }
    }

    // Report DI violation for domain or use-case classes
    violations.push({
      type: 'no_di_violation',
      file: sourceFile.getFilePath(),
      line: lineNumber,
      message: `Direct instantiation without DI: new ${className}()`,
      details: 'Infrastructure should use dependency injection instead of direct instantiation.',
    });
  }

  return violations;
}

/**
 * Check if infrastructure adapter implements a port interface
 */
function checkInfrastructureImplementsPort(sourceFile: SourceFile): ArchitectureViolation | null {
  const sourceLayer = getLayer(sourceFile.getFilePath());

  // Only check infrastructure adapters
  if (sourceLayer !== 'infrastructure' || !sourceFile.getFilePath().includes('/adapters/')) {
    return null;
  }

  const classes = sourceFile.getClasses();

  for (const classDecl of classes) {
    const className = classDecl.getName();

    if (!className) {
      continue;
    }

    // Skip known helper classes
    if (KNOWN_HELPERS.includes(className)) {
      continue;
    }

    // Check if class implements a port interface
    const implementedInterfaces = classDecl.getImplements();
    const hasPortInterface = implementedInterfaces.some(imp => {
      const interfaceName = imp.getExpression().getText();
      return interfaceName.startsWith('I');
    });

    if (!hasPortInterface) {
      return {
        type: 'infrastructure_missing_port',
        file: sourceFile.getFilePath(),
        line: classDecl.getStartLineNumber(),
        message: `Infrastructure class ${className} does not implement a port interface`,
        details: 'Infrastructure adapters should implement corresponding port interfaces for dependency inversion.',
      };
    }
  }

  return null;
}

/**
 * Validate a single file for architecture violations
 */
function validateFile(sourceFile: SourceFile): ArchitectureViolation[] {
  const violations: ArchitectureViolation[] = [];

  // Check import violations
  const imports = sourceFile.getImportDeclarations();
  for (const importDecl of imports) {
    const importViolation = checkImportViolation(importDecl, sourceFile);
    if (importViolation) {
      violations.push(importViolation);
    }

    const typeOnlyViolation = checkPortImportTypeOnly(importDecl, sourceFile);
    if (typeOnlyViolation) {
      violations.push(typeOnlyViolation);
    }
  }

  // Check port implementation leaks
  violations.push(...checkPortImplementationLeaks(sourceFile));

  // Check DI violations
  violations.push(...checkNoDIViolations(sourceFile));

  return violations;
}

/**
 * Main validation function using ts-morph for AST parsing
 */
export function validateArchitecture(_options: { jsonOutput?: boolean } = {}): ValidationResult {
  const violations: ArchitectureViolation[] = [];

  // Create ts-morph project
  const project = new Project({
    skipAddingFilesFromTsConfig: true,
    compilerOptions: {
      allowJs: true,
    },
  });

  // Get all TypeScript files from relevant layers
  const allFilePaths = [
    ...getTypeScriptFiles(LAYERS.domain),
    ...getTypeScriptFiles(LAYERS.ports),
    ...getTypeScriptFiles(LAYERS.useCases),
    ...getTypeScriptFiles(LAYERS.infrastructure),
  ];

  // Add source files to project
  const sourceFiles = project.addSourceFilesAtPaths(allFilePaths);

  // Validate each file
  for (const sourceFile of sourceFiles) {
    violations.push(...validateFile(sourceFile));
  }

  // Check infrastructure classes implement ports
  const infrastructureFiles = sourceFiles.filter(sf =>
    sf.getFilePath().includes('/infrastructure/adapters/')
  );

  for (const sourceFile of infrastructureFiles) {
    const violation = checkInfrastructureImplementsPort(sourceFile);
    if (violation) {
      violations.push(violation);
    }
  }

  // Build summary
  const summary = {
    domain_imports_infrastructure: 0,
    domain_imports_application: 0,
    domain_imports_cli: 0,
    application_imports_infrastructure: 0,
    application_imports_cli: 0,
    no_di_violation: 0,
    port_leaks_implementation: 0,
    port_import_not_type_only: 0,
    infrastructure_missing_port: 0,
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
    console.log('  • Application layer does not import from infrastructure/cli');
    console.log('  • Infrastructure uses dependency injection (no direct instantiation)');
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
const isDirectExecution = (): boolean => {
  try {
    return import.meta.url === `file://${process.argv[1]}`;
  } catch {
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
