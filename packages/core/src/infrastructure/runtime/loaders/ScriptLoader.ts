import * as fs from 'fs';
import * as path from 'path';

/**
 * ScriptLoader
 *
 * Carrega core scripts do RPG Maker MZ em ordem específica usando eval indireto
 * para garantir escopo global das classes e objetos do engine.
 *
 * CRÍTICO: A ordem de carregamento é fundamental - scripts dependem de classes
 * definidas anteriormente. Mudanças na ordem causarão ReferenceError.
 *
 * Ordem obrigatória (baseada na pesquisa POC, Seção 6, linhas 496-510):
 * 1. rmmz_core.js - Classes base (Utils, Point, Rectangle, etc.)
 * 2. rmmz_managers.js - Managers (DataManager, BattleManager, SceneManager, etc.)
 * 3. rmmz_objects.js - Game objects (Game_Actor, Game_Enemy, Game_Party, etc.)
 * 4. rmmz_scenes.js - Scenes (Scene_Battle, Scene_Map, etc.)
 * 5. rmmz_sprites.js - Sprites (Spriteset_Battle, Sprite_Actor, etc.)
 * 6. rmmz_windows.js - Windows (Window_BattleLog, Window_BattleStatus, etc.)
 *
 * ADRs aplicáveis:
 * - ADR-015: Graphics Mocking (shims devem estar carregados ANTES)
 * - ADR-018: Determinism (scripts carregam consistentemente)
 *
 * Referências:
 * - Pesquisa POC: docs/pesquisas/Headless RPG Maker MZ_ Node.js POC.md (Seção 6)
 * - Task 22: planos/002-implementacao-mvp/tasks/22_task.md
 */
export class ScriptLoader {
  private projectPath: string;
  private diagnosticMode: boolean;

  /**
   * ORDEM CRÍTICA dos scripts principais do RPG Maker MZ.
   *
   * NÃO ALTERE esta ordem sem consultar a documentação do RMMZ.
   * Mudanças causarão ReferenceError durante o carregamento.
   *
   * Baseado na pesquisa POC (linha 496).
   */
  private readonly CORE_SCRIPTS = [
    'rmmz_core.js',
    'rmmz_managers.js',
    'rmmz_objects.js',
    'rmmz_scenes.js',
    'rmmz_sprites.js',
    'rmmz_windows.js',
  ] as const;

  /**
   * @param projectPath - Caminho absoluto do projeto RPG Maker MZ
   * @param diagnosticMode - Ativa logging detalhado (opcional)
   */
  constructor(projectPath: string, diagnosticMode: boolean = false) {
    this.projectPath = projectPath;
    this.diagnosticMode = diagnosticMode;
  }

  /**
   * Carrega todos os core scripts na ordem correta.
   *
   * IMPORTANTE: Este método deve ser chamado APÓS:
   * - JSDOM estar inicializado (step1)
   * - Shims carregados (step2 - Graphics, Audio, Effekseer)
   * - Globals $data* definidos (step3)
   *
   * IMPORTANTE: Este método deve ser chamado ANTES:
   * - step5_applyOverrides (overrides precisam das classes carregadas)
   * - step6_loadDatabase (DataManager precisa estar definido)
   *
   * @throws {Error} Se qualquer script falhar ao carregar ou executar
   */
  loadAllScripts(): void {
    this.log('[ScriptLoader] Starting core scripts loading sequence');

    // Debug: Check if critical globals are available
    const g = global as any;
    this.log(`[ScriptLoader] Global availability check:`);
    this.log(`  - PIXI: ${typeof g.PIXI}`);
    this.log(`  - window: ${typeof g.window}`);
    this.log(`  - document: ${typeof g.document}`);
    this.log(`  - Graphics: ${typeof g.Graphics}`);

    if (typeof g.PIXI === 'undefined') {
      throw new Error('PIXI global not found. Ensure step2_loadShims() was called before loading scripts.');
    }
    if (typeof g.window === 'undefined') {
      throw new Error('window global not found. Ensure step1_initializeJSDOM() was called.');
    }
    if (typeof g.document === 'undefined') {
      throw new Error('document global not found. Ensure step1_initializeJSDOM() was called.');
    }

    const jsPath = path.join(this.projectPath, 'js');

    // Valida que diretório js/ existe
    if (!fs.existsSync(jsPath)) {
      throw new Error(
        `RPG Maker MZ js/ directory not found: ${jsPath}. Ensure projectPath is valid.`
      );
    }

    // Carrega cada script na ordem definida
    this.CORE_SCRIPTS.forEach((scriptName) => {
      const scriptPath = path.join(jsPath, scriptName);
      this.loadScript(scriptPath, scriptName);
    });

    this.log('[ScriptLoader] All core scripts loaded successfully');

    // Apply post-load patches for headless mode
    this.applyPostLoadPatches();
  }

  /**
   * Carrega e executa um script individual usando eval indireto.
   *
   * CRÍTICO - Eval Indireto:
   * - `eval(code)` executa em escopo LOCAL - classes ficam invisíveis
   * - `(0, eval)(code)` executa em escopo GLOBAL - classes ficam em window/global
   *
   * A expressão `(0, eval)` força o JavaScript a tratar eval como uma
   * referência de função (não chamada direta), ativando modo indireto.
   *
   * Baseado na pesquisa POC (linha 505).
   *
   * @param scriptPath - Caminho absoluto do arquivo .js
   * @param scriptName - Nome do script (para logging)
   * @throws {Error} Se arquivo não existir ou erro durante execução
   */
  private loadScript(scriptPath: string, scriptName: string): void {
    try {
      // Valida existência do arquivo
      if (!fs.existsSync(scriptPath)) {
        throw new Error(`Script file not found: ${scriptPath}`);
      }

      // Lê conteúdo do script
      let code = fs.readFileSync(scriptPath, 'utf8');

      // PATCH: Fix ColorFilter.initialize for headless mode
      // RMMZ's ColorFilter uses broken 'this' binding
      if (scriptName === 'rmmz_core.js') {
        code = this.patchColorFilter(code);
      }

      // Eval INDIRETO (pesquisa linha 505)
      // (0, eval) força escopo global - classes ficam em window/global
      // eval direto = escopo local (classes não ficam globais)
      (0, eval)(code);

      this.log(`[ScriptLoader] Loaded ${scriptName} (${scriptPath})`);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      const errorStack = e instanceof Error ? e.stack : undefined;
      console.error(`[ScriptLoader] Error loading ${scriptName}:`, errorMessage);
      if (errorStack) {
        console.error(`[ScriptLoader] Stack trace:`, errorStack);
      }

      // Fail fast - script loading é crítico
      // Se um script falhar, todo o runtime está comprometido
      throw new Error(`Failed to load ${scriptName}: ${errorMessage}. Check file path and syntax.`);
    }
  }

  /**
   * Valida que globals críticos foram criados após carregamento dos scripts.
   *
   * Este método verifica a existência de classes e objetos fundamentais
   * do RPG Maker MZ que devem estar disponíveis globalmente.
   *
   * IMPORTANTE: Chame este método APÓS loadAllScripts() para garantir
   * que o runtime foi inicializado corretamente.
   *
   * @throws {Error} Se qualquer global esperado estiver undefined
   */
  validateGlobals(): void {
    this.log('[ScriptLoader] Validating required globals');

    const requiredGlobals = [
      // rmmz_core.js
      'Utils',
      'Graphics',

      // rmmz_managers.js
      'DataManager',
      'BattleManager',
      'SceneManager',
      'ImageManager',
      'AudioManager',

      // rmmz_objects.js
      'Game_Actor',
      'Game_Enemy',
      'Game_Party',
      'Game_Troop',
      'Game_Action',
      'Game_Battler',

      // rmmz_scenes.js
      'Scene_Battle',
      'Scene_Base',

      // rmmz_sprites.js
      'Spriteset_Battle',
      'Sprite_Battler',

      // rmmz_windows.js
      'Window_BattleLog',
      'Window_BattleStatus',
    ];

    const missingGlobals: string[] = [];

    for (const globalName of requiredGlobals) {
      if (typeof (global as any)[globalName] === 'undefined') {
        missingGlobals.push(globalName);
      }
    }

    if (missingGlobals.length > 0) {
      throw new Error(
        `Script validation failed: Missing globals: ${missingGlobals.join(', ')}. ` +
          `Ensure all core scripts loaded successfully.`
      );
    }

    this.log(`[ScriptLoader] Global validation passed: ${requiredGlobals.length} globals verified`);
  }

  /**
   * Applies post-load patches for headless mode compatibility.
   *
   * These patches override RMMZ methods that depend on rendering/graphics
   * to prevent errors during Scene_Battle initialization.
   */
  private applyPostLoadPatches(): void {
    const globalScope = global as any;

    // Patch Sprite.prototype.setFrame to be no-op in headless mode
    // RMMZ's Sprite.setFrame tries to access texture properties that don't exist
    if (globalScope.Sprite && globalScope.Sprite.prototype) {
      globalScope.Sprite.prototype.setFrame = function(x: number, y: number, width: number, height: number) {
        // Store frame data but don't try to update texture UVs
        if (!this._frame) {
          this._frame = new globalScope.PIXI.Rectangle();
        }
        this._frame.x = x || 0;
        this._frame.y = y || 0;
        this._frame.width = width || 0;
        this._frame.height = height || 0;
        // Don't call _refresh() which tries to update texture properties
      };
      this.log('[ScriptLoader] Sprite.prototype.setFrame patched for headless mode');
    }

    // Patch Sprite.prototype._refresh to be no-op
    if (globalScope.Sprite && globalScope.Sprite.prototype) {
      globalScope.Sprite.prototype._refresh = function() {
        // No-op: don't update texture UVs in headless mode
      };
      this.log('[ScriptLoader] Sprite.prototype._refresh patched for headless mode');
    }

    // Patch Bitmap.prototype.clearRect to avoid _baseTexture.update() errors
    // Window_BattleLog creates bitmaps via 'new Bitmap()' which don't have _baseTexture
    if (globalScope.Bitmap && globalScope.Bitmap.prototype) {
      globalScope.Bitmap.prototype.clearRect = function(_x: number, _y: number, _width: number, _height: number) {
        // No-op in headless mode - don't try to update textures
      };
      this.log('[ScriptLoader] Bitmap.prototype.clearRect patched for headless mode');
    }

    // Patch Bitmap.prototype.clear to be no-op
    if (globalScope.Bitmap && globalScope.Bitmap.prototype) {
      globalScope.Bitmap.prototype.clear = function() {
        // No-op in headless mode
      };
      this.log('[ScriptLoader] Bitmap.prototype.clear patched for headless mode');
    }

    // Patch other Bitmap drawing methods that might cause errors
    if (globalScope.Bitmap && globalScope.Bitmap.prototype) {
      globalScope.Bitmap.prototype.fillRect = function(..._args: any[]) {
        // No-op
      };
      globalScope.Bitmap.prototype.gradientFillRect = function(..._args: any[]) {
        // No-op
      };
      globalScope.Bitmap.prototype.drawCircle = function(..._args: any[]) {
        // No-op
      };
      globalScope.Bitmap.prototype.drawText = function(..._args: any[]) {
        // No-op
      };
      globalScope.Bitmap.prototype.blt = function(..._args: any[]) {
        // No-op
      };
      globalScope.Bitmap.prototype.strokeRect = function(..._args: any[]) {
        // No-op
      };
      this.log('[ScriptLoader] Bitmap drawing methods patched for headless mode');
    }

    // Patch Window._createAllParts to ensure _container is always created
    // CRITICAL: Window setter for 'openness' accesses this._container.y
    if (globalScope.Window && globalScope.Window.prototype) {
      const original_createAllParts = globalScope.Window.prototype._createAllParts;
      globalScope.Window.prototype._createAllParts = function() {
        // Always ensure _container exists with position/scale
        if (!this._container) {
          this._container = new globalScope.PIXI.Container();
          this.addChild(this._container);
        }
        // Call original (may create sprites which will be no-op in headless)
        try {
          original_createAllParts.call(this);
        } catch (error) {
          // Suppress errors from visual sprite creation in headless mode
          console.warn('[Window._createAllParts] Suppressed error:', error);
        }
      };
      this.log('[ScriptLoader] Window.prototype._createAllParts patched for headless mode');
    }

    // Patch Window openness setter to safely handle missing _container
    // CRITICAL: Some Windows set openness before _createAllParts() is called
    if (globalScope.Window) {
      const opennessDescriptor = Object.getOwnPropertyDescriptor(
        globalScope.Window.prototype,
        'openness'
      );
      if (opennessDescriptor && opennessDescriptor.set) {
        const originalSetter = opennessDescriptor.set;
        opennessDescriptor.set = function(this: any, value: number) {
          // Ensure _container exists before setting openness
          if (!this._container) {
            this._container = new globalScope.PIXI.Container();
            // Ensure scale property exists (required by openness setter)
            if (!this._container.scale) {
              this._container.scale = { x: 1, y: 1 };
            }
            // Don't call addChild here - might be called before Window is fully initialized
          }
          // Call original setter
          originalSetter.call(this, value);
        };
        Object.defineProperty(globalScope.Window.prototype, 'openness', opennessDescriptor);
        this.log('[ScriptLoader] Window.prototype.openness setter patched for headless mode');
      }
    }

    // Patch ColorFilter.setBlendColor to ensure uniforms exists
    // CRITICAL: RMMZ ColorFilter accesses this.uniforms.blendColor
    if (globalScope.ColorFilter && globalScope.ColorFilter.prototype) {
      const original_setBlendColor = globalScope.ColorFilter.prototype.setBlendColor;
      globalScope.ColorFilter.prototype.setBlendColor = function(this: any, color: any) {
        // Ensure uniforms exists
        if (!this.uniforms) {
          this.uniforms = {
            hue: 0,
            brightness: 255,
            colorTone: [0, 0, 0, 0],
            blendColor: [0, 0, 0, 0],
          };
        }
        // Call original
        original_setBlendColor.call(this, color);
      };
      this.log('[ScriptLoader] ColorFilter.prototype.setBlendColor patched for headless mode');
    }
  }

  /**
   * Patches ColorFilter.initialize to prevent 'this' binding errors in headless mode.
   *
   * CRITICAL: RMMZ's ColorFilter calls this.initialize() from constructor,
   * but 'this' becomes undefined in Node.js environment. We replace the
   * entire initialize method with a no-op.
   *
   * @param code - Original rmmz_core.js code
   * @returns Patched code with safe ColorFilter.initialize
   */
  private patchColorFilter(code: string): string {
    // Match full initialize method (function declaration + body)
    const regex = /(ColorFilter\.prototype\.initialize\s*=\s*function\s*\([^)]*\)\s*\{)([^}]*\})/g;

    if (!regex.test(code)) {
      this.log('[ScriptLoader] ColorFilter.initialize not found - skipping patch');
      return code;
    }

    // Replace entire method with no-op
    const patched = code.replace(
      regex,
      `ColorFilter.prototype.initialize = function() {
        // Headless mode no-op: prevent 'this' binding errors
        if (this && typeof this === 'object') {
          this.hue = 0;
          this.brightness = 255;
          this.colorTone = [0, 0, 0, 0];
        }
      }`
    );

    console.log('[ScriptLoader] ColorFilter.initialize patched for headless mode');
    return patched;
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
   * Retorna a lista de scripts principais (útil para testes e documentação).
   *
   * @returns Array readonly com nomes dos scripts na ordem de carregamento
   */
  getCoreScripts(): readonly string[] {
    return this.CORE_SCRIPTS;
  }
}
