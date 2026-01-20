/**
 * Integration Tests: JSDOM Setup
 *
 * Valida a inicialização completa do JSDOM e injeção de globals
 * no headless runtime do RPG Maker MZ.
 *
 * Critérios de aceite (Task 18):
 * - JSDOM inicializa com stub-index.html
 * - Globals injetados: window, document, navigator
 * - localStorage e sessionStorage funcionam
 * - Canvas API mockado (getContext('2d') retorna objeto)
 * - Diagnostic mode loga API calls
 * - Cleanup libera recursos (dom.window.close())
 */

import { HeadlessRuntimeBootstrapper } from '../../src/infrastructure/runtime/HeadlessRuntimeBootstrapper.js';

// Mock ScriptLoader para testes de integração (Task 22)
// Estes testes focam em JSDOM setup, não em carregamento de scripts
jest.mock('../../src/infrastructure/runtime/loaders/ScriptLoader.js', () => {
  return {
    ScriptLoader: jest.fn().mockImplementation(() => {
      return {
        loadAllScripts: jest.fn(),
        validateGlobals: jest.fn(),
      };
    }),
  };
});

// Mock HeadlessOverrides para testes de integração (Task 22.5)
// Estes testes focam em JSDOM setup, não em overrides de busy state
jest.mock('../../src/infrastructure/runtime/overrides/HeadlessOverrides.js', () => {
  return {
    HeadlessOverrides: jest.fn().mockImplementation(() => {
      return {
        applyAll: jest.fn(),
        validateOverrides: jest.fn(),
      };
    }),
  };
});

// Mock DatabaseLoader para testes de integração (Task 21)
// Estes testes focam em JSDOM setup, não em database loading
jest.mock('../../src/infrastructure/runtime/loaders/DatabaseLoader.js', () => {
  return {
    DatabaseLoader: jest.fn().mockImplementation(() => {
      return {
        overrideDataManager: jest.fn(),
        loadDatabase: jest.fn(),
        waitForDatabase: jest.fn().mockResolvedValue(undefined),
        validateDatabase: jest.fn(),
      };
    }),
  };
});

describe('Integration: JSDOM Setup', () => {
  let runtime: HeadlessRuntimeBootstrapper;

  beforeEach(() => {
    // Limpa globals antes de cada teste
    delete (global as any).window;
    delete (global as any).document;
    delete (global as any).navigator;
    delete (global as any).localStorage;
    delete (global as any).sessionStorage;

    // Mock ImageManager para step5_applyOverrides (Task 20.5-20.6)
    // ImageManager seria normalmente carregado via rmmz_managers.js em step4
    (global as any).ImageManager = {
      loadBitmap: jest.fn(),
      clear: jest.fn(),
      isReady: jest.fn().mockReturnValue(true),
    };
  });

  afterEach(() => {
    if (runtime) {
      runtime.cleanup();
    }
  });

  describe('Step 1: JSDOM Initialization', () => {
    it('should initialize JSDOM and inject globals', async () => {
      // Arrange
      runtime = new HeadlessRuntimeBootstrapper(false);
      const projectPath = '/tmp/test-project';

      // Act
      await runtime.bootstrap(projectPath);

      // Assert
      expect((global as any).window).toBeDefined();
      expect((global as any).document).toBeDefined();
      expect((global as any).navigator).toBeDefined();
    });

    it('should inject Canvas API globals', async () => {
      // Arrange
      runtime = new HeadlessRuntimeBootstrapper(false);
      const projectPath = '/tmp/test-project';

      // Act
      await runtime.bootstrap(projectPath);

      // Assert
      expect((global as any).HTMLCanvasElement).toBeDefined();
      expect((global as any).CanvasRenderingContext2D).toBeDefined();
      expect((global as any).HTMLElement).toBeDefined();
    });

    it('should create JSDOM with pretendToBeVisual: true', async () => {
      // Arrange
      runtime = new HeadlessRuntimeBootstrapper(false);
      const projectPath = '/tmp/test-project';

      // Act
      await runtime.bootstrap(projectPath);

      // Assert
      const dom = runtime.getDOM();
      expect(dom).not.toBeNull();
      // JSDOM com pretendToBeVisual simula que há um display
      // Verificar que window.requestAnimationFrame existe
      expect((global as any).window.requestAnimationFrame).toBeDefined();
    });

    it('should throw error if stub-index.html does not exist', async () => {
      // Arrange
      runtime = new HeadlessRuntimeBootstrapper(false);
      const projectPath = '/tmp/test-project';

      // Temporariamente renomeia stub-index.html para forçar erro
      const fs = await import('fs');
      const path = await import('path');
      const stubPath = path.join(process.cwd(), 'stub-index.html');
      const backupPath = path.join(process.cwd(), 'stub-index.html.backup');

      // Verifica se arquivo existe antes de renomear
      if (!fs.existsSync(stubPath)) {
        // Se não existe, pula o teste
        return;
      }

      fs.renameSync(stubPath, backupPath);

      try {
        // Act & Assert
        await expect(runtime.bootstrap(projectPath)).rejects.toThrow(
          /stub-index.html not found/
        );
      } finally {
        // Restaura arquivo
        fs.renameSync(backupPath, stubPath);
      }
    });
  });

  describe('Storage Mocking', () => {
    it('should mock localStorage with functional implementation', async () => {
      // Arrange
      runtime = new HeadlessRuntimeBootstrapper(false);
      const projectPath = '/tmp/test-project';
      await runtime.bootstrap(projectPath);

      // Act
      (global as any).localStorage.setItem('testKey', 'testValue');
      const result = (global as any).localStorage.getItem('testKey');

      // Assert
      expect(result).toBe('testValue');
    });

    it('should mock sessionStorage with functional implementation', async () => {
      // Arrange
      runtime = new HeadlessRuntimeBootstrapper(false);
      const projectPath = '/tmp/test-project';
      await runtime.bootstrap(projectPath);

      // Act
      (global as any).sessionStorage.setItem('sessionKey', 'sessionValue');
      const result = (global as any).sessionStorage.getItem('sessionKey');

      // Assert
      expect(result).toBe('sessionValue');
    });

    it('should support localStorage.removeItem', async () => {
      // Arrange
      runtime = new HeadlessRuntimeBootstrapper(false);
      const projectPath = '/tmp/test-project';
      await runtime.bootstrap(projectPath);

      // Act
      (global as any).localStorage.setItem('key1', 'value1');
      (global as any).localStorage.removeItem('key1');
      const result = (global as any).localStorage.getItem('key1');

      // Assert
      expect(result).toBeNull();
    });

    it('should support localStorage.clear', async () => {
      // Arrange
      runtime = new HeadlessRuntimeBootstrapper(false);
      const projectPath = '/tmp/test-project';
      await runtime.bootstrap(projectPath);

      // Act
      (global as any).localStorage.setItem('key1', 'value1');
      (global as any).localStorage.setItem('key2', 'value2');
      (global as any).localStorage.clear();

      // Assert
      expect((global as any).localStorage.length).toBe(0);
      expect((global as any).localStorage.getItem('key1')).toBeNull();
    });

    it('should support localStorage.length', async () => {
      // Arrange
      runtime = new HeadlessRuntimeBootstrapper(false);
      const projectPath = '/tmp/test-project';
      await runtime.bootstrap(projectPath);

      // Act
      (global as any).localStorage.setItem('key1', 'value1');
      (global as any).localStorage.setItem('key2', 'value2');

      // Assert
      expect((global as any).localStorage.length).toBe(2);
    });

    it('should support localStorage.key(index)', async () => {
      // Arrange
      runtime = new HeadlessRuntimeBootstrapper(false);
      const projectPath = '/tmp/test-project';
      await runtime.bootstrap(projectPath);

      // Act
      (global as any).localStorage.setItem('keyA', 'valueA');
      const key = (global as any).localStorage.key(0);

      // Assert
      expect(key).toBe('keyA');
    });
  });

  describe('Canvas API Support', () => {
    it('should support Canvas 2D context via jest-canvas-mock', async () => {
      // Arrange
      runtime = new HeadlessRuntimeBootstrapper(false);
      const projectPath = '/tmp/test-project';
      await runtime.bootstrap(projectPath);

      // Act
      const canvas = (global as any).document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Assert
      expect(ctx).not.toBeNull();
      expect(ctx.fillRect).toBeDefined(); // jest-canvas-mock implementa fillRect
    });

    it('should support canvas.getContext("2d") returns functional context', async () => {
      // Arrange
      runtime = new HeadlessRuntimeBootstrapper(false);
      const projectPath = '/tmp/test-project';
      await runtime.bootstrap(projectPath);

      // Act
      const canvas = (global as any).document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Executar operação Canvas básica (não deve lançar erro)
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(0, 0, 100, 100);

      // Assert
      // Mock não normaliza cor, mantém o valor original
      expect(ctx.fillStyle).toBe('#FF0000');
    });

    it('should support common CanvasRenderingContext2D methods used by RMMZ', async () => {
      runtime = new HeadlessRuntimeBootstrapper(false);
      const projectPath = '/tmp/test-project';
      await runtime.bootstrap(projectPath);

      const canvas = (global as any).document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Hit most mocked methods to improve coverage of the bootstrapper Canvas API stub
      ctx.clearRect(0, 0, 1, 1);
      ctx.strokeRect(0, 0, 1, 1);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(1, 1);
      ctx.arc(0, 0, 1, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.save();
      ctx.restore();
      ctx.translate(1, 1);
      ctx.rotate(0);
      ctx.scale(1, 1);
      ctx.getImageData(0, 0, 1, 1);
      ctx.putImageData({ data: new Uint8ClampedArray(0), width: 0, height: 0 }, 0, 0);
      ctx.measureText('x');

      // Non-2d context should safely return null
      expect(canvas.getContext('webgl')).toBeNull();
    });
  });

  describe('RPG Maker MZ Globals ($data* e $game*)', () => {
    it('should define all $data* globals as null', async () => {
      // Arrange
      runtime = new HeadlessRuntimeBootstrapper(false);
      const projectPath = '/tmp/test-project';

      // Act
      await runtime.bootstrap(projectPath);

      // Assert
      expect((global as any).$dataActors).toBeNull();
      expect((global as any).$dataClasses).toBeNull();
      expect((global as any).$dataSkills).toBeNull();
      expect((global as any).$dataItems).toBeNull();
      expect((global as any).$dataWeapons).toBeNull();
      expect((global as any).$dataArmors).toBeNull();
      expect((global as any).$dataEnemies).toBeNull();
      expect((global as any).$dataTroops).toBeNull();
      expect((global as any).$dataStates).toBeNull();
      expect((global as any).$dataAnimations).toBeNull();
      expect((global as any).$dataTilesets).toBeNull();
      expect((global as any).$dataCommonEvents).toBeNull();
      expect((global as any).$dataSystem).toBeNull();
      expect((global as any).$dataMapInfos).toBeNull();
      expect((global as any).$dataMap).toBeNull();
    });

    it('should define all $game* globals as null', async () => {
      // Arrange
      runtime = new HeadlessRuntimeBootstrapper(false);
      const projectPath = '/tmp/test-project';

      // Act
      await runtime.bootstrap(projectPath);

      // Assert
      expect((global as any).$gameTemp).toBeNull();
      expect((global as any).$gameSystem).toBeNull();
      expect((global as any).$gameScreen).toBeNull();
      expect((global as any).$gameTimer).toBeNull();
      expect((global as any).$gameMessage).toBeNull();
      expect((global as any).$gameSwitches).toBeNull();
      expect((global as any).$gameVariables).toBeNull();
      expect((global as any).$gameSelfSwitches).toBeNull();
      expect((global as any).$gameActors).toBeNull();
      expect((global as any).$gameParty).toBeNull();
      expect((global as any).$gameTroop).toBeNull();
      expect((global as any).$gameMap).toBeNull();
      expect((global as any).$gamePlayer).toBeNull();
    });

    it('should initialize game objects when DataManager.createGameObjects is available', async () => {
      runtime = new HeadlessRuntimeBootstrapper(false);

      (global as any).DataManager = {
        createGameObjects: jest.fn(() => {
          (global as any).$gameParty = { members: () => [] };
          (global as any).$gameActors = { actor: () => null };
        }),
      };

      await runtime.bootstrap('/tmp/test-project');

      expect((global as any).DataManager.createGameObjects).toHaveBeenCalled();
      expect((global as any).$gameParty).toBeDefined();
      expect((global as any).$gameActors).toBeDefined();
    });

    it('should exercise warning branches when createGameObjects does not initialize objects', async () => {
      runtime = new HeadlessRuntimeBootstrapper(true);

      (global as any).DataManager = {
        createGameObjects: jest.fn(() => {
          // Intentionally do not set $gameParty/$gameActors
        }),
      };

      await runtime.bootstrap('/tmp/test-project');
      expect((global as any).DataManager.createGameObjects).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should close JSDOM window on cleanup', async () => {
      // Arrange
      runtime = new HeadlessRuntimeBootstrapper(false);
      const projectPath = '/tmp/test-project';
      await runtime.bootstrap(projectPath);

      const dom = runtime.getDOM();
      expect(dom).not.toBeNull();

      // Act
      runtime.cleanup();

      // Assert
      expect(runtime.getDOM()).toBeNull();
    });

    it('should not throw error if cleanup called multiple times', async () => {
      // Arrange
      runtime = new HeadlessRuntimeBootstrapper(false);
      const projectPath = '/tmp/test-project';
      await runtime.bootstrap(projectPath);

      // Act & Assert
      expect(() => {
        runtime.cleanup();
        runtime.cleanup(); // Segunda chamada não deve falhar
      }).not.toThrow();
    });
  });

  describe('Diagnostic Mode', () => {
    it('should log messages when diagnostic mode is enabled', async () => {
      // Arrange
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      runtime = new HeadlessRuntimeBootstrapper(true); // Diagnostic mode ON
      const projectPath = '/tmp/test-project';

      // Act
      await runtime.bootstrap(projectPath);

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DIAGNOSTIC]')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Starting headless runtime initialization')
      );

      // Cleanup
      consoleLogSpy.mockRestore();
    });

    it('should NOT log messages when diagnostic mode is disabled', async () => {
      // Arrange
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      runtime = new HeadlessRuntimeBootstrapper(false); // Diagnostic mode OFF
      const projectPath = '/tmp/test-project';

      // Act
      await runtime.bootstrap(projectPath);

      // Assert
      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('[DIAGNOSTIC]')
      );

      // Cleanup
      consoleLogSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty projectPath gracefully', async () => {
      // Arrange
      runtime = new HeadlessRuntimeBootstrapper(false);

      // Act
      await runtime.bootstrap('');

      // Assert - JSDOM aceita URL vazia, mas globals devem estar injetados
      expect((global as any).window).toBeDefined();
      expect((global as any).document).toBeDefined();
    });

    it('should expose getDOM() method for testing', async () => {
      // Arrange
      runtime = new HeadlessRuntimeBootstrapper(false);
      const projectPath = '/tmp/test-project';

      // Act
      await runtime.bootstrap(projectPath);
      const dom = runtime.getDOM();

      // Assert
      expect(dom).not.toBeNull();
      expect(dom?.window).toBeDefined();
    });
  });
});
