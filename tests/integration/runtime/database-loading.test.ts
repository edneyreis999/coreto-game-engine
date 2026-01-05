import { HeadlessRuntimeBootstrapper } from '@/infrastructure/runtime/HeadlessRuntimeBootstrapper';
import { DatabaseLoader } from '@/infrastructure/runtime/loaders/DatabaseLoader';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Integration Tests: Database Loading
 *
 * Testa o carregamento completo da database do RPG Maker MZ em ambiente headless.
 *
 * Task 21: Synchronous Database Loading Override (ADR-016)
 *
 * NOTA: Estes testes requerem um projeto RPG Maker MZ real em tests/fixtures/test-project
 * Serão skippados automaticamente se o projeto não existir.
 */

const testProjectPath = path.join(__dirname, '../../fixtures/test-project');
const projectExists = fs.existsSync(path.join(testProjectPath, 'js', 'rmmz_core.js'));

// Skip todo o describe se o projeto RMMZ não existir
const describeIfProject = projectExists ? describe : describe.skip;

describeIfProject('Database Loading Integration', () => {
  let bootstrapper: HeadlessRuntimeBootstrapper;

  beforeAll(async () => {
    bootstrapper = new HeadlessRuntimeBootstrapper(true);
    await bootstrapper.bootstrap(testProjectPath);
  }, 30000); // Timeout de 30s para bootstrap completo

  afterAll(() => {
    bootstrapper.cleanup();
  });

  it('should load database synchronously', async () => {
    // Arrange
    const loader = new DatabaseLoader(testProjectPath);

    // Act
    loader.overrideDataManager();
    loader.loadDatabase();
    await loader.waitForDatabase();

    // Assert
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

  it('should timeout if database fails to load with invalid path', async () => {
    // Arrange
    const invalidPath = '/invalid/path/to/project';
    const loader = new DatabaseLoader(invalidPath);

    // Mock DataManager para simular falha
    const DataManager = (global as any).DataManager;
    const originalIsDatabaseLoaded = DataManager.isDatabaseLoaded;

    // Mock para sempre retornar false
    DataManager.isDatabaseLoaded = jest.fn().mockReturnValue(false);

    // Act & Assert
    await expect(loader.waitForDatabase(100)).rejects.toThrow(
      'Database loading timeout'
    );

    // Restaura função original
    DataManager.isDatabaseLoaded = originalIsDatabaseLoaded;
  });
});
