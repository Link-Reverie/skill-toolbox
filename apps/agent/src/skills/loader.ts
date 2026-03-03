import { SkillLoader as CoreSkillLoader, SkillParser } from '@skill-toolbox/core';
import { FilesystemSource } from '@skill-toolbox/filesystem-source';
import { GitSource } from '@skill-toolbox/git-source';
import { metadataPlugin } from '@skill-toolbox/plugin-metadata';
import type { Skill } from '@skill-toolbox/utils';
import type { SkillSource } from '@skill-toolbox/utils';
import type { SourceLocation } from './prompt';
import path from 'path';

export class SkillLoader {
  private loader: CoreSkillLoader;
  private sources: SkillSource[];

  constructor(skillsDir: string) {
    const parser = new SkillParser().use(metadataPlugin());

    // Define all sources at construction time with descriptive names
    this.sources = [
      // Local skills directory (use directory name)
      new FilesystemSource({
        path: skillsDir,
        name: path.basename(skillsDir) || 'local',
      }),
      // Global skills directory
      new FilesystemSource({
        path: path.join(
          process.env.HOME || process.env.USERPROFILE || '',
          '.claude',
          'skills'
        ),
        name: 'global',
      }),
      // Git repository (ComposioHQ awesome-claude-skills)
      new GitSource({
        source: 'ComposioHQ/awesome-claude-skills',
        skillPath: '',  // 空字符串表示根目录
        cacheDir: path.join(process.env.HOME || process.env.USERPROFILE || '', '.myagent'),
        shallow: true,
        name: '~/.myagent',  // 友好的显示名称
      }),
    ];

    this.loader = new CoreSkillLoader({
      sources: this.sources,
      parser,
    });
  }

  /**
   * Build source locations from the sources' own information
   * Sources provide their own paths, identifiers, and categories
   */
  private buildSourceLocations(): SourceLocation[] {
    return this.sources.map(source => {
      const info = source.getSourceInfo();

      // Use category directly from source info
      return {
        name: info.identifier,
        path: info.path || '<not-loaded>',  // Path available after load()
        type: info.category,  // Use category from source
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
   * Locations are built dynamically from sources' own information
   */
  getSourceLocations(): SourceLocation[] {
    return this.buildSourceLocations();
  }
}
