import { DatabaseLoader } from '@/infrastructure/runtime/loaders/DatabaseLoader';
import * as path from 'path';

// Mock fs antes de importar DatabaseLoader
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
}));

const fs = require('fs');

/**
 * Unit Tests: DatabaseLoader
 *
 * Testa o override de DataManager.loadDataFile para usar fs.readFileSync
 * e a validação do carregamento da database do RPG Maker MZ.
 *
 * Task 21: Synchronous Database Loading Override (ADR-016)
 */
describe('DatabaseLoader', () => {
  const testProjectPath = '/fake/project/path';

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    // Mock DataManager global
    (global as any).DataManager = {
      loadDataFile: jest.fn(),
      onLoad: jest.fn(),
      isDatabaseLoaded: jest.fn().mockReturnValue(false),
      loadDatabase: jest.fn(),
      _errorUrl: null,
    };

    // Mock window global
    (global as any).window = {};

    // Reset $data* globals
    (global as any).$dataActors = null;
    (global as any).$dataClasses = null;
    (global as any).$dataSkills = null;
    (global as any).$dataItems = null;
    (global as any).$dataWeapons = null;
    (global as any).$dataArmors = null;
    (global as any).$dataEnemies = null;
    (global as any).$dataTroops = null;
    (global as any).$dataStates = null;
    (global as any).$dataSystem = null;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('overrideDataManager', () => {
    it('should throw error if DataManager does not exist', () => {
      // Arrange
      (global as any).DataManager = undefined;
      const loader = new DatabaseLoader(testProjectPath);

      // Act & Assert
      expect(() => loader.overrideDataManager()).toThrow(
        'DataManager not found - load core scripts first (Task 22)'
      );
    });

    it('should override DataManager.loadDataFile', () => {
      // Arrange
      const loader = new DatabaseLoader(testProjectPath);
      const originalLoadDataFile = (global as any).DataManager.loadDataFile;

      // Act
      loader.overrideDataManager();

      // Assert
      expect((global as any).DataManager.loadDataFile).not.toBe(
        originalLoadDataFile
      );
    });

    it('should use fs.readFileSync in overridden loadDataFile', () => {
      // Arrange
      const loader = new DatabaseLoader(testProjectPath);
      const mockData = { test: 'data' };

      fs.readFileSync.mockReturnValue(JSON.stringify(mockData));

      // Act
      loader.overrideDataManager();
      (global as any).DataManager.loadDataFile('$dataActors', 'Actors.json');

      // Assert
      expect(fs.readFileSync).toHaveBeenCalledWith(
        path.join(testProjectPath, 'data', 'Actors.json'),
        'utf8'
      );
    });

    it('should parse JSON and assign to window[name]', () => {
      // Arrange
      const loader = new DatabaseLoader(testProjectPath);
      const mockData = [null, { id: 1, name: 'Hero' }];

      fs.readFileSync.mockReturnValue(JSON.stringify(mockData));

      // Act
      loader.overrideDataManager();
      (global as any).DataManager.loadDataFile('$dataActors', 'Actors.json');

      // Assert
      expect((global as any).window.$dataActors).toEqual(mockData);
    });

    it('should call DataManager.onLoad manually after fs.readFileSync', () => {
      // Arrange
      const loader = new DatabaseLoader(testProjectPath);
      const mockData = [null, { id: 1, name: 'Hero' }];

      fs.readFileSync.mockReturnValue(JSON.stringify(mockData));

      // Act
      loader.overrideDataManager();
      (global as any).DataManager.loadDataFile('$dataActors', 'Actors.json');

      // Assert
      expect((global as any).DataManager.onLoad).toHaveBeenCalledWith(mockData);
    });

    it('should set _errorUrl on fs.readFileSync error', () => {
      // Arrange
      const loader = new DatabaseLoader(testProjectPath);

      fs.readFileSync.mockImplementation(() => {
        throw new Error('ENOENT');
      });

      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation();

      // Act
      loader.overrideDataManager();
      (global as any).DataManager.loadDataFile('$dataActors', 'Actors.json');

      // Assert
      expect((global as any).DataManager._errorUrl).toBe('$dataActors');
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('loadDatabase', () => {
    it('should call DataManager.loadDatabase', () => {
      // Arrange
      const loader = new DatabaseLoader(testProjectPath);

      // Act
      loader.loadDatabase();

      // Assert
      expect((global as any).DataManager.loadDatabase).toHaveBeenCalled();
    });

    it('should throw if DataManager does not exist', () => {
      // Arrange
      (global as any).DataManager = undefined;
      const loader = new DatabaseLoader(testProjectPath);

      // Act & Assert
      expect(() => loader.loadDatabase()).toThrow('DataManager not found');
    });
  });

  describe('waitForDatabase', () => {
    it('should return promise', () => {
      // Arrange
      const loader = new DatabaseLoader(testProjectPath);
      (global as any).DataManager.isDatabaseLoaded = jest.fn(() => true);

      // Act
      const result = loader.waitForDatabase(1000);

      // Assert
      expect(result).toBeInstanceOf(Promise);
    });

    // Testes assíncronos com setInterval são testados em integration tests
    // devido à complexidade de mockar timers corretamente em unit tests
  });

  describe('validateDatabase', () => {
    it('should not throw if all required data is loaded', () => {
      // Arrange
      const loader = new DatabaseLoader(testProjectPath);

      // Mock todos os dados obrigatórios em window (onde validateDatabase procura)
      (global as any).window.$dataActors = [null];
      (global as any).window.$dataClasses = [null];
      (global as any).window.$dataSkills = [null];
      (global as any).window.$dataItems = [null];
      (global as any).window.$dataWeapons = [null];
      (global as any).window.$dataArmors = [null];
      (global as any).window.$dataEnemies = [null];
      (global as any).window.$dataTroops = [null];
      (global as any).window.$dataStates = [null];
      (global as any).window.$dataSystem = { gameTitle: 'Test Game' };

      // Act & Assert
      expect(() => loader.validateDatabase()).not.toThrow();
    });

    it('should throw error if any required data is null', () => {
      // Arrange
      const loader = new DatabaseLoader(testProjectPath);

      // Mock dados em window, mas deixa $dataEnemies null
      (global as any).window.$dataActors = [null];
      (global as any).window.$dataClasses = [null];
      (global as any).window.$dataSkills = [null];
      (global as any).window.$dataItems = [null];
      (global as any).window.$dataWeapons = [null];
      (global as any).window.$dataArmors = [null];
      (global as any).window.$dataEnemies = null; // <-- null
      (global as any).window.$dataTroops = [null];
      (global as any).window.$dataStates = [null];
      (global as any).window.$dataSystem = { gameTitle: 'Test Game' };

      // Act & Assert
      expect(() => loader.validateDatabase()).toThrow(
        'Database validation failed: $dataEnemies is null'
      );
    });

    it('should warn if data array is empty', () => {
      // Arrange
      const loader = new DatabaseLoader(testProjectPath);
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Mock todos os dados em window, mas $dataActors vazio
      (global as any).window.$dataActors = []; // <-- empty
      (global as any).window.$dataClasses = [null];
      (global as any).window.$dataSkills = [null];
      (global as any).window.$dataItems = [null];
      (global as any).window.$dataWeapons = [null];
      (global as any).window.$dataArmors = [null];
      (global as any).window.$dataEnemies = [null];
      (global as any).window.$dataTroops = [null];
      (global as any).window.$dataStates = [null];
      (global as any).window.$dataSystem = { gameTitle: 'Test Game' };

      // Act
      loader.validateDatabase();

      // Assert
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[DatabaseLoader] $dataActors is empty array'
      );

      consoleWarnSpy.mockRestore();
    });
  });
});
