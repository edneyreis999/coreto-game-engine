import { ConfigError, ConfigFileNotFoundError, ConfigParseError } from '@coreto/core';
import { DomainError } from '@coreto/core';

describe('ConfigError', () => {
  describe('constructor', () => {
    it('should create error with critical severity', () => {
      const error = new ConfigError('Configuration error');

      expect(error).toBeInstanceOf(DomainError);
      expect(error).toBeInstanceOf(ConfigError);
      expect(error.message).toBe('Configuration error');
      expect(error.severity).toBe('critical');
      expect(error.name).toBe('ConfigError');
    });

    it('should accept context data', () => {
      const context = { configPath: '/path/to/config.json' };
      const error = new ConfigError('Invalid configuration', context);

      expect(error.context).toEqual(context);
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON', () => {
      const error = new ConfigError('Config error', { file: 'config.json' });
      const json = error.toJSON();

      expect(json).toHaveProperty('name', 'ConfigError');
      expect(json).toHaveProperty('message', 'Config error');
      expect(json).toHaveProperty('severity', 'critical');
      expect(json.context).toEqual({ file: 'config.json' });
    });
  });
});

describe('ConfigFileNotFoundError', () => {
  describe('constructor', () => {
    it('should create error with config path in message', () => {
      const configPath = '/path/to/config.json';
      const error = new ConfigFileNotFoundError(configPath);

      expect(error).toBeInstanceOf(ConfigError);
      expect(error).toBeInstanceOf(ConfigFileNotFoundError);
      expect(error.message).toBe(`Configuration file not found: ${configPath}`);
      expect(error.severity).toBe('critical');
    });

    it('should include config path in context', () => {
      const configPath = '/path/to/config.json';
      const error = new ConfigFileNotFoundError(configPath);

      expect(error.context).toHaveProperty('configPath', configPath);
    });
  });

  describe('toJSON', () => {
    it('should serialize with config path', () => {
      const configPath = '/path/to/missing.json';
      const error = new ConfigFileNotFoundError(configPath);
      const json = error.toJSON();

      expect(json).toHaveProperty('name', 'ConfigFileNotFoundError');
      expect(json).toHaveProperty('message');
      expect((json.message as string).includes(configPath)).toBe(true);
      expect(json.context).toHaveProperty('configPath', configPath);
    });
  });

  describe('Error inheritance', () => {
    it('should be instanceof ConfigError', () => {
      const error = new ConfigFileNotFoundError('/path/to/config.json');

      expect(error instanceof ConfigError).toBe(true);
    });

    it('should be instanceof DomainError', () => {
      const error = new ConfigFileNotFoundError('/path/to/config.json');

      expect(error instanceof DomainError).toBe(true);
    });
  });
});

describe('ConfigParseError', () => {
  describe('constructor', () => {
    it('should create error with original error message', () => {
      const configPath = '/path/to/config.json';
      const originalError = new Error('Unexpected token } in JSON at position 42');
      const error = new ConfigParseError(configPath, originalError);

      expect(error).toBeInstanceOf(ConfigError);
      expect(error).toBeInstanceOf(ConfigParseError);
      expect(error.message).toBe(`Failed to parse configuration: ${originalError.message}`);
      expect(error.severity).toBe('critical');
    });

    it('should include config path and original error in context', () => {
      const configPath = '/path/to/config.json';
      const originalError = new Error('Invalid JSON');
      const error = new ConfigParseError(configPath, originalError);

      expect(error.context).toHaveProperty('configPath', configPath);
      expect(error.context).toHaveProperty('originalError', originalError.message);
    });
  });

  describe('toJSON', () => {
    it('should serialize with config path and original error', () => {
      const configPath = '/path/to/config.json';
      const originalError = new Error('Parse error');
      const error = new ConfigParseError(configPath, originalError);
      const json = error.toJSON();

      expect(json).toHaveProperty('name', 'ConfigParseError');
      expect(json).toHaveProperty('message');
      expect((json.message as string).includes('Parse error')).toBe(true);
      expect(json.context).toHaveProperty('configPath', configPath);
      expect(json.context).toHaveProperty('originalError', 'Parse error');
    });
  });

  describe('Error inheritance', () => {
    it('should be instanceof ConfigError', () => {
      const error = new ConfigParseError('/path/to/config.json', new Error('test'));

      expect(error instanceof ConfigError).toBe(true);
    });

    it('should be instanceof DomainError', () => {
      const error = new ConfigParseError('/path/to/config.json', new Error('test'));

      expect(error instanceof DomainError).toBe(true);
    });

    it('should be throwable', () => {
      expect(() => {
        throw new ConfigParseError('/path/to/config.json', new Error('test'));
      }).toThrow('Failed to parse configuration');
    });
  });
});
