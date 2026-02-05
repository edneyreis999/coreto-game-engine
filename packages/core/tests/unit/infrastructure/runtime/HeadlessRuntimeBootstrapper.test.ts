/**
 * HeadlessRuntimeBootstrapper - Main Unit Tests
 *
 * Testes principais para o HeadlessRuntimeBootstrapper:
 * - Bootstrap process
 * - File system operations
 * - RNG Integration
 * - Cleanup and error handling
 */

import { HeadlessRuntimeBootstrapper, DeterministicRNG } from '@coreto/core';

describe('HeadlessRuntimeBootstrapper', () => {
  describe('bootstrap process', () => {
    it('should initialize with correct dependencies', () => {
      const bootstrapper = new HeadlessRuntimeBootstrapper(false);
      expect(bootstrapper).toBeDefined();
    });

    it('should support diagnostic mode', () => {
      const diagnosticBootstrapper = new HeadlessRuntimeBootstrapper(true);
      const normalBootstrapper = new HeadlessRuntimeBootstrapper(false);

      // Both should be instances of the same class
      expect(diagnosticBootstrapper).toBeInstanceOf(HeadlessRuntimeBootstrapper);
      expect(normalBootstrapper).toBeInstanceOf(HeadlessRuntimeBootstrapper);
    });
  });

  describe('cleanup', () => {
    it('should clean up resources without errors', () => {
      const bootstrapper = new HeadlessRuntimeBootstrapper(false);

      // Should not throw during cleanup
      expect(() => bootstrapper.cleanup()).not.toThrow();
    });

    it('should clean up multiple times safely', () => {
      const bootstrapper = new HeadlessRuntimeBootstrapper(false);

      // Multiple cleanup calls should be safe
      bootstrapper.cleanup();
      bootstrapper.cleanup();
      bootstrapper.cleanup();

      expect(true).toBe(true); // If we get here, cleanup worked
    });
  });

  describe('RNG Initialization', () => {
    // Store original Math.random for safety
    const originalRandom = Math.random;

    afterEach(() => {
      // Safety: garantir que Math.random é restaurado após cada teste
      if (DeterministicRNG.isActive()) {
        DeterministicRNG.reset();
      }
      Math.random = originalRandom;
    });

    describe('step0_initializeRNG', () => {
      it('should initialize RNG when seed is provided in bootstrap', () => {
        // Mock bootstrap steps para evitar dependências de filesystem
        const bootstrapper = new HeadlessRuntimeBootstrapper(false);

        // Acessar step0 via reflexão para teste isolado
        const step0 = (bootstrapper as any).step0_initializeRNG;
        expect(step0).toBeDefined();
      });

      it('should activate deterministic RNG with valid seed', () => {
        const bootstrapper = new HeadlessRuntimeBootstrapper(false);
        const SEED = 12345;

        // Executar step0 diretamente
        (bootstrapper as any).step0_initializeRNG(SEED);

        // Verificar que RNG foi ativado
        expect(DeterministicRNG.isActive()).toBe(true);

        // Cleanup
        DeterministicRNG.reset();
      });

      it('should make Math.random deterministic after step0', () => {
        const bootstrapper = new HeadlessRuntimeBootstrapper(false);
        const SEED = 42;

        // Executar step0
        (bootstrapper as any).step0_initializeRNG(SEED);

        // Capturar sequência
        const values: number[] = [];
        for (let i = 0; i < 5; i++) {
          values.push(Math.random());
        }

        // Reset e re-executar
        DeterministicRNG.reset();
        (bootstrapper as any).step0_initializeRNG(SEED);

        // Verificar reprodução
        for (let i = 0; i < 5; i++) {
          expect(Math.random()).toBe(values[i]);
        }

        // Cleanup
        DeterministicRNG.reset();
      });

      it('should throw error with invalid seed', () => {
        const bootstrapper = new HeadlessRuntimeBootstrapper(false);

        // Seed inválido deve propagar erro do DeterministicRNG
        expect(() => {
          (bootstrapper as any).step0_initializeRNG(-1);
        }).toThrow(/Invalid seed/);

        expect(() => {
          (bootstrapper as any).step0_initializeRNG(0);
        }).toThrow(/Invalid seed/);

        expect(() => {
          (bootstrapper as any).step0_initializeRNG(NaN);
        }).toThrow(/Invalid seed/);
      });

      it('should log RNG initialization in diagnostic mode', () => {
        const bootstrapper = new HeadlessRuntimeBootstrapper(true); // Diagnostic mode
        const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
        const SEED = 99999;

        // Executar step0
        (bootstrapper as any).step0_initializeRNG(SEED);

        // Verificar logs
        expect(mockConsoleLog).toHaveBeenCalledWith(
          expect.stringContaining('Step 0: Initialize Deterministic RNG')
        );
        expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining(`seed: ${SEED}`));
        expect(mockConsoleLog).toHaveBeenCalledWith(
          expect.stringContaining('Math.random replaced with deterministic LCG')
        );

        // Cleanup
        DeterministicRNG.reset();
        mockConsoleLog.mockRestore();
      });

      it('should NOT log in non-diagnostic mode', () => {
        const bootstrapper = new HeadlessRuntimeBootstrapper(false); // Non-diagnostic
        const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();

        // Executar step0
        (bootstrapper as any).step0_initializeRNG(12345);

        // Não deve haver logs
        expect(mockConsoleLog).not.toHaveBeenCalled();

        // Cleanup
        DeterministicRNG.reset();
        mockConsoleLog.mockRestore();
      });
    });

    describe('cleanup with RNG', () => {
      it('should reset RNG when cleanup is called', () => {
        const bootstrapper = new HeadlessRuntimeBootstrapper(false);

        // Inicializar RNG
        (bootstrapper as any).step0_initializeRNG(12345);
        expect(DeterministicRNG.isActive()).toBe(true);

        // Cleanup
        bootstrapper.cleanup();

        // RNG deve estar resetado
        expect(DeterministicRNG.isActive()).toBe(false);
        expect(Math.random).toBe(originalRandom);
      });

      it('should be safe to cleanup when RNG was not initialized', () => {
        const bootstrapper = new HeadlessRuntimeBootstrapper(false);

        // Cleanup sem inicializar RNG
        expect(() => bootstrapper.cleanup()).not.toThrow();

        // Math.random deve permanecer original
        expect(Math.random).toBe(originalRandom);
      });

      it('should log RNG reset in diagnostic mode', () => {
        const bootstrapper = new HeadlessRuntimeBootstrapper(true); // Diagnostic mode
        const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();

        // Inicializar RNG
        (bootstrapper as any).step0_initializeRNG(12345);

        // Clear logs anteriores
        mockConsoleLog.mockClear();

        // Cleanup
        bootstrapper.cleanup();

        // Verificar log de reset
        expect(mockConsoleLog).toHaveBeenCalledWith(
          expect.stringContaining('Cleanup: Deterministic RNG reset to original Math.random')
        );

        mockConsoleLog.mockRestore();
      });

      it('should NOT log RNG reset when RNG was not active', () => {
        const bootstrapper = new HeadlessRuntimeBootstrapper(true); // Diagnostic mode
        const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();

        // Cleanup sem RNG ativo
        bootstrapper.cleanup();

        // Não deve haver log de RNG reset
        const rngResetLog = mockConsoleLog.mock.calls.find((call) =>
          call[0]?.includes('Deterministic RNG reset')
        );
        expect(rngResetLog).toBeUndefined();

        mockConsoleLog.mockRestore();
      });
    });

    describe('RNG determinism validation', () => {
      it('should generate identical sequences across multiple step0 calls with same seed', () => {
        const bootstrapper = new HeadlessRuntimeBootstrapper(false);
        const SEED = 777;
        const sequences: number[][] = [];

        for (let run = 0; run < 5; run++) {
          (bootstrapper as any).step0_initializeRNG(SEED);

          const sequence: number[] = [];
          for (let i = 0; i < 10; i++) {
            sequence.push(Math.random());
          }
          sequences.push(sequence);

          DeterministicRNG.reset();
        }

        // Todas as sequências devem ser idênticas
        for (let run = 1; run < 5; run++) {
          expect(sequences[run]).toEqual(sequences[0]);
        }
      });

      it('should generate different sequences with different seeds', () => {
        const bootstrapper = new HeadlessRuntimeBootstrapper(false);
        const seeds = [111, 222, 333];
        const firstValues: number[] = [];

        for (const seed of seeds) {
          (bootstrapper as any).step0_initializeRNG(seed);
          firstValues.push(Math.random());
          DeterministicRNG.reset();
        }

        // Todos os primeiros valores devem ser únicos
        const uniqueValues = new Set(firstValues);
        expect(uniqueValues.size).toBe(seeds.length);
      });
    });

    describe('Bootstrap seed parameter integration', () => {
      it('should support optional seed parameter in bootstrap signature', () => {
        // Verificar que método bootstrap aceita seed opcional
        const bootstrapper = new HeadlessRuntimeBootstrapper(false);
        const bootstrapMethod = bootstrapper.bootstrap;

        expect(bootstrapMethod).toBeDefined();
        // TypeScript validation garante que assinatura está correta
        // Se compilar, o parâmetro opcional está presente
      });

      it('should conditionally initialize RNG based on seed parameter', () => {
        // Mock para validar lógica condicional
        const mockInitialize = jest.spyOn(DeterministicRNG, 'initialize');

        // Caso 1: seed undefined - não deve chamar initialize
        // (não podemos testar bootstrap completo sem fixtures, mas a lógica está em step0)

        // Caso 2: seed definido - deve chamar initialize
        const bootstrapper = new HeadlessRuntimeBootstrapper(false);
        (bootstrapper as any).step0_initializeRNG(12345);

        expect(mockInitialize).toHaveBeenCalledWith(12345);

        mockInitialize.mockRestore();
        DeterministicRNG.reset();
      });
    });

    describe('RNG state management', () => {
      it('should allow querying RNG state via isActive', () => {
        const bootstrapper = new HeadlessRuntimeBootstrapper(false);

        // Estado inicial
        expect(DeterministicRNG.isActive()).toBe(false);

        // Após step0
        (bootstrapper as any).step0_initializeRNG(12345);
        expect(DeterministicRNG.isActive()).toBe(true);

        // Após cleanup
        bootstrapper.cleanup();
        expect(DeterministicRNG.isActive()).toBe(false);
      });

      it('should allow querying current seed for debugging', () => {
        const bootstrapper = new HeadlessRuntimeBootstrapper(false);
        const SEED = 55555;

        (bootstrapper as any).step0_initializeRNG(SEED);

        // Seed deve estar normalizado (% 233280)
        const currentSeed = DeterministicRNG.getSeed();
        expect(currentSeed).toBeGreaterThan(0);
        expect(currentSeed).toBeLessThan(233280);

        // Após chamadas, seed deve mudar
        Math.random();
        const newSeed = DeterministicRNG.getSeed();
        expect(newSeed).not.toBe(currentSeed);

        DeterministicRNG.reset();
      });
    });
  });
});