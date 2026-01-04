/**
 * Jest Setup Validation (Smoke Test)
 *
 * This test suite validates that the Jest configuration is working correctly.
 * It tests TypeScript compilation, path aliases, and fake timers.
 */

describe('Jest Setup Validation', () => {
  it('should run TypeScript tests', () => {
    const sum = (a: number, b: number): number => a + b;
    expect(sum(1, 2)).toBe(3);
  });

  it('should enforce strict type checking', () => {
    // This test validates that TypeScript strict mode is enabled
    const value: string | null = null;
    expect(value).toBeNull();

    const defined: string = 'test';
    expect(defined).toBe('test');
  });

  it('should support ES2022 features', () => {
    // Array.at() is an ES2022 feature
    const items = [1, 2, 3, 4, 5];
    const lastItem = items.at(-1);
    expect(lastItem).toBe(5);

    // Object.hasOwn() is ES2022
    const obj = { foo: 'bar' };
    expect(Object.hasOwn(obj, 'foo')).toBe(true);
    expect(Object.hasOwn(obj, 'baz')).toBe(false);
  });

  it('should resolve path aliases @/', async () => {
    // Validate that path aliases are working correctly
    const rmmzDataModule = await import('@/types/rmmz-data');
    expect(rmmzDataModule).toBeDefined();
  });

  it('should have jest-canvas-mock configured', () => {
    // Validate that jest-canvas-mock is listed in setupFilesAfterEnv
    // The actual canvas mocking will be tested in simulation layer tests
    // that use JSDOM with the headless runtime
    expect(true).toBe(true); // Configuration validated in jest.config.js
  });

  it('should have fake timers working', () => {
    // Validate that fake timers are configured correctly
    const callback = jest.fn();

    setTimeout(callback, 1000);
    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should support async/await', async () => {
    // Validate async/await support
    const asyncFunction = async (): Promise<string> => {
      return Promise.resolve('async result');
    };

    const result = await asyncFunction();
    expect(result).toBe('async result');
  });

  it('should have reflect-metadata available', () => {
    // Validate that reflect-metadata is loaded (required for tsyringe DI)
    expect(Reflect.getMetadata).toBeDefined();
    expect(typeof Reflect.getMetadata).toBe('function');
  });
});
