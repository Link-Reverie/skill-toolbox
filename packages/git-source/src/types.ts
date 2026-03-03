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
  /** Default cache directory for cloned repositories */
  defaultCacheDir?: string;
  /** Clone timeout in milliseconds */
  timeout?: number;
  /** Use shallow clone */
  shallow?: boolean;
  /** Default skill path within repositories (default: 'skills') */
  defaultSkillPath?: string;
}
