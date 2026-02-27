import type { SkillIR, PluginValidationResult } from './skill';

/**
 * Skill plugin interface
 */
export interface SkillPlugin {
  /** Plugin name */
  name: string;

  /** Plugin version */
  version?: string;

  /**
   * Parse and enhance the IR
   * Can be sync or async
   */
  parse: (ir: SkillIR) => SkillIR | Promise<SkillIR>;

  /**
   * Optional validation function
   */
  validate?(ir: SkillIR): PluginValidationResult | Promise<PluginValidationResult>;
}
