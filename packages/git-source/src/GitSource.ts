import path from 'path';
import os from 'os';
import { execa } from 'execa';
import fs from 'fs-extra';
import type { ResolvedSource, GitSourceOptions } from './types';
import { GitSourceError } from '@skill-toolbox/utils';

export class GitSource {
  private cacheDir: string;
  private timeout: number;
  private shallow: boolean;

  constructor(options?: GitSourceOptions) {
    this.cacheDir = options?.cacheDir || path.join(os.homedir(), '.skill-toolbox', 'cache');
    this.timeout = options?.timeout || 60000;
    this.shallow = options?.shallow ?? true;
  }

  async resolve(source: string): Promise<ResolvedSource> {
    if (source.startsWith('github:')) {
      const parts = source.slice(7).split('/');
      if (parts.length !== 2) throw new GitSourceError('Invalid GitHub format', source);
      const [owner, name] = parts;
      return { url: `https://github.com/${owner}/${name}.git`, repo: { owner, name } };
    }

    if (/^[\w-]+\/[\w-]+$/.test(source)) {
      const [owner, name] = source.split('/');
      return { url: `https://github.com/${owner}/${name}.git`, repo: { owner, name } };
    }

    const urlMatch = source.match(/github\.com[\/:]([\w-]+)\/([\w-]+)/);
    if (urlMatch) {
      return { url: source, repo: { owner: urlMatch[1], name: urlMatch[2] } };
    }

    throw new GitSourceError(`Invalid source format: ${source}`, source);
  }

  async clone(url: string, options?: { branch?: string }): Promise<string> {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'skill-'));
    const args = ['clone'];
    if (this.shallow) args.push('--depth', '1');
    if (options?.branch) args.push('--branch', options.branch);
    args.push(url, tempDir);

    await execa('git', args, { timeout: this.timeout, stdio: 'pipe' });
    return tempDir;
  }
}
