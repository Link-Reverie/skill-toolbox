import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SkillLoader } from '../skills/loader';
import fs from 'fs-extra';
import path from 'path';

describe('SkillLoader', () => {
  const testSkillsDir = './test-skills';

  beforeEach(async () => {
    await fs.remove(testSkillsDir);
  });

  afterEach(async () => {
    await fs.remove(testSkillsDir);
  });

  it('should load skills from local directory', async () => {
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

    // Disable discovery and git to test local only
    const loader = new SkillLoader({
      skillsDir: testSkillsDir,
      enableDiscovery: false,
      enableHttp: false,
      projectDir: testSkillsDir, // Limit discovery scope
    });
    const skills = await loader.loadAll();

    // Check that our local skill was loaded
    const skillNames = Array.from(skills.keys());
    const testSkillKey = skillNames.find(key => key.includes('test-skill'));
    expect(testSkillKey).toBeDefined();

    const skill = skills.get(testSkillKey!)!;
    expect(skill.metadata.name).toBe('test-skill');
    expect(skill.metadata.version).toBe('1.0.0');
  });

  it('should handle missing local directory gracefully', async () => {
    // Disable all remote sources to test error handling
    const loader = new SkillLoader({
      skillsDir: './non-existent-dir',
      enableDiscovery: false,
      enableHttp: false,
      projectDir: './non-existent-dir',
    });
    const skills = await loader.loadAll();
    // Should not throw, just return empty map
    expect(skills.size).toBe(0);
  });
});
