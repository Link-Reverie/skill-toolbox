import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '../skills/prompt';
import type { Skill } from '@skill-toolbox/utils';

describe('buildSystemPrompt', () => {
  it('should build prompt with skill list', () => {
    const skills = new Map<string, Skill>();
    skills.set('test-source/test-skill', {
      metadata: { name: 'test-skill', description: 'A test skill', version: '1.0.0' },
      sections: [],
      codeBlocks: [],
      dependencies: [],
      references: [],
      raw: { markdown: '# Test Skill\n\nThis is a test skill.' }
    });

    const prompt = buildSystemPrompt(skills);

    expect(prompt).toContain('You are an AI assistant');
    expect(prompt).toContain('test-skill');
    expect(prompt).toContain('A test skill');
    expect(prompt).toContain('[test-source]');
  });

  it('should separate multiple skills with divider', () => {
    const skills = new Map<string, Skill>();
    skills.set('source1/skill1', {
      metadata: { name: 'skill1', description: 'Skill 1', version: '1.0.0' },
      sections: [],
      codeBlocks: [],
      dependencies: [],
      references: [],
      raw: { markdown: 'Skill 1 content' }
    });
    skills.set('source2/skill2', {
      metadata: { name: 'skill2', description: 'Skill 2', version: '1.0.0' },
      sections: [],
      codeBlocks: [],
      dependencies: [],
      references: [],
      raw: { markdown: 'Skill 2 content' }
    });

    const prompt = buildSystemPrompt(skills);

    expect(prompt).toContain('skill1');
    expect(prompt).toContain('skill2');
    expect(prompt).toContain('[source1]');
    expect(prompt).toContain('[source2]');
  });
});
