/**
 * Core functionality for the workspace
 */

export interface Config {
  name: string;
  version: string;
  environment: 'development' | 'production' | 'test';
}

export class CoreService {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  public getConfig(): Config {
    return { ...this.config };
  }

  public initialize(): void {
    console.log(`Initializing ${this.config.name} v${this.config.version}`);
  }
}

export const createCoreService = (config: Config): CoreService => {
  return new CoreService(config);
};
