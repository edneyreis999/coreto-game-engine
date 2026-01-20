/**
 * DeterministicRNG
 *
 * Implementa Linear Congruential Generator (LCG) para substituir Math.random
 * por uma função determinística baseada em seed.
 *
 * ADR-018: Determinism in Battle Simulation
 * - Todas as simulações com mesmo seed devem gerar sequências idênticas
 * - Override de Math.random deve ocorrer ANTES de carregar core scripts RMMZ
 * - Reset deve restaurar Math.random original
 *
 * Fórmula LCG (parâmetros otimizados para distribuição uniforme):
 * seed = (seed * 9301 + 49297) % 233280
 * return seed / 233280
 *
 * Fonte: Numerical Recipes (Press et al.)
 * Período: 233280 valores antes de repetir
 *
 * IMPORTANTE: Este override DEVE ser aplicado ANTES de carregar qualquer script RMMZ
 * que use Math.random internamente (BattleManager, Game_Action, etc.).
 */
export class DeterministicRNG {
  private static currentSeed: number = 0;
  private static originalRandom: (() => number) | null = null;

  // Constantes LCG (Numerical Recipes)
  private static readonly LCG_MULTIPLIER = 9301;
  private static readonly LCG_INCREMENT = 49297;
  private static readonly LCG_MODULUS = 233280;

  /**
   * Inicializa RNG determinístico com seed fornecido.
   *
   * Sobrescreve Math.random globalmente com implementação LCG.
   * Armazena Math.random original para permitir reset posterior.
   *
   * @param seed - Seed inicial (número inteiro positivo)
   * @throws {Error} Se seed for inválido (negativo, zero ou NaN)
   *
   * @example
   * DeterministicRNG.initialize(12345);
   * const value1 = Math.random(); // Determinístico
   * const value2 = Math.random(); // Determinístico
   * DeterministicRNG.reset();
   * const value3 = Math.random(); // Não-determinístico (original)
   */
  static initialize(seed: number): void {
    // Validação de seed
    if (!Number.isFinite(seed) || seed <= 0) {
      throw new Error(`Invalid seed: ${seed}. Seed must be a positive finite number.`);
    }

    // Armazena Math.random original APENAS na primeira inicialização
    if (this.originalRandom === null) {
      this.originalRandom = Math.random;
    }

    // Define seed inicial
    this.currentSeed = Math.floor(seed) % this.LCG_MODULUS;

    // Sobrescreve Math.random globalmente
    Math.random = (): number => {
      return this.next();
    };
  }

  /**
   * Gera próximo valor pseudo-aleatório da sequência LCG.
   *
   * Fórmula: seed = (seed * a + c) % m
   * - a = 9301 (multiplicador)
   * - c = 49297 (incremento)
   * - m = 233280 (módulo)
   *
   * @returns Número pseudo-aleatório entre 0 (inclusivo) e 1 (exclusivo)
   * @private
   */
  private static next(): number {
    this.currentSeed =
      (this.currentSeed * this.LCG_MULTIPLIER + this.LCG_INCREMENT) % this.LCG_MODULUS;
    return this.currentSeed / this.LCG_MODULUS;
  }

  /**
   * Reseta Math.random para implementação original do JavaScript.
   *
   * IMPORTANTE: Chame este método após finalizar simulações para restaurar
   * comportamento padrão do Math.random (útil em testes e cleanup).
   *
   * @example
   * DeterministicRNG.initialize(12345);
   * const deterministicValue = Math.random(); // LCG
   * DeterministicRNG.reset();
   * const randomValue = Math.random(); // Original
   */
  static reset(): void {
    if (this.originalRandom !== null) {
      Math.random = this.originalRandom;
      this.originalRandom = null;
    }
    this.currentSeed = 0;
  }

  /**
   * Retorna o seed atual (para debugging e validação).
   *
   * Útil para diagnóstico de reprodutibilidade:
   * - Verificar se seed está progredindo corretamente
   * - Identificar ponto exato de divergência entre execuções
   * - Validar estado interno do LCG em testes
   *
   * @returns Seed atual do gerador LCG
   *
   * @example
   * DeterministicRNG.initialize(12345);
   * Math.random(); // Gera valor
   * const currentSeed = DeterministicRNG.getSeed(); // Seed após 1 chamada
   */
  static getSeed(): number {
    return this.currentSeed;
  }

  /**
   * Verifica se RNG determinístico está ativo.
   *
   * @returns true se Math.random foi sobrescrito, false caso contrário
   *
   * @example
   * console.log(DeterministicRNG.isActive()); // false
   * DeterministicRNG.initialize(12345);
   * console.log(DeterministicRNG.isActive()); // true
   * DeterministicRNG.reset();
   * console.log(DeterministicRNG.isActive()); // false
   */
  static isActive(): boolean {
    return this.originalRandom !== null;
  }
}
