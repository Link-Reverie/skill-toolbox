import path from 'path';
import fs from 'fs-extra';
import type { SkillSource, SourceInfo, SourceLoadResult, SourceCategory, LoadedSourceInfo } from '@skill-toolbox/utils';
import { findSkillFile } from '@skill-toolbox/utils';

export interface FilesystemSourceOptions {
  /** Path to the skills directory or file */
  path: string;
  /** Display name for this source (used in skill names) */
  name?: string;
  /** Category override (defaults to 'global' if name is 'global', else 'local') */
  category?: SourceCategory;
}

export class FilesystemSource implements SkillSource {
  private targetPath: string;
  private name: string;
  private category: SourceCategory;

  constructor(options: FilesystemSourceOptions) {
    this.targetPath = options.path;

    // Generate name for skill names
    if (options.name) {
      this.name = options.name;
    } else {
      // Use directory name or 'local' for absolute paths
      const resolved = path.resolve(options.path);
      const dirName = path.basename(resolved);
      this.name = dirName || 'local';
    }

    // Determine category
    if (options.category) {
      this.category = options.category;
    } else {
      this.category = this.name === 'global' ? 'global' : 'local';
    }
  }

  getSourceInfo(): SourceInfo {
    return {
      type: 'filesystem',
      category: this.category,
      identifier: this.name,
    };
  }

  async load(): Promise<SourceLoadResult> {
    // Initialize info with default path (will be updated after resolution)
    const info: LoadedSourceInfo = {
      type: 'filesystem',
      category: this.category,
      identifier: this.name,
      path: '', // Will be set below
    };

    const result: SourceLoadResult = {
      skills: [],
      errors: [],
      info,
    };

    try {
      // Resolve to absolute path
      const resolvedPath = path.resolve(this.targetPath);

      // Update info with resolved path
      result.info.path = resolvedPath;

      // Check if path exists
      if (!(await fs.pathExists(resolvedPath))) {
        result.errors.push({
          path: this.targetPath,
          error: new Error(`Path does not exist: ${this.targetPath}`),
        });
        return result;
      }

      const stat = await fs.stat(resolvedPath);
      const isFile = stat.isFile();

      if (isFile) {
        // Single skill file
        await this.loadSingleFile(resolvedPath, result);
      } else {
        // Directory with multiple skills
        await this.loadDirectory(resolvedPath, result);
      }
    } catch (error) {
      result.errors.push({
        path: this.targetPath,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }

    return result;
  }

  async cleanup(): Promise<void> {
    // Nothing to cleanup for filesystem sources
  }

  /**
   * Load a single skill file
   */
  private async loadSingleFile(filePath: string, result: SourceLoadResult): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const dir = path.dirname(filePath);
      const baseName = path.basename(dir);

      result.skills.push({
        name: `${this.name}/${baseName}`,
        baseName,
        source: this.name,
        path: filePath,
        directory: dir,
        content,
      });
    } catch (error) {
      result.errors.push({
        path: filePath,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  /**
   * Load all skills from a directory
   */
  private async loadDirectory(dirPath: string, result: SourceLoadResult): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        // Skip hidden files/directories
        if (entry.name.startsWith('.')) continue;

        const entryPath = path.join(dirPath, entry.name);

        if (entry.isFile() && this.isSkillFileName(entry.name)) {
          // Skill file in root directory
          await this.loadSingleFile(entryPath, result);
        } else if (entry.isDirectory()) {
          // Check if directory contains a skill file
          const skillFile = await findSkillFile(entryPath);
          if (skillFile) {
            try {
              const content = await fs.readFile(skillFile, 'utf-8');
              result.skills.push({
                name: `${this.name}/${entry.name}`,
                baseName: entry.name,
                source: this.name,
                path: skillFile,
                directory: entryPath,
                content,
              });
            } catch (error) {
              result.errors.push({
                path: skillFile,
                error: error instanceof Error ? error : new Error(String(error)),
              });
            }
          }
        }
      }
    } catch (error) {
      result.errors.push({
        path: dirPath,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  /**
   * Check if filename is a valid skill file name
   */
  private isSkillFileName(name: string): boolean {
    const lower = name.toLowerCase();
    return lower === 'skill.md' || lower === 'readme.md';
  }
}
