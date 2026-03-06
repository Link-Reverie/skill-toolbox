import type { Skill } from '@skill-toolbox/utils';

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
## How to Use Skills

You have two dedicated skill tools:

1. **search_skills(query)** — Search skills by keyword. Returns ranked results with names, descriptions, and relevance scores.
2. **get_skill(name)** — Get the full SKILL.md content by skill name (from cache, very fast). Supports partial names.

**Workflow when the user asks for help:**

1. Call \`search_skills\` with relevant keywords to find matching skills
2. Call \`get_skill\` with the skill name to read the full instructions
3. Follow the skill's guidelines to help the user

**Example:**
\`\`\`
User: "Help me review this code"
→ search_skills("code review")
→ Found: "ComposioHQ/awesome-claude-skills/code-review" (score: 10)
→ get_skill("ComposioHQ/awesome-claude-skills/code-review")
→ [Full skill content with guidelines, checklist, examples...]
→ Apply the skill to help the user
\`\`\`

You also have tools for file operations (\`read\`, \`write\`) and command execution (\`bash\`).`;
}
