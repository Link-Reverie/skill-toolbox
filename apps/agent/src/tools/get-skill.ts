import type { Tool, ToolExecutor } from './types';
import type { SkillLoader } from '../skills/loader';

export function createGetSkillTool(skillLoader: SkillLoader): { tool: Tool; executor: ToolExecutor } {
  const tool: Tool = {
    name: 'get_skill',
    description:
      'Get the full content of a skill by name. Returns the raw SKILL.md markdown content ' +
      'with complete instructions, examples, and best practices. ' +
      'Use search_skills first to find the skill name.',
    input_schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'The full skill name (e.g., "ComposioHQ/awesome-claude-skills/code-review")',
        },
      },
      required: ['name'],
    },
  };

  const executor: ToolExecutor = async (input: any) => {
    if (!input.name || typeof input.name !== 'string') {
      throw new Error('Skill name is required and must be a string');
    }

    const name = input.name.trim();
    const content = skillLoader.getRawContent(name);

    if (!content) {
      // Try partial match: user might provide just the short name
      const allKeys = skillLoader.getCacheKeys();
      const match = allKeys.find(k => k.endsWith(`/${name}`) || k === name);
      if (match) {
        const matchedContent = skillLoader.getRawContent(match);
        if (matchedContent) {
          return matchedContent;
        }
      }
      throw new Error(
        `Skill "${name}" not found. Use search_skills to find available skills.`
      );
    }

    return content;
  };

  return { tool, executor };
}
