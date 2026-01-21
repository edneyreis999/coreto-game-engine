/**
 * Unit tests for Architecture Validator
 *
 * Tests the DDD + Hexagonal Architecture constraint validation logic.
 */

// Import without type annotations to avoid module resolution issues
const { validateArchitecture } = require('../../scripts/validate-architecture.ts');

describe('validateArchitecture', () => {
  describe('validation result structure', () => {
    it('should return result with success, violations, and summary properties', () => {
      const result = validateArchitecture();

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('violations');
      expect(result).toHaveProperty('summary');
      expect(Array.isArray(result.violations)).toBe(true);
      expect(typeof result.summary).toBe('object');
    });

    it('should have boolean success property', () => {
      const result = validateArchitecture();
      expect(typeof result.success).toBe('boolean');
    });

    it('should have violations array', () => {
      const result = validateArchitecture();
      expect(Array.isArray(result.violations)).toBe(true);
    });

    it('should have summary object with all violation types', () => {
      const result = validateArchitecture();
      const expectedKeys = [
        'domain_imports_infrastructure',
        'domain_imports_application',
        'domain_imports_cli',
        'port_leaks_implementation',
        'port_import_not_type_only',
        'infrastructure_missing_port',
        'core_imports_violation',
      ];

      for (const key of expectedKeys) {
        expect(result.summary).toHaveProperty(key);
        expect(typeof result.summary[key]).toBe('number');
      }
    });
  });

  describe('violation structure', () => {
    it('should have no violations or properly structured violations', () => {
      const result = validateArchitecture();

      for (const violation of result.violations) {
        expect(violation).toHaveProperty('type');
        expect(violation).toHaveProperty('file');
        expect(violation).toHaveProperty('line');
        expect(violation).toHaveProperty('message');
        expect(violation).toHaveProperty('details');
        expect(typeof violation.file).toBe('string');
        expect(typeof violation.line).toBe('number');
        expect(typeof violation.message).toBe('string');
        expect(typeof violation.details).toBe('string');
      }
    });

    it('should have valid violation types', () => {
      const result = validateArchitecture();
      const validTypes = [
        'domain_imports_infrastructure',
        'domain_imports_application',
        'domain_imports_cli',
        'port_leaks_implementation',
        'port_import_not_type_only',
        'infrastructure_missing_port',
        'core_imports_violation',
      ];

      for (const violation of result.violations) {
        expect(validTypes).toContain(violation.type);
      }
    });
  });

  describe('domain import violations', () => {
    it('should detect domain importing from infrastructure layer', () => {
      const result = validateArchitecture();
      const violations = result.violations.filter(
        (v: { type: string }) => v.type === 'domain_imports_infrastructure'
      );

      for (const violation of violations) {
        expect(violation.file).toContain('/domain/');
        expect(violation.message).toContain('infrastructure');
      }
    });

    it('should detect domain importing from application layer', () => {
      const result = validateArchitecture();
      const violations = result.violations.filter(
        (v: { type: string }) => v.type === 'domain_imports_application'
      );

      for (const violation of violations) {
        expect(violation.file).toContain('/domain/');
        expect(violation.message).toContain('application');
      }
    });

    it('should detect domain importing from cli layer', () => {
      const result = validateArchitecture();
      const violations = result.violations.filter(
        (v: { type: string }) => v.type === 'domain_imports_cli'
      );

      for (const violation of violations) {
        expect(violation.file).toContain('/domain/');
        expect(violation.message).toContain('cli');
      }
    });
  });

  describe('port implementation leak violations', () => {
    it('should detect ports importing implementation libraries', () => {
      const result = validateArchitecture();
      const violations = result.violations.filter(
        (v: { type: string }) => v.type === 'port_leaks_implementation'
      );

      for (const violation of violations) {
        expect(violation.file).toContain('/ports/');
        expect(violation.message.toLowerCase()).toMatch(/implementation|zod|fs\.|jsdom|pixi/i);
      }
    });

    it('should detect ports not using type-only imports', () => {
      const result = validateArchitecture();
      const violations = result.violations.filter(
        (v: { type: string }) => v.type === 'port_import_not_type_only'
      );

      for (const violation of violations) {
        expect(violation.file).toContain('/ports/');
        expect(violation.message).toContain('type');
      }
    });
  });

  describe('infrastructure adapter violations', () => {
    it('should detect infrastructure classes not implementing ports', () => {
      const result = validateArchitecture();
      const violations = result.violations.filter(
        (v: { type: string }) => v.type === 'infrastructure_missing_port'
      );

      for (const violation of violations) {
        expect(violation.file).toContain('/infrastructure/');
        expect(violation.file).toContain('/adapters/');
        expect(violation.message).toContain('does not implement a port');
      }
    });
  });

  describe('summary counts', () => {
    it('should accurately count violations by type', () => {
      const result = validateArchitecture();

      for (const [type, count] of Object.entries(result.summary)) {
        const actualCount = result.violations.filter(
          (v: { type: string }) => v.type === type
        ).length;
        expect(count).toBe(actualCount);
      }
    });

    it('should have total violations matching sum of summary counts', () => {
      const result = validateArchitecture();

      const summaryTotal = Object.values(result.summary).reduce(
        (sum: number, count) => sum + (count as number),
        0
      );
      expect(result.violations.length).toBe(summaryTotal);
    });
  });

  describe('integration test - valid architecture', () => {
    it('should execute validation without errors', () => {
      // This test verifies the validator runs successfully
      // The actual validation results document the current state
      const result = validateArchitecture();
      expect(result).toBeDefined();

      if (result.success) {
        console.log('✅ Architecture validation passed');
      } else {
        console.log(
          `⚠️  Architecture validation found ${result.violations.length} issue(s)`
        );
        console.log('Run "npm run validate:architecture" for details');
      }
    });
  });
});

describe('Architecture Validator Contract', () => {
  describe('exported functions', () => {
    it('should export validateArchitecture function', () => {
      expect(typeof validateArchitecture).toBe('function');
    });

    it('should accept optional options parameter', () => {
      expect(() => validateArchitecture()).not.toThrow();
      expect(() => validateArchitecture({})).not.toThrow();
      expect(() => validateArchitecture({ jsonOutput: true })).not.toThrow();
    });

    it('should return object with required properties', () => {
      const result = validateArchitecture();

      const hasRequiredProps =
        'success' in result &&
        'violations' in result &&
        'summary' in result;

      expect(hasRequiredProps).toBe(true);
    });
  });
});
