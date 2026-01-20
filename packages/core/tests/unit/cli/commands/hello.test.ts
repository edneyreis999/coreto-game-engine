import { describe, it, expect } from '@jest/globals';

describe('HelloCommand', () => {
  it('should print greeting and status lines', async () => {
    const { default: HelloCommand } = await import('@/cli/commands/hello.js');

    const cmd: any = Object.create(HelloCommand.prototype);
    cmd.parse = async () => ({ flags: { name: 'Coreto' } });
    cmd.log = jest.fn();

    await cmd.run();

    expect(cmd.log).toHaveBeenCalledWith('Hello Coreto!');
    expect(cmd.log).toHaveBeenCalledWith('Coreto Game Engine - TTK Validation System');
    expect(cmd.log).toHaveBeenCalledWith('Oclif configuration successful!');
  });
});

