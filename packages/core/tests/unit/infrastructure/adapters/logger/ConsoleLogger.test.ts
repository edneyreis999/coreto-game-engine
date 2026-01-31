import { ConsoleLogger } from '@coreto/core/infrastructure/adapters/logger/ConsoleLogger.js';

describe('ConsoleLogger', () => {
  it('should log with and without meta for each level', () => {
    const logger = new ConsoleLogger();

    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {});

    logger.info('hello');
    logger.info('hello', { a: 1 });

    logger.warn('warn');
    logger.warn('warn', { b: 2 });

    logger.error('err');
    logger.error('err', { c: 3 });

    logger.debug('dbg');
    logger.debug('dbg', { d: 4 });

    expect(log).toHaveBeenCalledWith('[INFO] hello');
    expect(log).toHaveBeenCalledWith('[INFO] hello', { a: 1 });

    expect(warn).toHaveBeenCalledWith('[WARN] warn');
    expect(warn).toHaveBeenCalledWith('[WARN] warn', { b: 2 });

    expect(error).toHaveBeenCalledWith('[ERROR] err');
    expect(error).toHaveBeenCalledWith('[ERROR] err', { c: 3 });

    expect(debug).toHaveBeenCalledWith('[DEBUG] dbg');
    expect(debug).toHaveBeenCalledWith('[DEBUG] dbg', { d: 4 });

    log.mockRestore();
    warn.mockRestore();
    error.mockRestore();
    debug.mockRestore();
  });
});

