import { describe, it, expect } from 'vitest';
import { metadataPlugin } from '../index';
import type { SkillIR } from '@skill-toolbox/utils';

describe('Metadata Plugin', () => {
  it('should parse skill with nested metadata', () => {
    const plugin = metadataPlugin();
    const ir: SkillIR = {
      frontmatter: `name: pdf-processing
description: PDF processing skill
license: Apache-2.0
metadata:
  author: example-org
  version: "1.0"`,
      tokens: [],
      raw: ''
    };

    const result = plugin.parse(ir);

    expect(result.metadata).toEqual({
      name: 'pdf-processing',
      description: 'PDF processing skill',
      license: 'Apache-2.0',
      author: 'example-org',
      version: '1.0'
    });
  });

  it('should require name field', () => {
    const plugin = metadataPlugin();
    const ir: SkillIR = {
      frontmatter: `description: Test description
metadata:
  version: "1.0"`,
      tokens: [],
      raw: ''
    };

    expect(() => plugin.parse(ir)).toThrow('Missing required field: name');
  });

  it('should require description field', () => {
    const plugin = metadataPlugin();
    const ir: SkillIR = {
      frontmatter: `name: test-skill
metadata:
  version: "1.0"`,
      tokens: [],
      raw: ''
    };

    expect(() => plugin.parse(ir)).toThrow('Missing required field: description');
  });

  it('should work without metadata object', () => {
    const plugin = metadataPlugin();
    const ir: SkillIR = {
      frontmatter: `name: test-skill
description: Test description
license: MIT`,
      tokens: [],
      raw: ''
    };

    const result = plugin.parse(ir);

    expect(result.metadata).toEqual({
      name: 'test-skill',
      description: 'Test description',
      license: 'MIT'
    });
  });

  it('should throw error when frontmatter is missing', () => {
    const plugin = metadataPlugin();
    const ir: SkillIR = {
      tokens: [],
      raw: ''
    };

    expect(() => plugin.parse(ir)).toThrow('Missing frontmatter: name and description are required');
  });
});
