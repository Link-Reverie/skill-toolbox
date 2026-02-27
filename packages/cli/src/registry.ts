import fs from 'fs-extra';
import path from 'path';
import { SkillParser } from '@skill-toolbox/core';
import { metadataPlugin } from '@skill-toolbox/plugin-metadata';
import type { Skill } from '@skill-toolbox/utils';

export class SkillRegistry {
  constructor(private skillsDir: string) {}

  async listAll(): Promise<Skill[]> {
    const skills: Skill[] = [];

    if (!(await fs.pathExists(this.skillsDir))) {
      return skills;
    }

    const entries = await fs.readdir(this.skillsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const skill = await this.get(entry.name);
      if (skill) {
        skills.push(skill);
      }
    }

    return skills;
  }

  async get(name: string): Promise<Skill | null> {
    const skillPath = path.join(this.skillsDir, name);
    if (!(await fs.pathExists(skillPath))) {
      return null;
    }

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
