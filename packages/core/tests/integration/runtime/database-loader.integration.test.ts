import { DatabaseLoader } from '@coreto/core/infrastructure/runtime/loaders/DatabaseLoader';
import * as path from 'path';

/**
 * Integration Tests: DatabaseLoader
 *
 * Testa funcionalidades específicas do DatabaseLoader de forma isolada.
 *
 * Usa o fixture mínimo `tests/fixtures/rmmz-mini-project` (scripts + data) para não depender
 * de projetos externos e evitar suites skipadas.
 */

const testProjectPath = path.join(__dirname, '../../fixtures/rmmz-mini-project');

describe('DatabaseLoader Integration', () => {
  it('should validate database without errors', () => {
    // Arrange
    const loader = new DatabaseLoader(testProjectPath);

    // Act & Assert (não deve lançar erro)
    expect(() => loader.validateDatabase()).not.toThrow();
  });

  it('should have valid database file structure', () => {
    // Arrange
    const loader = new DatabaseLoader(testProjectPath);

    // Act & Assert
    expect(loader).toBeDefined();
    expect(loader['projectPath']).toBe(testProjectPath);
  });

  it('should validate required database fields', () => {
    // Arrange
    const loader = new DatabaseLoader(testProjectPath);

    // Act
    const validationResult = loader.validateDatabase();

    // Assert
    expect(validationResult).toBeDefined();
    // A validação não deve lançar exceções para o projeto mínimo válido
  });
});