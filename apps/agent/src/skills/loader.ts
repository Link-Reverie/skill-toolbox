import fs from 'fs-extra';
import path from 'path';
import { SkillParser } from '@skill-toolbox/core';
import { metadataPlugin } from '@skill-toolbox/plugin-metadata';
import type { Skill } from '@skill-toolbox/utils';

export class SkillLoader {
  private skillsDir: string;

  constructor(skillsDir: string) {
    this.skillsDir = skillsDir;
  }

  async loadAll(): Promise<Map<string, Skill>> {
    const skills = new Map<string, Skill>();

    if (!(await fs.pathExists(this.skillsDir))) {
      return skills;
    }

    const entries = await fs.readdir(this.skillsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      try {
        const skill = await this.load(path.join(this.skillsDir, entry.name));
        if (skill) {
          skills.set(skill.metadata.name, skill);
        }
      } catch (error) {
        console.warn(`Failed to load skill ${entry.name}:`, error);
      }
    }

    return skills;
  }

  private async load(skillPath: string): Promise<Skill | null> {
    const skillFile = await this.findSkillFile(skillPath);
    if (!skillFile) {
      return null;
    }

    const markdown = await fs.readFile(skillFile, 'utf-8');
    const parser = new SkillParser().use(metadataPlugin());
    return parser.parse(markdown);
  }

  private async findSkillFile(dir: string): Promise<string | null> {
    const candidates = ['SKILL.md', 'skill.md', 'README.md', 'readme.md'];

    for (const file of candidates) {
      const filePath = path.join(dir, file);
      if (await fs.pathExists(filePath)) {
        return filePath;
      }
    }

    return null;
  }
}
