import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '../skills/prompt';
import type { Skill } from '@skill-toolbox/utils';

describe('buildSystemPrompt', () => {
  it('should build prompt from single skill', () => {
    const skills = new Map<string, Skill>();
    skills.set('test-skill', {
      metadata: { name: 'test-skill', version: '1.0.0' },
      sections: [],
      codeBlocks: [],
      dependencies: [],
      references: [],
      raw: { markdown: '# Test Skill\n\nThis is a test skill.' }
    });

    const prompt = buildSystemPrompt(skills);

    expect(prompt).toContain('You are an AI assistant');
    expect(prompt).toContain('test-skill');
    expect(prompt).toContain('This is a test skill');
  });

  it('should separate multiple skills with divider', () => {
    const skills = new Map<string, Skill>();
    skills.set('skill1', {
      metadata: { name: 'skill1', version: '1.0.0' },
      sections: [],
      codeBlocks: [],
      dependencies: [],
      references: [],
      raw: { markdown: 'Skill 1 content' }
    });
    skills.set('skill2', {
      metadata: { name: 'skill2', version: '1.0.0' },
      sections: [],
      codeBlocks: [],
      dependencies: [],
      references: [],
      raw: { markdown: 'Skill 2 content' }
    });

    const prompt = buildSystemPrompt(skills);

    expect(prompt).toContain('skill1');
    expect(prompt).toContain('skill2');
    expect(prompt).toContain('---');
  });
});
