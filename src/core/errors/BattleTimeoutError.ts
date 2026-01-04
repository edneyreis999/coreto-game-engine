import { DomainError } from './DomainError.js';

/**
 * Error thrown when a battle exceeds the maximum allowed frame count.
 *
 * This indicates a potential infinite loop or extremely long battle that
 * should be investigated. The timeout prevents the simulation from hanging.
 *
 * @example
 * ```typescript
 * if (frameCount >= MAX_FRAMES) {
 *   throw new BattleTimeoutError(troopId, frameCount, MAX_FRAMES);
 * }
 * ```
 */
export class BattleTimeoutError extends DomainError {
  /**
   * Creates a new BattleTimeoutError.
   *
   * @param troopId - The troop ID of the battle that timed out
   * @param frames - The number of frames executed before timeout
   * @param maxFrames - The maximum allowed frames
   */
  constructor(troopId: number, frames: number, maxFrames: number) {
    super(`Battle timeout: exceeded ${maxFrames} frames`, 'critical', {
      troopId,
      frames,
      maxFrames,
    });
  }
}
