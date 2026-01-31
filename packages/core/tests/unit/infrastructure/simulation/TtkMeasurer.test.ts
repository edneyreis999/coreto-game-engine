import { TtkMeasurer } from '@coreto/core/infrastructure/simulation/TtkMeasurer.js';
import { TtkTarget } from '@coreto/core/core/domain/TtkTarget.js';
import { TtkMetrics } from '@coreto/core/core/domain/TtkMetrics.js';
import { ValidationError } from '@coreto/core/core/errors/ValidationError.js';

/**
 * Type assertion for accessing global scope
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any, no-undef
const globalScope = global as any;

describe('TtkMeasurer', () => {
  let measurer: TtkMeasurer;

  beforeEach(() => {
    measurer = new TtkMeasurer();
  });

  afterEach(() => {
    measurer.cleanup();
    // Clean up global mocks
    delete globalScope.BattleManager;
    delete globalScope.Game_Battler;
  });

  describe('injectActionTracking', () => {
    it('should inject action tracking into Game_Battler.prototype.performAction', () => {
      // Arrange
      const mockPerformAction = jest.fn();
      globalScope.Game_Battler = {
        prototype: {
          performAction: mockPerformAction,
        },
      };

      // Act
      measurer.injectActionTracking();

      // Assert
      expect(globalScope.Game_Battler.prototype.performAction).toBeDefined();
      expect(globalScope.Game_Battler.prototype.performAction).not.toBe(mockPerformAction);
    });

    it('should reset action counter when injecting', () => {
      // Arrange
      globalScope.Game_Battler = {
        prototype: {
          performAction: jest.fn(),
        },
      };

      // Manually set counter (simulate previous battle)
      // @ts-expect-error - accessing private field for testing
      measurer.actionCount = 10;

      // Act
      measurer.injectActionTracking();

      // Assert
      const metrics = createMockBattleManagerAndGetMetrics(0);
      expect(metrics.actions).toBe(0);
    });

    it('should throw ValidationError if Game_Battler not available', () => {
      // Arrange
      delete globalScope.Game_Battler;

      // Act & Assert
      expect(() => measurer.injectActionTracking()).toThrow(ValidationError);
      expect(() => measurer.injectActionTracking()).toThrow(
        'Game_Battler not available. Runtime not initialized.'
      );
    });

    it('should throw ValidationError if Game_Battler.prototype not available', () => {
      // Arrange
      globalScope.Game_Battler = {};

      // Act & Assert
      expect(() => measurer.injectActionTracking()).toThrow(ValidationError);
    });
  });

  describe('action tracking injection behavior', () => {
    beforeEach(() => {
      globalScope.Game_Battler = {
        prototype: {
          performAction: jest.fn(),
        },
      };
      measurer.injectActionTracking();
    });

    it('should increment counter when party member performs action', () => {
      // Arrange
      const mockActor = {
        isActor: () => true,
      };

      // Act
      globalScope.Game_Battler.prototype.performAction.call(mockActor, {});
      globalScope.Game_Battler.prototype.performAction.call(mockActor, {});
      globalScope.Game_Battler.prototype.performAction.call(mockActor, {});

      // Assert
      globalScope.BattleManager = { _turnCount: 1 };
      const metrics = measurer.getMetrics();
      expect(metrics.actions).toBe(3);
    });

    it('should not increment counter when enemy performs action', () => {
      // Arrange
      const mockEnemy = {
        isActor: () => false,
      };

      // Act
      globalScope.Game_Battler.prototype.performAction.call(mockEnemy, {});
      globalScope.Game_Battler.prototype.performAction.call(mockEnemy, {});

      // Assert
      globalScope.BattleManager = { _turnCount: 1 };
      const metrics = measurer.getMetrics();
      expect(metrics.actions).toBe(0);
    });

    it('should track mixed party and enemy actions correctly', () => {
      // Arrange
      const mockActor = {
        isActor: () => true,
      };
      const mockEnemy = {
        isActor: () => false,
      };

      // Act
      globalScope.Game_Battler.prototype.performAction.call(mockActor, {});
      globalScope.Game_Battler.prototype.performAction.call(mockEnemy, {});
      globalScope.Game_Battler.prototype.performAction.call(mockActor, {});
      globalScope.Game_Battler.prototype.performAction.call(mockEnemy, {});
      globalScope.Game_Battler.prototype.performAction.call(mockActor, {});

      // Assert
      globalScope.BattleManager = { _turnCount: 2 };
      const metrics = measurer.getMetrics();
      expect(metrics.actions).toBe(3); // Only party actions
    });

    it('should call original performAction method', () => {
      // Arrange
      const originalPerformAction = jest.fn();
      globalScope.Game_Battler = {
        prototype: {
          performAction: originalPerformAction,
        },
      };
      measurer.injectActionTracking();

      const mockActor = {
        isActor: () => true,
      };
      const mockAction = { skillId: 1 };

      // Act
      globalScope.Game_Battler.prototype.performAction.call(mockActor, mockAction);

      // Assert
      expect(originalPerformAction).toHaveBeenCalledWith(mockAction);
    });
  });

  describe('measureTtk', () => {
    beforeEach(() => {
      globalScope.Game_Battler = {
        prototype: {
          performAction: jest.fn(),
        },
      };
      measurer.injectActionTracking();
    });

    it('should measure TTK turns and actions correctly', () => {
      // Arrange
      globalScope.BattleManager = { _turnCount: 10 };
      simulatePartyActions(40);

      const target = new TtkTarget(10, 40, 15); // 10T/40A ±15%

      // Act
      const measurement = measurer.measureTtk(target);

      // Assert
      expect(measurement.ttkTurns).toBe(10);
      expect(measurement.ttkActions).toBe(40);
    });

    it('should calculate turn deviation correctly (actual > target)', () => {
      // Arrange
      globalScope.BattleManager = { _turnCount: 12 };
      simulatePartyActions(48);

      const target = new TtkTarget(10, 40, 15);

      // Act
      const measurement = measurer.measureTtk(target);

      // Assert
      expect(measurement.turnDeviation).toBe(2); // 12 - 10 = 2
      expect(measurement.actionDeviation).toBe(8); // 48 - 40 = 8
    });

    it('should calculate deviation correctly (actual < target)', () => {
      // Arrange
      globalScope.BattleManager = { _turnCount: 8 };
      simulatePartyActions(35);

      const target = new TtkTarget(10, 40, 15);

      // Act
      const measurement = measurer.measureTtk(target);

      // Assert
      expect(measurement.turnDeviation).toBe(-2); // 8 - 10 = -2
      expect(measurement.actionDeviation).toBe(-5); // 35 - 40 = -5
    });

    it('should calculate deviation correctly (exact match)', () => {
      // Arrange
      globalScope.BattleManager = { _turnCount: 10 };
      simulatePartyActions(40);

      const target = new TtkTarget(10, 40, 15);

      // Act
      const measurement = measurer.measureTtk(target);

      // Assert
      expect(measurement.turnDeviation).toBe(0);
      expect(measurement.actionDeviation).toBe(0);
    });

    it('should mark passed=true when within tolerance', () => {
      // Arrange
      globalScope.BattleManager = { _turnCount: 11 };
      simulatePartyActions(42);

      const target = new TtkTarget(10, 40, 15); // ±15% = ±1.5T, ±6A

      // Act
      const measurement = measurer.measureTtk(target);

      // Assert
      expect(measurement.passed).toBe(true);
    });

    it('should mark passed=false when turns out of tolerance', () => {
      // Arrange
      globalScope.BattleManager = { _turnCount: 15 }; // +50% deviation
      simulatePartyActions(40);

      const target = new TtkTarget(10, 40, 15); // ±15% tolerance

      // Act
      const measurement = measurer.measureTtk(target);

      // Assert
      expect(measurement.passed).toBe(false);
    });

    it('should mark passed=false when actions out of tolerance', () => {
      // Arrange
      globalScope.BattleManager = { _turnCount: 10 };
      simulatePartyActions(60); // +50% deviation

      const target = new TtkTarget(10, 40, 15); // ±15% tolerance

      // Act
      const measurement = measurer.measureTtk(target);

      // Assert
      expect(measurement.passed).toBe(false);
    });

    it('should mark passed=false when both metrics out of tolerance', () => {
      // Arrange
      globalScope.BattleManager = { _turnCount: 20 };
      simulatePartyActions(80);

      const target = new TtkTarget(10, 40, 15);

      // Act
      const measurement = measurer.measureTtk(target);

      // Assert
      expect(measurement.passed).toBe(false);
    });

    it('should handle edge case with zero turn count', () => {
      // Arrange
      globalScope.BattleManager = { _turnCount: 0 };
      simulatePartyActions(0);

      const target = new TtkTarget(10, 40, 15);

      // Act
      const measurement = measurer.measureTtk(target);

      // Assert
      expect(measurement.ttkTurns).toBe(0);
      expect(measurement.ttkActions).toBe(0);
      expect(measurement.turnDeviation).toBe(-10);
      expect(measurement.actionDeviation).toBe(-40);
      expect(measurement.passed).toBe(false);
    });

    it('should handle undefined _turnCount as 0', () => {
      // Arrange
      globalScope.BattleManager = {}; // No _turnCount property
      simulatePartyActions(0);

      const target = new TtkTarget(10, 40, 15);

      // Act
      const measurement = measurer.measureTtk(target);

      // Assert
      expect(measurement.ttkTurns).toBe(0);
    });

    it('should throw ValidationError if BattleManager not initialized', () => {
      // Arrange
      delete globalScope.BattleManager;
      const target = new TtkTarget(10, 40, 15);

      // Act & Assert
      expect(() => measurer.measureTtk(target)).toThrow(ValidationError);
      expect(() => measurer.measureTtk(target)).toThrow('BattleManager not initialized');
    });
  });

  describe('getMetrics', () => {
    beforeEach(() => {
      globalScope.Game_Battler = {
        prototype: {
          performAction: jest.fn(),
        },
      };
      measurer.injectActionTracking();
    });

    it('should return TtkMetrics value object', () => {
      // Arrange
      globalScope.BattleManager = { _turnCount: 12 };
      simulatePartyActions(48);

      // Act
      const metrics = measurer.getMetrics();

      // Assert
      expect(metrics).toBeInstanceOf(TtkMetrics);
      expect(metrics.turns).toBe(12);
      expect(metrics.actions).toBe(48);
    });

    it('should return metrics without requiring target', () => {
      // Arrange
      globalScope.BattleManager = { _turnCount: 5 };
      simulatePartyActions(20);

      // Act
      const metrics = measurer.getMetrics();

      // Assert
      expect(metrics.turns).toBe(5);
      expect(metrics.actions).toBe(20);
    });

    it('should handle zero values', () => {
      // Arrange
      globalScope.BattleManager = { _turnCount: 0 };
      simulatePartyActions(0);

      // Act
      const metrics = measurer.getMetrics();

      // Assert
      expect(metrics.turns).toBe(0);
      expect(metrics.actions).toBe(0);
    });

    it('should throw ValidationError if BattleManager not initialized', () => {
      // Arrange
      delete globalScope.BattleManager;

      // Act & Assert
      expect(() => measurer.getMetrics()).toThrow(ValidationError);
      expect(() => measurer.getMetrics()).toThrow('BattleManager not initialized');
    });
  });

  describe('reset', () => {
    beforeEach(() => {
      globalScope.Game_Battler = {
        prototype: {
          performAction: jest.fn(),
        },
      };
      measurer.injectActionTracking();
    });

    it('should reset action counter to 0', () => {
      // Arrange
      globalScope.BattleManager = { _turnCount: 1 };
      simulatePartyActions(10);

      // Verify counter is non-zero
      let metrics = measurer.getMetrics();
      expect(metrics.actions).toBe(10);

      // Act
      measurer.reset();

      // Assert
      metrics = measurer.getMetrics();
      expect(metrics.actions).toBe(0);
    });

    it('should allow reusing measurer after reset', () => {
      // Arrange
      globalScope.BattleManager = { _turnCount: 5 };
      simulatePartyActions(20);

      // Act - First battle
      let metrics = measurer.getMetrics();
      expect(metrics.actions).toBe(20);

      // Reset and simulate second battle
      measurer.reset();
      globalScope.BattleManager = { _turnCount: 3 };
      simulatePartyActions(12);

      // Assert - Second battle
      metrics = measurer.getMetrics();
      expect(metrics.turns).toBe(3);
      expect(metrics.actions).toBe(12);
    });
  });

  describe('cleanup', () => {
    it('should reset action counter', () => {
      // Arrange
      globalScope.Game_Battler = {
        prototype: {
          performAction: jest.fn(),
        },
      };
      measurer.injectActionTracking();
      globalScope.BattleManager = { _turnCount: 1 };
      simulatePartyActions(10);

      // Act
      measurer.cleanup();

      // Assert
      const metrics = measurer.getMetrics();
      expect(metrics.actions).toBe(0);
    });
  });

  describe('integration tests', () => {
    it('should measure complete battle flow correctly', () => {
      // Arrange
      globalScope.Game_Battler = {
        prototype: {
          performAction: jest.fn(),
        },
      };
      measurer.injectActionTracking();

      const mockActor1 = { isActor: () => true };
      const mockActor2 = { isActor: () => true };
      const mockEnemy = { isActor: () => false };

      const target = new TtkTarget(3, 8, 20); // 3T/8A ±20%

      // Act - Simulate 3 turn battle
      // Turn 1
      globalScope.Game_Battler.prototype.performAction.call(mockActor1, {});
      globalScope.Game_Battler.prototype.performAction.call(mockActor2, {});
      globalScope.Game_Battler.prototype.performAction.call(mockEnemy, {});

      // Turn 2
      globalScope.Game_Battler.prototype.performAction.call(mockActor1, {});
      globalScope.Game_Battler.prototype.performAction.call(mockActor2, {});
      globalScope.Game_Battler.prototype.performAction.call(mockEnemy, {});

      // Turn 3
      globalScope.Game_Battler.prototype.performAction.call(mockActor1, {});
      globalScope.Game_Battler.prototype.performAction.call(mockActor2, {});
      globalScope.Game_Battler.prototype.performAction.call(mockActor2, {});
      globalScope.Game_Battler.prototype.performAction.call(mockEnemy, {});

      globalScope.BattleManager = { _turnCount: 3 };

      const measurement = measurer.measureTtk(target);

      // Assert
      expect(measurement.ttkTurns).toBe(3);
      expect(measurement.ttkActions).toBe(7); // Only party actions
      expect(measurement.turnDeviation).toBe(0); // 3 - 3
      expect(measurement.actionDeviation).toBe(-1); // 7 - 8
      expect(measurement.passed).toBe(true); // Within ±20%
    });

    it('should handle multiple battles with reset between them', () => {
      // Arrange
      globalScope.Game_Battler = {
        prototype: {
          performAction: jest.fn(),
        },
      };
      measurer.injectActionTracking();

      const target1 = new TtkTarget(2, 4, 15);
      const target2 = new TtkTarget(5, 10, 15);

      // Battle 1
      globalScope.BattleManager = { _turnCount: 2 };
      simulatePartyActions(4);
      const measurement1 = measurer.measureTtk(target1);

      // Reset for Battle 2
      measurer.reset();

      // Battle 2
      globalScope.BattleManager = { _turnCount: 5 };
      simulatePartyActions(10);
      const measurement2 = measurer.measureTtk(target2);

      // Assert
      expect(measurement1.ttkTurns).toBe(2);
      expect(measurement1.ttkActions).toBe(4);
      expect(measurement1.passed).toBe(true);

      expect(measurement2.ttkTurns).toBe(5);
      expect(measurement2.ttkActions).toBe(10);
      expect(measurement2.passed).toBe(true);
    });
  });

  // Helper functions

  /**
   * Helper to simulate party actions by calling injected performAction
   */
  function simulatePartyActions(count: number): void {
    const mockActor = {
      isActor: () => true,
    };

    for (let i = 0; i < count; i++) {
      globalScope.Game_Battler.prototype.performAction.call(mockActor, {});
    }
  }

  /**
   * Helper to create mock BattleManager and get metrics
   */
  function createMockBattleManagerAndGetMetrics(turnCount: number): TtkMetrics {
    globalScope.BattleManager = { _turnCount: turnCount };
    return measurer.getMetrics();
  }
});
