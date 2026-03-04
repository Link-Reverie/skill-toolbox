import { mkdir, readFile, writeFile, stat } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { createHash } from 'crypto';
import type { SkillSource, SourceInfo, SourceLoadResult, LoadedSkill } from '@skill-toolbox/utils';
import type { HttpSourceOptions, RemoteSkillIndex } from './types';

/**
 * HTTP Source - Discover and fetch skills from remote URLs
 *
 * @example
 * ```typescript
 * const httpSource = new HttpSource({
 *   url: 'https://example.com/.well-known/skills/'
 * });
 *
 * const { skills } = await httpSource.load();
 * ```
 */
export class HttpSource implements SkillSource {
  private options: Required<Omit<HttpSourceOptions, 'cacheDir'>> & { cacheDir: string };
  private cachePath: string;

  constructor(options: HttpSourceOptions) {
    this.options = {
      url: options.url.endsWith('/') ? options.url : `${options.url}/`,
      cacheDir: options.cacheDir ?? join(homedir(), '.cache', 'skill-toolbox', 'http'),
      timeout: options.timeout ?? 30000,
      forceRefresh: options.forceRefresh ?? false,
    };

    // Use URL hash as cache directory name
    const urlHash = createHash('md5').update(options.url).digest('hex').slice(0, 8);
    this.cachePath = join(this.options.cacheDir, urlHash);
  }

  getSourceInfo(): SourceInfo {
    const url = new URL(this.options.url);
    return {
      type: 'git', // Mark as git to distinguish from other remote sources
      category: 'git',
      identifier: `http:${url.hostname}`,
    };
  }

  async load(): Promise<SourceLoadResult> {
    const skills: LoadedSkill[] = [];
    const errors: SourceLoadResult['errors'] = [];

    try {
      // 1. Get or refresh cache
      await this.ensureCache();

      // 2. Load skills from cache
      const index = await this.loadIndex();
      if (!index?.skills) {
        return { skills, errors, info: { ...this.getSourceInfo(), path: this.cachePath } };
      }

      // 3. Load each skill
      for (const skillInfo of index.skills) {
        try {
          const skillFile = join(this.cachePath, skillInfo.name, 'SKILL.md');
          const content = await readFile(skillFile, 'utf-8');

          skills.push({
            name: `${this.getSourceInfo().identifier}/${skillInfo.name}`,
            baseName: skillInfo.name,
            source: this.getSourceInfo().identifier,
            path: skillFile,
            directory: join(this.cachePath, skillInfo.name),
            content,
          });
        } catch (error) {
          errors.push({
            path: skillInfo.name,
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      }
    } catch (error) {
      errors.push({
        path: this.options.url,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }

    return {
      skills,
      errors,
      info: { ...this.getSourceInfo(), path: this.cachePath },
    };
  }

  private async ensureCache(): Promise<void> {
    const indexFile = join(this.cachePath, 'index.json');
    const needsRefresh = this.options.forceRefresh || !(await this.fileExists(indexFile));

    if (needsRefresh) {
      await this.refreshCache();
    }
  }

  private async refreshCache(): Promise<void> {
    // 1. Fetch index.json
    const indexUrl = new URL('index.json', this.options.url).href;
    const response = await fetch(indexUrl, {
      signal: AbortSignal.timeout(this.options.timeout),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch index: ${response.status}`);
    }

    const index: RemoteSkillIndex = await response.json();

    // 2. Create cache directory
    await mkdir(this.cachePath, { recursive: true });

    // 3. Download each skill's files
    for (const skill of index.skills) {
      const skillDir = join(this.cachePath, skill.name);
      await mkdir(skillDir, { recursive: true });

      for (const file of skill.files) {
        const fileUrl = new URL(`${skill.name}/${file}`, this.options.url).href;
        const filePath = join(skillDir, file);

        try {
          const fileResponse = await fetch(fileUrl, {
            signal: AbortSignal.timeout(this.options.timeout),
          });

          if (fileResponse.ok) {
            const content = await fileResponse.text();
            await writeFile(filePath, content, 'utf-8');
          }
        } catch {
          // Ignore individual file download failures
        }
      }
    }

    // 4. Save index.json
    await writeFile(join(this.cachePath, 'index.json'), JSON.stringify(index, null, 2));
  }

  private async loadIndex(): Promise<RemoteSkillIndex | null> {
    try {
      const content = await readFile(join(this.cachePath, 'index.json'), 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await stat(path);
      return true;
    } catch {
      return false;
    }
  }

  async cleanup(): Promise<void> {
    // Keep cache, don't cleanup
  }
}

export type { RemoteSkillIndex, HttpSourceOptions } from './types';
