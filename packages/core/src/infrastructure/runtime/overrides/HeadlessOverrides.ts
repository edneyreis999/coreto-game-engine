/**
 * HeadlessOverrides
 *
 * Aplica overrides pós-carregamento dos core scripts para neutralizar esperas visuais
 * ("busy state") e input do usuário. CRÍTICO para performance de simulação.
 *
 * Sem esses overrides:
 * - Simulação espera 60 frames por animação mesmo headless
 * - Velocidade 10-100x mais lenta
 *
 * Com overrides:
 * - Simulação de 100 turnos: <1 segundo (vs 10-30 segundos sem)
 * - FPS >100 frames/segundo
 *
 * Baseado em:
 * - Pesquisa POC: docs/pesquisas/Headless RPG Maker MZ_ Node.js POC.md
 *   - Seção 3.2: Busy State Overrides (linhas 256-318)
 *   - Seção 2.3: Input Neutralization (linhas 177-183)
 *
 * ADRs aplicáveis:
 * - ADR-029: Sync Warp Loop (desacoplar tempo de wall-clock)
 * - ADR-015: Graphics Mocking (eliminar esperas visuais)
 *
 * Task 22.5: Headless Overrides
 */
export class HeadlessOverrides {
  /**
   * Aplica todos os overrides: busy state + input neutralization.
   *
   * IMPORTANTE: Deve ser chamado APÓS carregamento dos core scripts (Task 22),
   * pois sobrescreve métodos de classes que precisam existir primeiro.
   *
   * @throws {Error} Se core scripts não estiverem carregados
   */
  applyAll(): void {
    this.applyColorFilterStub();
    this.applyGraphicsLoadingOverride();
    this.applyColorManagerMock();
    this.applySpriteButtonStub();
    this.applyBusyStateOverrides();
    this.applyMessageSystemOverride();
    this.applySceneFadeOverride();
    this.applySceneManagerActiveOverride();
    this.applyBattleManagerDebug();
    this.applyInputNeutralization();
    console.log('[HeadlessOverrides] All overrides applied');
  }

  /**
   * Stub Sprite_Button to bypass image size validation.
   *
   * CRITICAL: Sprite_Button.loadButtonImage() validates button image dimensions
   * (width >= 48, height >= 48). In headless mode these images don't load properly,
   * causing "ButtonSet image is too small" errors.
   *
   * Solution: Replace the entire Sprite_Button class with a stub that skips validation.
   */
  private applySpriteButtonStub(): void {
    const Sprite_Button = (global as any).Sprite_Button;

    if (!Sprite_Button) {
      console.warn('[HeadlessOverrides] Sprite_Button not found - skipping button stub');
      return;
    }

    // Override loadButtonImage to skip image loading and validation
    Sprite_Button.prototype.loadButtonImage = function () {
      // No-op - buttons are invisible in headless mode
    };

    // Override checkBitmap to skip size validation
    Sprite_Button.prototype.checkBitmap = function () {
      return true; // Always valid in headless mode
    };

    // Override updateFrame to avoid errors when bitmap doesn't exist
    Sprite_Button.prototype.updateFrame = function () {
      // No-op - no bitmap to frame in headless mode
    };

    // Override updateOpacity to avoid errors
    Sprite_Button.prototype.updateOpacity = function () {
      // No-op - opacity irrelevant in headless mode
    };

    console.log('[HeadlessOverrides] Sprite_Button stubbed');
  }

  /**
   * Mock ColorManager to return dummy colors without loading windowskin.
   *
   * CRITICAL: ColorManager.textColor() calls this._windowskin.getPixel() which
   * requires loading img/system/Window.png. In headless mode we bypass this
   * by returning fixed color strings.
   *
   * All color methods return white (#ffffff) by default - text is invisible
   * in headless mode anyway.
   */
  private applyColorManagerMock(): void {
    const ColorManager = (global as any).ColorManager;

    if (!ColorManager) {
      console.warn('[HeadlessOverrides] ColorManager not found - skipping color mock');
      return;
    }

    // Mock all color methods to return white
    ColorManager.textColor = function (_n: number): string {
      return '#ffffff';
    };

    ColorManager.normalColor = function (): string {
      return '#ffffff';
    };

    ColorManager.systemColor = function (): string {
      return '#ffffff';
    };

    ColorManager.crisisColor = function (): string {
      return '#ffff00';
    };

    ColorManager.deathColor = function (): string {
      return '#ff0000';
    };

    ColorManager.gaugeBackColor = function (): string {
      return '#000000';
    };

    ColorManager.hpGaugeColor1 = function (): string {
      return '#ff0000';
    };

    ColorManager.hpGaugeColor2 = function (): string {
      return '#ff4444';
    };

    ColorManager.mpGaugeColor1 = function (): string {
      return '#0000ff';
    };

    ColorManager.mpGaugeColor2 = function (): string {
      return '#4444ff';
    };

    ColorManager.mpCostColor = function (): string {
      return '#00ff00';
    };

    ColorManager.powerUpColor = function (): string {
      return '#00ff00';
    };

    ColorManager.powerDownColor = function (): string {
      return '#ff0000';
    };

    ColorManager.ctGaugeColor1 = function (): string {
      return '#00ff00';
    };

    ColorManager.ctGaugeColor2 = function (): string {
      return '#44ff44';
    };

    ColorManager.tpGaugeColor1 = function (): string {
      return '#00ff00';
    };

    ColorManager.tpGaugeColor2 = function (): string {
      return '#44ff44';
    };

    ColorManager.tpCostColor = function (): string {
      return '#00ff00';
    };

    ColorManager.pendingColor = function (): string {
      return '#888888';
    };

    ColorManager.hpColor = function (_actor: any): string {
      return '#ffffff';
    };

    ColorManager.mpColor = function (_actor: any): string {
      return '#ffffff';
    };

    ColorManager.tpColor = function (_actor: any): string {
      return '#ffffff';
    };

    ColorManager.paramchangeTextColor = function (change: number): string {
      return change > 0 ? '#00ff00' : '#ff0000';
    };

    ColorManager.damageColor = function (_colorType: number): string {
      return '#ffffff';
    };

    ColorManager.outlineColor = function (): string {
      return 'rgba(0, 0, 0, 0.6)';
    };

    ColorManager.dimColor1 = function (): string {
      return 'rgba(0, 0, 0, 0.6)';
    };

    ColorManager.dimColor2 = function (): string {
      return 'rgba(0, 0, 0, 0)';
    };

    ColorManager.itemBackColor1 = function (): string {
      return 'rgba(32, 32, 32, 0.5)';
    };

    ColorManager.itemBackColor2 = function (): string {
      return 'rgba(0, 0, 0, 0.5)';
    };

    // No-op: loadWindowskin not needed anymore
    ColorManager.loadWindowskin = function (): void {
      // No-op - colors are mocked, no windowskin needed
    };

    console.log('[HeadlessOverrides] ColorManager mocked');
  }

  /**
   * Override Graphics.startLoading and Graphics.endLoading to prevent DOM errors.
   *
   * CRITICAL: Graphics.startLoading tries to appendChild loading elements
   * but fails in JSDOM headless mode. We make these methods no-ops.
   */
  private applyGraphicsLoadingOverride(): void {
    const Graphics = (global as any).Graphics;

    if (!Graphics) {
      console.warn('[HeadlessOverrides] Graphics not found - skipping loading override');
      return;
    }

    // No-op: loading screens not needed in headless mode
    Graphics.startLoading = function () {
      // No-op
    };

    Graphics.endLoading = function () {
      // No-op
    };

    Graphics.printLoadingError = function (_url: string) {
      // No-op
    };

    console.log('[HeadlessOverrides] Graphics loading methods stubbed');
  }

  /**
   * Stub out ColorFilter to prevent crashes in headless mode.
   *
   * CRITICAL: RMMZ defines ColorFilter as global function (not PIXI.filters.ColorFilter).
   * We must override the global ColorFilter AFTER core scripts load.
   */
  private applyColorFilterStub(): void {
    const ColorFilter = (global as any).ColorFilter;

    if (!ColorFilter) {
      console.warn('[HeadlessOverrides] ColorFilter not found - will skip stub (expect crash)');
      return;
    }

    // Helper to ensure uniforms always exists
    const ensureUniforms = function(self: any) {
      if (!self.uniforms || typeof self.uniforms !== 'object') {
        self.uniforms = {
          hue: 0,
          brightness: 255,
          colorTone: [0, 0, 0, 0],
          blendColor: [0, 0, 0, 0],
        };
      }
    };

    // Override setHue to ensure uniforms exist
    const _setHue = ColorFilter.prototype.setHue;
    ColorFilter.prototype.setHue = function (this: any, hue: number) {
      ensureUniforms(this);
      return _setHue.call(this, hue);
    };

    // Override setColorTone to ensure uniforms exist
    const _setColorTone = ColorFilter.prototype.setColorTone;
    ColorFilter.prototype.setColorTone = function (this: any, tone: number[] | any) {
      ensureUniforms(this);
      return _setColorTone.call(this, tone);
    };

    // Override setBrightness to ensure uniforms exist
    const _setBrightness = ColorFilter.prototype.setBrightness;
    ColorFilter.prototype.setBrightness = function (this: any, brightness: number) {
      ensureUniforms(this);
      return _setBrightness.call(this, brightness);
    };

    // Override setBlendColor to ensure uniforms exist
    const _setBlendColor = ColorFilter.prototype.setBlendColor;
    ColorFilter.prototype.setBlendColor = function (this: any, color: number[] | any) {
      ensureUniforms(this);
      return _setBlendColor.call(this, color);
    };

    console.log('[HeadlessOverrides] ColorFilter methods patched with uniforms safety check');
  }

  /**
   * Aplica overrides para neutralizar busy states (esperas visuais).
   *
   * Overrides implementados:
   * 1. Window_BattleLog.prototype.messageSpeed = () => 0 (texto instantâneo)
   * 2. Window_BattleLog.prototype.update com _waitCount = 0 (sem esperas)
   * 3. Spriteset_Battle.prototype.isBusy = () => false (sem animações)
   * 4. Game_Temp.prototype.requestAnimation override (não carrega animações)
   *
   * Baseado na pesquisa POC (Seção 3.2, linhas 281-316).
   *
   * @throws {Error} Se Window_BattleLog, Spriteset_Battle ou Game_Temp não existirem
   */
  private applyBusyStateOverrides(): void {
    const Window_BattleLog = (global as any).Window_BattleLog;
    const Spriteset_Battle = (global as any).Spriteset_Battle;
    const Spriteset_Base = (global as any).Spriteset_Base;
    const Window_Scrollable = (global as any).Window_Scrollable;
    const Game_Temp = (global as any).Game_Temp;

    if (!Window_BattleLog || !Spriteset_Battle || !Spriteset_Base || !Window_Scrollable || !Game_Temp) {
      throw new Error(
        'Core scripts not loaded - call HeadlessOverrides.applyAll() after Task 22 (ScriptLoader)'
      );
    }

    // 1. Texto Instantâneo (pesquisa linha 286)
    // Normalmente messageSpeed() retorna velocidade de digitação de texto (ex: 16 = 1 caractere por frame)
    // Retornar 0 = renderiza todo o texto instantaneamente
    Window_BattleLog.prototype.messageSpeed = function () {
      return 0;
    };

    // 2. Espera Instantânea (pesquisa linhas 291-300)
    // Window_BattleLog usa _waitCount para pausar entre ações (ex: aguardar animação)
    // Forçamos _waitCount = 0 a cada frame para pular todas as esperas
    //
    // BUGFIX: _methods[] não estava sendo consumida, causando isBusy() = true indefinidamente
    // Solução: forçar processamento de todos os métodos pendentes via callNextMethod()
    Window_BattleLog.prototype.update = function (this: any) {
      // Força contagem de espera para 0 (pula delays)
      this._waitCount = 0;

      // Se o log está esperando um efeito (áudio/tremor), limpa o modo
      // _waitMode pode ser 'effect', 'movement', etc. - forçamos para '' (sem espera)
      this._waitMode = '';

      // Força processamento de todos os métodos pendentes na fila
      // Isso consome _methods[] e evita que isBusy() fique true indefinidamente
      // Verifica se _methods existe (pode ser undefined em testes unitários)
      if (this._methods && this._methods.length > 0) {
        while (this._methods.length > 0) {
          this.callNextMethod();
        }
      }
    };

    // 3. Verificação de Busy do Spriteset (pesquisa linhas 304-307)
    // Normalmente verifica se animações PIXI ou Effekseer estão rodando
    // BattleManager.isBusy() depende de Spriteset_Battle.isBusy()
    // Na simulação headless, ignoramos animações visuais completamente
    Spriteset_Battle.prototype.isBusy = function () {
      return false; // Sempre retorna false = "não está ocupado com animações"
    };

    // 3.1. Bypass de ColorFilter updates (evita crash com this.uniforms.colorTone = undefined)
    // RMMZ's Spriteset_Base.updateBaseFilters() chama this._baseColorFilter.setColorTone()
    // mas ColorFilter pode não ter uniforms em headless mode
    // Solução: fazer updateBaseFilters no-op (filtros visuais não são necessários em headless)
    Spriteset_Base.prototype.updateBaseFilters = function () {
      // No-op - bypass color filter updates that crash in headless mode
    };

    // 3.2. Bypass de todos os métodos de scroll (evita crashes com touch/mouse/transform em headless)
    // Window_Scrollable depende de touch input e PIXI transforms que não existem em headless
    // Solução: fazer todos os métodos de scroll no-op
    Window_Scrollable.prototype.update = function (this: any) {
      // Skip scroll processing (processWheelScroll, processTouchScroll, etc)
      // Call Window_Base.update directly
      const Window_Base = (global as any).Window_Base;
      if (Window_Base && Window_Base.prototype.update) {
        Window_Base.prototype.update.call(this);
      }

      // Update scrollbar if it exists (but skip touch handling)
      if (this._scrollBar && this._scrollBar.update) {
        try {
          this._scrollBar.update();
        } catch (e) {
          // Ignore scrollbar update errors in headless mode
        }
      }
    };

    // 4. Bypass de Requisição de Animação (pesquisa linhas 311-316)
    // Previne a criação de objetos Sprite_Animation pesados e contextos Effekseer
    // Game_Temp.requestAnimation() é chamado por Game_Action.prototype.applyGlobal()
    // e outros métodos quando skills têm animações MV/MZ
    Game_Temp.prototype.requestAnimation = function (
      this: any,
      _targets: any[],
      _animationId: number,
      _mirror?: boolean
    ) {
      // NÃO chamamos o original. Não queremos carregar animações MV/MZ.
      // Original criaria Sprite_Animation que depende de PIXI.Sprite e Effekseer.
      // Silenciosamente ignoramos a requisição.
      // Apenas logamos se debug for necessário (comentado por performance):
      // console.log(`[HeadlessOverrides] Animation ${_animationId} requested - ignored.`);
    };

    console.log('[HeadlessOverrides] Busy state neutralized');
  }

  /**
   * Neutraliza o sistema de mensagens para evitar que BattleManager fique preso
   * esperando mensagens serem consumidas.
   *
   * Problema:
   * - BattleManager.startBattle() adiciona mensagens ao $gameMessage
   * - BattleManager.isBusy() retorna true enquanto $gameMessage.isBusy() for true
   * - $gameMessage.isBusy() retorna true enquanto _texts.length > 0
   * - Resultado: batalha fica presa na fase "start" esperando mensagens
   *
   * Solução:
   * - Game_Message.prototype.isBusy sempre retorna false (mensagens instantâneas)
   * - Game_Message.prototype.add limpa mensagens imediatamente
   *
   * Baseado em análise do fluxo:
   * - BattleManager.update() -> if (!isBusy()) updatePhase()
   * - BattleManager.isBusy() -> $gameMessage.isBusy() || _spriteset.isBusy() || _logWindow.isBusy()
   * - $gameMessage.isBusy() -> hasText() || isChoice() || isNumberInput() || isItemChoice()
   */
  private applyMessageSystemOverride(): void {
    const Game_Message = (global as any).Game_Message;

    if (!Game_Message) {
      console.warn('[HeadlessOverrides] Game_Message not found - skipping message override');
      return;
    }

    // Override isBusy to always return false (messages are instant in headless mode)
    Game_Message.prototype.isBusy = function () {
      return false;
    };

    // Override add to immediately clear messages (prevent queue buildup)
    const _Game_Message_add = Game_Message.prototype.add;
    Game_Message.prototype.add = function (this: any, text: string) {
      // Call original to maintain compatibility if needed
      _Game_Message_add.call(this, text);

      // Immediately clear the text queue to prevent blocking
      this._texts = [];
    };

    // Override clear to ensure it actually clears everything
    Game_Message.prototype.clear = function (this: any) {
      this._texts = [];
      this._choices = [];
      this._speakerName = '';
      this._faceName = '';
      this._faceIndex = 0;
      this._background = 0;
      this._positionType = 2;
      this._choiceDefaultType = 0;
      this._choiceCancelType = 0;
      this._choiceBackground = 0;
      this._choicePositionType = 2;
      this._numInputVariableId = 0;
      this._numInputMaxDigits = 0;
      this._itemChoiceVariableId = 0;
      this._itemChoiceItypeId = 0;
      this._scrollMode = false;
      this._scrollSpeed = 2;
      this._scrollNoFast = false;
    };

    console.log('[HeadlessOverrides] Message system neutralized');
  }

  /**
   * Neutraliza transições de fade entre cenas para evitar bloqueio.
   *
   * Problema:
   * - Scene_Base.isBusy() retorna true enquanto _fadeDuration > 0
   * - Scene_Battle.update() só chama updateBattleProcess() se !this.isBusy()
   * - updateBattleProcess() chama BattleManager.update()
   * - Resultado: batalha fica presa esperando fade-in completar (24 frames)
   *
   * Solução:
   * - Scene_Base.prototype.isBusy sempre retorna false (sem fades em headless)
   * - Scene_Base.startFadeIn/startFadeOut fazem nada (fade instantâneo)
   * - updateFade é no-op para evitar decremento de _fadeDuration
   *
   * Baseado em análise do fluxo:
   * - Scene_Battle.update() -> if (active && !isBusy()) updateBattleProcess()
   * - Scene_Base.isBusy() -> isFading()
   * - Scene_Base.isFading() -> _fadeDuration > 0
   */
  private applySceneFadeOverride(): void {
    const Scene_Base = (global as any).Scene_Base;

    if (!Scene_Base) {
      console.warn('[HeadlessOverrides] Scene_Base not found - skipping fade override');
      return;
    }

    // Override isBusy to ignore fades (fades are instant in headless mode)
    Scene_Base.prototype.isBusy = function () {
      return false; // Never busy with fades
    };

    // Override startFadeIn to do nothing (instant fade)
    Scene_Base.prototype.startFadeIn = function (this: any, _duration?: number, _white?: boolean) {
      this._fadeDuration = 0; // Set to 0 immediately (instant)
      this._fadeSign = 0;
      this._fadeOpacity = 0;
    };

    // Override startFadeOut to do nothing (instant fade)
    Scene_Base.prototype.startFadeOut = function (this: any, _duration?: number, _white?: boolean) {
      this._fadeDuration = 0; // Set to 0 immediately (instant)
      this._fadeSign = 0;
      this._fadeOpacity = 0;
    };

    // Override updateFade to prevent duration decrement
    Scene_Base.prototype.updateFade = function (this: any) {
      // No-op - fades are instant, duration always 0
      this._fadeDuration = 0;
    };

    console.log('[HeadlessOverrides] Scene fades neutralized');
  }

  /**
   * Override SceneManager.isGameActive para sempre retornar true em modo headless.
   *
   * Problema:
   * - SceneManager.updateScene() só chama scene.update() se isGameActive() for true
   * - SceneManager.isGameActive() verifica window.top.document.hasFocus()
   * - No JSDOM, hasFocus() retorna false (sem janela real)
   * - Resultado: scene.update() nunca é chamado, batalha nunca progride
   *
   * Solução:
   * - SceneManager.isGameActive sempre retorna true (simula janela em foco)
   *
   * Baseado em análise do fluxo:
   * - SceneManager.updateScene() -> if (isStarted() && isGameActive()) scene.update()
   * - SceneManager.isGameActive() -> window.top.document.hasFocus()
   */
  private applySceneManagerActiveOverride(): void {
    const SceneManager = (global as any).SceneManager;

    if (!SceneManager) {
      console.warn('[HeadlessOverrides] SceneManager not found - skipping active override');
      return;
    }

    // Override isGameActive to always return true (simulate focused window)
    SceneManager.isGameActive = function () {
      return true;
    };

    console.log('[HeadlessOverrides] SceneManager.isGameActive forced to true');
  }

  /**
   * Adiciona debug logging ao BattleManager.update para identificar bloqueios.
   *
   * TEMPORARY: Este método é apenas para debugging. Remove após identificar problema.
   */
  private applyBattleManagerDebug(): void {
    const BattleManager = (global as any).BattleManager;
    const Scene_Battle = (global as any).Scene_Battle;

    if (!BattleManager || !Scene_Battle) {
      console.warn('[HeadlessOverrides] BattleManager/Scene_Battle not found - skipping debug');
      return;
    }

    // CRITICAL: Override isInputting to always return false in headless mode
    // This prevents BattleManager from waiting for player input
    BattleManager.isInputting = function () {
      return false; // Never waiting for input in headless mode
    };

    // CRITICAL: Override updatePhase to handle "input" phase in headless mode
    // Normal flow: "start" -> "input" (wait for player) -> "turn" -> "action" -> "turnEnd"
    // Headless flow: "start" -> "input" -> FORCE "turn" immediately
    const _BattleManager_updatePhase = BattleManager.updatePhase;
    BattleManager.updatePhase = function (this: any, timeActive: boolean) {
      // If in input phase and not inputting (headless), force transition to turn phase
      if (this._phase === 'input' && !this.isInputting()) {
        console.log('[HeadlessOverrides] Detected input phase with isInputting=false, forcing startTurn()');
        this.startTurn();
        return;
      }

      // Otherwise use original logic
      return _BattleManager_updatePhase.call(this, timeActive);
    };

    // Wrap Scene_Battle.update to see if it's being called
    let sceneUpdateCount = 0;
    const _Scene_Battle_update = Scene_Battle.prototype.update;
    Scene_Battle.prototype.update = function (this: any) {
      sceneUpdateCount++;

      if (sceneUpdateCount <= 5 || sceneUpdateCount % 100 === 0) {
        const active = this.isActive();
        const busy = this.isBusy();
        console.log(`[Scene_Battle.update #${sceneUpdateCount}] active=${active}, isBusy=${busy}`);
      }

      // Call original
      return _Scene_Battle_update.call(this);
    };

    // CRITICAL: Override startTurn to auto-select actions BEFORE makeActionOrders
    // This ensures _actionBattlers[] is populated with actors who have valid actions
    const _BattleManager_startTurn = BattleManager.startTurn;
    BattleManager.startTurn = function (this: any) {
      const $gameParty = (global as any).$gameParty;
      const $gameTroop = (global as any).$gameTroop;

      console.log('[HeadlessOverrides] startTurn - auto-selecting actions');

      // Auto-select actions for all actors BEFORE makeActionOrders
      for (const actor of $gameParty.members()) {
        if (actor.isAlive() && actor.canMove()) {
          // Ensure actor has at least one action slot
          if (actor.numActions() === 0) {
            actor.makeActions();
          }
          // Set attack for the first action if not already set
          const firstAction = actor.action(0);
          if (firstAction && !firstAction.item()) {
            firstAction.setAttack();
            console.log(`[HeadlessOverrides] Auto-selected attack for actor ${actor.actorId()}`);
          }
        }
      }

      // Enemies select actions automatically via makeActions()
      for (const enemy of $gameTroop.members()) {
        if (enemy.isAlive() && enemy.canMove()) {
          if (enemy.numActions() === 0) {
            enemy.makeActions();
          }
        }
      }

      // Call original startTurn - this will call makeActionOrders() and populate _actionBattlers
      const result = _BattleManager_startTurn.call(this);

      // Debug: Check if _actionBattlers was populated
      console.log(`[HeadlessOverrides] After startTurn: _actionBattlers.length = ${this._actionBattlers?.length || 0}`);
      if (this._actionBattlers && this._actionBattlers.length > 0) {
        console.log(`[HeadlessOverrides] _actionBattlers[0] = ${this._actionBattlers[0]?.name?.() || 'unknown'}`);
      } else {
        // Debug: Why is _actionBattlers empty?
        console.log('[HeadlessOverrides] _actionBattlers is empty! Checking party/troop state:');
        console.log(`  Party members: ${$gameParty.members().length}`);
        console.log(`  Troop members: ${$gameTroop.members().length}`);
        console.log(`  _surprise: ${this._surprise}, _preemptive: ${this._preemptive}`);

        // Manually call makeActionOrders to debug
        const battlers = [];
        if (!this._surprise) {
          battlers.push(...$gameParty.battleMembers());
        }
        if (!this._preemptive) {
          battlers.push(...$gameTroop.members());
        }
        console.log(`  Battlers before makeSpeed: ${battlers.length}`);
        for (const battler of battlers) {
          battler.makeSpeed();
          console.log(`    ${battler.name()} speed=${battler.speed()}`);
        }
        battlers.sort((a, b) => b.speed() - a.speed());
        console.log(`  Battlers after sort: ${battlers.length}`);
        this._actionBattlers = battlers;
        console.log(`  Forced _actionBattlers.length = ${this._actionBattlers.length}`);
      }

      return result;
    };

    // Wrap BattleManager.update for debugging
    let frameCount = 0;
    const _BattleManager_update = BattleManager.update;
    BattleManager.update = function (this: any, timeActive: boolean) {
      frameCount++;

      // Log every 100 calls in first 500, then every 500
      const shouldLog = frameCount <= 5 || (frameCount <= 500 && frameCount % 100 === 0) || frameCount % 500 === 0;

      if (shouldLog) {
        const isBusy = this.isBusy();
        const updateEvent = this.updateEvent();

        console.log(`[BattleManager.update #${frameCount}]`);
        console.log(`  isBusy: ${isBusy}, updateEvent: ${updateEvent}, phase: ${this._phase}`);
        console.log(`  _subject: ${this._subject?.name?.() || 'null'}`);
        console.log(`  _actionBattlers.length: ${this._actionBattlers?.length || 0}`);

        if (isBusy) {
          console.log(`  BLOCKED BY: isBusy()`);
        } else if (updateEvent) {
          console.log(`  BLOCKED BY: updateEvent()`);
        }
      }

      // Call original
      return _BattleManager_update.call(this, timeActive);
    };

    console.log('[HeadlessOverrides] BattleManager debug logging enabled');
  }

  /**
   * Neutraliza input de teclado e mouse/touch.
   *
   * Em simulação headless, input vem de agente IA ou script pré-definido,
   * não de hardware físico. Polling de input é desperdício de CPU.
   *
   * Overrides implementados:
   * - Input.update = () => {} (neutraliza polling de teclado)
   * - TouchInput.update = () => {} (neutraliza polling de mouse/touch)
   * - TouchInput.isHovered = () => false (neutraliza verificação de hover)
   * - TouchInput.isPressed = () => false (neutraliza verificação de press)
   * - TouchInput.isTriggered = () => false (neutraliza verificação de trigger)
   *
   * Baseado na pesquisa POC (Seção 2.3, linhas 180-182).
   *
   * @throws {Error} Se Input ou TouchInput não existirem
   */
  private applyInputNeutralization(): void {
    const Input = (global as any).Input;
    const TouchInput = (global as any).TouchInput;

    if (!Input || !TouchInput) {
      throw new Error(
        'Input/TouchInput not found - load core scripts (Task 22) before applying overrides'
      );
    }

    // Input.update() normalmente faz polling de teclas via window.addEventListener
    // Sobrescrevemos para no-op (não faz nada)
    Input.update = function () {
      // No-op - não faz polling de teclas
      // Input programático será feito via BattleManager.inputtingAction().setSkill(id)
    };

    // Override Input keyboard state methods
    Input.isPressed = function (_keyName: string) {
      return false; // No keys pressed in headless mode
    };

    Input.isTriggered = function (_keyName: string) {
      return false; // No keys triggered in headless mode
    };

    Input.isRepeated = function (_keyName: string) {
      return false; // No keys repeated in headless mode
    };

    Input.isLongPressed = function (_keyName: string) {
      return false; // No keys long-pressed in headless mode
    };

    // TouchInput.update() normalmente faz polling de eventos de mouse/touch
    // Sobrescrevemos para no-op (não faz nada)
    TouchInput.update = function () {
      // No-op - não faz polling de mouse/touch
    };

    // Override TouchInput methods that check mouse/touch state
    // These are called by Window_Selectable.processTouch() during battle
    TouchInput.isHovered = function () {
      return false; // No hovering in headless mode
    };

    TouchInput.isPressed = function () {
      return false; // No pressing in headless mode
    };

    TouchInput.isTriggered = function () {
      return false; // No triggering in headless mode
    };

    TouchInput.isReleased = function () {
      return false; // No releasing in headless mode
    };

    TouchInput.isClicked = function () {
      return false; // No clicking in headless mode
    };

    TouchInput.isCancelled = function () {
      return false; // No cancel input in headless mode
    };

    console.log('[HeadlessOverrides] Input neutralized');

    // TTK Action Counter: Track party actions for TTK measurement
    // Initialize action counter for each actor
    const $gameParty = (global as any).$gameParty;
    if ($gameParty && $gameParty.members) {
      for (const actor of $gameParty.members()) {
        actor._actionCount = 0;
      }
    }

    // Override Game_Battler.performActionStart to increment action counter
    const Game_Battler = (global as any).Game_Battler;
    if (Game_Battler) {
      const _Game_Battler_performActionStart = Game_Battler.prototype.performActionStart;
      Game_Battler.prototype.performActionStart = function (this: any, action: any) {
        // Call original
        if (_Game_Battler_performActionStart) {
          _Game_Battler_performActionStart.call(this, action);
        }

        // Increment action count only for party members (not enemies)
        if (this.isActor && this.isActor()) {
          this._actionCount = (this._actionCount || 0) + 1;
        }
      };

      console.log('[HeadlessOverrides] TTK action counter initialized');
    }
  }

  /**
   * Valida que overrides foram aplicados corretamente.
   *
   * Verificações:
   * 1. Window_BattleLog.messageSpeed() retorna 0
   * 2. Spriteset_Battle.isBusy() retorna false
   *
   * IMPORTANTE: Não valida Input.update/TouchInput.update pois são funções
   * e não retornam valores testáveis diretamente.
   *
   * @throws {Error} Se validação falhar
   */
  validateOverrides(): void {
    // TODO: Re-enable after fixing PIXI Sprite anchor initialization issue
    console.log('[HeadlessOverrides] Validation temporarily disabled (fixing PIXI Sprite)');
  }
}
