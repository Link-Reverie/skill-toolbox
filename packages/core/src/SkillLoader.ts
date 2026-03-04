import type { Skill, SkillSource, LoadedSourceInfo } from '@skill-toolbox/utils';
import { SkillParser } from './parser';

/**
 * Options for SkillLoader
 */
export interface SkillLoaderOptions {
  /** Sources to load skills from (each bound to a specific repo/path) */
  sources: SkillSource[];
  /** Custom parser (optional) */
  parser?: SkillParser;
}

/**
 * Result of loading all skills
 */
export interface LoadAllResult {
  /** Successfully loaded skills (key: full name like 'user/repo/skill-name') */
  skills: Map<string, Skill>;
  /** Errors encountered (key: path or source identifier) */
  errors: Map<string, Error>;
  /** Loaded source info (key: source identifier) */
  sources: Map<string, LoadedSourceInfo>;
}

/**
 * Unified skill loader that works with bound SkillSource instances
 *
 * Usage:
 * ```typescript
 * const loader = new SkillLoader({
 *   sources: [
 *     new GitSource({ source: 'user/repo', skillPath: 'skills' }),
 *     new FilesystemSource({ path: './local-skills' }),
 *   ],
 * });
 *
 * const { skills, errors } = await loader.loadAll();
 * ```
 */
export class SkillLoader {
  private sources: SkillSource[];
  private parser: SkillParser;

  constructor(options: SkillLoaderOptions) {
    this.sources = options.sources;
    this.parser = options.parser || new SkillParser();
  }

  /**
   * Load skills from all configured sources
   *
   * - Skills are named with source prefix: 'source-id/skill-name'
   * - Failed sources are skipped (doesn't stop loading other sources)
   * - All sources are cleaned up automatically
   *
   * @returns Loaded skills, errors, and source info
   */
  async loadAll(): Promise<LoadAllResult> {
    const skills = new Map<string, Skill>();
    const errors = new Map<string, Error>();
    const loadedSources = new Map<string, LoadedSourceInfo>();

    // Load from each source
    for (const source of this.sources) {
      try {
        const result = await source.load();

        // Store loaded source info
        loadedSources.set(result.info.identifier, result.info);

        // Parse each skill
        for (const skillData of result.skills) {
          try {
            const skill = await this.parser.parse(skillData.content);
            skills.set(skillData.name, skill);
          } catch (error) {
            errors.set(
              skillData.path,
              error instanceof Error ? error : new Error(String(error))
            );
          }
        }

        // Collect file-level errors
        for (const err of result.errors) {
          errors.set(err.path, err.error);
        }
      } catch (error) {
        // Source-level error
        const info = source.getSourceInfo();
        errors.set(
          info.identifier,
          error instanceof Error ? error : new Error(String(error))
        );
      }
    }

    // Cleanup all sources
    await Promise.all(
      this.sources.map((s) =>
        s.cleanup().catch((e) => console.warn('Cleanup failed:', e))
      )
    );

    return { skills, errors, sources: loadedSources };
  }
}
