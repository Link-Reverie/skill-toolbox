import path from 'path';
import os from 'os';
import type { ResolvedSource, GitSourceOptions } from './types';
import { GitSourceError } from '@skill-toolbox/utils';

export class GitSource {
  private readonly cacheDir: string;
  private readonly timeout: number;
  private readonly shallow: boolean;

  constructor(options?: GitSourceOptions) {
    this.cacheDir = options?.cacheDir || path.join(os.homedir(), '.skill-toolbox', 'cache');
    this.timeout = options?.timeout || 60000;
    this.shallow = options?.shallow ?? true;
  }

  /**
   * Get cache directory path (used by clone method)
   */
  getCacheDir(): string {
    return this.cacheDir;
  }

  /**
   * Get timeout value (used by clone method)
   */
  getTimeout(): number {
    return this.timeout;
  }

  /**
   * Check if shallow clone is enabled (used by clone method)
   */
  isShallow(): boolean {
    return this.shallow;
  }

  /**
   * Resolve source string to Git URL
   * Supports formats:
   * - github:user/repo
   * - user/repo (defaults to GitHub)
   * - https://github.com/user/repo.git
   * - git@github.com:user/repo.git
   */
  async resolve(source: string): Promise<ResolvedSource> {
    // 1. GitHub shorthand: github:user/repo
    if (source.startsWith('github:')) {
      const parts = source.slice(7).split('/');
      if (parts.length !== 2) {
        throw new GitSourceError('Invalid GitHub format', source);
      }
      const [owner, name] = parts;
      return {
        url: `https://github.com/${owner}/${name}.git`,
        repo: { owner, name }
      };
    }

    // 2. user/repo format (default to GitHub)
    if (/^[\w-]+\/[\w-]+$/.test(source)) {
      const [owner, name] = source.split('/');
      return {
        url: `https://github.com/${owner}/${name}.git`,
        repo: { owner, name }
      };
    }

    // 3. Full Git URL
    const urlMatch = source.match(/github\.com[\/:]([\w-]+)\/([\w-]+)/);
    if (urlMatch) {
      return {
        url: source,
        repo: { owner: urlMatch[1], name: urlMatch[2] }
      };
    }

    throw new GitSourceError(`Invalid source format: ${source}`, source);
  }
}
