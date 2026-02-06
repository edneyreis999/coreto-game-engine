import { JSDOM } from 'jsdom';
import { ScriptLoader } from './loaders/ScriptLoader.js';
import { DatabaseLoader } from './loaders/DatabaseLoader.js';
import { DeterministicRNG } from '../simulation/DeterministicRNG.js';

/* eslint-disable @typescript-eslint/no-explicit-any */
// This file intentionally uses 'any' types to interface with RPG Maker MZ runtime APIs

/**
 * HeadlessRuntimeBootstrapper
 *
 * Orquestra a sequência completa de inicialização headless do RPG Maker MZ
 * em ambiente Node.js, seguindo o padrão documentado na pesquisa POC (Seção 6).
 *
 * Implementa 7 passos sequenciais:
 * 0. step0_initializeRNG: Inicializa RNG determinístico (Task 24) - OPCIONAL
 * 1. step1_initializeJSDOM: Cria ambiente DOM sintético
 * 2. step2_loadShims: Carrega shims de PIXI, Audio, ImageManager (Tasks 19-20)
 * 3. step3_defineGlobals: Define variáveis globais $data* do RPG Maker MZ
 * 4. step4_loadCoreScripts: Carrega scripts principais (Task 22)
 * 5. step5_applyOverrides: Aplica overrides pós-carregamento (Task 22.5)
 * 6. step6_loadDatabase: Carrega database JSON (Task 21)
 *
 * ADRs aplicáveis:
 * - ADR-018: Determinism in Battle Simulation (Task 24)
 * - ADR-014: JSDOM Browser Emulation
 * - ADR-015: Graphics Mocking (shims)
 * - ADR-025: Diagnostic Mode
 * - ADR-016: Sync Database Loading
 */
export class HeadlessRuntimeBootstrapper {
  private dom: JSDOM | null = null;
  private diagnosticMode: boolean;

  /**
   * @param diagnosticMode - Ativa logging detalhado de API calls e eventos
   */
  constructor(diagnosticMode: boolean = false) {
    this.diagnosticMode = diagnosticMode;
  }

  /**
   * Executa a sequência completa de bootstrap do headless runtime.
   *
   * @param projectPath - Caminho absoluto para o diretório raiz do projeto RPG Maker MZ
   * @param seed - Seed opcional para RNG determinístico (Task 24). Se fornecido, Math.random será substituído por LCG
   * @throws {Error} Se stub-index.html não existir ou JSDOM falhar
   */
  async bootstrap(projectPath: string, seed?: number): Promise<void> {
    this.log('[Bootstrap] Starting headless runtime initialization');

    // Step 0: Inicializar RNG determinístico (se seed fornecido)
    if (seed !== undefined) {
      this.step0_initializeRNG(seed);
    }

    await this.step1_initializeJSDOM(projectPath);
    await this.step2_loadShims();
    this.step3_defineGlobals();
    this.step4_loadCoreScripts(projectPath);
    await this.step6_loadDatabase(projectPath);
    this.step7_initializeGameObjects();
    await this.step5_applyOverrides();

    this.log('[Bootstrap] Headless runtime initialized successfully');
  }

  /**
   * Step 0: Inicializa RNG determinístico (Task 24).
   *
   * CRÍTICO: Este passo DEVE ocorrer ANTES de carregar core scripts RMMZ,
   * pois Math.random será chamado durante inicialização de classes
   * (Game_Action, BattleManager, etc.).
   *
   * ADR-018: Determinism in Battle Simulation
   * - Linear Congruential Generator (LCG) substitui Math.random
   * - Seed fixo garante sequências idênticas entre execuções
   * - Permite reprodução exata de combates para validação
   *
   * @param seed - Seed para gerador LCG (deve ser positivo)
   * @throws {Error} Se seed for inválido (negativo, zero ou NaN)
   */
  private step0_initializeRNG(seed: number): void {
    this.log(`[Bootstrap] Step 0: Initialize Deterministic RNG (seed: ${seed})`);

    DeterministicRNG.initialize(seed);

    this.log('[Bootstrap] Math.random replaced with deterministic LCG');
  }

  /**
   * Step 5: Aplica overrides pós-carregamento de core scripts.
   *
   * Task 20.5-20.6: ImageManager mock
   * Task 22.5: Busy state overrides (Window_BattleLog, Spriteset_Battle)
   *
   * IMPORTANTE: Este método deve ser chamado APÓS step4_loadCoreScripts,
   * pois sobrescreve métodos de classes que precisam existir primeiro.
   */
  async step5_applyOverrides(): Promise<void> {
    this.log('[Bootstrap] Step 5: Apply Overrides');

    // Task 20.5-20.6: ImageManager override (PÓS-carregamento de rmmz_managers.js)
    const { setupImageManagerMock } = await import('./shims/imagemanager_shim.js');
    setupImageManagerMock();
    this.log('[Bootstrap] ImageManager mock applied');

    // Task 22.5: Headless overrides (busy state + input neutralization)
    const { HeadlessOverrides } = await import('./overrides/HeadlessOverrides.js');
    const overrides = new HeadlessOverrides();
    overrides.applyAll();
    overrides.validateOverrides();
    this.log('[Bootstrap] Headless overrides applied and validated');
  }

  /**
   * Step 1: Inicializa JSDOM com opções específicas para RPG Maker MZ.
   *
   * Opções críticas (baseadas na pesquisa POC, Seção 6, linhas 447-451):
   * - runScripts: "dangerously" - Permite execução de scripts inline
   * - resources: "usable" - Habilita carregamento de recursos externos
   * - pretendToBeVisual: true - Simula display visual (importante para RMMZ)
   * - url: file://${projectPath}/ - Define base URL para resolução de paths relativos
   *
   * @param projectPath - Caminho absoluto do projeto RMMZ
   */
  private async step1_initializeJSDOM(projectPath: string): Promise<void> {
    this.log('[Bootstrap] Step 1: Initialize JSDOM');

    // HTML stub básico para JSDOM - embutido diretamente no código
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><div id="stub-root"></div></body></html>`;

    // Cria instância JSDOM com opções específicas do RMMZ
    this.dom = new JSDOM(html, {
      runScripts: 'dangerously',
      resources: 'usable',
      pretendToBeVisual: true, // CRÍTICO: simula display para RMMZ
      url: `file://${projectPath}/`, // CRÍTICO: resolve paths relativos
    });

    // Injeta globals no escopo Node.js
    this.injectGlobals();

    // Mock Storage APIs (localStorage, sessionStorage)
    this.mockStorage();

    this.log('[Bootstrap] JSDOM initialized with pretendToBeVisual: true');
  }

  /**
   * Injeta objetos window, document, navigator no escopo global do Node.js.
   *
   * O RPG Maker MZ espera que esses objetos estejam disponíveis globalmente.
   * Canvas APIs também são injetadas para compatibilidade com jest-canvas-mock.
   */
  private injectGlobals(): void {
    if (!this.dom) {
      throw new Error('JSDOM not initialized. Call step1_initializeJSDOM first.');
    }

    const { window } = this.dom;

    // Injeta globals do browser no Node.js usando Object.defineProperty
    // para sobrescrever propriedades read-only do Node.js (como navigator)
    Object.defineProperty(global, 'window', {
      value: window,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(global, 'document', {
      value: window.document,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(global, 'navigator', {
      value: window.navigator,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(global, 'location', {
      value: window.location,
      writable: true,
      configurable: true,
    });

    // localforage stub - used by RMMZ for save data
    // In headless mode we don't need save persistence
    Object.defineProperty(global, 'localforage', {
      value: {
        setItem: () => Promise.resolve(),
        getItem: () => Promise.resolve(null),
        removeItem: () => Promise.resolve(),
        clear: () => Promise.resolve(),
        length: () => Promise.resolve(0),
        key: () => Promise.resolve(null),
        keys: () => Promise.resolve([]),
      },
      writable: true,
      configurable: true,
    });

    // Canvas API - Mock implementação
    // JSDOM não implementa canvas.getContext() nativamente
    // Implementamos mock básico aqui para compatibilidade com jest-canvas-mock
    this.mockCanvasAPI(window);

    // Injeta globals de Canvas
    Object.defineProperty(global, 'HTMLElement', {
      value: window.HTMLElement,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(global, 'HTMLCanvasElement', {
      value: window.HTMLCanvasElement,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(global, 'CanvasRenderingContext2D', {
      value: window.CanvasRenderingContext2D,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(global, 'Image', {
      value: window.Image,
      writable: true,
      configurable: true,
    });

    this.log('[Bootstrap] Globals injected: window, document, navigator, location, HTMLCanvasElement');
  }

  /**
   * Mock Canvas API no JSDOM window.
   *
   * JSDOM não implementa canvas.getContext() nativamente.
   * Este mock fornece uma implementação mínima para compatibilidade com RMMZ.
   *
   * @param window - Window do JSDOM
   */
  private mockCanvasAPI(window: any): void {
    // Mock CanvasRenderingContext2D
    const CanvasRenderingContext2D = function (this: any): void {
      this.fillStyle = '#000000';
      this.strokeStyle = '#000000';
      this.lineWidth = 1;
      this.globalAlpha = 1;
    };

    CanvasRenderingContext2D.prototype = {
      fillRect: function () {},
      strokeRect: function () {},
      clearRect: function () {},
      beginPath: function () {},
      closePath: function () {},
      moveTo: function () {},
      lineTo: function () {},
      arc: function () {},
      fill: function () {},
      stroke: function () {},
      drawImage: function () {},
      getImageData: function () {
        return { data: new Uint8ClampedArray(0), width: 0, height: 0 };
      },
      putImageData: function () {},
      save: function () {},
      restore: function () {},
      translate: function () {},
      rotate: function () {},
      scale: function () {},
      measureText: function () {
        return { width: 0 };
      },
    };

    // Override HTMLCanvasElement.prototype.getContext
    const originalGetContext = window.HTMLCanvasElement.prototype.getContext;
    window.HTMLCanvasElement.prototype.getContext = function (this: any, contextType: string) {
      if (contextType === '2d') {
        return new (CanvasRenderingContext2D as any)();
      }
      // Fallback para implementação original (retorna null)
      return originalGetContext?.call(this, contextType) || null;
    };

    // Expor CanvasRenderingContext2D no window para compatibilidade
    window.CanvasRenderingContext2D = CanvasRenderingContext2D;

    this.log('[Bootstrap] Canvas API mocked: getContext("2d") functional');
  }

  /**
   * Mock localStorage e sessionStorage com implementação funcional.
   *
   * O RMMZ usa localStorage para salvar configurações (Config Manager).
   * Esta implementação simula a API Storage do browser.
   */
  private mockStorage(): void {
    const storage: Record<string, string> = {};

    const mockStorageImpl = {
      getItem: (key: string): string | null => storage[key] || null,
      setItem: (key: string, value: string): void => {
        storage[key] = value;
      },
      removeItem: (key: string): void => {
        delete storage[key];
      },
      clear: (): void => {
        Object.keys(storage).forEach((k) => delete storage[k]);
      },
      get length(): number {
        return Object.keys(storage).length;
      },
      key: (index: number): string | null => Object.keys(storage)[index] || null,
    };

    (global as any).localStorage = mockStorageImpl;
    (global as any).sessionStorage = mockStorageImpl;

    this.log('[Bootstrap] Storage APIs mocked: localStorage, sessionStorage');
  }

  /**
   * Step 2: Carrega shims para Graphics, Audio, Effekseer.
   *
   * Task 19: PIXI shims (Container, Sprite, Graphics) - deferred
   * Task 20: Graphics/Effekseer/Audio mocks - IMPLEMENTED
   *
   * Shims são injetados ANTES de carregar scripts principais do RMMZ
   * para prevenir ReferenceError durante parsing.
   *
   * IMPORTANTE: ImageManager shim será aplicado em step5_applyOverrides
   * pois precisa sobrescrever o ImageManager original (pós-carregamento).
   */
  private async step2_loadShims(): Promise<void> {
    this.log('[Bootstrap] Step 2: Load Shims (PIXI, Graphics, Audio, Effekseer)');

    // Task 19: PIXI shims
    await import('./shims/pixi_shim.js');
    this.log('[Bootstrap] PIXI shim loaded');

    // Task 20.1: Graphics Mock
    await import('./shims/graphics_shim.js');
    this.log('[Bootstrap] Graphics shim loaded');

    // Task 20.2-20.4: Audio Mocks (AudioContext, GainNode, AudioBufferSourceNode)
    await import('./shims/audio_shim.js');
    this.log('[Bootstrap] Audio shims loaded (AudioContext, GainNode, AudioBufferSourceNode)');

    // Task 20.3: Effekseer Mock
    await import('./shims/effekseer_shim.js');
    this.log('[Bootstrap] Effekseer shim loaded');
  }

  /**
   * Step 3: Define variáveis globais $data* do RPG Maker MZ.
   *
   * O RMMZ espera que essas variáveis existam ANTES de carregar scripts principais.
   * Inicializadas como null, serão populadas pelo DataManager em step6_loadDatabase.
   *
   * Baseado na pesquisa POC (Seção 6, linhas 466-493).
   */
  private step3_defineGlobals(): void {
    this.log('[Bootstrap] Step 3: Define RPG Maker MZ $data* globals');

    // Database globals ($data*)
    (global as any).$dataActors = null;
    (global as any).$dataClasses = null;
    (global as any).$dataSkills = null;
    (global as any).$dataItems = null;
    (global as any).$dataWeapons = null;
    (global as any).$dataArmors = null;
    (global as any).$dataEnemies = null;
    (global as any).$dataTroops = null;
    (global as any).$dataStates = null;
    (global as any).$dataAnimations = null;
    (global as any).$dataTilesets = null;
    (global as any).$dataCommonEvents = null;
    (global as any).$dataSystem = null;
    (global as any).$dataMapInfos = null;
    (global as any).$dataMap = null;

    // Game globals ($game*)
    (global as any).$gameTemp = null;
    (global as any).$gameSystem = null;
    (global as any).$gameScreen = null;
    (global as any).$gameTimer = null;
    (global as any).$gameMessage = null;
    (global as any).$gameSwitches = null;
    (global as any).$gameVariables = null;
    (global as any).$gameSelfSwitches = null;
    (global as any).$gameActors = null;
    (global as any).$gameParty = null;
    (global as any).$gameTroop = null;
    (global as any).$gameMap = null;
    (global as any).$gamePlayer = null;

    this.log('[Bootstrap] $data* and $game* globals defined (initialized as null)');
  }

  /**
   * Step 4: Carrega core scripts do RPG Maker MZ na ordem correta.
   *
   * Task 22: ScriptLoader implementation
   *
   * Ordem de carregamento (CRÍTICA - não altere):
   * 1. rmmz_core.js - Classes base (Utils, Point, Rectangle)
   * 2. rmmz_managers.js - Managers (DataManager, BattleManager, SceneManager)
   * 3. rmmz_objects.js - Game objects (Game_Actor, Game_Enemy, Game_Party)
   * 4. rmmz_scenes.js - Scenes (Scene_Battle, Scene_Map)
   * 5. rmmz_sprites.js - Sprites (Spriteset_Battle, Sprite_Actor)
   * 6. rmmz_windows.js - Windows (Window_BattleLog, Window_BattleStatus)
   *
   * IMPORTANTE: Scripts são executados usando `(0, eval)(code)` (eval indireto)
   * para garantir escopo global. Eval direto resultaria em escopo local e
   * classes não ficariam disponíveis globalmente.
   *
   * @param projectPath - Caminho absoluto do projeto RMMZ
   * @throws {Error} Se scripts não existirem ou falharem ao carregar
   */
  private step4_loadCoreScripts(projectPath: string): void {
    this.log('[Bootstrap] Step 4: Load Core Scripts');

    const loader = new ScriptLoader(projectPath, this.diagnosticMode);

    // Carregar todos os scripts na ordem correta
    loader.loadAllScripts();

    // Validar que globals foram criados
    loader.validateGlobals();

    this.log('[Bootstrap] Core scripts ready');
  }

  /**
   * Step 6: Carrega database JSON do RPG Maker MZ.
   *
   * Task 21: DatabaseLoader
   * - Override DataManager.loadDataFile para usar fs.readFileSync
   * - Chama DataManager.onLoad manualmente (CRÍTICO)
   * - Aguarda isDatabaseLoaded() retornar true
   * - Valida que $data* foram populados
   *
   * ADR-016: Synchronous Database Loading
   *
   * @param projectPath - Caminho absoluto do projeto RMMZ
   */
  private async step6_loadDatabase(projectPath: string): Promise<void> {
    this.log('[Bootstrap] Step 6: Load Database');

    const loader = new DatabaseLoader(projectPath);

    // Aplicar override do DataManager.loadDataFile
    loader.overrideDataManager();

    // Carregar database
    loader.loadDatabase();

    // Esperar database estar pronta
    await loader.waitForDatabase();

    // Validar integridade
    loader.validateDatabase();

    this.log('[Bootstrap] Database ready');
  }

  /**
   * Step 7: Initialize game objects ($gameParty, $gameActors, etc.)
   * Calls DataManager.createGameObjects() to instantiate runtime game state.
   *
   * GRACEFUL: If DataManager.createGameObjects is not available (e.g., in test environments
   * without full RMMZ runtime), this step logs a warning and continues without throwing.
   *
   * @private
   */
  private step7_initializeGameObjects(): void {
    this.log('[Bootstrap] Step 7: Initialize Game Objects');

    const globalScope = global as any;

    // Gracefully skip if DataManager not available (test environments)
    if (!globalScope.DataManager || typeof globalScope.DataManager.createGameObjects !== 'function') {
      this.log('[Bootstrap] DataManager.createGameObjects not available - skipping game object initialization (test mode)');
      return;
    }

    // Call RPG Maker MZ's initialization method
    globalScope.DataManager.createGameObjects();

    // Validate that objects were created
    if (!globalScope.$gameParty) {
      this.log('[Bootstrap] Warning: $gameParty not initialized after createGameObjects()');
    }
    if (!globalScope.$gameActors) {
      this.log('[Bootstrap] Warning: $gameActors not initialized after createGameObjects()');
    }

    this.log('[Bootstrap] Game objects initialized successfully');
  }

  /**
   * Limpa recursos do JSDOM e reseta globals.
   *
   * IMPORTANTE: Chame este método após finalizar a simulação para liberar memória.
   * Não limpa variáveis globais do RPG Maker MZ para permitir inspeção pós-simulação.
   *
   * Task 24: Reseta RNG determinístico (se ativo) para restaurar Math.random original.
   */
  cleanup(): void {
    // Reset RNG determinístico (se foi inicializado)
    if (DeterministicRNG.isActive()) {
      DeterministicRNG.reset();
      this.log('[Bootstrap] Cleanup: Deterministic RNG reset to original Math.random');
    }

    if (this.dom) {
      this.dom.window.close();
      this.dom = null;
      this.log('[Bootstrap] Cleanup completed: JSDOM window closed');
    }
  }

  /**
   * Logging condicional baseado no modo diagnostic.
   *
   * @param message - Mensagem a ser logada
   */
  private log(message: string): void {
    if (this.diagnosticMode) {
      console.log(`[DIAGNOSTIC] ${message}`);
    }
  }

  /**
   * Retorna a instância JSDOM para inspeção (útil em testes).
   *
   * @returns Instância JSDOM ou null se não inicializado
   */
  getDOM(): JSDOM | null {
    return this.dom;
  }
}
