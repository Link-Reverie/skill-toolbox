import { describe, it, expect } from 'vitest';
import { metadataPlugin } from '../index';
import { sanitizeYamlFrontmatter } from '../sanitize';
import type { SkillIR } from '@skill-toolbox/utils';

describe('Metadata Plugin', () => {
  it('should parse skill with nested metadata', async () => {
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

    const result = await plugin.parse(ir);

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

  it('should work without metadata object', async () => {
    const plugin = metadataPlugin();
    const ir: SkillIR = {
      frontmatter: `name: test-skill
description: Test description
license: MIT`,
      tokens: [],
      raw: ''
    };

    const result = await plugin.parse(ir);

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

    expect(() => plugin.parse(ir)).toThrow('Missing frontmatter');
  });

  it('should handle values containing colons using fallback sanitization', async () => {
    const plugin = metadataPlugin();
    const ir: SkillIR = {
      frontmatter: `name: test-skill
description: "This: contains a colon"
license: MIT`,
      tokens: [],
      raw: ''
    };

    const result = await plugin.parse(ir);

    expect(result.metadata).toEqual({
      name: 'test-skill',
      description: 'This: contains a colon',
      license: 'MIT'
    });
  });

  it('should handle unquoted values containing colons', async () => {
    const plugin = metadataPlugin();
    const ir: SkillIR = {
      frontmatter: `name: test-skill
description: This: contains a colon
license: MIT`,
      tokens: [],
      raw: ''
    };

    const result = await plugin.parse(ir);

    expect(result.metadata).toEqual({
      name: 'test-skill',
      description: 'This: contains a colon',
      license: 'MIT'
    });
  });
});

describe('sanitizeYamlFrontmatter', () => {
  it('should process raw YAML content without frontmatter delimiters', () => {
    const input = `name: test-skill
description: This: contains a colon`;
    const expected = `name: test-skill
description: |-
  This: contains a colon`;
    expect(sanitizeYamlFrontmatter(input)).toBe(expected);
  });

  it('should convert values with colons to block scalars', () => {
    const input = `---
name: test-skill
description: This: contains a colon
---`;
    const expected = `---
name: test-skill
description: |-
  This: contains a colon
---`;
    expect(sanitizeYamlFrontmatter(input)).toBe(expected);
  });

  it('should preserve already quoted values', () => {
    const input = `---
name: test-skill
description: "Already quoted: value"
---`;
    expect(sanitizeYamlFrontmatter(input)).toBe(input);
  });

  it('should preserve single-quoted values', () => {
    const input = `---
name: test-skill
description: 'Already quoted: value'
---`;
    expect(sanitizeYamlFrontmatter(input)).toBe(input);
  });

  it('should preserve comments', () => {
    const input = `---
# This is a comment
name: test-skill
description: Test description
---`;
    expect(sanitizeYamlFrontmatter(input)).toBe(input);
  });

  it('should preserve empty values', () => {
    const input = `---
name: test-skill
description:
---`;
    expect(sanitizeYamlFrontmatter(input)).toBe(input);
  });

  it('should preserve block scalar indicators', () => {
    const input = `---
name: test-skill
description: |-
  Already block scalar
---`;
    expect(sanitizeYamlFrontmatter(input)).toBe(input);
  });

  it('should preserve folded scalar indicators', () => {
    const input = `---
name: test-skill
description: >
  Folded scalar
---`;
    expect(sanitizeYamlFrontmatter(input)).toBe(input);
  });

  it('should preserve indented continuation lines', () => {
    const input = `---
name: test-skill
description: |-
  Line 1
  Line 2
---`;
    expect(sanitizeYamlFrontmatter(input)).toBe(input);
  });

  it('should handle multiple values with colons', () => {
    const input = `---
name: test-skill
description: Description: with colon
author: Author: name
---`;
    const expected = `---
name: test-skill
description: |-
  Description: with colon
author: |-
  Author: name
---`;
    expect(sanitizeYamlFrontmatter(input)).toBe(expected);
  });

  it('should handle mixed content correctly', () => {
    const input = `---
# Comment
name: test-skill
description: Value: with colon
simple: simple value
quoted: "Already: quoted"
---`;
    const expected = `---
# Comment
name: test-skill
description: |-
  Value: with colon
simple: simple value
quoted: "Already: quoted"
---`;
    expect(sanitizeYamlFrontmatter(input)).toBe(expected);
  });

  it('should handle Windows line endings (CRLF)', () => {
    const input = '---\r\nname: test-skill\r\ndescription: Value: colon\r\n---';
    const result = sanitizeYamlFrontmatter(input);
    // The frontmatter should be processed, but result uses \n for processed content
    expect(result).toContain('description: |-');
    expect(result).toContain('Value: colon');
  });
});
