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
 * Discovery source configuration
 */
export interface DiscoverySourceConfig {
  type: 'discovery';
  /** Project starting directory (default: process.cwd()) */
  projectDir?: string;
  /** Worktree root directory (stops upward traversal) */
  worktreeRoot?: string;
  /** External directory names to discover (default: ['.claude', '.agents']) */
  externalDirs?: string[];
  /** Include global directories (default: true) */
  includeGlobal?: boolean;
  /** Include project-level directories (default: true) */
  includeProject?: boolean;
}

/**
 * HTTP source configuration
 */
export interface HttpSourceConfig {
  type: 'http';
  /** Remote skill index URL (e.g., https://example.com/.well-known/skills/) */
  url: string;
  /** Cache directory (default: ~/.cache/skill-toolbox/http) */
  cacheDir?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Force refresh cache */
  forceRefresh?: boolean;
}

/**
 * Source configuration union type
 */
export type SourceConfig =
  | FilesystemSourceConfig
  | GitSourceConfig
  | DiscoverySourceConfig
  | HttpSourceConfig;

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
 * Discovery source options
 */
interface DiscoverySourceOptions {
  projectDir?: string;
  worktreeRoot?: string;
  externalDirs?: string[];
  includeGlobal?: boolean;
  includeProject?: boolean;
}

/**
 * HTTP source options
 */
interface HttpSourceOptions {
  url: string;
  cacheDir?: string;
  timeout?: number;
  forceRefresh?: boolean;
}

/**
 * Import map for source classes
 */
export interface SourceImports {
  FilesystemSource: SourceConstructor<FilesystemSourceOptions>;
  GitSource: SourceConstructor<GitSourceOptions>;
  DiscoverySource: SourceConstructor<DiscoverySourceOptions>;
  HttpSource: SourceConstructor<HttpSourceOptions>;
}

/**
 * Helper to create sources from configurations.
 * Requires source classes to be passed in to avoid circular dependencies.
 *
 * @example
 * ```typescript
 * import { FilesystemSource } from '@skill-toolbox/filesystem-source';
 * import { GitSource } from '@skill-toolbox/git-source';
 * import { DiscoverySource } from '@skill-toolbox/discovery-source';
 * import { HttpSource } from '@skill-toolbox/http-source';
 * import { createSources, SkillLoader } from '@skill-toolbox/core';
 *
 * const sources = createSources(
 *   [
 *     { type: 'filesystem', path: './skills' },
 *     { type: 'git', source: 'user/repo' },
 *     { type: 'discovery', projectDir: process.cwd() },
 *     { type: 'http', url: 'https://example.com/skills/' },
 *   ],
 *   { FilesystemSource, GitSource, DiscoverySource, HttpSource }
 * );
 *
 * const loader = new SkillLoader({ sources });
 * ```
 */
export function createSources(
  configs: SourceConfig[],
  imports: SourceImports
): SkillSource[] {
  return configs.map((config) => {
    switch (config.type) {
      case 'filesystem':
        return new imports.FilesystemSource({
          path: config.path,
          name: config.name,
          category: config.category,
        });

      case 'git':
        return new imports.GitSource({
          source: config.source,
          skillPath: config.skillPath,
          name: config.name,
          category: config.category,
          cacheDir: config.cacheDir,
          shallow: config.shallow,
        });

      case 'discovery':
        return new imports.DiscoverySource({
          projectDir: config.projectDir,
          worktreeRoot: config.worktreeRoot,
          externalDirs: config.externalDirs,
          includeGlobal: config.includeGlobal,
          includeProject: config.includeProject,
        });

      case 'http':
        return new imports.HttpSource({
          url: config.url,
          cacheDir: config.cacheDir,
          timeout: config.timeout,
          forceRefresh: config.forceRefresh,
        });

      default: {
        // Compile-time exhaustiveness check
        const _exhaustiveCheck: never = config;
        throw new Error(`Unknown source type: ${(_exhaustiveCheck as any).type}`);
      }
    }
  });
}
