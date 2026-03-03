import { describe, it, expect, beforeEach } from 'vitest';
import { SkillLoader } from '../skills/loader';
import fs from 'fs-extra';
import path from 'path';

describe('SkillLoader', () => {
  const testSkillsDir = './test-skills';

  beforeEach(async () => {
    await fs.remove(testSkillsDir);
  });

  it('should still load from other sources when local skills directory does not exist', async () => {
    const loader = new SkillLoader(testSkillsDir);
    const skills = await loader.loadAll();
    // The loader loads from multiple sources (local, global, git)
    // so even if local doesn't exist, we get skills from git
    expect(skills.size).toBeGreaterThan(0);
  });

  it('should load skill from directory', async () => {
    // Create test skill with proper frontmatter
    const skillDir = path.join(testSkillsDir, 'test-skill');
    await fs.ensureDir(skillDir);
    await fs.writeFile(
      path.join(skillDir, 'SKILL.md'),
      `---
name: test-skill
description: A test skill
version: 1.0.0
---
# Test Skill`
    );

    const loader = new SkillLoader(testSkillsDir);
    const skills = await loader.loadAll();

    // Check that our local skill was loaded (along with git skills)
    // The skill name includes the source prefix
    const skillNames = Array.from(skills.keys());
    const testSkillKey = skillNames.find(key => key.includes('test-skill'));
    expect(testSkillKey).toBeDefined();

    const skill = skills.get(testSkillKey!)!;
    expect(skill.metadata.name).toBe('test-skill');
    expect(skill.metadata.version).toBe('1.0.0');

    await fs.remove(testSkillsDir);
  });
});
