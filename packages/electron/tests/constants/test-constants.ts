/**
 * Test Constants for Electron Package
 *
 * This file centralizes all magic numbers used in Electron tests with documented business rules.
 * Constants are organized by domain/feature for easy navigation and maintenance.
 *
 * Usage:
 * ```ts
 * import { UI_CONSTANTS, DATABASE_CONSTANTS } from '../constants/test-constants';
 * ```
 */

// ============================================================================
// UI/UX CONSTANTS
// ============================================================================

/**
 * Constants related to user interface components and behavior
 */
export const UI_CONSTANTS = {
  // === Simulation Progress ===

  /**
   * Initial progress percentage
   * Business Rule: Simulation starts at 0% complete
   */
  INITIAL_PROGRESS: 0,

  /**
   * Completed progress percentage
   * Business Rule: Simulation finishes at 100% complete
   */
  COMPLETED_PROGRESS: 100,

  /**
   * Halfway progress percentage
   */
  HALFWAY_PROGRESS: 50,

  /**
   * Sample progress update
   */
  SAMPLE_PROGRESS: 25,

  /**
   * Small progress increment
   */
  SMALL_INCREMENT: 5,

  /**
   * Large progress increment
   */
  LARGE_INCREMENT: 20,

  // === Project Lists ===

  /**
   * Empty project list
   */
  EMPTY_PROJECT_COUNT: 0,

  /**
   * Single project in list
   */
  SINGLE_PROJECT: 1,

  /**
   * Two projects in list
   */
  TWO_PROJECTS: 2,

  /**
   * Three projects in list
   */
  THREE_PROJECTS: 3,

  /**
   * Five projects in list
   */
  FIVE_PROJECTS: 5,

  /**
   * Ten projects in list (for stress testing)
   */
  TEN_PROJECTS: 10,

  // === Configuration Panel ===

  /**
   * Minimum number of trechos
   */
  MIN_TRECHOS: 1,

  /**
   * Sample number of trechos
   */
  SAMPLE_TRECHO_COUNT: 2,

  /**
   * Maximum trecho name length
   */
  MAX_TRECHO_NAME_LENGTH: 100,

  /**
   * Minimum trecho name length
   */
  MIN_TRECHO_NAME_LENGTH: 1,
} as const;

// ============================================================================
// DATABASE CONSTANTS
// ============================================================================

/**
 * Constants related to database operations and storage
 */
export const DATABASE_CONSTANTS = {
  // === Recent Projects ===

  /**
   * Maximum number of recent projects to store
   * Business Rule: Limits list to prevent UI clutter
   */
  MAX_RECENT_PROJECTS: 10,

  /**
   * Small number of recent projects
   */
  SMALL_RECENT_COUNT: 3,

  /**
   * Sample number of recent projects
   */
  SAMPLE_RECENT_COUNT: 5,

  // === Simulation History ===

  /**
   * Maximum history records per project
   * Business Rule: Prevents unlimited database growth
   */
  MAX_HISTORY_PER_PROJECT: 100,

  /**
   * Sample history count
   */
  SAMPLE_HISTORY_COUNT: 5,

  /**
   * Large history count (for pagination testing)
   */
  LARGE_HISTORY_COUNT: 50,

  // === Database Operations ===

  /**
   * Query timeout in milliseconds
   */
  QUERY_TIMEOUT_MS: 1000,

  /**
   * Database operation timeout
   */
  DB_TIMEOUT_MS: 5000,

  /**
   * Batch operation size
   */
  BATCH_SIZE: 100,

  // === Record IDs ===

  /**
   * First record ID
   */
  FIRST_ID: 1,

  /**
   * Invalid record ID (for testing)
   */
  INVALID_ID: 999,

  /**
   * Non-existent record ID
   */
  NON_EXISTENT_ID: 9999,
} as const;

// ============================================================================
// IPC (INTER-PROCESS COMMUNICATION) CONSTANTS
// ============================================================================

/**
 * Constants related to IPC communication between main and renderer processes
 */
export const IPC_CONSTANTS = {
  /**
   * Default IPC timeout (ms)
   * Business Rule: Maximum time to wait for IPC response
   */
  DEFAULT_TIMEOUT: 5000,

  /**
   * Short timeout for quick operations
   */
  SHORT_TIMEOUT: 1000,

  /**
   * Long timeout for complex operations
   */
  LONG_TIMEOUT: 10000,

  /**
   * Channel name for simulation progress
   */
  PROGRESS_CHANNEL: 'simulation:progress',

  /**
   * Channel name for simulation completion
   */
  COMPLETE_CHANNEL: 'simulation:complete',

  /**
   * Channel name for simulation errors
   */
  ERROR_CHANNEL: 'simulation:error',
} as const;

// ============================================================================
// SIMULATION CONSTANTS
// ============================================================================

/**
 * Constants related to battle simulation in Electron context
 */
export const SIMULATION_CONSTANTS = {
  /**
   * Default TTK turns for Electron tests
   */
  DEFAULT_TURNS: 10,

  /**
   * Default TTK actions for Electron tests
   */
  DEFAULT_ACTIONS: 40,

  /**
   * Default tolerance percentage
   */
  DEFAULT_TOLERANCE: 15,

  /**
   * Sample seed for deterministic simulation
   */
  DEFAULT_SEED: 12345,

  /**
   * Sample troop ID
   */
  SAMPLE_TROOP_ID: 1,

  /**
   * Maximum concurrent simulations
   * Business Rule: Prevents system overload
   */
  MAX_CONCURRENT: 5,

  /**
   * Simulation completion percentage
   */
  COMPLETION_PERCENT: 100,

  /**
   * Halfway completion percentage
   */
  HALFWAY_PERCENT: 50,

  /**
   * Sample progress update
   */
  SAMPLE_PROGRESS: 25,

  // === Simulation Duration ===

  /**
   * Expected simulation time (ms)
   */
  EXPECTED_DURATION_MS: 1000,

  /**
   * Maximum allowed simulation time (ms)
   */
  MAX_DURATION_MS: 10000,

  /**
   * Quick simulation time (ms)
   */
  QUICK_DURATION_MS: 500,
} as const;

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

/**
 * Constants related to form and data validation in Electron
 */
export const VALIDATION_CONSTANTS = {
  /**
   * Maximum string length for text inputs
   */
  MAX_STRING_LENGTH: 255,

  /**
   * Minimum string length
   */
  MIN_STRING_LENGTH: 1,

  /**
   * Maximum description length
   */
  MAX_DESCRIPTION_LENGTH: 1000,

  /**
   * Maximum path length
   */
  MAX_PATH_LENGTH: 4096,

  /**
   * Default validation delay (ms)
   */
  VALIDATION_DELAY_MS: 300,

  /**
   * Debounce delay for search (ms)
   */
  SEARCH_DEBOUNCE_MS: 500,
} as const;

// ============================================================================
// PROJECT CONSTANTS
// ============================================================================

/**
 * Constants related to project management
 */
export const PROJECT_CONSTANTS = {
  /**
   * Sample project name
   */
  SAMPLE_NAME: 'Test Project',

  /**
   * Sample project path
   */
  SAMPLE_PATH: '/path/to/project',

  /**
   * Sample project path 2
   */
  SAMPLE_PATH_2: '/path/to/project2',

  /**
   * Invalid project path
   */
  INVALID_PATH: '/invalid/path',

  /**
   * Empty path
   */
  EMPTY_PATH: '',

  /**
   * Project name max length
   */
  MAX_NAME_LENGTH: 100,

  /**
   * Project name min length
   */
  MIN_NAME_LENGTH: 1,
} as const;

// ============================================================================
// TRECHO CONSTANTS
// ============================================================================

/**
 * Constants related to trecho (game section) configuration
 */
export const TRECHO_CONSTANTS = {
  /**
   * Sample trecho ID
   */
  SAMPLE_ID: 'ato1-nivel1-10',

  /**
   * Sample trecho name
   */
  SAMPLE_NAME: 'Ato 1 - Níveis 1-10',

  /**
   * Minimum anchor level
   */
  MIN_ANCHOR_LEVEL: 1,

  /**
   * Maximum anchor level
   */
  MAX_ANCHOR_LEVEL: 99,

  /**
   * Sample min anchor level
   */
  SAMPLE_MIN_LEVEL: 1,

  /**
   * Sample max anchor level
   */
  SAMPLE_MAX_LEVEL: 10,

  /**
   * Default TTK turns
   */
  DEFAULT_TURNS: 3,

  /**
   * Default TTK actions
   */
  DEFAULT_ACTIONS: 8,

  /**
   * Default tolerance percentage
   */
  DEFAULT_TOLERANCE: 15,

  /**
   * Single troop ID
   */
  SINGLE_TROOP: [1],

  /**
   * Multiple troop IDs
   */
  MULTIPLE_TROOPS: [1, 2, 3],
} as const;

// ============================================================================
// WINDOW/VIEW CONSTANTS
// ============================================================================

/**
 * Constants related to Electron window management
 */
export const WINDOW_CONSTANTS = {
  /**
   * Default window width
   */
  DEFAULT_WIDTH: 1200,

  /**
   * Default window height
   */
  DEFAULT_HEIGHT: 800,

  /**
   * Minimum window width
   */
  MIN_WIDTH: 800,

  /**
   * Minimum window height
   */
  MIN_HEIGHT: 600,

  /**
   * Window resize debounce (ms)
   */
  RESIZE_DEBOUNCE_MS: 200,
} as const;

// ============================================================================
// NOTIFICATION/TOAST CONSTANTS
// ============================================================================

/**
 * Constants related to user notifications and toasts
 */
export const NOTIFICATION_CONSTANTS = {
  /**
   * Default notification duration (ms)
   */
  DEFAULT_DURATION_MS: 3000,

  /**
   * Short notification duration (ms)
   */
  SHORT_DURATION_MS: 1500,

  /**
   * Long notification duration (ms)
   */
  LONG_DURATION_MS: 5000,

  /**
   * Maximum notifications visible at once
   */
  MAX_VISIBLE: 3,
} as const;

// ============================================================================
// THEME/STYLING CONSTANTS
// ============================================================================

/**
 * Constants related to UI theming
 */
export const THEME_CONSTANTS = {
  /**
   * Default font size
   */
  DEFAULT_FONT_SIZE: 14,

  /**
   * Large font size
   */
  LARGE_FONT_SIZE: 18,

  /**
   * Small font size
   */
  SMALL_FONT_SIZE: 12,

  /**
   * Default border radius
   */
  DEFAULT_BORDER_RADIUS: 4,

  /**
   * Large border radius
   */
  LARGE_BORDER_RADIUS: 8,

  /**
   * Default spacing unit
   */
  SPACING_UNIT: 8,
} as const;

// ============================================================================
// ARRAY/COLLECTION CONSTANTS
// ============================================================================

/**
 * Constants related to array and collection operations
 */
export const COLLECTION_CONSTANTS = {
  /**
   * Empty array length
   */
  EMPTY: 0,

  /**
   * Single item
   */
  SINGLE: 1,

  /**
   * Two items
   */
  TWO: 2,

  /**
   * Three items
   */
  THREE: 3,

  /**
   * Four items
   */
  FOUR: 4,

  /**
   * Five items
   */
  FIVE: 5,

  /**
   * Ten items
   */
  TEN: 10,

  /**
   * Twenty items
   */
  TWENTY: 20,

  /**
   * Fifty items
   */
  FIFTY: 50,

  /**
   * Hundred items
   */
  HUNDRED: 100,
} as const;

// ============================================================================
// INDEX/POSITION CONSTANTS
// ============================================================================

/**
 * Constants related to array indices and positions
 */
export const INDEX_CONSTANTS = {
  /**
   * First index
   */
  FIRST: 0,

  /**
   * Second index
   */
  SECOND: 1,

  /**
   * Third index
   */
  THIRD: 2,

  /**
   * Fourth index
   */
  FOURTH: 3,
} as const;

// ============================================================================
// PERCENTAGE CONSTANTS
// ============================================================================

/**
 * Common percentage values
 */
export const PERCENTAGE_CONSTANTS = {
  /**
   * Zero percent
   */
  ZERO: 0,

  /**
   * Ten percent
   */
  TEN: 10,

  /**
   * Fifteen percent
   */
  FIFTEEN: 15,

  /**
   * Twenty percent
   */
  TWENTY: 20,

  /**
   * Twenty-five percent
   */
  TWENTY_FIVE: 25,

  /**
   * Fifty percent
   */
  FIFTY: 50,

  /**
   * Seventy-five percent
   */
  SEVENTY_FIVE: 75,

  /**
   * Eighty percent
   */
  EIGHTY: 80,

  /**
   * Hundred percent
   */
  HUNDRED: 100,
} as const;

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

/**
 * All constants organized by domain
 */
export const DOMAINS = {
  UI: UI_CONSTANTS,
  DATABASE: DATABASE_CONSTANTS,
  IPC: IPC_CONSTANTS,
  SIMULATION: SIMULATION_CONSTANTS,
  VALIDATION: VALIDATION_CONSTANTS,
  PROJECT: PROJECT_CONSTANTS,
  TRECHO: TRECHO_CONSTANTS,
  WINDOW: WINDOW_CONSTANTS,
  NOTIFICATION: NOTIFICATION_CONSTANTS,
  THEME: THEME_CONSTANTS,
  COLLECTION: COLLECTION_CONSTANTS,
  INDEX: INDEX_CONSTANTS,
  PERCENTAGE: PERCENTAGE_CONSTANTS,
} as const;

/**
 * Legacy TEST_CONSTANTS for backward compatibility
 */
export const TEST_CONSTANTS = {
  DEFAULT_SEED: SIMULATION_CONSTANTS.DEFAULT_SEED,
  DEFAULT_TURNS: SIMULATION_CONSTANTS.DEFAULT_TURNS,
  DEFAULT_ACTIONS: SIMULATION_CONSTANTS.DEFAULT_ACTIONS,
  DEFAULT_TROOP_ID: SIMULATION_CONSTANTS.SAMPLE_TROOP_ID,
  DEFAULT_TOLERANCE: SIMULATION_CONSTANTS.DEFAULT_TOLERANCE,
} as const;
