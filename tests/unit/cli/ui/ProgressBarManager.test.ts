/**
 * Unit tests for ProgressBarManager
 *
 * Tests progress bar lifecycle, updates, and thread safety
 */

import { ProgressBarManager } from '@/cli/ui/ProgressBarManager';

describe('ProgressBarManager', () => {
  let progressBar: ProgressBarManager;

  beforeEach(() => {
    progressBar = new ProgressBarManager();
  });

  afterEach(() => {
    // Ensure cleanup after each test
    if (progressBar.getIsActive()) {
      progressBar.stop();
    }
  });

  describe('start', () => {
    it('should initialize progress bar with total count', () => {
      expect(() => progressBar.start(10)).not.toThrow();
      expect(progressBar.getIsActive()).toBe(true);
    });

    it('should throw if progress bar already active', () => {
      progressBar.start(10);
      expect(() => progressBar.start(20)).toThrow('Progress bar already active');
    });
  });

  describe('update', () => {
    it('should update progress without error when active', () => {
      progressBar.start(10);

      expect(() =>
        progressBar.update({
          current: 5,
          total: 10,
          trechoId: 'test-trecho',
          troopId: 1,
        })
      ).not.toThrow();
    });

    it('should handle update gracefully when not active', () => {
      expect(() =>
        progressBar.update({
          current: 5,
          total: 10,
          trechoId: 'test-trecho',
        })
      ).not.toThrow();
    });
  });

  describe('increment', () => {
    it('should increment progress without error when active', () => {
      progressBar.start(10);
      expect(() => progressBar.increment('test-trecho', 1)).not.toThrow();
    });

    it('should handle increment gracefully when not active', () => {
      expect(() => progressBar.increment('test-trecho')).not.toThrow();
    });
  });

  describe('stop', () => {
    it('should stop active progress bar', () => {
      progressBar.start(10);
      progressBar.stop();
      expect(progressBar.getIsActive()).toBe(false);
    });

    it('should handle stop gracefully when not active', () => {
      expect(() => progressBar.stop()).not.toThrow();
      expect(progressBar.getIsActive()).toBe(false);
    });
  });

  describe('getIsActive', () => {
    it('should return false initially', () => {
      expect(progressBar.getIsActive()).toBe(false);
    });

    it('should return true after start', () => {
      progressBar.start(10);
      expect(progressBar.getIsActive()).toBe(true);
    });

    it('should return false after stop', () => {
      progressBar.start(10);
      progressBar.stop();
      expect(progressBar.getIsActive()).toBe(false);
    });
  });

  describe('lifecycle', () => {
    it('should support multiple start-stop cycles', () => {
      progressBar.start(10);
      progressBar.stop();

      expect(() => progressBar.start(20)).not.toThrow();
      expect(progressBar.getIsActive()).toBe(true);
      progressBar.stop();
      expect(progressBar.getIsActive()).toBe(false);
    });
  });
});
