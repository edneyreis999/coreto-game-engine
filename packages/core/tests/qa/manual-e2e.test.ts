/**
 * Manual QA Tests for E2E Integration (Section 6)
 * These tests validate the manual QA scenarios from MANUAL_QA_GUIDE.md
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { RmmzProjectValidator } from '@coreto/core/infrastructure/adapters/data/RmmzProjectValidator';
import { RmmzDataLoader } from '@coreto/core/infrastructure/adapters/data/RmmzDataLoader';
import { IntegrityValidator } from '@coreto/core/infrastructure/adapters/data/IntegrityValidator';
import { NodeFileSystem } from '@coreto/core/infrastructure/adapters/filesystem/NodeFileSystem';

const PROJECT_PATH = path.join(os.tmpdir(), 'e2e-qa-project');

// Helper to setup valid MZ project with consistent references
function setupValidProject(): void {
  fs.rmSync(PROJECT_PATH, { recursive: true, force: true });
  fs.mkdirSync(path.join(PROJECT_PATH, 'data'), { recursive: true });
  fs.mkdirSync(path.join(PROJECT_PATH, 'js'), { recursive: true });
  fs.writeFileSync(path.join(PROJECT_PATH, 'game.rmmzproject'), '');

  // All references are valid (enemyId: 1 exists, skillId: 1 exists)
  fs.writeFileSync(
    path.join(PROJECT_PATH, 'data/Classes.json'),
    JSON.stringify([null, { id: 1, name: 'Guerreiro', expParams: [30, 20, 30, 30], traits: [], learnings: [], note: '', params: [[1, 1], [450, 990], [80, 120], [30, 50], [30, 50], [30, 50], [30, 50], [30, 50]] }])
  );
  fs.writeFileSync(
    path.join(PROJECT_PATH, 'data/Enemies.json'),
    JSON.stringify([null, { id: 1, name: 'Slime', battlerName: 'Slime', battlerHue: 0, params: [100, 0, 10, 10, 10, 10, 10, 10], exp: 5, gold: 3, dropItems: [], actions: [{ skillId: 1, conditionType: 0, conditionParam1: 0, conditionParam2: 0, rating: 5 }], traits: [], note: '' }])
  );
  fs.writeFileSync(
    path.join(PROJECT_PATH, 'data/Troops.json'),
    JSON.stringify([null, { id: 1, name: 'Slime*2', members: [{ enemyId: 1, x: 400, y: 400, hidden: false }], pages: [] }])
  );
  fs.writeFileSync(
    path.join(PROJECT_PATH, 'data/Skills.json'),
    JSON.stringify([null, { id: 1, name: 'Ataque', iconIndex: 76, description: '', stypeId: 0, scope: 1, mpCost: 0, tpCost: 0, message1: '', message2: '', messageType: 1, animationId: 1, damage: { type: 1, elementId: 0, formula: 'a.atk * 4 - b.def * 2', variance: 20, critical: false }, effects: [], hitType: 1, occasion: 1, speed: 0, successRate: 100, repeats: 1, tpGain: 0, requiredWtypeId1: 0, requiredWtypeId2: 0, note: '' }])
  );
  fs.writeFileSync(path.join(PROJECT_PATH, 'data/Items.json'), '[null]');
  fs.writeFileSync(path.join(PROJECT_PATH, 'data/Actors.json'), '[null]');
  fs.writeFileSync(path.join(PROJECT_PATH, 'data/Weapons.json'), '[null]');
  fs.writeFileSync(path.join(PROJECT_PATH, 'data/Armors.json'), '[null]');
  fs.writeFileSync(path.join(PROJECT_PATH, 'data/States.json'), '[null]');
  fs.writeFileSync(
    path.join(PROJECT_PATH, 'data/System.json'),
    JSON.stringify({
      gameTitle: 'E2E Test Game',
      locale: 'pt_BR',
      partyMembers: [1],
      testBattlers: [{ actorId: 1, level: 1, equips: [0, 0, 0, 0, 0] }],
      testTroopId: 1,
      elements: ['', 'Fisico'],
      skillTypes: ['', 'Magia'],
      weaponTypes: ['', 'Espada'],
      armorTypes: ['', 'Armadura'],
      equipTypes: ['', 'Arma'],
    })
  );
}

// Helper to setup project with invalid references
function setupInvalidProject(): void {
  setupValidProject();

  // Modify troop to reference non-existent enemy (enemyId: 999)
  fs.writeFileSync(
    path.join(PROJECT_PATH, 'data/Troops.json'),
    JSON.stringify([null, { id: 1, name: 'Broken Troop', members: [{ enemyId: 999, x: 400, y: 400, hidden: false }], pages: [] }])
  );
}

describe('Manual QA - Section 6: Testes de Integração Manual', () => {
  let fileSystem: NodeFileSystem;
  let validator: RmmzProjectValidator;
  let loader: RmmzDataLoader;
  let integrityValidator: IntegrityValidator;

  beforeAll(() => {
    fileSystem = new NodeFileSystem();
    validator = new RmmzProjectValidator(fileSystem);
    loader = new RmmzDataLoader(fileSystem, validator);
    integrityValidator = new IntegrityValidator();
  });

  afterAll(() => {
    fs.rmSync(PROJECT_PATH, { recursive: true, force: true });
  });

  describe('TC-E2E-001: Fluxo Completo de Validação de Projeto', () => {
    beforeAll(() => {
      setupValidProject();
    });

    it('should complete full validation flow without errors', async () => {
      // Step 1: Validate project structure
      const structureValid = await validator.validateProjectStructure(PROJECT_PATH);
      expect(structureValid).toBe(true);

      // Step 2: Load database
      const db = await loader.loadDatabase(PROJECT_PATH);
      expect(db).toBeDefined();
      expect(db.$dataClasses).toBeDefined();
      expect(db.$dataEnemies).toBeDefined();
      expect(db.$dataTroops).toBeDefined();
      expect(db.$dataSkills).toBeDefined();
      expect(db.$dataSystem).toBeDefined();

      // Step 3: Validate references
      const warnings = integrityValidator.validate(db);
      expect(warnings).toEqual([]);
    });

    it('should load correct data values', async () => {
      const db = await loader.loadDatabase(PROJECT_PATH);

      // Verify loaded data
      expect(db.$dataClasses[1]?.name).toBe('Guerreiro');
      expect(db.$dataEnemies[1]?.name).toBe('Slime');
      expect(db.$dataTroops[1]?.name).toBe('Slime*2');
      expect(db.$dataSkills[1]?.name).toBe('Ataque');
      expect(db.$dataSystem.gameTitle).toBe('E2E Test Game');
    });
  });

  describe('TC-E2E-002: Fluxo com Dados Inconsistentes', () => {
    beforeAll(() => {
      setupInvalidProject();
    });

    it('should detect inconsistencies and collect warnings', async () => {
      // Step 1: Validate project structure (should still pass)
      const structureValid = await validator.validateProjectStructure(PROJECT_PATH);
      expect(structureValid).toBe(true);

      // Step 2: Load database (should still succeed)
      const db = await loader.loadDatabase(PROJECT_PATH);
      expect(db).toBeDefined();

      // Step 3: Validate references - should find warnings
      const warnings = integrityValidator.validate(db);

      // Should have at least one warning
      expect(warnings.length).toBeGreaterThan(0);

      // Should have enemy_not_found warning
      const enemyWarning = warnings.find(w => w.type === 'enemy_not_found');
      expect(enemyWarning).toBeDefined();
      expect(enemyWarning?.severity).toBe('critical');
      expect(enemyWarning?.context).toHaveProperty('enemyId', 999);
    });

    it('should provide useful debugging context in warnings', async () => {
      const db = await loader.loadDatabase(PROJECT_PATH);
      const warnings = integrityValidator.validate(db);

      // All warnings should have useful context
      for (const warning of warnings) {
        expect(warning.type).toBeDefined();
        expect(warning.severity).toBeDefined();
        expect(warning.message).toBeDefined();
        expect(warning.context).toBeDefined();
        expect(typeof warning.message).toBe('string');
        expect(warning.message.length).toBeGreaterThan(0);
      }
    });
  });
});
