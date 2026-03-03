import { buildSystemPrompt, SourceLocation } from './apps/agent/src/skills/prompt';

// Mock skills data - now with the new display name
const mockSkills = new Map([
  ['skills/code-helper', {
    metadata: { name: 'code-helper', description: 'A code review assistant' }
  }],
  ['global/algorithmic-art', {
    metadata: { name: 'algorithmic-art', description: 'Creating algorithmic art' }
  }],
  ['~/.myagent/artifacts-builder', {
    metadata: { name: 'artifacts-builder', description: 'HTML artifacts builder' }
  }],
  ['~/.myagent/brand-guidelines', {
    metadata: { name: 'brand-guidelines', description: 'Apply brand colors' }
  }],
]);

// Mock source locations
const sourceLocations: SourceLocation[] = [
  { name: 'skills', path: './skills', type: 'local' },
  { name: 'global', path: '~/.claude/skills', type: 'global' },
  { name: '~/.myagent', path: '~/.myagent/https---github-com-ComposioHQ-awesome-claude-skills-git', type: 'git' },
];

const prompt = buildSystemPrompt(mockSkills, sourceLocations);
console.log(prompt);
