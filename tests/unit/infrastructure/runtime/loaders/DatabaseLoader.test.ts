import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { DatabaseLoader } from '@/infrastructure/runtime/loaders/DatabaseLoader.js';

describe('DatabaseLoader', () => {
  let tmpProjectPath: string;
  let DataManager: any;

  beforeEach(() => {
    tmpProjectPath = fs.mkdtempSync(path.join(os.tmpdir(), 'dbloader-'));
    fs.mkdirSync(path.join(tmpProjectPath, 'data'), { recursive: true });

    (global as any).window = {};

    DataManager = {
      _loaded: false,
      _errorUrl: null,
      onLoad: jest.fn(),
      isDatabaseLoaded: jest.fn(() => DataManager._loaded),
      loadDatabase: jest.fn(() => {
        // Will be configured per-test
      }),
    };
    (global as any).DataManager = DataManager;
  });

  afterEach(() => {
    delete (global as any).window;
    delete (global as any).DataManager;
    fs.rmSync(tmpProjectPath, { recursive: true, force: true });
  });

  it('should throw if DataManager is missing', () => {
    delete (global as any).DataManager;
    const loader = new DatabaseLoader(tmpProjectPath);
    expect(() => loader.overrideDataManager()).toThrow(/DataManager not found/);
  });

  it('should throw if DataManager is missing when calling loadDatabase()', () => {
    delete (global as any).DataManager;
    const loader = new DatabaseLoader(tmpProjectPath);
    expect(() => loader.loadDatabase()).toThrow(/DataManager not found/);
  });

  it('should override DataManager.loadDataFile and load JSON synchronously', () => {
    fs.writeFileSync(
      path.join(tmpProjectPath, 'data', 'Actors.json'),
      JSON.stringify([null, { id: 1, name: 'Hero' }]),
      'utf-8'
    );

    const loader = new DatabaseLoader(tmpProjectPath);
    loader.overrideDataManager();

    (global as any).window.$dataActors = null;
    (global as any).$dataActors = null;

    DataManager.loadDataFile('$dataActors', 'Actors.json');

    expect((global as any).window.$dataActors).toEqual([null, { id: 1, name: 'Hero' }]);
    expect((global as any).$dataActors).toEqual([null, { id: 1, name: 'Hero' }]);
    expect(DataManager.onLoad).toHaveBeenCalledWith((global as any).window.$dataActors);
    expect(DataManager._errorUrl).toBeNull();
  });

  it('should set DataManager._errorUrl when JSON parse fails', () => {
    fs.writeFileSync(path.join(tmpProjectPath, 'data', 'Broken.json'), '{not-json', 'utf-8');

    const loader = new DatabaseLoader(tmpProjectPath);
    loader.overrideDataManager();

    DataManager.loadDataFile('$dataBroken', 'Broken.json');
    expect(DataManager._errorUrl).toBe('$dataBroken');
  });

  it('should wait for database load and resolve when isDatabaseLoaded becomes true', async () => {
    const loader = new DatabaseLoader(tmpProjectPath);
    loader.overrideDataManager();

    // Simulate async readiness by toggling in a timer tick
    DataManager._loaded = false;
    setTimeout(() => {
      DataManager._loaded = true;
    }, 25);

    const promise = loader.waitForDatabase(1000);
    jest.advanceTimersByTime(50);
    await promise;
  });

  it('should reject with timeout if database never becomes ready', async () => {
    const loader = new DatabaseLoader(tmpProjectPath);
    loader.overrideDataManager();

    DataManager._loaded = false;

    const promise = loader.waitForDatabase(30);
    jest.advanceTimersByTime(100);

    await expect(promise).rejects.toThrow('Database loading timeout');
  });

  it('should validate required $data* variables in window', () => {
    (global as any).window.$dataActors = [null];
    (global as any).window.$dataClasses = [null];
    (global as any).window.$dataSkills = [null];
    (global as any).window.$dataItems = [null];
    (global as any).window.$dataWeapons = [null];
    (global as any).window.$dataArmors = [null];
    (global as any).window.$dataEnemies = [null];
    (global as any).window.$dataTroops = [null];
    (global as any).window.$dataStates = [null];
    (global as any).window.$dataSystem = { gameTitle: 'ok' };

    const loader = new DatabaseLoader(tmpProjectPath);
    expect(() => loader.validateDatabase()).not.toThrow();
  });

  it('should warn when a required $data* array is empty (but still pass validation)', () => {
    (global as any).window.$dataActors = [null];
    (global as any).window.$dataClasses = [null];
    (global as any).window.$dataSkills = [null];
    (global as any).window.$dataItems = []; // empty array should warn
    (global as any).window.$dataWeapons = [null];
    (global as any).window.$dataArmors = [null];
    (global as any).window.$dataEnemies = [null];
    (global as any).window.$dataTroops = [null];
    (global as any).window.$dataStates = [null];
    (global as any).window.$dataSystem = { gameTitle: 'ok' };

    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const loader = new DatabaseLoader(tmpProjectPath);
    expect(() => loader.validateDatabase()).not.toThrow();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('$dataItems is empty array'));
    warn.mockRestore();
  });

  it('should throw if a required $data* variable is missing', () => {
    (global as any).window.$dataActors = [null];
    (global as any).window.$dataClasses = [null];
    (global as any).window.$dataSkills = [null];
    (global as any).window.$dataItems = [null];
    (global as any).window.$dataWeapons = [null];
    (global as any).window.$dataArmors = [null];
    (global as any).window.$dataEnemies = [null];
    (global as any).window.$dataTroops = [null];
    (global as any).window.$dataStates = [null];
    // Intentionally omit $dataSystem to verify correct error reporting

    const loader = new DatabaseLoader(tmpProjectPath);
    expect(() => loader.validateDatabase()).toThrow(/\$dataSystem/);
  });

  it('should report null vs undefined correctly in validation errors', () => {
    (global as any).window.$dataActors = [null];
    (global as any).window.$dataClasses = [null];
    (global as any).window.$dataSkills = [null];
    (global as any).window.$dataItems = [null];
    (global as any).window.$dataWeapons = [null];
    (global as any).window.$dataArmors = [null];
    (global as any).window.$dataEnemies = [null];
    (global as any).window.$dataTroops = [null];
    (global as any).window.$dataStates = [null];
    (global as any).window.$dataSystem = null;

    const loader = new DatabaseLoader(tmpProjectPath);
    expect(() => loader.validateDatabase()).toThrow(/\$dataSystem is null/);
  });
});
