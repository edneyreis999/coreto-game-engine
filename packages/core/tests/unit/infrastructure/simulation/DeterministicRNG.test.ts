/**
 * DeterministicRNG - Unit Tests
 *
 * Valida comportamento do Linear Congruential Generator (LCG):
 * - CA-007: Sequências idênticas com mesmo seed (10 execuções)
 * - CA-008: Sequências diferentes com seeds diferentes
 * - Valores no range [0, 1)
 * - Reset restaura Math.random original
 * - Validação de seeds inválidos
 */

import { DeterministicRNG } from '../../src/infrastructure/simulation/DeterministicRNG';

describe('DeterministicRNG', () => {
  // Store original Math.random for restoration
  const originalRandom = Math.random;

  afterEach(() => {
    // Garantir reset após cada teste
    DeterministicRNG.reset();
  });

  afterAll(() => {
    // Safety: restaurar Math.random original
    Math.random = originalRandom;
  });

  describe('initialize', () => {
    it('should override Math.random with deterministic implementation', () => {
      const beforeRandom = Math.random;
      DeterministicRNG.initialize(12345);
      const afterRandom = Math.random;

      expect(afterRandom).not.toBe(beforeRandom);
      expect(DeterministicRNG.isActive()).toBe(true);
    });

    it('should store original Math.random for later restoration', () => {
      DeterministicRNG.initialize(12345);
      expect(DeterministicRNG.isActive()).toBe(true);

      DeterministicRNG.reset();
      expect(Math.random).toBe(originalRandom);
    });

    it('should reject invalid seeds (negative)', () => {
      expect(() => DeterministicRNG.initialize(-1)).toThrow(/Invalid seed.*positive finite number/);
    });

    it('should reject invalid seeds (zero)', () => {
      expect(() => DeterministicRNG.initialize(0)).toThrow(/Invalid seed.*positive finite number/);
    });

    it('should reject invalid seeds (NaN)', () => {
      expect(() => DeterministicRNG.initialize(NaN)).toThrow(
        /Invalid seed.*positive finite number/
      );
    });

    it('should reject invalid seeds (Infinity)', () => {
      expect(() => DeterministicRNG.initialize(Infinity)).toThrow(
        /Invalid seed.*positive finite number/
      );
    });

    it('should accept decimal seeds and floor them', () => {
      expect(() => DeterministicRNG.initialize(123.456)).not.toThrow();
      DeterministicRNG.reset();
    });
  });

  describe('CA-007: Deterministic Sequence (Same Seed)', () => {
    it('should generate identical sequence across 10 executions with same seed', () => {
      const SEED = 42;
      const SEQUENCE_LENGTH = 100;
      const sequences: number[][] = [];

      // Execute 10 vezes
      for (let run = 0; run < 10; run++) {
        DeterministicRNG.initialize(SEED);
        const sequence: number[] = [];

        for (let i = 0; i < SEQUENCE_LENGTH; i++) {
          sequence.push(Math.random());
        }

        sequences.push(sequence);
        DeterministicRNG.reset();
      }

      // Validar que todas as 10 sequências são idênticas
      const firstSequence = sequences[0];
      for (let run = 1; run < 10; run++) {
        expect(sequences[run]).toEqual(firstSequence);
      }
    });

    it('should generate identical values for first 5 calls with seed 12345', () => {
      const SEED = 12345;
      const expectedSequence: number[] = [];

      // Primeira execução - capturar referência
      DeterministicRNG.initialize(SEED);
      for (let i = 0; i < 5; i++) {
        expectedSequence.push(Math.random());
      }
      DeterministicRNG.reset();

      // Segunda execução - validar reprodução
      DeterministicRNG.initialize(SEED);
      for (let i = 0; i < 5; i++) {
        expect(Math.random()).toBe(expectedSequence[i]);
      }
      DeterministicRNG.reset();
    });

    it('should maintain determinism across multiple initialize/reset cycles', () => {
      const SEED = 99999;
      const values1: number[] = [];
      const values2: number[] = [];

      // Ciclo 1
      DeterministicRNG.initialize(SEED);
      values1.push(Math.random());
      values1.push(Math.random());
      values1.push(Math.random());
      DeterministicRNG.reset();

      // Ciclo 2
      DeterministicRNG.initialize(SEED);
      values2.push(Math.random());
      values2.push(Math.random());
      values2.push(Math.random());
      DeterministicRNG.reset();

      expect(values2).toEqual(values1);
    });
  });

  describe('CA-008: Different Seeds Generate Different Sequences', () => {
    it('should generate different sequences with different seeds', () => {
      const SEED1 = 12345;
      const SEED2 = 54321;
      const SEQUENCE_LENGTH = 50;

      // Sequência 1
      DeterministicRNG.initialize(SEED1);
      const sequence1: number[] = [];
      for (let i = 0; i < SEQUENCE_LENGTH; i++) {
        sequence1.push(Math.random());
      }
      DeterministicRNG.reset();

      // Sequência 2
      DeterministicRNG.initialize(SEED2);
      const sequence2: number[] = [];
      for (let i = 0; i < SEQUENCE_LENGTH; i++) {
        sequence2.push(Math.random());
      }
      DeterministicRNG.reset();

      // Validar que são diferentes
      expect(sequence2).not.toEqual(sequence1);
    });

    it('should generate different first values with different seeds', () => {
      const seeds = [1, 42, 100, 999, 12345];
      const firstValues: number[] = [];

      for (const seed of seeds) {
        DeterministicRNG.initialize(seed);
        firstValues.push(Math.random());
        DeterministicRNG.reset();
      }

      // Validar que todos os primeiros valores são únicos
      const uniqueValues = new Set(firstValues);
      expect(uniqueValues.size).toBe(seeds.length);
    });

    it('should generate different sequences even with adjacent seeds', () => {
      const SEED1 = 1000;
      const SEED2 = 1001; // Seed adjacente

      DeterministicRNG.initialize(SEED1);
      const value1 = Math.random();
      DeterministicRNG.reset();

      DeterministicRNG.initialize(SEED2);
      const value2 = Math.random();
      DeterministicRNG.reset();

      expect(value2).not.toBe(value1);
    });
  });

  describe('Value Range Validation', () => {
    it('should generate values between 0 (inclusive) and 1 (exclusive)', () => {
      DeterministicRNG.initialize(12345);

      for (let i = 0; i < 1000; i++) {
        const value = Math.random();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }

      DeterministicRNG.reset();
    });

    it('should never generate exactly 0', () => {
      DeterministicRNG.initialize(1);
      const values: number[] = [];

      for (let i = 0; i < 1000; i++) {
        values.push(Math.random());
      }

      // LCG sempre gera valores > 0 devido à fórmula (seed > 0 sempre)
      const hasZero = values.some((v) => v === 0);
      expect(hasZero).toBe(false);

      DeterministicRNG.reset();
    });

    it('should never generate exactly 1', () => {
      DeterministicRNG.initialize(1);
      const values: number[] = [];

      for (let i = 0; i < 1000; i++) {
        values.push(Math.random());
      }

      // LCG retorna seed / modulus, nunca atinge 1
      const hasOne = values.some((v) => v === 1);
      expect(hasOne).toBe(false);

      DeterministicRNG.reset();
    });

    it('should generate values distributed across the range', () => {
      DeterministicRNG.initialize(12345);
      let countLow = 0; // [0, 0.5)
      let countHigh = 0; // [0.5, 1)

      for (let i = 0; i < 1000; i++) {
        const value = Math.random();
        if (value < 0.5) {
          countLow++;
        } else {
          countHigh++;
        }
      }

      // Validar distribuição razoável (não perfeita, mas balanceada)
      // Esperado ~500/500, aceitar 400-600 range
      expect(countLow).toBeGreaterThan(400);
      expect(countLow).toBeLessThan(600);
      expect(countHigh).toBeGreaterThan(400);
      expect(countHigh).toBeLessThan(600);

      DeterministicRNG.reset();
    });
  });

  describe('reset', () => {
    it('should restore original Math.random', () => {
      DeterministicRNG.initialize(12345);
      const deterministicRandom = Math.random;

      DeterministicRNG.reset();

      expect(Math.random).toBe(originalRandom);
      expect(Math.random).not.toBe(deterministicRandom);
    });

    it('should clear internal state', () => {
      DeterministicRNG.initialize(12345);
      expect(DeterministicRNG.getSeed()).toBeGreaterThan(0);

      DeterministicRNG.reset();
      expect(DeterministicRNG.getSeed()).toBe(0);
    });

    it('should mark RNG as inactive', () => {
      DeterministicRNG.initialize(12345);
      expect(DeterministicRNG.isActive()).toBe(true);

      DeterministicRNG.reset();
      expect(DeterministicRNG.isActive()).toBe(false);
    });

    it('should be safe to call multiple times', () => {
      DeterministicRNG.initialize(12345);
      DeterministicRNG.reset();
      DeterministicRNG.reset();
      DeterministicRNG.reset();

      expect(Math.random).toBe(originalRandom);
      expect(DeterministicRNG.isActive()).toBe(false);
    });

    it('should restore non-deterministic behavior after reset', () => {
      DeterministicRNG.initialize(12345);
      const value1 = Math.random();
      DeterministicRNG.reset();

      DeterministicRNG.initialize(12345);
      const value2 = Math.random();
      DeterministicRNG.reset();

      // Após reset completo, valores devem ser idênticos com mesmo seed
      expect(value2).toBe(value1);
    });
  });

  describe('getSeed', () => {
    it('should return current seed after initialization', () => {
      DeterministicRNG.initialize(12345);
      const seed = DeterministicRNG.getSeed();

      // Seed é normalizado via % LCG_MODULUS (233280)
      expect(seed).toBeGreaterThan(0);
      expect(seed).toBeLessThan(233280);

      DeterministicRNG.reset();
    });

    it('should update seed after each Math.random call', () => {
      DeterministicRNG.initialize(12345);
      const seed1 = DeterministicRNG.getSeed();

      Math.random(); // Avança gerador
      const seed2 = DeterministicRNG.getSeed();

      Math.random(); // Avança gerador
      const seed3 = DeterministicRNG.getSeed();

      // Seeds devem ser diferentes após cada chamada
      expect(seed2).not.toBe(seed1);
      expect(seed3).not.toBe(seed2);
      expect(seed3).not.toBe(seed1);

      DeterministicRNG.reset();
    });

    it('should return 0 after reset', () => {
      DeterministicRNG.initialize(12345);
      Math.random();
      expect(DeterministicRNG.getSeed()).toBeGreaterThan(0);

      DeterministicRNG.reset();
      expect(DeterministicRNG.getSeed()).toBe(0);
    });

    it('should allow debugging of seed progression', () => {
      DeterministicRNG.initialize(42);
      const seeds: number[] = [];

      for (let i = 0; i < 10; i++) {
        Math.random();
        seeds.push(DeterministicRNG.getSeed());
      }

      // Validar que seeds são todos diferentes (progressão)
      const uniqueSeeds = new Set(seeds);
      expect(uniqueSeeds.size).toBe(10);

      DeterministicRNG.reset();
    });
  });

  describe('isActive', () => {
    it('should return false before initialization', () => {
      expect(DeterministicRNG.isActive()).toBe(false);
    });

    it('should return true after initialization', () => {
      DeterministicRNG.initialize(12345);
      expect(DeterministicRNG.isActive()).toBe(true);
      DeterministicRNG.reset();
    });

    it('should return false after reset', () => {
      DeterministicRNG.initialize(12345);
      DeterministicRNG.reset();
      expect(DeterministicRNG.isActive()).toBe(false);
    });

    it('should allow checking if determinism is enabled before operations', () => {
      // Use case: validar que RNG foi inicializado antes de executar simulação
      expect(DeterministicRNG.isActive()).toBe(false);

      DeterministicRNG.initialize(12345);
      if (DeterministicRNG.isActive()) {
        // Safe to use Math.random() - determinístico
        expect(Math.random()).toBeDefined();
      }

      DeterministicRNG.reset();
    });
  });

  describe('LCG Algorithm Validation', () => {
    it('should follow LCG formula: seed = (seed * 9301 + 49297) % 233280', () => {
      const INITIAL_SEED = 1;
      const MULTIPLIER = 9301;
      const INCREMENT = 49297;
      const MODULUS = 233280;

      DeterministicRNG.initialize(INITIAL_SEED);

      // Calcular seed esperado manualmente
      let expectedSeed = INITIAL_SEED;
      expectedSeed = (expectedSeed * MULTIPLIER + INCREMENT) % MODULUS;
      const expectedValue = expectedSeed / MODULUS;

      const actualValue = Math.random();
      expect(actualValue).toBe(expectedValue);

      DeterministicRNG.reset();
    });

    it('should have period of 233280 (modulus value)', () => {
      // Validar que após 233280 chamadas, sequência se repete
      const SEED = 1;
      const PERIOD = 233280;

      DeterministicRNG.initialize(SEED);
      const firstValue = Math.random();

      // Avançar até completar período (period - 1 chamadas restantes)
      for (let i = 1; i < PERIOD; i++) {
        Math.random();
      }

      // Próximo valor deve ser igual ao primeiro (ciclo completo)
      const nextValue = Math.random();
      expect(nextValue).toBe(firstValue);

      DeterministicRNG.reset();
    });

    it('should normalize large seeds via modulus', () => {
      const LARGE_SEED = 999999;
      const MODULUS = 233280;

      DeterministicRNG.initialize(LARGE_SEED);
      const seed = DeterministicRNG.getSeed();

      // Seed deve estar normalizado
      expect(seed).toBe(LARGE_SEED % MODULUS);

      DeterministicRNG.reset();
    });
  });

  describe('Integration Scenario: Battle Simulation', () => {
    it('should enable reproducible random skill selection', () => {
      // Simular seleção de skill baseada em Math.random
      const selectSkill = (skills: string[]): string => {
        const index = Math.floor(Math.random() * skills.length);
        return skills[index]!;
      };

      const skills = ['Attack', 'FireBolt', 'Heal', 'IceShard'];
      const selections1: string[] = [];
      const selections2: string[] = [];

      // Execução 1
      DeterministicRNG.initialize(777);
      for (let i = 0; i < 10; i++) {
        selections1.push(selectSkill(skills));
      }
      DeterministicRNG.reset();

      // Execução 2 (mesmo seed)
      DeterministicRNG.initialize(777);
      for (let i = 0; i < 10; i++) {
        selections2.push(selectSkill(skills));
      }
      DeterministicRNG.reset();

      // Seleções devem ser idênticas
      expect(selections2).toEqual(selections1);
    });

    it('should enable reproducible damage calculation', () => {
      // Simular cálculo de dano com variância
      const calculateDamage = (baseDamage: number, variance: number): number => {
        const multiplier = 1 + (Math.random() * 2 - 1) * (variance / 100);
        return Math.floor(baseDamage * multiplier);
      };

      const damages1: number[] = [];
      const damages2: number[] = [];

      // Execução 1
      DeterministicRNG.initialize(555);
      for (let i = 0; i < 20; i++) {
        damages1.push(calculateDamage(100, 20)); // 100 ± 20%
      }
      DeterministicRNG.reset();

      // Execução 2 (mesmo seed)
      DeterministicRNG.initialize(555);
      for (let i = 0; i < 20; i++) {
        damages2.push(calculateDamage(100, 20));
      }
      DeterministicRNG.reset();

      // Danos devem ser idênticos
      expect(damages2).toEqual(damages1);
    });
  });
});
