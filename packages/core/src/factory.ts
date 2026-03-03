import type { SkillSource, SourceCategory } from '@skill-toolbox/utils';

/**
 * Filesystem source configuration
 */
export interface FilesystemSourceConfig {
  type: 'filesystem';
  /** Path to the skills directory or file */
  path: string;
  /** Display name for this source */
  name?: string;
  /** Category override */
  category?: SourceCategory;
}

/**
 * Git source configuration
 */
export interface GitSourceConfig {
  type: 'git';
  /** Git repository source (e.g., 'user/repo') */
  source: string;
  /** Skill path within repository ('' for root - default is root) */
  skillPath?: string;
  /** Display name for this source */
  name?: string;
  /** Category override */
  category?: SourceCategory;
  /** Cache directory */
  cacheDir?: string;
  /** Use shallow clone */
  shallow?: boolean;
}

/**
 * Source configuration union type
 */
export type SourceConfig = FilesystemSourceConfig | GitSourceConfig;

/**
 * Constructor interface for source classes
 */
interface SourceConstructor<Options> {
  new (options: Options): SkillSource;
}

/**
 * Filesystem source options (subset for factory)
 */
interface FilesystemSourceOptions {
  path: string;
  name?: string;
  category?: SourceCategory;
}

/**
 * Git source options (subset for factory)
 */
interface GitSourceOptions {
  source: string;
  skillPath?: string;
  name?: string;
  category?: SourceCategory;
  cacheDir?: string;
  shallow?: boolean;
}

/**
 * Helper to create sources from configurations.
 * Requires FilesystemSource and GitSource to be passed in to avoid circular dependencies.
 *
 * @example
 * ```typescript
 * import { FilesystemSource } from '@skill-toolbox/filesystem-source';
 * import { GitSource } from '@skill-toolbox/git-source';
 * import { createSources, SkillLoader } from '@skill-toolbox/core';
 *
 * const sources = createSources(
 *   [
 *     { type: 'filesystem', path: './skills' },
 *     { type: 'git', source: 'user/repo' },
 *   ],
 *   { FilesystemSource, GitSource }
 * );
 *
 * const loader = new SkillLoader({ sources });
 * ```
 */
export function createSources(
  configs: SourceConfig[],
  imports: {
    FilesystemSource: SourceConstructor<FilesystemSourceOptions>;
    GitSource: SourceConstructor<GitSourceOptions>;
  }
): SkillSource[] {
  return configs.map((config) => {
    if (config.type === 'filesystem') {
      return new imports.FilesystemSource({
        path: config.path,
        name: config.name,
        category: config.category,
      });
    } else {
      return new imports.GitSource({
        source: config.source,
        skillPath: config.skillPath,
        name: config.name,
        category: config.category,
        cacheDir: config.cacheDir,
        shallow: config.shallow,
      });
    }
  });
}
