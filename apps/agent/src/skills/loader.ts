import { SkillLoader as CoreSkillLoader, SkillParser } from '@skill-toolbox/core';
import { FilesystemSource } from '@skill-toolbox/filesystem-source';
import { metadataPlugin } from '@skill-toolbox/plugin-metadata';
import type { Skill } from '@skill-toolbox/utils';

export class SkillLoader {
  private loader: CoreSkillLoader;
  private skillsDir: string;

  constructor(skillsDir: string) {
    this.skillsDir = skillsDir;
    const parser = new SkillParser().use(metadataPlugin());

    this.loader = new CoreSkillLoader({
      sources: [new FilesystemSource({ cwd: skillsDir })],  // Base directory for relative paths
      parser,
    });
  }

  async loadAll(): Promise<Map<string, Skill>> {
    // Load from both local and global skill directories
    const sources = [
      '.',                                              // Local: skillsDir (cwd)
      'C:\\Users\\Administrator\\.claude\\skills'      // Global: absolute path
    ];

    let allSkills = new Map<string, Skill>();

    for (const source of sources) {
      const result = await this.loader.loadFromSource(source);

      // Log any errors
      for (const error of result.errors) {
        console.warn(`Failed to load skill from ${error.source}:`, error.error);
      }

      // Merge skills (later sources override earlier ones with same name)
      for (const [name, skill] of result.skills) {
        allSkills.set(name, skill);
      }
    }

    return allSkills;
  }
}
