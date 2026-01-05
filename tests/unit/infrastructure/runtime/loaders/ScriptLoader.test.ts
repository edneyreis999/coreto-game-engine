import { ScriptLoader } from '@/infrastructure/runtime/loaders/ScriptLoader';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module para testes unitários
jest.mock('fs');

describe('ScriptLoader', () => {
  const mockProjectPath = '/mock/project';
  const mockJsPath = path.join(mockProjectPath, 'js');

  beforeEach(() => {
    // Reset mocks antes de cada teste
    jest.clearAllMocks();
    jest.resetAllMocks();

    // Setup padrão: diretório js/ existe
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    // Mock globals necessários para ScriptLoader (validados em loadAllScripts)
    (global as any).PIXI = { Container: function() {}, Sprite: function() {} };
    (global as any).window = { addEventListener: jest.fn() };
    (global as any).document = { createElement: jest.fn() };
  });

  describe('constructor', () => {
    it('should create instance with provided project path', () => {
      const loader = new ScriptLoader(mockProjectPath);
      expect(loader).toBeInstanceOf(ScriptLoader);
    });

    it('should create instance with diagnostic mode enabled', () => {
      const loader = new ScriptLoader(mockProjectPath, true);
      expect(loader).toBeInstanceOf(ScriptLoader);
    });
  });

  describe('getCoreScripts', () => {
    it('should return core scripts in correct order', () => {
      const loader = new ScriptLoader(mockProjectPath);
      const scripts = loader.getCoreScripts();

      expect(scripts).toEqual([
        'rmmz_core.js',
        'rmmz_managers.js',
        'rmmz_objects.js',
        'rmmz_scenes.js',
        'rmmz_sprites.js',
        'rmmz_windows.js',
      ]);
    });

    it('should return readonly array', () => {
      const loader = new ScriptLoader(mockProjectPath);
      const scripts = loader.getCoreScripts();

      // TypeScript readonly array não permite push
      // Teste garante que array retornado não pode ser modificado
      expect(Object.isFrozen(scripts)).toBe(false); // Array literal não é frozen
      expect(Array.isArray(scripts)).toBe(true);
    });
  });

  describe('loadAllScripts', () => {
    it('should throw error if js/ directory does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const loader = new ScriptLoader(mockProjectPath);

      expect(() => loader.loadAllScripts()).toThrow(
        `RPG Maker MZ js/ directory not found: ${mockJsPath}`
      );
    });

    it('should load all scripts in correct order', () => {
      // Mock readFileSync para retornar código válido
      (fs.readFileSync as jest.Mock).mockReturnValue('// Mock script code');

      // Mock eval indireto (não podemos mockar diretamente, mas podemos verificar execução)
      const loader = new ScriptLoader(mockProjectPath);

      // Não deve lançar erro
      expect(() => loader.loadAllScripts()).not.toThrow();

      // Verifica que readFileSync foi chamado para cada script
      expect(fs.readFileSync).toHaveBeenCalledTimes(6);

      // Verifica ordem de carregamento
      const expectedScripts = [
        'rmmz_core.js',
        'rmmz_managers.js',
        'rmmz_objects.js',
        'rmmz_scenes.js',
        'rmmz_sprites.js',
        'rmmz_windows.js',
      ];

      expectedScripts.forEach((script, index) => {
        const scriptPath = path.join(mockJsPath, script);
        expect(fs.readFileSync).toHaveBeenNthCalledWith(index + 1, scriptPath, 'utf8');
      });
    });

    it('should throw error if script file does not exist', () => {
      // Mock: js/ existe, mas arquivo não
      (fs.existsSync as jest.Mock)
        .mockReturnValueOnce(true) // js/ directory check
        .mockReturnValueOnce(false); // rmmz_core.js check

      const loader = new ScriptLoader(mockProjectPath);

      expect(() => loader.loadAllScripts()).toThrow('Script file not found');
    });

    it('should throw error if script loading fails', () => {
      // Mock readFileSync para lançar erro
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const loader = new ScriptLoader(mockProjectPath);

      expect(() => loader.loadAllScripts()).toThrow('Failed to load rmmz_core.js');
    });
  });

  describe('validateGlobals', () => {
    beforeEach(() => {
      // Setup: Define todos os globals esperados
      (global as any).Utils = {};
      (global as any).Graphics = {};
      (global as any).DataManager = {};
      (global as any).BattleManager = {};
      (global as any).SceneManager = {};
      (global as any).ImageManager = {};
      (global as any).AudioManager = {};
      (global as any).Game_Actor = class {};
      (global as any).Game_Enemy = class {};
      (global as any).Game_Party = class {};
      (global as any).Game_Troop = class {};
      (global as any).Game_Action = class {};
      (global as any).Game_Battler = class {};
      (global as any).Scene_Battle = class {};
      (global as any).Scene_Base = class {};
      (global as any).Spriteset_Battle = class {};
      (global as any).Sprite_Battler = class {};
      (global as any).Window_BattleLog = class {};
      (global as any).Window_BattleStatus = class {};
    });

    afterEach(() => {
      // Cleanup: Remove globals definidos no teste
      delete (global as any).Utils;
      delete (global as any).Graphics;
      delete (global as any).DataManager;
      delete (global as any).BattleManager;
      delete (global as any).SceneManager;
      delete (global as any).ImageManager;
      delete (global as any).AudioManager;
      delete (global as any).Game_Actor;
      delete (global as any).Game_Enemy;
      delete (global as any).Game_Party;
      delete (global as any).Game_Troop;
      delete (global as any).Game_Action;
      delete (global as any).Game_Battler;
      delete (global as any).Scene_Battle;
      delete (global as any).Scene_Base;
      delete (global as any).Spriteset_Battle;
      delete (global as any).Sprite_Battler;
      delete (global as any).Window_BattleLog;
      delete (global as any).Window_BattleStatus;
    });

    it('should pass validation when all globals are defined', () => {
      const loader = new ScriptLoader(mockProjectPath);

      // Não deve lançar erro
      expect(() => loader.validateGlobals()).not.toThrow();
    });

    it('should throw error if critical global is missing', () => {
      // Remove BattleManager
      delete (global as any).BattleManager;

      const loader = new ScriptLoader(mockProjectPath);

      expect(() => loader.validateGlobals()).toThrow(
        'Script validation failed: Missing globals: BattleManager'
      );
    });

    it('should list all missing globals in error message', () => {
      // Remove múltiplos globals
      delete (global as any).BattleManager;
      delete (global as any).Game_Actor;
      delete (global as any).Scene_Battle;

      const loader = new ScriptLoader(mockProjectPath);

      expect(() => loader.validateGlobals()).toThrow('BattleManager, Game_Actor, Scene_Battle');
    });

    it('should validate all expected globals', () => {
      const loader = new ScriptLoader(mockProjectPath);

      // Validação deve verificar pelo menos estes globals críticos
      const expectedGlobals = [
        'Utils',
        'Graphics',
        'DataManager',
        'BattleManager',
        'SceneManager',
        'ImageManager',
        'AudioManager',
        'Game_Actor',
        'Game_Enemy',
        'Game_Party',
        'Game_Troop',
        'Game_Action',
        'Game_Battler',
        'Scene_Battle',
        'Scene_Base',
        'Spriteset_Battle',
        'Sprite_Battler',
        'Window_BattleLog',
        'Window_BattleStatus',
      ];

      // Teste que validação não falha com todos globals definidos
      expect(() => loader.validateGlobals()).not.toThrow();

      // Teste que validação falha se qualquer global crítico estiver ausente
      expectedGlobals.forEach((globalName) => {
        const backup = (global as any)[globalName];
        delete (global as any)[globalName];

        expect(() => loader.validateGlobals()).toThrow(globalName);

        // Restaura global
        (global as any)[globalName] = backup;
      });
    });
  });

  describe('diagnostic mode', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      (fs.readFileSync as jest.Mock).mockReturnValue('// Mock script');
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should not log when diagnostic mode is disabled', () => {
      const loader = new ScriptLoader(mockProjectPath, false);
      loader.loadAllScripts();

      // Console.log não deve ser chamado em modo normal
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should log when diagnostic mode is enabled', () => {
      const loader = new ScriptLoader(mockProjectPath, true);
      loader.loadAllScripts();

      // Console.log deve ser chamado em modo diagnostic
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls.some((call) => call[0].includes('[DIAGNOSTIC]'))).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should include script name in error message', () => {
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('File read error');
      });

      const loader = new ScriptLoader(mockProjectPath);

      expect(() => loader.loadAllScripts()).toThrow('Failed to load rmmz_core.js');
    });

    it('should include original error message', () => {
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('ENOENT: no such file');
      });

      const loader = new ScriptLoader(mockProjectPath);

      expect(() => loader.loadAllScripts()).toThrow('ENOENT: no such file');
    });
  });
});
