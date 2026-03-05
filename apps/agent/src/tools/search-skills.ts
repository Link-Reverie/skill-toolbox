import type { Tool, ToolExecutor } from './types';
import type { SkillLoader } from '../skills/loader';

export function createSearchSkillsTool(skillLoader: SkillLoader): { tool: Tool; executor: ToolExecutor } {
  const tool: Tool = {
    name: 'search_skills',
    description:
      'Search available skills by keyword. Returns matching skills ranked by relevance. ' +
      'Use this to find the most relevant skill before reading its full content with get_skill.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search keywords (e.g., "code review", "testing", "deployment")',
        },
      },
      required: ['query'],
    },
  };

  const executor: ToolExecutor = async (input: any) => {
    if (!input.query || typeof input.query !== 'string') {
      throw new Error('Query is required and must be a string');
    }

    const results = skillLoader.search(input.query.trim());

    if (results.length === 0) {
      return 'No matching skills found. Try different keywords.';
    }

    // Format results for LLM consumption
    const formatted = results.slice(0, 10).map((r, i) => (
      `${i + 1}. **${r.name}** (score: ${r.relevanceScore})\n` +
      `   ${r.description}\n` +
      `   keywords: ${r.keywords.join(', ') || 'none'}`
    )).join('\n\n');

    return `Found ${results.length} skill(s):\n\n${formatted}\n\nUse get_skill with the skill name to read full content.`;
  };

  return { tool, executor };
}
