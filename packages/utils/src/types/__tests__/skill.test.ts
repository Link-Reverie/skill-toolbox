import { describe, it, expect } from 'vitest';
import type { Skill, SkillMetadata, SkillIR } from '../skill';

describe('Skill Types', () => {
  it('should accept valid SkillIR', () => {
    const ir: SkillIR = {
      frontmatter: 'name: test',
      tokens: [],
      raw: '# Test'
    };
    expect(ir.raw).toBe('# Test');
  });

  it('should accept valid SkillMetadata', () => {
    const metadata: SkillMetadata = {
      name: 'test-skill',
      version: '1.0.0'
    };
    expect(metadata.name).toBe('test-skill');
  });

  it('should accept valid Skill', () => {
    const skill: Skill = {
      metadata: {
        name: 'test',
        version: '1.0.0'
      },
      sections: [],
      codeBlocks: [],
      dependencies: [],
      references: [],
      raw: {
        markdown: '# Test'
      }
    };
    expect(skill.metadata.name).toBe('test');
  });
});
