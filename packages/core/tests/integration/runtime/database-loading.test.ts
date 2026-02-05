import { HeadlessRuntimeBootstrapper, DatabaseLoader } from '@coreto/core';
import * as path from 'path';

/**
 * Integration Tests: Database Loading
 *
 * Testa o carregamento completo da database do RPG Maker MZ em ambiente headless.
 *
 * Task 21: Synchronous Database Loading Override (ADR-016)
 *
 * Usa o fixture mínimo `tests/fixtures/rmmz-mini-project` (scripts + data) para não depender
 * de projetos externos e evitar suites skipadas.
 */

const testProjectPath = path.join(__dirname, '../../fixtures/rmmz-mini-project');

describe('Database Loading Integration', () => {
  let bootstrapper: HeadlessRuntimeBootstrapper;

  beforeAll(async () => {
    bootstrapper = new HeadlessRuntimeBootstrapper(true);
    await bootstrapper.bootstrap(testProjectPath);
  }, 30000); // Timeout de 30s para bootstrap completo

  afterAll(() => {
    bootstrapper.cleanup();
  });

  it('should bootstrap and load database (ADR-016)', () => {
    // Assert: bootstrap step6_loadDatabase should have completed
    expect((global as any).$dataActors).toBeDefined();
    expect((global as any).$dataActors).not.toBeNull();
    expect(Array.isArray((global as any).$dataActors)).toBe(true);
  });

  it('should validate all required data is loaded', () => {
    // Arrange
    const loader = new DatabaseLoader(testProjectPath);

    // Act & Assert (não deve lançar erro)
    expect(() => loader.validateDatabase()).not.toThrow();
  });

  it('should have $dataSystem with game title', () => {
    // Assert
    const system = (global as any).$dataSystem;
    expect(system).toBeDefined();
    expect(system).not.toBeNull();
    expect(system.gameTitle).toBeDefined();
    expect(typeof system.gameTitle).toBe('string');
  });

  it('should have $dataTroops with at least 1 troop', () => {
    // Assert
    const troops = (global as any).$dataTroops;
    expect(troops).toBeDefined();
    expect(troops).not.toBeNull();
    expect(Array.isArray(troops)).toBe(true);
    expect(troops.length).toBeGreaterThan(1); // [null, troop1, ...]
  });

  it('should have $dataEnemies with at least 1 enemy', () => {
    // Assert
    const enemies = (global as any).$dataEnemies;
    expect(enemies).toBeDefined();
    expect(enemies).not.toBeNull();
    expect(Array.isArray(enemies)).toBe(true);
    expect(enemies.length).toBeGreaterThan(1); // [null, enemy1, ...]
  });

  it('should have $dataActors with valid actor structure', () => {
    // Assert
    const actors = (global as any).$dataActors;
    expect(actors).toBeDefined();
    expect(Array.isArray(actors)).toBe(true);

    // Pula [null] e verifica primeiro actor
    if (actors.length > 1) {
      const firstActor = actors[1];
      expect(firstActor).toBeDefined();
      expect(firstActor.id).toBe(1);
      expect(firstActor.name).toBeDefined();
    }
  });

  it('should have $dataClasses with valid class structure', () => {
    // Assert
    const classes = (global as any).$dataClasses;
    expect(classes).toBeDefined();
    expect(Array.isArray(classes)).toBe(true);

    // Verifica primeira classe
    if (classes.length > 1) {
      const firstClass = classes[1];
      expect(firstClass).toBeDefined();
      expect(firstClass.id).toBe(1);
      expect(firstClass.name).toBeDefined();
    }
  });

  it('should have $dataSkills with valid skill structure', () => {
    // Assert
    const skills = (global as any).$dataSkills;
    expect(skills).toBeDefined();
    expect(Array.isArray(skills)).toBe(true);

    // Verifica primeira skill (ID 1 é geralmente Attack)
    if (skills.length > 1) {
      const firstSkill = skills[1];
      expect(firstSkill).toBeDefined();
      expect(firstSkill.id).toBe(1);
      expect(firstSkill.name).toBeDefined();
    }
  });

  it('should have DataManager.isDatabaseLoaded() returning true', () => {
    // Assert
    const DataManager = (global as any).DataManager;
    expect(DataManager).toBeDefined();
    expect(DataManager.isDatabaseLoaded()).toBe(true);
  });
});
