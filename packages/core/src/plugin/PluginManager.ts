import type { SkillPlugin, SkillIR } from '@skill-toolbox/utils';
import { PluginError } from '@skill-toolbox/utils';

/**
 * Plugin manager for registering and executing plugins
 */
export class PluginManager {
  private plugins: Map<string, SkillPlugin> = new Map();

  /**
   * Register a plugin
   */
  register(plugin: SkillPlugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new PluginError(plugin.name, 'Plugin already registered');
    }
    this.plugins.set(plugin.name, plugin);
  }

  /**
   * Register multiple plugins
   */
  registerAll(plugins: SkillPlugin[]): void {
    plugins.forEach(plugin => this.register(plugin));
  }

  /**
   * Get a plugin by name
   */
  get(name: string): SkillPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Process IR through all registered plugins
   */
  async process(ir: SkillIR): Promise<SkillIR> {
    let result = ir;

    for (const plugin of this.plugins.values()) {
      try {
        result = await plugin.parse(result);
      } catch (error) {
        throw new PluginError(
          plugin.name,
          error instanceof Error ? error.message : 'Unknown error',
          error instanceof Error ? error : undefined
        );
      }
    }

    return result;
  }

  /**
   * Check if a plugin is registered
   */
  has(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Remove a plugin
   */
  remove(name: string): boolean {
    return this.plugins.delete(name);
  }

  /**
   * Clear all plugins
   */
  clear(): void {
    this.plugins.clear();
  }

  /**
   * Get all plugin names
   */
  getPluginNames(): string[] {
    return Array.from(this.plugins.keys());
  }
}
