/**
 * Remote skill index format (compatible with OpenCode)
 */
export interface RemoteSkillIndex {
  skills: Array<{
    name: string;
    description?: string;
    files: string[];
  }>;
}

/**
 * HTTP Source configuration options
 */
export interface HttpSourceOptions {
  /** Remote skill index URL (e.g., https://example.com/.well-known/skills/) */
  url: string;
  /** Cache directory (default: ~/.cache/skill-toolbox/http) */
  cacheDir?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Force refresh cache */
  forceRefresh?: boolean;
}
