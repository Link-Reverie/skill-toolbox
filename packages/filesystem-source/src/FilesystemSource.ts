import path from 'path';
import fs from 'fs-extra';
import type { SkillSource, SkillSourceMeta, DiscoveredSkill, FetchOptions } from '@skill-toolbox/utils';
import { findSkillFile } from '@skill-toolbox/utils';

export interface FilesystemSourceOptions {
  /** Base directory for relative paths */
  cwd?: string;
}

export class FilesystemSource implements SkillSource {
  private cwd: string;

  constructor(options?: FilesystemSourceOptions) {
    this.cwd = options?.cwd || process.cwd();
  }

  async canHandle(source: string): Promise<boolean> {
    // Check if it's an absolute path
    if (path.isAbsolute(source)) {
      return fs.pathExists(source);
    }

    // Check if it's a relative path that exists
    const absolutePath = path.resolve(this.cwd, source);
    return fs.pathExists(absolutePath);
  }

  async resolve(source: string): Promise<SkillSourceMeta> {
    const resolved = path.isAbsolute(source)
      ? source
      : path.resolve(this.cwd, source);

    if (!(await fs.pathExists(resolved))) {
      throw new Error(`Path does not exist: ${resolved}`);
    }

    const stat = await fs.stat(resolved);
    const isFile = stat.isFile();

    return {
      type: 'filesystem',
      source,
      resolved,
      multiSkill: !isFile, // Directories can contain multiple skills
    };
  }

  async fetch(meta: SkillSourceMeta, _options?: FetchOptions): Promise<string> {
    // For filesystem, just validate and return the resolved path
    // No actual fetching needed
    if (!(await fs.pathExists(meta.resolved))) {
      throw new Error(`Path does not exist: ${meta.resolved}`);
    }

    return meta.resolved;
  }

  async discover(localPath: string, meta: SkillSourceMeta): Promise<DiscoveredSkill[]> {
    const stat = await fs.stat(localPath);

    // If it's a file, check if it's a skill file
    if (stat.isFile()) {
      const fileName = path.basename(localPath);
      const skillFileNames = ['SKILL.md', 'skill.md'];

      if (skillFileNames.includes(fileName)) {
        const skillName = path.basename(path.dirname(localPath));
        return [{
          name: skillName,
          path: localPath,
          directory: path.dirname(localPath),
          source: meta,
        }];
      }

      return [];
    }

    // If it's a directory, check if it contains a skill file
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

    // Check for subdirectories that might contain skills
    const skills: DiscoveredSkill[] = [];
    let entries: fs.Dirent[];

    try {
      entries = await fs.readdir(localPath, { withFileTypes: true });
    } catch (error) {
      // If we can't read the directory (permissions, etc.), return skills discovered so far
      console.warn(`Warning: Could not read directory ${localPath}:`, error);
      return skills;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const skillDir = path.join(localPath, entry.name);
      const childSkillFile = await findSkillFile(skillDir);

      if (childSkillFile) {
        skills.push({
          name: entry.name,
          path: childSkillFile,
          directory: skillDir,
          source: meta,
        });
      }
    }

    return skills;
  }
}
