/**
 * Source type classification
 */
export type SourceType = 'git' | 'filesystem';

/**
 * Source category for user-facing display
 */
export type SourceCategory = 'local' | 'global' | 'git';

/**
 * Information about a skill source
 */
export interface SourceInfo {
  /** Source type (technical) */
  type: SourceType;
  /** Source category (user-facing) */
  category: SourceCategory;
  /** Unique identifier for this source (e.g., 'user/repo' or 'local') */
  identifier: string;
  /** Actual path to the source location (resolved after load) */
  path?: string;
}

/**
 * Loaded skill data from a source
 */
export interface LoadedSkill {
  /** Full skill name including source (e.g., 'user/repo/skill-name') */
  name: string;
  /** Base skill name (e.g., 'skill-name') */
  baseName: string;
  /** Path to SKILL.md file */
  path: string;
  /** Directory containing the skill */
  directory: string;
  /** Raw markdown content */
  content: string;
}

/**
 * Result of loading skills from a source
 */
export interface SourceLoadResult {
  /** Successfully loaded skills */
  skills: LoadedSkill[];
  /** Errors encountered during loading */
  errors: Array<{
    /** Path or identifier where error occurred */
    path: string;
    /** Error details */
    error: Error;
  }>;
}

/**
 * Options for loading from a source
 */
export interface LoadOptions {
  /** Cache directory for Git sources */
  cacheDir?: string;
  /** Clone timeout for Git sources (milliseconds) */
  timeout?: number;
  /** Use shallow clone for Git sources */
  shallow?: boolean;
}

/**
 * Unified interface for skill sources
 *
 * Sources are bound to specific repositories/paths at construction time.
 * Use load() to fetch and parse all skills from the source.
 */
export interface SkillSource {
  /**
   * Get information about this source
   */
  getSourceInfo(): SourceInfo;

  /**
   * Load all skills from this source
   * - Fetches/clones the source if needed
   * - Discovers all skill directories
   * - Reads SKILL.md files
   *
   * @returns Loaded skills and any errors encountered
   */
  load(options?: LoadOptions): Promise<SourceLoadResult>;

  /**
   * Cleanup temporary resources
   * Called automatically by SkillLoader after all skills are loaded
   */
  cleanup(): Promise<void>;
}
