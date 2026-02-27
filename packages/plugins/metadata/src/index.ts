import yaml from 'js-yaml';
import type { SkillPlugin, SkillIR, SkillMetadata } from '@skill-toolbox/utils';
import { ParseError } from '@skill-toolbox/utils';

export interface MetadataPluginOptions {
  /** Required metadata fields */
  required?: string[];
}

/**
 * Metadata plugin for parsing YAML frontmatter
 */
export const metadataPlugin = (options?: MetadataPluginOptions): SkillPlugin => ({
  name: 'metadata',
  version: '1.0.0',

  parse(ir: SkillIR): SkillIR {
    if (!ir.frontmatter) {
      return { ...ir, metadata: {} };
    }

    try {
      // Parse YAML
      const metadata = yaml.load(ir.frontmatter) as SkillMetadata;

      // Validate required fields
      if (options?.required) {
        const missing = options.required.filter(field => !metadata[field as keyof SkillMetadata]);
        if (missing.length > 0) {
          throw new ParseError(
            `Missing required metadata fields: ${missing.join(', ')}`,
            { missing }
          );
        }
      }

      return { ...ir, metadata };
    } catch (error) {
      if (error instanceof ParseError) {
        throw error;
      }
      throw new ParseError(
        `Failed to parse frontmatter: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
});
