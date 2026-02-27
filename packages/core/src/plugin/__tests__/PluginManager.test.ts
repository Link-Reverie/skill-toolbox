import { describe, it, expect, beforeEach } from 'vitest';
import { PluginManager } from '../PluginManager';
import type { SkillPlugin, SkillIR } from '@skill-toolbox/utils';

describe('PluginManager', () => {
  let manager: PluginManager;

  beforeEach(() => {
    manager = new PluginManager();
  });

  it('should register a plugin', () => {
    const plugin: SkillPlugin = {
      name: 'test',
      parse: (ir) => ir
    };

    manager.register(plugin);
    expect(manager.get('test')).toBe(plugin);
  });

  it('should throw error when registering duplicate plugin', () => {
    const plugin: SkillPlugin = {
      name: 'test',
      parse: (ir) => ir
    };

    manager.register(plugin);
    expect(() => manager.register(plugin)).toThrow('already registered');
  });

  it('should register multiple plugins', () => {
    const plugins: SkillPlugin[] = [
      { name: 'plugin1', parse: (ir) => ir },
      { name: 'plugin2', parse: (ir) => ir }
    ];

    manager.registerAll(plugins);
    expect(manager.get('plugin1')).toBeDefined();
    expect(manager.get('plugin2')).toBeDefined();
  });

  it('should process IR through plugins in order', async () => {
    const plugin1: SkillPlugin = {
      name: 'plugin1',
      parse: (ir) => ({ ...ir, step1: true })
    };

    const plugin2: SkillPlugin = {
      name: 'plugin2',
      parse: (ir) => ({ ...ir, step2: true })
    };

    manager.registerAll([plugin1, plugin2]);

    const ir: SkillIR = { tokens: [], raw: 'test' };
    const result = await manager.process(ir);

    expect(result.step1).toBe(true);
    expect(result.step2).toBe(true);
  });

  it('should support async plugins', async () => {
    const asyncPlugin: SkillPlugin = {
      name: 'async',
      parse: async (ir) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return { ...ir, async: true };
      }
    };

    manager.register(asyncPlugin);

    const ir: SkillIR = { tokens: [], raw: 'test' };
    const result = await manager.process(ir);

    expect(result.async).toBe(true);
  });
});
