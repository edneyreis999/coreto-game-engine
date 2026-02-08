/**
 * Test Constants for Core Package
 *
 * This file centralizes all magic numbers used in tests with documented business rules.
 * Constants are organized by domain/feature for easy navigation and maintenance.
 *
 * Usage:
 * ```ts
 * import { TEST_CONSTANTS, LEVEL_CONSTANTS, TTK_CONSTANTS } from '../constants/test-constants';
 * ```
 */

// ============================================================================
// LEVEL SYSTEM CONSTANTS
// ============================================================================

/**
 * Constants related to RPG Maker MZ level system (1-99)
 */
export const LEVEL_CONSTANTS = {
  /**
   * Minimum valid level in RPG Maker MZ
   * Business Rule: All actors and enemies must be at least level 1
   */
  MIN_LEVEL: 1,

  /**
   * Maximum valid level in RPG Maker MZ
   * Business Rule: No character can exceed level 99
   */
  MAX_LEVEL: 99,

  /**
   * Level 0 (invalid - used for testing validation)
   * Business Rule: Level 0 should always fail validation
   */
  INVALID_LEVEL_ZERO: 0,

  /**
   * Level 100 (invalid - used for testing validation)
   * Business Rule: Level 100 should always fail validation
   */
  INVALID_LEVEL_OVER_MAX: 100,

  /**
   * Sample low level for testing
   * Represents beginning game content
   */
  SAMPLE_LOW_LEVEL: 5,

  /**
   * Sample mid level for testing
   * Represents mid-game content
   */
  SAMPLE_MID_LEVEL: 50,

  /**
   * High level for testing range boundaries
   * Represents end-game content
   */
  SAMPLE_HIGH_LEVEL: 99,

  /**
   * Midpoint of full level range (1-99)
   * Used for testing range calculations
   */
  LEVEL_RANGE_MIDPOINT: 50,
} as const;

// ============================================================================
// TTK (TIME-TO-KILL) CONSTANTS
// ============================================================================

/**
 * Constants related to Time-To-Kill battle metrics
 */
export const TTK_CONSTANTS = {
  // === Target Values ===

  /**
   * Default target turns for basic tests
   * Business Rule: Represents a quick battle (~3 turns)
   */
  DEFAULT_TARGET_TURNS: 3,

  /**
   * Default target actions for basic tests
   * Business Rule: ~2.67 actions per turn (8/3), realistic for small party
   */
  DEFAULT_TARGET_ACTIONS: 8,

  /**
   * Sample target turns for medium battles
   * Business Rule: Represents an average-length battle
   */
  SAMPLE_TARGET_TURNS: 10,

  /**
   * Sample target actions for medium battles
   * Business Rule: ~4 actions per turn, typical for 4-member party
   */
  SAMPLE_TARGET_ACTIONS: 40,

  /**
   * Quick battle target turns
   * Business Rule: Very short battle, strong party vs weak enemies
   */
  QUICK_BATTLE_TURNS: 2,

  /**
   * Quick battle target actions
   * Business Rule: Minimal actions needed for victory
   */
  QUICK_BATTLE_ACTIONS: 4,

  /**
   * Long battle target turns
   * Business Rule: Extended battle, weak party or strong enemies
   */
  LONG_BATTLE_TURNS: 20,

  /**
   * Long battle target actions
   * Business Rule: Many actions due to difficulty
   */
  LONG_BATTLE_ACTIONS: 80,

  // === Tolerance Values ===

  /**
   * Default tolerance percentage (15%)
   * Business Rule: Standard margin for TTK validation
   * Allows for natural variance in battle outcomes
   */
  DEFAULT_TOLERANCE_PERCENT: 15,

  /**
   * Zero tolerance (exact match required)
   * Business Rule: Used when precise metrics are critical
   */
  ZERO_TOLERANCE: 0,

  /**
   * Small tolerance (10%)
   * Business Rule: Tight margin for critical battles
   */
  SMALL_TOLERANCE: 10,

  /**
   * Large tolerance (20%)
   * Business Rule: Permissive margin for variable battles
   */
  LARGE_TOLERANCE: 20,

  /**
   * Maximum tolerance (100%)
   * Business Rule: Extremely permissive, allows 0-2x target values
   */
  MAX_TOLERANCE: 100,

  // === Tolerance Fractions ===

  /**
   * Default tolerance as decimal (0.15 = 15%)
   * Business Rule: Used for fractional calculations
   */
  DEFAULT_TOLERANCE_FRACTION: 0.15,

  /**
   * Small tolerance as decimal (0.10 = 10%)
   */
  SMALL_TOLERANCE_FRACTION: 0.1,

  /**
   * Large tolerance as decimal (0.20 = 20%)
   */
  LARGE_TOLERANCE_FRACTION: 0.2,

  // === Deviation Values ===

  /**
   * Small positive deviation (20%)
   * Business Rule: Slightly exceeds target but acceptable
   */
  SMALL_POSITIVE_DEVIATION: 0.2,

  /**
   * Small negative deviation (-20%)
   * Business Rule: Slightly under target but acceptable
   */
  SMALL_NEGATIVE_DEVIATION: -0.2,

  /**
   * Large positive deviation (100%)
   * Business Rule: Doubles the target, usually indicates problem
   */
  LARGE_POSITIVE_DEVIATION: 1.0,

  /**
   * Maximum deviation percentage
   */
  MAX_DEVIATION_PERCENT: 100,

  // === Measurement Values ===

  /**
   * Default measured turns in tests
   * Slightly above target (10) to test tolerance
   */
  SAMPLE_MEASURED_TURNS: 12,

  /**
   * Default measured actions in tests
   * Slightly above target (40) to test tolerance
   */
  SAMPLE_MEASURED_ACTIONS: 48,

  /**
   * Below-target measured turns
   * Tests lower boundary of tolerance
   */
  BELOW_TARGET_TURNS: 8,

  /**
   * Below-target measured actions
   * Tests lower boundary of tolerance
   */
  BELOW_TARGET_ACTIONS: 32,

  /**
   * Above-target measured turns
   * Tests upper boundary of tolerance
   */
  ABOVE_TARGET_TURNS: 15,

  /**
   * Above-target measured actions
   * Tests upper boundary of tolerance
   */
  ABOVE_TARGET_ACTIONS: 60,

  // === Boundary Values ===

  /**
   * Zero turns/actions
   * Business Rule: Represents instant battle or failure to start
   */
  ZERO_METRIC: 0,

  /**
   * Minimum valid turns
   */
  MIN_VALID_TURNS: 1,

  /**
   * Minimum valid actions
   */
  MIN_VALID_ACTIONS: 1,

  /**
   * Single turn battle (fastest possible)
   */
  SINGLE_TURN: 1,
} as const;

// ============================================================================
// BATTLE SYSTEM CONSTANTS
// ============================================================================

/**
 * Constants related to battle mechanics and limits
 */
export const BATTLE_CONSTANTS = {
  // === Frame Limits ===

  /**
   * Maximum frames before battle timeout
   * Business Rule: Prevents infinite loops, ~10 seconds at 60fps
   */
  MAX_FRAMES: 10000,

  /**
   * Shorter timeout for quick tests
   * Business Rule: ~1.6 seconds at 60fps
   */
  SHORT_TIMEOUT_FRAMES: 100,

  /**
   * Medium timeout for testing
   * Business Rule: ~5 seconds at 60fps
   */
  MEDIUM_TIMEOUT_FRAMES: 50000,

  /**
   * Frames exceeding MAX_FRAMES (for timeout testing)
   */
  EXCESSIVE_FRAMES: 15000,

  /**
   * Frames far exceeding MAX_FRAMES
   */
  VERY_EXCESSIVE_FRAMES: 100000,

  // === Turn Limits ===

  /**
   * Maximum turns for battle simulation
   * Business Rule: Prevents excessively long battles
   */
  MAX_TURNS: 50,

  // === Action Tracking ===

  /**
   * Actions per typical party member
   * Business Rule: One action per turn per member
   */
  ACTIONS_PER_MEMBER: 1,

  /**
   * Actions for 2-member party
   */
  TWO_MEMBER_ACTIONS: 2,

  /**
   * Actions for 3-member party
   */
  THREE_MEMBER_ACTIONS: 3,

  /**
   * Actions for 4-member party
   */
  FOUR_MEMBER_ACTIONS: 4,

  // === Sample Values ===

  /**
   * Sample troop ID for tests
   */
  SAMPLE_TROOP_ID: 1,

  /**
   * Sample troop ID 2
   */
  SAMPLE_TROOP_ID_2: 2,

  /**
   * Sample troop ID 3
   */
  SAMPLE_TROOP_ID_3: 3,

  /**
   * Non-existent troop ID (for error testing)
   * Business Rule: 999 is conventionally used as invalid ID
   */
  INVALID_TROOP_ID: 999,
} as const;

// ============================================================================
// PARTY CONFIGURATION CONSTANTS
// ============================================================================

/**
 * Constants related to party composition
 */
export const PARTY_CONSTANTS = {
  /**
   * Minimum party size
   * Business Rule: At least 1 member required
   */
  MIN_MEMBERS: 1,

  /**
   * Typical party size (4 members)
   * Business Rule: Standard RPG Maker MZ party size
   */
  STANDARD_PARTY_SIZE: 4,

  /**
   * Large party size (for testing)
   */
  LARGE_PARTY_SIZE: 8,

  /**
   * Default class ID for tests
   */
  DEFAULT_CLASS_ID: 1,

  /**
   * Invalid class ID (0)
   * Business Rule: Class IDs must be >= 1
   */
  INVALID_CLASS_ID: 0,

  /**
   * Negative class ID (for error testing)
   */
  NEGATIVE_CLASS_ID: -1,

  /**
   * Sample class ID 2
   */
  SAMPLE_CLASS_ID_2: 2,

  /**
   * Sample class ID 3
   */
  SAMPLE_CLASS_ID_3: 3,

  /**
   * Sample class ID 5
   */
  SAMPLE_CLASS_ID_5: 5,
} as const;

// ============================================================================
// ENEMY/ACTOR CONSTANTS
// ============================================================================

/**
 * Constants related to enemy and actor statistics
 */
export const CHARACTER_CONSTANTS = {
  // === IDs ===

  /**
   * Default actor ID
   */
  DEFAULT_ACTOR_ID: 1,

  /**
   * Non-existent enemy ID (for error testing)
   * Business Rule: 999 is conventionally used as invalid ID
   */
  INVALID_ENEMY_ID: 999,

  /**
   * Non-existent skill ID (for error testing)
   */
  INVALID_SKILL_ID: 999,

  /**
   * Non-existent class ID (for error testing)
   */
  INVALID_CLASS_ID: 999,

  // === Stats ===

  /**
   * Basic Goblin stats
   * Format: [HP, MP, ATK, DEF, MAT, MDF, AGI, LUK]
   * Business Rule: Weak enemy for early game
   */
  BASIC_GOBLIN_STATS: [50, 0, 10, 5, 3, 3, 4, 4] as const,

  /**
   * High HP enemy stats
   * Business Rule: Tanky enemy, takes longer to kill
   */
  HIGH_HP_STATS: [100, 0, 10, 5, 3, 3, 4, 4] as const,

  /**
   * Enemy with MP only (no magical attack)
   * Business Rule: Has MP but can't use it
   */
  MP_ONLY_STATS: [50, 20, 10, 5, 0, 0, 4, 4] as const,

  /**
   * Experience points for defeating Goblin
   * Business Rule: Standard XP for early game enemy
   */
  GOBLIN_EXP: 10000,

  // === Stat Values ===

  /**
   * Sample HP value
   */
  SAMPLE_HP: 50,

  /**
   * Sample MP value
   */
  SAMPLE_MP: 20,

  /**
   * Sample attack stat
   */
  SAMPLE_ATK: 10,

  /**
   * Sample defense stat
   */
  SAMPLE_DEF: 5,

  /**
   * Sample magic attack stat
   */
  SAMPLE_MAT: 3,

  /**
   * Sample magic defense stat
   */
  SAMPLE_MDF: 3,

  /**
   * Sample agility stat
   */
  SAMPLE_AGI: 4,

  /**
   * Sample luck stat
   */
  SAMPLE_LUK: 4,

  /**
   * High HP value
   */
  HIGH_HP: 100,

  /**
   * Invalid HP (negative)
   */
  NEGATIVE_HP: -1,
} as const;

// ============================================================================
// RNG (RANDOM NUMBER GENERATOR) CONSTANTS
// ============================================================================

/**
 * Constants related to deterministic random number generation
 */
export const RNG_CONSTANTS = {
  /**
   * Default seed for deterministic tests
   * Business Rule: Easy to remember, provides consistent results
   */
  DEFAULT_SEED: 12345,

  /**
   * Custom seed for testing seed variations
   */
  CUSTOM_SEED: 99999,

  /**
   * LCG (Linear Congruential Generator) multiplier
   * Business Rule: Standard multiplier for LCG algorithm
   */
  LCG_MULTIPLIER: 1664525,

  /**
   * LCG increment
   * Business Rule: Standard increment for LCG algorithm
   */
  LCG_INCREMENT: 1013904223,

  /**
   * Modulo for 32-bit arithmetic
   * Business Rule: 2^32 for unsigned 32-bit integers
   */
  MODULO_32: 4294967296,
} as const;

// ============================================================================
// REPORTING CONSTANTS
// ============================================================================

/**
 * Constants related to report generation and metadata
 */
export const REPORT_CONSTANTS = {
  /**
   * Default report version
   */
  DEFAULT_VERSION: '1.0.0',

  /**
   * Default timestamp for reports
   */
  DEFAULT_DATE: new Date('2024-01-01T00:00:00Z'),

  /**
   * Large number of battle results (for stress testing)
   */
  LARGE_RESULT_COUNT: 1000,

  /**
   * Maximum report generation time (ms)
   * Business Rule: Should generate quickly even for large datasets
   */
  MAX_GENERATION_TIME_MS: 1000,

  // === Duration Values ===

  /**
   * Short battle duration (ms)
   */
  SHORT_DURATION_MS: 500,

  /**
   * Medium battle duration (ms)
   */
  MEDIUM_DURATION_MS: 1000,

  /**
   * Long battle duration (ms)
   */
  LONG_DURATION_MS: 3000,

  /**
   * Default battle duration (ms)
   */
  DEFAULT_DURATION_MS: 1250,
} as const;

// ============================================================================
// FILE SYSTEM CONSTANTS
// ============================================================================

/**
 * Constants related to file system operations
 */
export const FILESYSTEM_CONSTANTS = {
  /**
   * Default project path for tests
   */
  DEFAULT_PROJECT_PATH: '/path/to/project',

  /**
   * Database load timeout (ms)
   * Business Rule: Maximum time to wait for DB initialization
   */
  DB_LOAD_TIMEOUT_MS: 1000,

  /**
   * Test timeout for async operations (ms)
   */
  TEST_TIMEOUT_MS: 10000,
} as const;

// ============================================================================
// AUDIO CONSTANTS
// ============================================================================

/**
 * Constants related to audio system
 */
export const AUDIO_CONSTANTS = {
  /**
   * CD quality sample rate (44.1 kHz)
   * Business Rule: Standard for high-quality digital audio
   */
  CD_SAMPLE_RATE: 44100,

  /**
   * Sample rate in Hz
   */
  SAMPLE_RATE_HZ: 44100,
} as const;

// ============================================================================
// SKILL CONSTANTS
// ============================================================================

/**
 * Constants related to skill system
 */
export const SKILL_CONSTANTS = {
  /**
   * Guaranteed success rate (100%)
   * Business Rule: Skill always hits
   */
  GUARANTEED_SUCCESS_RATE: 100,

  /**
   * Default skill ID for tests
   */
  DEFAULT_SKILL_ID: 1,
} as const;

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

/**
 * Constants related to validation and error testing
 */
export const VALIDATION_CONSTANTS = {
  /**
   * Single member count (minimum)
   */
  SINGLE_MEMBER: 1,

  /**
   * Two members
   */
  TWO_MEMBERS: 2,

  /**
   * Three members
   */
  THREE_MEMBERS: 3,

  /**
   * Empty array length
   */
  EMPTY_COUNT: 0,

  /**
   * Array length 2
   */
  ARRAY_LENGTH_2: 2,

  /**
   * Array length 3
   */
  ARRAY_LENGTH_3: 3,

  /**
   * Array length 4
   */
  ARRAY_LENGTH_4: 4,
} as const;

// ============================================================================
// RANGE CONSTANTS
// ============================================================================

/**
 * Constants related to level ranges and intervals
 */
export const RANGE_CONSTANTS = {
  /**
   * Minimum range value (level 5)
   */
  RANGE_MIN: 5,

  /**
   * Maximum range value (level 10)
   */
  RANGE_MAX: 10,

  /**
   * Single level for range testing
   */
  SINGLE_LEVEL: 5,

  /**
   * Range midpoint (5-10 = 7.5, floored to 7)
   */
  RANGE_MIDPOINT: 7,

  /**
   * Odd range max (for midpoint calculation)
   */
  ODD_RANGE_MAX: 11,

  /**
   * Odd range midpoint (5-11 = 8)
   */
  ODD_RANGE_MIDPOINT: 8,

  /**
   * Small odd range max
   */
  SMALL_ODD_MAX: 9,

  /**
   * Full level range min
   */
  FULL_RANGE_MIN: 1,

  /**
   * Full level range max
   */
  FULL_RANGE_MAX: 99,
} as const;

// ============================================================================
// LEGACY CONSTANTS (for backward compatibility)
// ============================================================================

/**
 * @deprecated Use individual constant groups instead
 * Legacy TEST_CONSTANTS object for backward compatibility
 */
export const TEST_CONSTANTS = {
  DEFAULT_SEED: RNG_CONSTANTS.DEFAULT_SEED,
  DEFAULT_TTK_TURNS: TTK_CONSTANTS.DEFAULT_TARGET_TURNS,
  DEFAULT_TTK_ACTIONS: TTK_CONSTANTS.DEFAULT_TARGET_ACTIONS,
  DEFAULT_DURATION_MS: REPORT_CONSTANTS.DEFAULT_DURATION_MS,
  DEFAULT_TROOP_ID: BATTLE_CONSTANTS.SAMPLE_TROOP_ID,
  DEFAULT_TOLERANCE: TTK_CONSTANTS.DEFAULT_TOLERANCE_FRACTION,
  DEFAULT_REPORT_VERSION: REPORT_CONSTANTS.DEFAULT_VERSION,
  DEFAULT_REPORT_DATE: REPORT_CONSTANTS.DEFAULT_DATE,
  DEFAULT_PROJECT_PATH: FILESYSTEM_CONSTANTS.DEFAULT_PROJECT_PATH,
} as const;

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

/**
 * All constants organized by domain
 */
export const DOMAINS = {
  LEVEL: LEVEL_CONSTANTS,
  TTK: TTK_CONSTANTS,
  BATTLE: BATTLE_CONSTANTS,
  PARTY: PARTY_CONSTANTS,
  CHARACTER: CHARACTER_CONSTANTS,
  RNG: RNG_CONSTANTS,
  REPORT: REPORT_CONSTANTS,
  FILESYSTEM: FILESYSTEM_CONSTANTS,
  AUDIO: AUDIO_CONSTANTS,
  SKILL: SKILL_CONSTANTS,
  VALIDATION: VALIDATION_CONSTANTS,
  RANGE: RANGE_CONSTANTS,
} as const;
