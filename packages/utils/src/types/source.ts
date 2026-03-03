/**
 * Metadata about a skill source
 */
export interface SkillSourceMeta {
  /** Source type */
  type: 'git' | 'filesystem' | 'url';
  /** Original source string */
  source: string;
  /** Resolved location (path or URL) */
  resolved: string;
  /** Supports multiple skills */
  multiSkill: boolean;
  /** Cached location if applicable */
  cachedPath?: string;
  /** Custom skill path (e.g., 'docs/skills') */
  skillPath?: string;
}

/**
 * Discovered skill information
 */
export interface DiscoveredSkill {
  /** Skill name */
  name: string;
  /** Path to SKILL.md file */
  path: string;
  /** Skill directory */
  directory: string;
  /** Source metadata */
  source: SkillSourceMeta;
}

/**
 * Options for fetching skills
 */
export interface FetchOptions {
  /** Force re-fetch */
  force?: boolean;
  /** User-specified cache directory */
  cacheDir?: string;
  /** Custom skill path (e.g., 'docs/skills') */
  skillPath?: string;
}

/**
 * Unified interface for skill sources (Git, Filesystem, URL, etc.)
 */
export interface SkillSource {
  /**
   * Check if this source can handle the given source string
   */
  canHandle(source: string): Promise<boolean>;

  /**
   * Resolve source string to metadata
   */
  resolve(source: string): Promise<SkillSourceMeta>;

  /**
   * Fetch skills from source
   * @returns Local path to fetched content
   */
  fetch(meta: SkillSourceMeta, options?: FetchOptions): Promise<string>;

  /**
   * Discover skills in a local path
   */
  discover(localPath: string, meta: SkillSourceMeta): Promise<DiscoveredSkill[]>;

  /**
   * Cleanup temporary resources (optional)
   */
  cleanup?(localPath: string, meta: SkillSourceMeta): Promise<void>;
}
