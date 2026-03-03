import { SkillLoader as CoreSkillLoader, SkillParser, createSources } from '@skill-toolbox/core';
import { FilesystemSource } from '@skill-toolbox/filesystem-source';
import { GitSource } from '@skill-toolbox/git-source';
import { metadataPlugin } from '@skill-toolbox/plugin-metadata';
import type { Skill, SkillSource } from '@skill-toolbox/utils';
import type { SourceLocation } from './prompt';
import path from 'path';

export class SkillLoader {
  private loader: CoreSkillLoader;
  private sources: SkillSource[];

  constructor(skillsDir: string) {
    const parser = new SkillParser().use(metadataPlugin());

    // Use createSources factory for cleaner configuration
    this.sources = createSources(
      [
        // Local skills directory (use directory name)
        {
          type: 'filesystem',
          path: skillsDir,
          name: path.basename(skillsDir) || 'local',
        },
        // Global skills directory
        {
          type: 'filesystem',
          path: path.join(
            process.env.HOME || process.env.USERPROFILE || '',
            '.claude',
            'skills'
          ),
          name: 'global',
        },
        // Git repository (ComposioHQ awesome-claude-skills)
        {
          type: 'git',
          source: 'ComposioHQ/awesome-claude-skills',
          skillPath: '',  // Root directory (default)
          cacheDir: path.join(process.env.HOME || process.env.USERPROFILE || '', '.myagent'),
          shallow: true,
          name: '~/.myagent',  // Friendly display name
        },
      ],
      { FilesystemSource, GitSource }
    );

    this.loader = new CoreSkillLoader({
      sources: this.sources,
      parser,
    });
  }

  /**
   * Build source locations from the sources' own information
   * Note: path is only available after load(), so we use placeholder
   */
  private buildSourceLocations(): SourceLocation[] {
    return this.sources.map(source => {
      const info = source.getSourceInfo();

      return {
        name: info.identifier,
        path: '<not-loaded>',  // Path available after load() via LoadedSourceInfo
        type: info.category,
      };
    });
  }

  async loadAll(): Promise<Map<string, Skill>> {
    const { skills, errors } = await this.loader.loadAll();

    // Log any errors
    for (const [sourcePath, error] of errors) {
      console.warn(`Failed to load skill from ${sourcePath}:`, error.message);
    }

    return skills;
  }

  /**
   * Get the source locations for system prompt generation
   */
  getSourceLocations(): SourceLocation[] {
    return this.buildSourceLocations();
  }
}
