import type { Skill } from '@skill-toolbox/utils';
import path from 'path';

export interface SourceLocation {
  name: string;
  path: string;
  type: 'local' | 'global' | 'git';
}

export function buildSystemPrompt(
  skills: Map<string, Skill>,
  sourceLocations?: SourceLocation[]
): string {
  // Group skills by source
  const skillsBySource = new Map<string, Array<{ name: string; desc: string }>>();

  for (const [fullName, skill] of skills) {
    const desc = skill.metadata.description || 'No description';

    // Extract source from full name (e.g., 'ComposioHQ/awesome-claude-skills/skill-name')
    const parts = fullName.split('/');
    const source = parts.slice(0, -1).join('/');  // Everything except last part

    if (!skillsBySource.has(source)) {
      skillsBySource.set(source, []);
    }

    skillsBySource.get(source)!.push({
      name: parts[parts.length - 1],  // Last part is skill name
      desc,
    });
  }

  // Build skill list grouped by source
  const sections: string[] = [];

  for (const [source, skillList] of skillsBySource) {
    const skillItems = skillList
      .map(s => `    • ${s.name}: ${s.desc}`)
      .join('\n');

    sections.push(`  [${source}]\n${skillItems}`);
  }

  const skillsSection =
    skills.size > 0
      ? `Available skills:\n${sections.join('\n\n')}`
      : 'No skills loaded.';

  // Build source locations section
  let sourceLocationsSection = '';
  let findingSkillsSection = '';

  if (sourceLocations && sourceLocations.length > 0) {
    const locationItems = sourceLocations
      .map(loc => {
        // Normalize path to use forward slashes for cross-platform consistency
        const normalizedPath = loc.path.replace(/\\/g, '/');
        return `  • [${loc.name}]: ${normalizedPath} (${loc.type})`;
      })
      .join('\n');
    sourceLocationsSection = `\n## Skill Source Locations\nCurrent skill source locations:\n${locationItems}\n`;

    // Build finding skills guidance per source
    const findingGuidance = sourceLocations
      .map(loc => {
        const sourceName = `[${loc.name}]`;
        // Normalize path and use forward slashes
        const normalizedPath = loc.path.replace(/\\/g, '/');
        const skillPath = `${normalizedPath}/{skill-name}/SKILL.md`;
        return `### ${sourceName}\n- **Type**: ${loc.type}\n- **Path**: \`${normalizedPath}\`\n- **Read skill**: \`read("${skillPath}")\``;
      })
      .join('\n\n');

    findingSkillsSection = `\n## Finding Skills by Source\n${findingGuidance}\n\n`;
  }

  return `You are an AI assistant with access to the following skills:

${skillsSection}
${sourceLocationsSection}
${findingSkillsSection}
## Skill File Format

Skills are defined in SKILL.md or README.md files using the agentskills.io specification:

### Required Frontmatter
\`\`\`yaml
---
name: skill-name
description: A clear description of what this skill does
---
\`\`\`

### Optional Fields
- \`version\`: Skill version (e.g., "1.0.0")
- \`license\`: License information
- \`author\`: Author information

### Content Structure
After the frontmatter, provide:
1. **Overview**: What the skill does and when to use it
2. **Usage**: How to use the skill (examples, code patterns)
3. **Best Practices**: Guidelines for effective use

When the user requests help, determine which skill would be most appropriate and use it to assist them.

**Note**: Each skill directory contains a SKILL.md or README.md file with the full skill content. Use the read tool to view the complete skill documentation when needed.

You also have access to tools for file operations and command execution.`;
}
