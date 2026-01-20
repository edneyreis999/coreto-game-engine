/**
 * Manual QA Tests for Data Loading (Section 3)
 * These tests validate the manual QA scenarios from MANUAL_QA_GUIDE.md
 */

import { DataLoadError } from '../../src/core/errors/DataLoadError';
import { RmmzDataLoader } from '../../src/infrastructure/adapters/data/RmmzDataLoader';
import { RmmzProjectValidator } from '../../src/infrastructure/adapters/data/RmmzProjectValidator';
import { NodeFileSystem } from '../../src/infrastructure/adapters/filesystem/NodeFileSystem';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_PATH = '/tmp/fake-mz-project-qa';

// Helper to setup fake MZ project
function setupFakeProject(): void {
  fs.rmSync(PROJECT_PATH, { recursive: true, force: true });
  fs.mkdirSync(path.join(PROJECT_PATH, 'data'), { recursive: true });
  fs.mkdirSync(path.join(PROJECT_PATH, 'js'), { recursive: true });
  fs.writeFileSync(path.join(PROJECT_PATH, 'game.rmmzproject'), '');

  fs.writeFileSync(
    path.join(PROJECT_PATH, 'data/Classes.json'),
    JSON.stringify([
      null,
      {
        id: 1,
        name: 'Guerreiro',
        expParams: [30, 20, 30, 30],
        traits: [],
        learnings: [],
        note: '',
        params: [
          [1, 1],
          [450, 990],
          [80, 120],
          [30, 50],
          [30, 50],
          [30, 50],
          [30, 50],
          [30, 50],
        ],
      },
    ])
  );
  fs.writeFileSync(
    path.join(PROJECT_PATH, 'data/Enemies.json'),
    JSON.stringify([
      null,
      {
        id: 1,
        name: 'Slime',
        battlerName: 'Slime',
        battlerHue: 0,
        params: [100, 0, 10, 10, 10, 10, 10, 10],
        exp: 5,
        gold: 3,
        dropItems: [],
        actions: [
          { skillId: 1, conditionType: 0, conditionParam1: 0, conditionParam2: 0, rating: 5 },
        ],
        traits: [],
        note: '',
      },
    ])
  );
  fs.writeFileSync(
    path.join(PROJECT_PATH, 'data/Troops.json'),
    JSON.stringify([
      null,
      {
        id: 1,
        name: 'Slime*2',
        members: [
          { enemyId: 1, x: 400, y: 400, hidden: false },
          { enemyId: 1, x: 450, y: 400, hidden: false },
        ],
        pages: [],
      },
    ])
  );
  fs.writeFileSync(
    path.join(PROJECT_PATH, 'data/Skills.json'),
    JSON.stringify([
      null,
      {
        id: 1,
        name: 'Ataque',
        iconIndex: 76,
        description: '',
        stypeId: 0,
        scope: 1,
        mpCost: 0,
        tpCost: 0,
        message1: '',
        message2: '',
        messageType: 1,
        animationId: 1,
        damage: {
          type: 1,
          elementId: 0,
          formula: 'a.atk * 4 - b.def * 2',
          variance: 20,
          critical: false,
        },
        effects: [],
        hitType: 1,
        occasion: 1,
        speed: 0,
        successRate: 100,
        repeats: 1,
        tpGain: 0,
        requiredWtypeId1: 0,
        requiredWtypeId2: 0,
        note: '',
      },
    ])
  );
  fs.writeFileSync(path.join(PROJECT_PATH, 'data/Items.json'), '[null]');
  fs.writeFileSync(path.join(PROJECT_PATH, 'data/Actors.json'), '[null]');
  fs.writeFileSync(path.join(PROJECT_PATH, 'data/Weapons.json'), '[null]');
  fs.writeFileSync(path.join(PROJECT_PATH, 'data/Armors.json'), '[null]');
  fs.writeFileSync(path.join(PROJECT_PATH, 'data/States.json'), '[null]');
  fs.writeFileSync(
    path.join(PROJECT_PATH, 'data/System.json'),
    JSON.stringify({
      gameTitle: 'QA Test Game',
      locale: 'pt_BR',
      partyMembers: [1],
      testBattlers: [{ actorId: 1, level: 1, equips: [0, 0, 0, 0, 0] }],
      testTroopId: 1,
      elements: ['', 'Fisico', 'Fogo'],
      skillTypes: ['', 'Magia'],
      weaponTypes: ['', 'Espada'],
      armorTypes: ['', 'Armadura'],
      equipTypes: ['', 'Arma', 'Escudo'],
      terms: {},
      sounds: [],
      switches: [],
      variables: [],
      battleBgm: {},
      victoryMe: {},
      defeatMe: {},
      gameoverMe: {},
      titleBgm: {},
      boat: {},
      ship: {},
      airship: {},
      optSideView: true,
      advanced: {},
    })
  );
}

function cleanupFakeProject(): void {
  fs.rmSync(PROJECT_PATH, { recursive: true, force: true });
}

describe('Manual QA - Section 3: Data Loading', () => {
  let fileSystem: NodeFileSystem;
  let validator: RmmzProjectValidator;
  let loader: RmmzDataLoader;

  beforeAll(() => {
    setupFakeProject();
    fileSystem = new NodeFileSystem();
    validator = new RmmzProjectValidator(fileSystem);
    loader = new RmmzDataLoader(fileSystem, validator);
  });

  afterAll(() => {
    cleanupFakeProject();
  });

  describe('TC-DATA-001: Validar Estrutura de Projeto Válido', () => {
    it('should return true for valid RPG Maker MZ project', async () => {
      const result = await validator.validateProjectStructure(PROJECT_PATH);
      expect(result).toBe(true);
    });
  });

  describe('TC-DATA-002: Projeto sem game.rmmzproject', () => {
    it('should throw DataLoadError if game.rmmzproject is missing', async () => {
      const markerPath = path.join(PROJECT_PATH, 'game.rmmzproject');
      fs.unlinkSync(markerPath);

      try {
        await expect(validator.validateProjectStructure(PROJECT_PATH)).rejects.toThrow(
          DataLoadError
        );
      } finally {
        fs.writeFileSync(markerPath, '');
      }
    });
  });

  describe('TC-DATA-003: Projeto sem Diretório data/', () => {
    it('should throw DataLoadError if data/ directory is missing', async () => {
      const dataPath = path.join(PROJECT_PATH, 'data');
      const backupPath = path.join(PROJECT_PATH, 'data-backup');
      fs.renameSync(dataPath, backupPath);

      try {
        await expect(validator.validateProjectStructure(PROJECT_PATH)).rejects.toThrow(
          DataLoadError
        );
      } finally {
        fs.renameSync(backupPath, dataPath);
      }
    });
  });

  describe('TC-DATA-004: Carregar Database Completo', () => {
    it('should load all database files correctly', async () => {
      const db = await loader.loadDatabase(PROJECT_PATH);

      expect(db.$dataClasses).toBeDefined();
      expect(db.$dataClasses.length).toBeGreaterThan(1);
      expect(db.$dataClasses[1]?.name).toBe('Guerreiro');

      expect(db.$dataEnemies).toBeDefined();
      expect(db.$dataEnemies.length).toBeGreaterThan(1);
      expect(db.$dataEnemies[1]?.name).toBe('Slime');

      expect(db.$dataTroops).toBeDefined();
      expect(db.$dataTroops.length).toBeGreaterThan(1);
      expect(db.$dataTroops[1]?.name).toBe('Slime*2');

      expect(db.$dataSkills).toBeDefined();
      expect(db.$dataSkills.length).toBeGreaterThan(1);
      expect(db.$dataSkills[1]?.name).toBe('Ataque');

      expect(db.$dataSystem).toBeDefined();
      expect(db.$dataSystem.gameTitle).toBe('QA Test Game');
    });
  });

  describe('TC-DATA-005: Arquivo JSON Corrompido', () => {
    it('should throw DataLoadError for corrupted JSON', async () => {
      const itemsPath = path.join(PROJECT_PATH, 'data/Items.json');
      const originalContent = fs.readFileSync(itemsPath, 'utf-8');

      fs.writeFileSync(itemsPath, 'invalid json{');

      try {
        await expect(loader.loadDatabase(PROJECT_PATH)).rejects.toThrow(DataLoadError);
      } finally {
        fs.writeFileSync(itemsPath, originalContent);
      }
    });
  });
});
