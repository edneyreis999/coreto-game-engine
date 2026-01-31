import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { NodeFileSystem } from '@coreto/core/infrastructure/adapters/filesystem/NodeFileSystem.js';
import { ConfigError } from '@coreto/core/core/errors/ConfigError.js';

describe('NodeFileSystem', () => {
  it('should read/write files using Node fs', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nfs-'));
    const file = path.join(tmp, 'x.txt');
    const nfs = new NodeFileSystem();

    expect(nfs.exists(file)).toBe(false);
    nfs.writeFileSync(file, 'ok');
    expect(nfs.exists(file)).toBe(true);
    expect(nfs.readFileSync(file)).toBe('ok');

    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('should convert invalid project path validation into ConfigError', () => {
    const nfs = new NodeFileSystem();
    expect(() => nfs.validateProjectPath('/path/that/does/not/exist')).toThrow(ConfigError);
  });
});

