import { describe, it, expect, beforeEach } from 'vitest';
import { SkillLoader } from '../skills/loader';
import fs from 'fs-extra';
import path from 'path';

describe('SkillLoader', () => {
  const testSkillsDir = './test-skills';

  beforeEach(async () => {
    await fs.remove(testSkillsDir);
  });

  it('should return empty map when skills directory does not exist', async () => {
    const loader = new SkillLoader(testSkillsDir);
    const skills = await loader.loadAll();
    expect(skills.size).toBe(0);
  });

  it('should load skill from directory', async () => {
    // Create test skill
    const skillDir = path.join(testSkillsDir, 'test-skill');
    await fs.ensureDir(skillDir);
    await fs.writeFile(
      path.join(skillDir, 'SKILL.md'),
      `---
name: test-skill
version: 1.0.0
---
# Test Skill`
    );

    const loader = new SkillLoader(testSkillsDir);
    const skills = await loader.loadAll();

    expect(skills.size).toBe(1);
    expect(skills.has('test-skill')).toBe(true);

    const skill = skills.get('test-skill')!;
    expect(skill.metadata.name).toBe('test-skill');
    expect(skill.metadata.version).toBe('1.0.0');

    await fs.remove(testSkillsDir);
  });
});
