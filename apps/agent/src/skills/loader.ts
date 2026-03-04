import { SkillLoader as CoreSkillLoader, SkillParser, createSources } from '@skill-toolbox/core';
import { FilesystemSource } from '@skill-toolbox/filesystem-source';
import { GitSource } from '@skill-toolbox/git-source';
import { DiscoverySource } from '@skill-toolbox/discovery-source';
import { HttpSource } from '@skill-toolbox/http-source';
import { metadataPlugin } from '@skill-toolbox/plugin-metadata';
import type { Skill, SkillSource, LoadedSourceInfo } from '@skill-toolbox/utils';
import type { SourceLocation } from './prompt';
import path from 'path';
import os from 'os';

export interface SkillLoaderOptions {
  /** Local skills directory */
  skillsDir: string;
  /** Enable auto-discovery from .claude/.agents directories */
  enableDiscovery?: boolean;
  /** Enable remote HTTP sources */
  enableHttp?: boolean;
  /** Remote skill URLs */
  httpUrls?: string[];
  /** Project directory for discovery (default: process.cwd()) */
  projectDir?: string;
}

export class SkillLoader {
  private loader: CoreSkillLoader;
  private sources: SkillSource[];
  private loadedSources: Map<string, LoadedSourceInfo> | null = null;

  constructor(options: SkillLoaderOptions | string) {
    // Support legacy string parameter
    const opts: SkillLoaderOptions = typeof options === 'string'
      ? { skillsDir: options }
      : options;

    const parser = new SkillParser().use(metadataPlugin());
    const homeDir = os.homedir();

    // Build source configurations
    const sourceConfigs = [];

    // 1. Local skills directory
    sourceConfigs.push({
      type: 'filesystem' as const,
      path: opts.skillsDir,
      name: path.basename(opts.skillsDir) || 'local',
    });

    // 2. Auto-discovery from .claude and .agents directories
    if (opts.enableDiscovery !== false) {
      sourceConfigs.push({
        type: 'discovery' as const,
        projectDir: opts.projectDir || process.cwd(),
        worktreeRoot: opts.projectDir || process.cwd(),
        externalDirs: ['.claude', '.agents'],
        includeGlobal: true,
        includeProject: true,
      });
    }

    // 3. Git repository (ComposioHQ awesome-claude-skills)
    sourceConfigs.push({
      type: 'git' as const,
      source: 'ComposioHQ/awesome-claude-skills',
      skillPath: '',  // Root directory (default)
      cacheDir: path.join(homeDir, '.skill-toolbox', 'git'),
      shallow: true,
      name: 'awesome-claude-skills',
    });

    // 4. HTTP sources (if enabled)
    if (opts.enableHttp !== false && opts.httpUrls && opts.httpUrls.length > 0) {
      for (const url of opts.httpUrls) {
        sourceConfigs.push({
          type: 'http' as const,
          url,
          cacheDir: path.join(homeDir, '.skill-toolbox', 'http'),
          timeout: 30000,
        });
      }
    }

    // Use createSources factory
    this.sources = createSources(
      sourceConfigs,
      { FilesystemSource, GitSource, DiscoverySource, HttpSource }
    );

    this.loader = new CoreSkillLoader({
      sources: this.sources,
      parser,
    });
  }

  async loadAll(): Promise<Map<string, Skill>> {
    const { skills, errors, sources } = await this.loader.loadAll();

    // Store loaded source info for later use
    this.loadedSources = sources;

    // Log any errors (errors is a Map<string, Error>)
    for (const [sourcePath, error] of errors) {
      console.warn(`Failed to load skill from ${sourcePath}:`, error.message);
    }

    return skills;
  }

  /**
   * Get the source locations for system prompt generation
   * Must be called after loadAll() to get actual paths
   */
  getSourceLocations(): SourceLocation[] {
    if (!this.loadedSources) {
      // Not loaded yet, return placeholder with source identifiers
      return this.sources.map(source => {
        const info = source.getSourceInfo();
        return {
          name: info.identifier,
          path: '<not-loaded>',
          type: info.category,
        };
      });
    }

    // Use actual loaded paths
    return Array.from(this.loadedSources.values()).map(info => ({
      name: info.identifier,
      path: info.path,
      type: info.category,
    }));
  }
}
