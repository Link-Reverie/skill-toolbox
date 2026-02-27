import { describe, it, expect } from 'vitest';
import { metadataPlugin } from '../index';
import type { SkillIR } from '@skill-toolbox/utils';

describe('Metadata Plugin', () => {
  it('should parse YAML frontmatter', () => {
    const plugin = metadataPlugin();
    const ir: SkillIR = {
      frontmatter: 'name: test\nversion: 1.0.0',
      tokens: [],
      raw: ''
    };

    const result = plugin.parse(ir);

    expect(result.metadata).toEqual({
      name: 'test',
      version: '1.0.0'
    });
  });

  it('should handle missing frontmatter', () => {
    const plugin = metadataPlugin();
    const ir: SkillIR = {
      tokens: [],
      raw: ''
    };

    const result = plugin.parse(ir);

    expect(result.metadata).toEqual({});
  });

  it('should validate required fields', () => {
    const plugin = metadataPlugin({ required: ['name', 'version'] });
    const ir: SkillIR = {
      frontmatter: 'name: test',
      tokens: [],
      raw: ''
    };

    expect(() => plugin.parse(ir)).toThrow('Missing required metadata fields');
  });
});
