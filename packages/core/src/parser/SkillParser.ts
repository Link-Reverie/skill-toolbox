import { marked } from 'marked';
import type { Skill, SkillIR, SkillPlugin } from '@skill-toolbox/utils';
import {
  extractMetadata,
  extractSections,
  extractCodeBlocks,
  extractDependencies,
  extractReferences,
} from '@skill-toolbox/utils';
import { PluginManager } from '../plugin';

/**
 * Core skill parser
 */
export class SkillParser {
  private pluginManager: PluginManager;

  constructor(plugins?: SkillPlugin[]) {
    this.pluginManager = new PluginManager();
    if (plugins) {
      this.pluginManager.registerAll(plugins);
    }
  }

  /**
   * Parse markdown to IR (exposed for testing)
   */
  async parseToIR(markdown: string): Promise<SkillIR> {
    // Extract frontmatter (support both \n and \r\n line endings)
    const frontmatterMatch = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const frontmatter = frontmatterMatch?.[1];

    // Parse markdown to tokens
    const tokens = marked.lexer(markdown);

    return {
      frontmatter,
      tokens,
      raw: markdown
    };
  }

  /**
   * Parse markdown to Skill object
   */
  async parse(markdown: string): Promise<Skill> {
    // 1. Parse to IR
    const ir = await this.parseToIR(markdown);

    // 2. Process through plugins
    const processedIR = await this.pluginManager.process(ir);

    // 3. Convert to Skill object
    return this.irToSkill(processedIR);
  }

  /**
   * Add a plugin
   */
  use(plugin: SkillPlugin): this {
    this.pluginManager.register(plugin);
    return this;
  }

  /**
   * Check if a plugin is registered
   */
  hasPlugin(name: string): boolean {
    return this.pluginManager.has(name);
  }

  /**
   * Convert IR to Skill object
   */
  private irToSkill(ir: SkillIR): Skill {
    return {
      metadata: extractMetadata(ir),
      sections: extractSections(ir),
      codeBlocks: extractCodeBlocks(ir),
      dependencies: extractDependencies(ir),
      references: extractReferences(ir),
      raw: {
        markdown: ir.raw
      }
    };
  }
}
