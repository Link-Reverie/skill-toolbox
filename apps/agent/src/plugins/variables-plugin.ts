import type { SkillPlugin, SkillIR } from '@skill-toolbox/utils';
import { marked } from 'marked';

/**
 * Variables replacement plugin
 *
 * Replaces {{variable}} placeholders with actual values
 *
 * @example
 * ```typescript
 * const plugin = variablesPlugin({
 *   project_name: 'MyApp',
 *   version: '1.0.0',
 *   api_key: process.env.API_KEY
 * });
 * ```
 *
 * In skill markdown:
 * ```markdown
 * # {{project_name}} Documentation
 * Version: {{version}}
 * API Key: {{api_key}}
 * ```
 */
export function variablesPlugin(context: Record<string, any>): SkillPlugin {
  return {
    name: 'variables',
    version: '1.0.0',

    parse(ir: SkillIR): SkillIR {
      let raw = ir.raw;

      // Replace all variables
      for (const [key, value] of Object.entries(context)) {
        // Support multiple formats: {{key}}, {{ key }}, {{key }}
        const regex = new RegExp(`\\{\\{\\s*${escapeRegex(key)}\\s*\\}\\}`, 'g');
        const stringValue = value === null || value === undefined ? '' : String(value);
        raw = raw.replace(regex, stringValue);
      }

      // Re-parse tokens if content changed
      if (raw !== ir.raw) {
        const tokens = marked.lexer(raw);
        return { ...ir, raw, tokens };
      }

      return ir;
    }
  };
}

/**
 * Escape special regex characters
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
