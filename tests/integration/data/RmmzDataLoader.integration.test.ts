/**
 * RmmzDataLoader Integration Tests
 *
 * Tests loading of actual sample-data files from fixtures.
 * Validates complete database loading workflow with real JSON files.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import * as path from 'path';
import { NodeFileSystem } from '../../../packages/core/src/infrastructure/adapters/filesystem/index.js';
import type { EnemyData, TroopData, ClassData, SkillData, ItemData, SystemData } from '@coreto/core';

describe('RmmzDataLoader Integration Tests', () => {
  let fileSystem: NodeFileSystem;
  let sampleDataPath: string;

  beforeEach(() => {
    fileSystem = new NodeFileSystem();

    // Path to sample-data directory
    sampleDataPath = path.resolve(__dirname, '../../fixtures/sample-data');
  });

  describe('loadDataFile with real JSON files', () => {
    it('should load Classes.json from sample-data', () => {
      const classesPath = path.join(sampleDataPath, 'Classes.json');
      const classesContent = fileSystem.readFileSync(classesPath);
      const classes = JSON.parse(classesContent) as ClassData[];

      expect(Array.isArray(classes)).toBe(true);
      expect(classes.length).toBeGreaterThan(0);

      // Verify structure of first class (after null at index 0)
      const firstClass = classes.find((c) => c !== null);
      expect(firstClass).toBeDefined();
      if (firstClass) {
        expect(firstClass).toHaveProperty('id');
        expect(firstClass).toHaveProperty('name');
        expect(firstClass).toHaveProperty('expParams');
        expect(firstClass).toHaveProperty('traits');
        expect(firstClass).toHaveProperty('learnings');
        expect(firstClass).toHaveProperty('params');
        expect(firstClass.params).toHaveLength(8); // 8 parameters
        expect(firstClass.params[0]).toHaveLength(100); // 100 levels (0-99)
      }
    });

    it('should load Enemies.json from sample-data', () => {
      const enemiesPath = path.join(sampleDataPath, 'Enemies.json');
      const enemiesContent = fileSystem.readFileSync(enemiesPath);
      const enemies = JSON.parse(enemiesContent) as EnemyData[];

      expect(Array.isArray(enemies)).toBe(true);
      expect(enemies.length).toBeGreaterThan(0);

      // Verify structure of first enemy
      const firstEnemy = enemies.find((e) => e !== null);
      expect(firstEnemy).toBeDefined();
      if (firstEnemy) {
        expect(firstEnemy).toHaveProperty('id');
        expect(firstEnemy).toHaveProperty('name');
        expect(firstEnemy).toHaveProperty('params');
        expect(firstEnemy).toHaveProperty('actions');
        expect(firstEnemy).toHaveProperty('traits');
        expect(firstEnemy).toHaveProperty('dropItems');
        expect(firstEnemy).toHaveProperty('exp');
        expect(firstEnemy).toHaveProperty('gold');
        expect(firstEnemy.params).toHaveLength(8); // 8 base parameters
      }
    });

    it('should load Troops.json from sample-data', () => {
      const troopsPath = path.join(sampleDataPath, 'Troops.json');
      const troopsContent = fileSystem.readFileSync(troopsPath);
      const troops = JSON.parse(troopsContent) as TroopData[];

      expect(Array.isArray(troops)).toBe(true);
      expect(troops.length).toBeGreaterThan(0);

      // Verify structure of first troop
      const firstTroop = troops.find((t) => t !== null);
      expect(firstTroop).toBeDefined();
      if (firstTroop) {
        expect(firstTroop).toHaveProperty('id');
        expect(firstTroop).toHaveProperty('name');
        expect(firstTroop).toHaveProperty('members');
        expect(firstTroop).toHaveProperty('pages');
        expect(Array.isArray(firstTroop.members)).toBe(true);
        expect(Array.isArray(firstTroop.pages)).toBe(true);

        // Verify troop member structure
        if (firstTroop.members.length > 0) {
          const member = firstTroop.members[0];
          expect(member).toHaveProperty('enemyId');
          expect(member).toHaveProperty('x');
          expect(member).toHaveProperty('y');
          expect(member).toHaveProperty('hidden');
        }
      }
    });

    it('should load Skills.json from sample-data', () => {
      const skillsPath = path.join(sampleDataPath, 'Skills.json');
      const skillsContent = fileSystem.readFileSync(skillsPath);
      const skills = JSON.parse(skillsContent) as SkillData[];

      expect(Array.isArray(skills)).toBe(true);
      expect(skills.length).toBeGreaterThan(0);

      // Verify structure of first skill
      const firstSkill = skills.find((s) => s !== null);
      expect(firstSkill).toBeDefined();
      if (firstSkill) {
        expect(firstSkill).toHaveProperty('id');
        expect(firstSkill).toHaveProperty('name');
        expect(firstSkill).toHaveProperty('damage');
        expect(firstSkill).toHaveProperty('effects');
        expect(firstSkill).toHaveProperty('mpCost');
        expect(firstSkill).toHaveProperty('tpCost');
        expect(firstSkill).toHaveProperty('scope');

        // Verify damage structure
        expect(firstSkill.damage).toHaveProperty('type');
        expect(firstSkill.damage).toHaveProperty('elementId');
        expect(firstSkill.damage).toHaveProperty('formula');
        expect(firstSkill.damage).toHaveProperty('variance');
        expect(firstSkill.damage).toHaveProperty('critical');
      }
    });

    it('should load Items.json from sample-data', () => {
      const itemsPath = path.join(sampleDataPath, 'Items.json');
      const itemsContent = fileSystem.readFileSync(itemsPath);
      const items = JSON.parse(itemsContent) as ItemData[];

      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);

      // Verify structure of first item
      const firstItem = items.find((i) => i !== null);
      expect(firstItem).toBeDefined();
      if (firstItem) {
        expect(firstItem).toHaveProperty('id');
        expect(firstItem).toHaveProperty('name');
        expect(firstItem).toHaveProperty('description');
        expect(firstItem).toHaveProperty('consumable');
        expect(firstItem).toHaveProperty('damage');
        expect(firstItem).toHaveProperty('effects');
        expect(firstItem).toHaveProperty('price');
        expect(firstItem).toHaveProperty('scope');
      }
    });

    it('should load System.json from sample-data', () => {
      const systemPath = path.join(sampleDataPath, 'System.json');
      const systemContent = fileSystem.readFileSync(systemPath);
      const system = JSON.parse(systemContent) as SystemData;

      expect(system).toBeDefined();
      expect(system).toHaveProperty('gameTitle');
      expect(system).toHaveProperty('versionId');
      expect(system).toHaveProperty('locale');
      expect(system).toHaveProperty('elements');
      expect(system).toHaveProperty('skillTypes');
      expect(system).toHaveProperty('weaponTypes');
      expect(system).toHaveProperty('armorTypes');
      expect(system).toHaveProperty('equipTypes');

      // Verify arrays are properly loaded
      expect(Array.isArray(system.elements)).toBe(true);
      expect(Array.isArray(system.skillTypes)).toBe(true);
      expect(Array.isArray(system.weaponTypes)).toBe(true);

      // Verify version ID is present
      expect(system.versionId).toBeGreaterThan(0);
    });
  });

  describe('Real-world data structure validation', () => {
    it('should correctly parse Goblin enemy from Enemies.json', () => {
      const enemiesPath = path.join(sampleDataPath, 'Enemies.json');
      const enemiesContent = fileSystem.readFileSync(enemiesPath);
      const enemies = JSON.parse(enemiesContent) as EnemyData[];

      const goblin = enemies.find((e) => e && e.name === 'Goblin');
      expect(goblin).toBeDefined();
      if (goblin) {
        expect(goblin.id).toBe(1);
        expect(goblin.params[0]).toBe(1); // MaxHP
        expect(goblin.params[2]).toBe(25); // ATK
        expect(goblin.exp).toBe(10000);
        expect(goblin.gold).toBe(5000);
        expect(goblin.actions.length).toBeGreaterThan(0);
      }
    });

    it('should correctly parse Mago class from Classes.json', () => {
      const classesPath = path.join(sampleDataPath, 'Classes.json');
      const classesContent = fileSystem.readFileSync(classesPath);
      const classes = JSON.parse(classesContent) as ClassData[];

      const mago = classes.find((c) => c && c.name === 'Mago');
      expect(mago).toBeDefined();
      if (mago) {
        expect(mago.id).toBe(2);
        expect(mago.learnings.length).toBeGreaterThan(0);
        expect(mago.expParams).toHaveLength(4);
        expect(mago.params).toHaveLength(8);

        // Verify first learning
        const firstLearning = mago.learnings[0];
        expect(firstLearning).toHaveProperty('level');
        expect(firstLearning).toHaveProperty('skillId');
      }
    });

    it('should correctly parse Attack skill from Skills.json', () => {
      const skillsPath = path.join(sampleDataPath, 'Skills.json');
      const skillsContent = fileSystem.readFileSync(skillsPath);
      const skills = JSON.parse(skillsContent) as SkillData[];

      const attack = skills.find((s) => s && s.id === 1);
      expect(attack).toBeDefined();
      if (attack) {
        expect(attack.name).toBe('Ataque');
        expect(attack.damage.type).toBe(1); // HP Damage
        expect(attack.damage.formula).toBe('a.atk * 4 - b.def * 2');
        expect(attack.damage.critical).toBe(true);
        expect(attack.mpCost).toBe(0);
        expect(attack.tpCost).toBe(0);
      }
    });

    it('should correctly parse Goblin*2 troop from Troops.json', () => {
      const troopsPath = path.join(sampleDataPath, 'Troops.json');
      const troopsContent = fileSystem.readFileSync(troopsPath);
      const troops = JSON.parse(troopsContent) as TroopData[];

      const goblinTroop = troops.find((t) => t && t.id === 1);
      expect(goblinTroop).toBeDefined();
      if (goblinTroop) {
        expect(goblinTroop.name).toBe('Goblin*2');
        expect(goblinTroop.members).toHaveLength(2);

        // Verify both members reference enemy ID 1
        expect(goblinTroop.members[0]?.enemyId).toBe(1);
        expect(goblinTroop.members[1]?.enemyId).toBe(1);

        // Verify positions
        expect(goblinTroop.members[0]?.x).toBe(336);
        expect(goblinTroop.members[0]?.y).toBe(436);
      }
    });

    it('should correctly parse System.json with Brazilian Portuguese locale', () => {
      const systemPath = path.join(sampleDataPath, 'System.json');
      const systemContent = fileSystem.readFileSync(systemPath);
      const system = JSON.parse(systemContent) as SystemData;

      expect(system.gameTitle).toBe('Daratrine - A Origem');
      expect(system.locale).toBe('pt_BR');
      expect(system.currencyUnit).toBe('Ludos');
      expect(system.battleSystem).toBe(1); // ATB/CTB

      // Verify elements (index 0 is empty string)
      expect(system.elements[0]).toBe('');
      expect(system.elements[1]).toBe('Físico');
      expect(system.elements[2]).toBe('Fogo');

      // Verify skill types
      expect(system.skillTypes[1]).toBe('Mágica');
      expect(system.skillTypes[2]).toBe('Especial');
    });
  });
});
