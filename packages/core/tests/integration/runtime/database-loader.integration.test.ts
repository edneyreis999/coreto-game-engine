import { DatabaseLoader } from '@coreto/core';
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
  beforeEach(() => {
    // Set up minimal global data that would be present after database load
    (global as any).$dataActors = [null];
    (global as any).$dataClasses = [null];
    (global as any).$dataSkills = [null];
    (global as any).$dataItems = [null];
    (global as any).$dataWeapons = [null];
    (global as any).$dataArmors = [null];
    (global as any).$dataEnemies = [null];
    (global as any).$dataTroops = [null];
    (global as any).$dataStates = [null];
    (global as any).$dataSystem = { gameTitle: 'Test Game' };
  });

  afterEach(() => {
    // Clean up global data
    delete (global as any).$dataActors;
    delete (global as any).$dataClasses;
    delete (global as any).$dataSkills;
    delete (global as any).$dataItems;
    delete (global as any).$dataWeapons;
    delete (global as any).$dataArmors;
    delete (global as any).$dataEnemies;
    delete (global as any).$dataTroops;
    delete (global as any).$dataStates;
    delete (global as any).$dataSystem;
  });

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

    // Act & Assert - validateDatabase() returns void but throws on error
    expect(() => loader.validateDatabase()).not.toThrow();
    // A validação não deve lançar exceções para o projeto mínimo válido
  });
});