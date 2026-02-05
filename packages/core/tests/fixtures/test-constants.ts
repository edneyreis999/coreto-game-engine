/**
 * Constantes reutilizáveis para testes
 *
 * Centraliza valores mágicos usados nos testes para melhorar
 * manutenibilidade e semântica.
 */
export const TEST_CONSTANTS = {
  /**
   * Seed padrão para RNG determinístico
   * Valor escolhido por ser fácil de lembrar e único
   */
  DEFAULT_SEED: 12345,

  /**
   * TTK esperado em turnos para testes básicos
   * Representa um combate de dificuldade média
   */
  DEFAULT_TTK_TURNS: 3,

  /**
   * TTK esperado em ações para testes básicos
   * Representa ~2.67 ações por turno (8/3)
   */
  DEFAULT_TTK_ACTIONS: 8,

  /**
   * Duração padrão de simulação em milissegundos
   * Representa um combate rápido (~1.25 segundos)
   */
  DEFAULT_DURATION_MS: 1250,

  /**
   * ID padrão de tropa para testes
   * Tropa 1 geralmente é a primeira do sistema
   */
  DEFAULT_TROOP_ID: 1,

  /**
   * Tolerância padrão para variações de TTK
   * 10% de margem (0.1 = 10%)
   */
  DEFAULT_TOLERANCE: 0.1,

  /**
   * Versão padrão para relatórios de teste
   */
  DEFAULT_REPORT_VERSION: '1.0.0',

  /**
   * Data/hora padrão para metadados de relatório
   */
  DEFAULT_REPORT_DATE: new Date('2024-01-01T00:00:00Z'),

  /**
   * Caminho de projeto padrão para testes
   */
  DEFAULT_PROJECT_PATH: '/path/to/project',
} as const;

/**
 * IDs de trechos comumente usados em testes
 */
export const TEST_TRECHO_IDS = {
  ATO1_NIVEL1_10: 'ato1-nivel1-10',
  ATO1_NIVEL11_20: 'ato1-nivel11-20',
  ATO2_NIVEL1_10: 'ato2-nivel1-10',
} as const;

/**
 * Nomes de trechos comumente usados em testes
 */
export const TEST_TRECHO_NAMES = {
  ATO1_NIVEL1_10: 'Ato 1 - Níveis 1-10',
  ATO1_NIVEL11_20: 'Ato 1 - Níveis 11-20',
  ATO2_NIVEL1_10: 'Ato 2 - Níveis 1-10',
} as const;

/**
 * Nomes de tropas comumente usados em testes
 */
export const TEST_TROOP_NAMES = {
  GOBLIN_PACK: 'Goblin Pack',
  TROOP_1: 'Troop 1',
  TROOP_2: 'Troop 2',
  TROOP_3: 'Troop 3',
} as const;
