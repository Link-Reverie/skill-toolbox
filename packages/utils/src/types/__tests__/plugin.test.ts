import { describe, it, expect } from 'vitest';
import type { SkillPlugin, SkillIR } from '../plugin';

describe('Plugin Types', () => {
  it('should accept valid SkillPlugin', () => {
    const plugin: SkillPlugin = {
      name: 'test-plugin',
      version: '1.0.0',
      parse: (ir: SkillIR) => ir
    };
    expect(plugin.name).toBe('test-plugin');
  });

  it('should allow async parse function', async () => {
    const plugin: SkillPlugin = {
      name: 'async-plugin',
      parse: async (ir: SkillIR) => {
        return { ...ir, custom: 'data' };
      }
    };

    const ir: SkillIR = { tokens: [], raw: '' };
    const result = await plugin.parse(ir);
    expect(result.custom).toBe('data');
  });
});
