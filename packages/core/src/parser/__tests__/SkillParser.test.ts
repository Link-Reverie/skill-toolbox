import { describe, it, expect } from 'vitest';
import { SkillParser } from '../SkillParser';
import type { SkillIR } from '@skill-toolbox/utils';

describe('SkillParser', () => {
  it('should parse basic markdown to IR', async () => {
    const parser = new SkillParser();
    const markdown = '# Test\n\nContent here';

    const skill = await parser.parse(markdown);

    expect(skill.raw.markdown).toBe(markdown);
  });

  it('should extract frontmatter', async () => {
    const parser = new SkillParser();
    const markdown = `---
name: test-skill
version: 1.0.0
---
# Test`;

    const ir = await parser.parseToIR(markdown);

    expect(ir.frontmatter).toContain('name: test-skill');
    expect(ir.frontmatter).toContain('version: 1.0.0');
  });

  it('should parse markdown tokens', async () => {
    const parser = new SkillParser();
    const markdown = '# Heading\n\nParagraph';

    const ir = await parser.parseToIR(markdown);

    expect(ir.tokens).toBeDefined();
    expect(ir.tokens.length).toBeGreaterThan(0);
  });

  it('should support adding plugins', () => {
    const parser = new SkillParser();

    parser.use({
      name: 'test',
      parse: (ir) => ({ ...ir, test: true })
    });

    expect(parser.hasPlugin('test')).toBe(true);
  });
});
