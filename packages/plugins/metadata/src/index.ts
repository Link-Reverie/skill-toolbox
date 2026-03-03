import yaml from 'js-yaml';
import type { SkillPlugin, SkillIR, SkillMetadata } from '@skill-toolbox/utils';
import { ParseError } from '@skill-toolbox/utils';

/**
 * Metadata plugin for parsing YAML frontmatter
 *
 * Required format:
 * - name (required, top-level)
 * - description (required, top-level)
 * - metadata (optional, nested object)
 *
 * Example:
 * name: pdf-processing
 * description: PDF processing skill
 * license: Apache-2.0
 * metadata:
 *   author: example-org
 *   version: "1.0"
 */
export const metadataPlugin = (): SkillPlugin => ({
  name: 'metadata',
  version: '1.0.0',

  parse(ir: SkillIR): SkillIR {
    if (!ir.frontmatter) {
      throw new ParseError('Missing frontmatter: name and description are required');
    }

    try {
      // Parse YAML
      const raw = yaml.load(ir.frontmatter) as Record<string, any>;

      // Validate required top-level fields
      if (!raw.name) {
        throw new ParseError('Missing required field: name');
      }
      if (!raw.description) {
        throw new ParseError('Missing required field: description');
      }

      // Extract top-level and nested metadata
      const { metadata, ...topLevel } = raw;

      // Merge: top-level fields + nested metadata fields (if present)
      const result: SkillMetadata = {
        ...topLevel,
        ...(metadata && typeof metadata === 'object' ? metadata : {})
      };

      return { ...ir, metadata: result };
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
