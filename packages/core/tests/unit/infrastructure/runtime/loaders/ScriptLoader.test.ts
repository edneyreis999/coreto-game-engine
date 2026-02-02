import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { ScriptLoader } from '@coreto/core/infrastructure/runtime/loaders/ScriptLoader.js';

function writeFile(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
}

describe('ScriptLoader', () => {
  let tmpProjectPath: string;

  beforeEach(() => {
    tmpProjectPath = fs.mkdtempSync(path.join(os.tmpdir(), 'rmmz-mini-'));

    // Minimal globals expected BEFORE loading scripts
    (global as any).PIXI = {
      Container: class Container {
        scale = { x: 1, y: 1 };
      },
      Rectangle: class Rectangle {
        x = 0;
        y = 0;
        width = 0;
        height = 0;
      },
      filters: {},
    };
    (global as any).window = { top: { document: { hasFocus: () => true } } };
    (global as any).document = {};
    (global as any).Graphics = { frameCount: 0 };

    // Create js/ directory and scripts from the repo fixture (copy-on-write)
    const fixtureProject = path.join(__dirname, '../../../../fixtures/rmmz-mini-project');
    const scripts = [
      'rmmz_core.js',
      'rmmz_managers.js',
      'rmmz_objects.js',
      'rmmz_scenes.js',
      'rmmz_sprites.js',
      'rmmz_windows.js',
    ];
    for (const name of scripts) {
      const src = fs.readFileSync(path.join(fixtureProject, 'js', name), 'utf-8');
      writeFile(path.join(tmpProjectPath, 'js', name), src);
    }
  });

  afterEach(() => {
    delete (global as any).PIXI;
    delete (global as any).window;
    delete (global as any).document;
    delete (global as any).Graphics;

    for (const k of [
      'Utils',
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
      'Scene_Boot',
      'Scene_Title',
      'Scene_Gameover',
      'Spriteset_Battle',
      'Sprite_Battler',
      'Window_BattleLog',
      'Window_BattleStatus',
      'Sprite',
      'Bitmap',
      'Window',
      'ColorFilter',
    ]) {
      delete (global as any)[k];
    }

    fs.rmSync(tmpProjectPath, { recursive: true, force: true });
  });

  it('should load all scripts and validate required globals', () => {
    const loader = new ScriptLoader(tmpProjectPath, true);

    expect(() => loader.loadAllScripts()).not.toThrow();
    expect(() => loader.validateGlobals()).not.toThrow();
    expect(loader.getCoreScripts()).toHaveLength(6);

    // Post-load patch: openness setter should be safe even if _container is missing
    const Window = (global as any).Window;
    const w = new Window();
    expect(() => {
      (w as any).openness = 255;
    }).not.toThrow();

    // Post-load patch: _createAllParts should suppress visual errors and ensure _container exists
    expect(() => (w as any)._createAllParts()).not.toThrow();
    expect((w as any)._container).toBeDefined();

    // Post-load patch: Sprite.setFrame/_refresh should be safe no-ops
    const Sprite = (global as any).Sprite;
    const sprite = new Sprite();
    expect(() => sprite.setFrame(0, 0, 10, 10)).not.toThrow();
    expect(() => sprite._refresh()).not.toThrow();

    // Post-load patch: Bitmap drawing methods should be safe no-ops
    const Bitmap = (global as any).Bitmap;
    const bmp = new Bitmap();
    expect(() => bmp.clearRect(0, 0, 1, 1)).not.toThrow();
    expect(() => bmp.clear()).not.toThrow();
    expect(() => bmp.fillRect(0, 0, 1, 1)).not.toThrow();
    expect(() => bmp.gradientFillRect(0, 0, 1, 1)).not.toThrow();
    expect(() => bmp.drawCircle(0, 0, 1)).not.toThrow();
    expect(() => bmp.drawText('x', 0, 0)).not.toThrow();
    expect(() => bmp.blt()).not.toThrow();
    expect(() => bmp.strokeRect(0, 0, 1, 1)).not.toThrow();

    // Post-load patch: ColorFilter.setBlendColor should ensure uniforms exists
    const ColorFilter = (global as any).ColorFilter;
    const cf = new ColorFilter();
    expect(() => cf.setBlendColor([0, 0, 0, 0])).not.toThrow();
  });

  it('should ensure Window container has scale when missing', () => {
    const loader = new ScriptLoader(tmpProjectPath, true);
    loader.loadAllScripts();

    // Force container instances without `scale` to hit the scale-guard branch
    (global as any).PIXI.Container = class Container {};

    const Window = (global as any).Window;
    const w = new Window();
    (w as any).openness = 123;

    expect((w as any)._container).toBeDefined();
    expect((w as any)._container.scale).toBeDefined();
    expect((w as any)._container.scale.x).toBe(1);
    expect((w as any)._container.scale.y).toBe(1);
  });

  it('should fail fast if PIXI is not available', () => {
    delete (global as any).PIXI;
    const loader = new ScriptLoader(tmpProjectPath);
    expect(() => loader.loadAllScripts()).toThrow(/PIXI global not found/);
  });

  it('should fail fast if window is not available', () => {
    delete (global as any).window;
    const loader = new ScriptLoader(tmpProjectPath);
    expect(() => loader.loadAllScripts()).toThrow(/window global not found/);
  });

  it('should fail fast if document is not available', () => {
    delete (global as any).document;
    const loader = new ScriptLoader(tmpProjectPath);
    expect(() => loader.loadAllScripts()).toThrow(/document global not found/);
  });

  it('should fail if js/ directory does not exist', () => {
    fs.rmSync(path.join(tmpProjectPath, 'js'), { recursive: true, force: true });
    const loader = new ScriptLoader(tmpProjectPath);
    expect(() => loader.loadAllScripts()).toThrow(/js\/ directory not found/);
  });

  it('should fail if a core script is missing', () => {
    fs.rmSync(path.join(tmpProjectPath, 'js', 'rmmz_windows.js'));
    const loader = new ScriptLoader(tmpProjectPath);
    expect(() => loader.loadAllScripts()).toThrow(/Failed to load rmmz_windows\.js/);
  });

  it('should skip ColorFilter patch when initialize is not found', () => {
    const loader: any = new ScriptLoader(tmpProjectPath, true);
    const original = 'function NotColorFilter() {}';
    const patched = loader.patchColorFilter(original);
    expect(patched).toBe(original);
  });

  it('should throw if required globals are missing after scripts load', () => {
    const loader = new ScriptLoader(tmpProjectPath, true);
    loader.loadAllScripts();
    delete (global as any).Scene_Battle;
    expect(() => loader.validateGlobals()).toThrow(/Missing globals/);
  });
});
