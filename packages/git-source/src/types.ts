export interface GitResolvedSource {
  /** Git URL */
  url: string;
  /** Repository information */
  repo: {
    owner: string;
    name: string;
    branch?: string;
  };
  /** Skill path within repository (default: 'skills') */
  skillPath: string;
  /** Cached path if already cached */
  cached?: string;
}

export interface GitSourceOptions {
  /** Bind to a specific repository (e.g., 'user/repo' or 'https://github.com/user/repo.git') */
  source?: string;
  /** Skill path for the bound repository (e.g., 'skills', 'docs/skills', '' for root) */
  skillPath?: string;
  /** Default cache directory for cloned repositories */
  defaultCacheDir?: string;
  /** Clone timeout in milliseconds */
  timeout?: number;
  /** Use shallow clone */
  shallow?: boolean;
  /** Default skill path within repositories (used when source is not bound, default: 'skills') */
  defaultSkillPath?: string;
}
