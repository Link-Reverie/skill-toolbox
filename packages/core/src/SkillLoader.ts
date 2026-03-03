import fs from 'fs-extra';
import type { Skill, SkillSource, SkillSourceMeta, DiscoveredSkill, FetchOptions } from '@skill-toolbox/utils';
import { SkillParser } from './parser';

/**
 * Options for SkillLoader
 */
export interface SkillLoaderOptions {
  /** Sources in priority order */
  sources: SkillSource[];
  /** Custom parser (optional) */
  parser?: SkillParser;
}

/**
 * Result of loading skills
 */
export interface LoadResult {
  /** Loaded skills */
  skills: Map<string, Skill>;
  /** Errors encountered */
  errors: Array<{ source: string; error: Error }>;
}

/**
 * Unified skill loader that works with any SkillSource
 */
export class SkillLoader {
  private sources: SkillSource[];
  private parser: SkillParser;

  constructor(options: SkillLoaderOptions) {
    this.sources = options.sources;
    this.parser = options.parser || new SkillParser();
  }

  /**
   * Load skills from a single source
   */
  async loadFromSource(source: string, options?: FetchOptions): Promise<LoadResult> {
    const result: LoadResult = {
      skills: new Map(),
      errors: [],
    };

    let handler: SkillSource | null = null;
    let meta: SkillSourceMeta | null = null;
    let localPath: string | null = null;

    try {
      // 1. Find source that canHandle(source)
      handler = await this.findHandler(source);
      if (!handler) {
        result.errors.push({
          source,
          error: new Error(`No source handler found for: ${source}`),
        });
        return result;
      }

      // 2. Resolve -> Fetch -> Discover
      meta = await handler.resolve(source);
      localPath = await handler.fetch(meta, options);
      const discovered = await handler.discover(localPath, meta);

      // 3. Parse each discovered skill
      for (const discoveredSkill of discovered) {
        try {
          const skill = await this.parseSkill(discoveredSkill);
          result.skills.set(skill.metadata.name, skill);
        } catch (error) {
          result.errors.push({
            source: discoveredSkill.path,
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      }
    } catch (error) {
      result.errors.push({
        source,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    } finally {
      // 4. Cleanup if needed (even on errors)
      if (handler?.cleanup && localPath && meta) {
        try {
          await handler.cleanup(localPath, meta);
        } catch (cleanupError) {
          // Log cleanup errors but don't fail the operation
          console.warn('Cleanup failed:', cleanupError);
        }
      }
    }

    return result;
  }

  /**
   * Load skills from multiple sources
   */
  async loadAll(sources: string[], options?: FetchOptions): Promise<LoadResult> {
    const result: LoadResult = {
      skills: new Map(),
      errors: [],
    };

    for (const source of sources) {
      const sourceResult = await this.loadFromSource(source, options);

      // Merge skills
      for (const [name, skill] of sourceResult.skills) {
        result.skills.set(name, skill);
      }

      // Merge errors
      result.errors.push(...sourceResult.errors);
    }

    return result;
  }

  /**
   * Find a source handler for the given source string
   */
  private async findHandler(source: string): Promise<SkillSource | null> {
    for (const handler of this.sources) {
      if (await handler.canHandle(source)) {
        return handler;
      }
    }
    return null;
  }

  /**
   * Parse a discovered skill
   */
  private async parseSkill(discovered: DiscoveredSkill): Promise<Skill> {
    const content = await fs.readFile(discovered.path, 'utf-8');
    const skill = await this.parser.parse(content);

    // Add source information
    skill.raw.path = discovered.path;
    skill.raw.source = discovered.source.source;

    return skill;
  }
}
