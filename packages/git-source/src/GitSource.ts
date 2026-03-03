import path from 'path';
import os from 'os';
import { execa } from 'execa';
import fs from 'fs-extra';
import type { SkillSource, SkillSourceMeta, DiscoveredSkill, FetchOptions } from '@skill-toolbox/utils';
import { GitSourceError, findSkillFile } from '@skill-toolbox/utils';
import type { GitResolvedSource, GitSourceOptions } from './types';

export class GitSource implements SkillSource {
  private timeout: number;
  private shallow: boolean;
  private defaultSkillPath: string;
  private defaultCacheDir: string;
  private tempDirs = new Set<string>();

  constructor(options?: GitSourceOptions) {
    this.timeout = options?.timeout || 60000;
    this.shallow = options?.shallow ?? true;
    this.defaultSkillPath = options?.defaultSkillPath || 'skills';
    this.defaultCacheDir = options?.defaultCacheDir ||
      path.join(os.tmpdir(), 'skill-toolbox');
  }

  async canHandle(source: string): Promise<boolean> {
    try {
      // Check if it's a GitHub shorthand (user/repo or user/repo:path)
      if (/^[\w-]+\/[\w-]+(:[\w\/-]+)?$/.test(source)) {
        return true;
      }

      // Check if it's a github: prefixed source
      if (source.startsWith('github:')) {
        return true;
      }

      // Check if it's a git URL
      if (source.includes('github.com') || source.endsWith('.git')) {
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  async resolve(source: string): Promise<SkillSourceMeta> {
    const resolved = await this.parseGitSource(source);

    return {
      type: 'git',
      source,
      resolved: resolved.url,
      multiSkill: true,
      skillPath: resolved.skillPath,
      cachedPath: resolved.cached,
    };
  }

  async fetch(meta: SkillSourceMeta, options?: FetchOptions): Promise<string> {
    const resolved = await this.parseGitSource(meta.source);

    // If cacheDir provided, clone there (user controls caching)
    // Otherwise clone to default cache dir or temp and track for cleanup
    const cacheBase = options?.cacheDir || this.defaultCacheDir;
    const targetDir = path.join(cacheBase, `${resolved.repo.owner}-${resolved.repo.name}`);

    if (!options?.cacheDir) {
      this.tempDirs.add(targetDir);
    }

    // Check if already cloned
    if (await fs.pathExists(targetDir)) {
      if (options?.force) {
        await fs.remove(targetDir);
      } else {
        return targetDir;
      }
    }

    // Clone the repository
    await this.clone(resolved.url, targetDir, { branch: resolved.repo.branch });
    return targetDir;
  }

  async discover(localPath: string, meta: SkillSourceMeta): Promise<DiscoveredSkill[]> {
    const skillPath = meta.skillPath || this.defaultSkillPath;

    // Security: Validate skillPath to prevent directory traversal
    if (skillPath.includes('..')) {
      throw new GitSourceError('Invalid skill path: path traversal not allowed', meta.source);
    }

    // Security: Reject absolute paths
    if (path.isAbsolute(skillPath)) {
      throw new GitSourceError('Invalid skill path: absolute paths not allowed', meta.source);
    }

    const skillsDir = path.join(localPath, skillPath);
    const resolved = path.resolve(localPath, skillsDir);

    // Security: Ensure resolved path doesn't escape repository root
    if (!resolved.startsWith(path.resolve(localPath))) {
      throw new GitSourceError('Invalid skill path: escapes repository root', meta.source);
    }

    // Check if skills directory exists
    if (!(await fs.pathExists(skillsDir))) {
      // Check if the repo itself is a skill (single skill repo)
      const skillFile = await findSkillFile(localPath);
      if (skillFile) {
        const skillName = path.basename(localPath);
        return [{
          name: skillName,
          path: skillFile,
          directory: localPath,
          source: meta,
        }];
      }

      return [];
    }

    // Discover multiple skills in the skills directory
    const skills: DiscoveredSkill[] = [];
    const entries = await fs.readdir(skillsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const skillDir = path.join(skillsDir, entry.name);
      const skillFile = await findSkillFile(skillDir);

      if (skillFile) {
        skills.push({
          name: entry.name,
          path: skillFile,
          directory: skillDir,
          source: meta,
        });
      }
    }

    return skills;
  }

  async cleanup(localPath: string, _meta?: SkillSourceMeta): Promise<void> {
    // Remove only the specific temp directory
    if (this.tempDirs.has(localPath)) {
      if (await fs.pathExists(localPath)) {
        await fs.remove(localPath);
      }
      this.tempDirs.delete(localPath);
    }
  }

  /**
   * Parse git source string
   * Supports formats:
   * - user/repo
   * - user/repo:path
   * - github:user/repo
   * - https://github.com/user/repo.git
   */
  private async parseGitSource(source: string): Promise<GitResolvedSource> {
    // github:user/repo format
    if (source.startsWith('github:')) {
      const parts = source.slice(7).split('/');
      if (parts.length < 2) {
        throw new GitSourceError('Invalid GitHub format', source);
      }
      const [owner, nameWithRef] = parts;
      const [name, skillPath] = nameWithRef.split(':');

      return {
        url: `https://github.com/${owner}/${name}.git`,
        repo: { owner, name },
        skillPath: skillPath || this.defaultSkillPath,
      };
    }

    // user/repo or user/repo:path format
    if (/^[\w-]+\/[\w-]+(:[\w\/-]+)?$/.test(source)) {
      const [repoPart, skillPath] = source.split(':');
      const [owner, name] = repoPart.split('/');

      return {
        url: `https://github.com/${owner}/${name}.git`,
        repo: { owner, name },
        skillPath: skillPath || this.defaultSkillPath,
      };
    }

    // Full URL format
    const urlMatch = source.match(/github\.com[\/:]([\w-]+)\/([\w-]+)/);
    if (urlMatch) {
      return {
        url: source,
        repo: { owner: urlMatch[1], name: urlMatch[2] },
        skillPath: this.defaultSkillPath,
      };
    }

    throw new GitSourceError(`Invalid source format: ${source}`, source);
  }

  /**
   * Clone git repository
   */
  private async clone(
    url: string,
    targetDir: string,
    options?: { branch?: string }
  ): Promise<string> {
    const args = ['clone'];
    if (this.shallow) args.push('--depth', '1');
    if (options?.branch) args.push('--branch', options.branch);
    args.push(url, targetDir);

    await execa('git', args, { timeout: this.timeout, stdio: 'pipe' });
    return targetDir;
  }
}
