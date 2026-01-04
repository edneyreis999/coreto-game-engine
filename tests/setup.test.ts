/**
 * Setup validation test
 *
 * Validates that the TypeScript and Jest configuration is working correctly.
 */

describe('Setup Validation', () => {
  it('should execute TypeScript code successfully', () => {
    const message: string = 'Hello from TypeScript';
    expect(message).toBe('Hello from TypeScript');
  });

  it('should support strict null checks', () => {
    const maybeValue: string | null = null;
    expect(maybeValue).toBeNull();
  });

  it('should support ES2022 features', () => {
    const items = [1, 2, 3, 4, 5];
    const lastItem = items.at(-1);
    expect(lastItem).toBe(5);
  });

  it('should support async/await', async () => {
    const asyncFunction = async (): Promise<string> => {
      return Promise.resolve('async result');
    };

    const result = await asyncFunction();
    expect(result).toBe('async result');
  });
});
