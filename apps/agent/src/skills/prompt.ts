import type { Skill } from '@skill-toolbox/utils';

export function buildSystemPrompt(skills: Map<string, Skill>): string {
  const skillPrompts = Array.from(skills.values()).map((skill) => {
    return `---
name: ${skill.metadata.name}
version: ${skill.metadata.version}
---

${skill.raw.markdown}`;
  });

  const skillsSection =
    skillPrompts.length > 0
      ? skillPrompts.join('\n\n---\n\n')
      : 'No skills loaded.';

  return `You are an AI assistant with the following skills:

${skillsSection}

Use these skills to help the user. You have access to tools for file operations and command execution.`;
}
