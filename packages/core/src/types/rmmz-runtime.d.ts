/**
 * TypeScript declarations for RPG Maker MZ runtime APIs
 * Reference: RPG Maker MZ v1.8.0 core scripts
 */

declare global {
  namespace RMMZ {
    // Core battle classes
    interface Game_Battler {
      isActor(): boolean;
      isEnemy(): boolean;
      isAlive(): boolean;
      isDead(): boolean;
      hp: number;
      mp: number;
      tp: number;
      param(paramId: number): number;
      performAction(action: Game_Action): void;
      performDamage(): void;
      performCollapse(): void;
      result(): Game_ActionResult;
    }

    interface Game_Actor extends Game_Battler {
      actorId(): number;
      name(): string;
      level: number;
      equips(): (DataWeapon | DataArmor | null)[];
      changeLevel?(level: number, showLevelUp: boolean): void;
      changeClass?(classId: number, keepExp: boolean): void;
      makeActions?(): void;
      numActions?(): number;
      action?(index: number): Game_Action;
      canMove?(): boolean;
      isAlive(): boolean;
      _actionCount?: number;
    }

    interface Game_Enemy extends Game_Battler {
      enemyId(): number;
      enemy(): DataEnemy;
      originalName(): string;
      isAlive(): boolean;
    }

    interface Game_Party {
      members(): Game_Actor[];
      allMembers(): Game_Actor[];
      battleMembers(): Game_Actor[];
      aliveMembers(): Game_Actor[];
      leader(): Game_Actor;
      clearMembers?(): void;
      removeAllMembers?(): void;
      removeActor?(actorId: number): void;
      addActor?(actorId: number): void;
      isAllDead?(): boolean;
    }

    interface Game_Troop {
      members(): Game_Enemy[];
      aliveMembers(): Game_Enemy[];
      enemyNames(): string[];
      _turnCount?: number;
      isAllDead?(): boolean;
      expTotal?(): number;
      onTurnEnd?(): void;
    }

    interface Game_Action {
      subject(): Game_Battler;
      item(): DataSkill | DataItem;
      isSkill(): boolean;
      isItem(): boolean;
      isAttack(): boolean;
      isGuard(): boolean;
      isMagical(): boolean;
      isPhysical(): boolean;
      setAttack(): void;
      setSkill(skillId: number): void;
      setTarget(targetIndex: number): void;
      apply(target: Game_Battler): void;
    }

    interface Game_ActionResult {
      clear(): void;
      used: boolean;
      missed: boolean;
      evaded: boolean;
      critical: boolean;
      success: boolean;
      hpDamage: number;
      mpDamage: number;
      tpDamage: number;
      hpAffected: boolean;
      mpAffected: boolean;
    }

    // Battle manager
    interface BattleManager {
      setup(troopId: number, canEscape: boolean, canLose: boolean): void;
      startBattle(): void;
      updateBattle(): void;
      endBattle(result: number): void;
      isBattleTest(): boolean;
      setBattleTest(battleTest: boolean): void;
      isInputting(): boolean;
      isInTurn(): boolean;
      isTurnEnd(): boolean;
      isBusy(): boolean;
      _subject: Game_Battler | null;
      _action: Game_Action | null;
      _targets: Game_Battler[];
      _logWindow: unknown;
      _actionBattlers?: Game_Battler[];
      _phase?: string;
      _surprise?: boolean;
      _preemptive?: boolean;
      _rewards?: { exp: number };
    }

    // Data structures
    interface DataActor {
      id: number;
      name: string;
      nickname: string;
      classId: number;
      initialLevel: number;
      maxLevel: number;
      profile: string;
      equips: number[];
      traits: DataTrait[];
    }

    interface DataEnemy {
      id: number;
      name: string;
      battlerName: string;
      battlerHue: number;
      params: number[]; // [MHP, MMP, ATK, DEF, MAT, MDF, AGI, LUK]
      exp: number;
      gold: number;
      dropItems: DataDropItem[];
      actions: DataEnemyAction[];
      traits: DataTrait[];
    }

    interface DataSkill {
      id: number;
      name: string;
      description: string;
      scope: number;
      mpCost: number;
      tpCost: number;
      damage: DataDamage;
      effects: DataEffect[];
      animationId: number;
    }

    interface DataDamage {
      type: number;
      elementId: number;
      formula: string;
      variance: number;
      critical: boolean;
    }

    interface DataTrait {
      code: number;
      dataId: number;
      value: number;
    }

    interface DataEffect {
      code: number;
      dataId: number;
      value1: number;
      value2: number;
    }

    // Graphics manager
    interface Graphics {
      width: number;
      height: number;
      frameCount: number;
      render(): void;
      startLoading(): void;
      endLoading(): void;
    }

    // Managers
    interface DataManager {
      loadDatabase(): void;
      isDatabaseLoaded(): boolean;
      loadDataFile(name: string, src: string): void;
      isDataLoaded(): boolean;
    }

    interface AudioManager {
      playBgm(bgm: { name: string; volume: number; pitch: number; pan: number }): void;
      stopBgm(): void;
      playSe(se: { name: string; volume: number; pitch: number; pan: number }): void;
    }

    interface ImageManager {
      loadBitmap(folder: string, filename: string): unknown;
      loadFace(filename: string): unknown;
      loadCharacter(filename: string): unknown;
      loadSvActor(filename: string): unknown;
      loadEnemy(filename: string): unknown;
    }

    // Additional common types
    interface DataClass {
      id: number;
      name: string;
    }

    interface DataItem {
      id: number;
      name: string;
    }

    interface DataWeapon {
      id: number;
      name: string;
    }

    interface DataArmor {
      id: number;
      name: string;
    }

    interface DataState {
      id: number;
      name: string;
    }

    interface DataAnimation {
      id: number;
      name: string;
    }

    interface DataTroop {
      id: number;
      name: string;
      members: DataTroopMember[];
      expTotal?(): number;
    }

    interface DataTroopMember {
      enemyId: number;
      x: number;
      y: number;
      hidden: boolean;
    }

    interface DataDropItem {
      kind: number;
      dataId: number;
      denominator: number;
    }

    interface DataEnemyAction {
      skillId: number;
      conditionType: number;
      conditionParam1: number;
      conditionParam2: number;
      rating: number;
    }

    interface SceneManager {
      goto(scene: unknown): void;
    }

    interface EffectManager {
      removeEffects(): void;
    }

    interface Game_Actors {
      actor(actorId: number): Game_Actor | null;
    }
  }

  // Global game objects
  const $gameParty: RMMZ.Game_Party;
  const $gameTroop: RMMZ.Game_Troop;
  const $gameActors: RMMZ.Game_Actors;
  const BattleManager: RMMZ.BattleManager;
  const DataManager: RMMZ.DataManager;
  const SceneManager: RMMZ.SceneManager;
  const Graphics: RMMZ.Graphics;
  const AudioManager: RMMZ.AudioManager;
  const ImageManager: RMMZ.ImageManager;
  const EffectManager: RMMZ.EffectManager;

  // Global data arrays
  const $dataActors: RMMZ.DataActor[];
  const $dataClasses: RMMZ.DataClass[];
  const $dataSkills: RMMZ.DataSkill[];
  const $dataItems: RMMZ.DataItem[];
  const $dataWeapons: RMMZ.DataWeapon[];
  const $dataArmors: RMMZ.DataArmor[];
  const $dataEnemies: RMMZ.DataEnemy[];
  const $dataTroops: RMMZ.DataTroop[];
  const $dataStates: RMMZ.DataState[];
  const $dataAnimations: RMMZ.DataAnimation[];
}

export {};
