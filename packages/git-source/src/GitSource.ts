import path from 'path';
import os from 'os';
import { execa } from 'execa';
import fs from 'fs-extra';
import type { SkillSource, SourceInfo, SourceLoadResult, LoadOptions } from '@skill-toolbox/utils';
import { findSkillFile } from '@skill-toolbox/utils';

export interface GitSourceOptions extends LoadOptions {
  /** Git repository source (e.g., 'user/repo' or 'https://github.com/user/repo.git') */
  source: string;
  /** Skill path within repository (e.g., 'skills', 'docs/skills', '' for root) */
  skillPath?: string;
  /** Display name for this source (shown in prompt, defaults to cache dir path) */
  name?: string;
}

export class GitSource implements SkillSource {
  private source: string;
  private skillPath: string;
  private cacheDir?: string;
  private timeout: number;
  private shallow: boolean;
  private localPath?: string;
  private tempDirs = new Set<string>();
  private displayName?: string;
  private category: 'git';

  constructor(options: GitSourceOptions) {
    this.source = options.source;
    this.skillPath = options.skillPath !== undefined ? options.skillPath : 'skills';
    this.cacheDir = options.cacheDir;
    this.timeout = options.timeout || 60000;
    this.shallow = options.shallow !== false;
    this.displayName = options.name;
    this.category = 'git';  // Git sources always have 'git' category
  }

  getSourceInfo(): SourceInfo {
    const info: SourceInfo = {
      type: 'git',
      category: this.category,
      identifier: this.displayName || this.source,
    };

    // Add path if repository has been cloned
    if (this.localPath) {
      info.path = this.localPath;
    }

    return info;
  }

  async load(options?: LoadOptions): Promise<SourceLoadResult> {
    const result: SourceLoadResult = {
      skills: [],
      errors: [],
    };

    const cacheDir = options?.cacheDir || this.cacheDir;
    const timeout = options?.timeout || this.timeout;
    const shallow = options?.shallow !== undefined ? options.shallow : this.shallow;

    try {
      // 1. Resolve repository URL
      const url = await this.resolveUrl();

      // 2. Clone repository
      this.localPath = await this.clone(url, { cacheDir, timeout, shallow });

      // Generate display name if not set
      if (!this.displayName) {
        // Shorten the path for display
        this.displayName = this.localPath;
      }

      // 3. Discover skill directories
      const skillDirs = await this.discoverSkillDirs();

      // 4. Load all SKILL.md files
      for (const dir of skillDirs) {
        const skillFile = await findSkillFile(path.join(this.localPath, dir));

        if (!skillFile) {
          result.errors.push({
            path: dir,
            error: new Error(`No SKILL.md or README.md found in ${dir}`),
          });
          continue;
        }

        try {
          const content = await fs.readFile(skillFile, 'utf-8');
          result.skills.push({
            name: `${this.displayName}/${dir}`,
            baseName: dir,
            path: skillFile,
            directory: path.dirname(skillFile),
            content,
          });
        } catch (error) {
          result.errors.push({
            path: skillFile,
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      }

      // Track for cleanup if not using cache
      if (!cacheDir) {
        this.tempDirs.add(this.localPath);
      }
    } catch (error) {
      result.errors.push({
        path: this.source,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }

    return result;
  }

  async cleanup(): Promise<void> {
    if (this.localPath && this.tempDirs.has(this.localPath)) {
      try {
        await fs.remove(this.localPath);
        this.tempDirs.delete(this.localPath);
      } catch (error) {
        console.warn(`Failed to cleanup ${this.localPath}:`, error);
      }
    }
  }

  /**
   * Resolve source string to Git URL
   */
  private async resolveUrl(): Promise<string> {
    const source = this.source;

    // github:user/repo format
    if (source.startsWith('github:')) {
      const parts = source.slice(7).split('/');
      if (parts.length < 2) {
        throw new Error(`Invalid GitHub format: ${source}`);
      }
      const [owner, name] = parts;
      return `https://github.com/${owner}/${name}.git`;
    }

    // user/repo or user/repo:path format
    if (/^[\w-]+\/[\w-]+(:[\w\/-]*)?$/.test(source)) {
      const [repoPart] = source.split(':');
      const [owner, name] = repoPart.split('/');
      return `https://github.com/${owner}/${name}.git`;
    }

    // Already a URL
    if (source.includes('github.com') || source.endsWith('.git')) {
      return source;
    }

    throw new Error(`Invalid Git source format: ${source}`);
  }

  /**
   * Clone repository to local directory
   */
  private async clone(
    url: string,
    options: { cacheDir?: string; timeout?: number; shallow?: boolean }
  ): Promise<string> {
    const { cacheDir, timeout = this.timeout, shallow = this.shallow } = options;

    // Generate cache directory name
    const repoName = url.replace(/[^a-zA-Z0-9]/g, '-');
    const targetDir = cacheDir
      ? path.join(cacheDir, repoName)
      : path.join(os.tmpdir(), 'skill-toolbox', repoName);

    // Check if already cached
    if (cacheDir && await fs.pathExists(targetDir)) {
      return targetDir;
    }

    // Clone repository
    const args = ['clone'];
    if (shallow) args.push('--depth', '1');
    args.push(url, targetDir);

    try {
      await execa('git', args, {
        timeout,
        stdio: 'pipe',
      });
    } catch (error) {
      throw new Error(`Failed to clone ${url}: ${error}`);
    }

    return targetDir;
  }

  /**
   * Discover skill directories
   */
  private async discoverSkillDirs(): Promise<string[]> {
    if (!this.localPath) {
      throw new Error('Repository not cloned');
    }

    // If skillPath is empty, search root directory
    if (!this.skillPath || this.skillPath === '') {
      const entries = await fs.readdir(this.localPath, { withFileTypes: true });
      const dirs: string[] = [];

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (entry.name.startsWith('.')) continue;

        const skillFile = await findSkillFile(path.join(this.localPath, entry.name));
        if (skillFile) {
          dirs.push(entry.name);
        }
      }

      return dirs;
    }

    // Search in specified skillPath
    const skillsDir = path.join(this.localPath, this.skillPath);

    // Security: Ensure path doesn't escape repository
    const resolved = path.resolve(this.localPath, this.skillPath);
    if (!resolved.startsWith(this.localPath)) {
      throw new Error(`Invalid skill path: escapes repository root`);
    }

    // Check if directory exists
    if (!(await fs.pathExists(skillsDir))) {
      // Check if root is a single skill
      const rootSkill = await findSkillFile(this.localPath);
      if (rootSkill) {
        return [path.basename(this.localPath)];
      }
      return [];
    }

    // List subdirectories
    const entries = await fs.readdir(skillsDir, { withFileTypes: true });
    const dirs: string[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const skillFile = await findSkillFile(path.join(skillsDir, entry.name));
      if (skillFile) {
        dirs.push(entry.name);
      }
    }

    return dirs;
  }
}
