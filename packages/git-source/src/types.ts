export interface ResolvedSource {
  /** Git URL */
  url: string;
  /** Repository information */
  repo: {
    owner: string;
    name: string;
    branch?: string;
    path?: string;
  };
  /** Cached path if already cached */
  cached?: string;
}

export interface GitSourceOptions {
  /** Cache directory */
  cacheDir?: string;
  /** Clone timeout in milliseconds */
  timeout?: number;
  /** Use shallow clone */
  shallow?: boolean;
}
