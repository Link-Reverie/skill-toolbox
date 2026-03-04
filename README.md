# Skill Toolbox

[![npm version](https://img.shields.io/npm/v/@skill-toolbox/core.svg)](https://www.npmjs.com/package/@skill-toolbox/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)

A plugin-based skill discovery and integration tool for building AI agents with dynamic skill loading capabilities.

## Overview

Skill Toolbox helps you build AI agents that can dynamically load, parse, and use "skills" from multiple sources. Skills are markdown-based instruction files that define behaviors, prompts, and workflows for AI assistants.

**Key capabilities:**

- Load skills from local filesystem or Git repositories
- Parse markdown with YAML frontmatter into structured data
- Extensible plugin architecture for custom parsing logic
- Unified API for all skill sources
- Full TypeScript support with strict typing

## Installation

```bash
# Core package
npm install @skill-toolbox/core

# Source adapters (install as needed)
npm install @skill-toolbox/git-source
npm install @skill-toolbox/filesystem-source

# Plugins
npm install @skill-toolbox/plugin-metadata
```

## Quick Start

### Basic Usage

```typescript
import { SkillLoader, SkillParser } from '@skill-toolbox/core';
import { FilesystemSource } from '@skill-toolbox/filesystem-source';
import { GitSource } from '@skill-toolbox/git-source';
import { metadataPlugin } from '@skill-toolbox/plugin-metadata';

// Create sources
const localSource = new FilesystemSource({
  path: './skills',
  category: 'local'
});

const gitSource = new GitSource({
  url: 'user/skill-repo',
  cacheDir: './.skill-cache'
});

// Create loader with plugin
const loader = new SkillLoader({
  sources: [localSource, gitSource],
  plugins: [metadataPlugin]
});

// Load all skills
const { skills, errors } = await loader.loadAll();

// Use skills in your agent
for (const skill of skills) {
  console.log(`Loaded: ${skill.metadata.name}`);
  console.log(`Description: ${skill.metadata.description}`);
}
```

### Using with AI Agents

```typescript
import { SkillLoader } from '@skill-toolbox/core';
import { createSources } from '@skill-toolbox/core/factory';
import anthropic from '@anthropic-ai/sdk';

// Configure sources
const sources = createSources([
  { type: 'filesystem', path: './skills' },
  { type: 'git', url: 'ComposioHQ/awesome-claude-skills' }
]);

const loader = new SkillLoader({ sources });
const { skills } = await loader.loadAll();

// Build system prompt from skills
const systemPrompt = skills
  .map(s => `## ${s.metadata.name}\n\n${s.content}`)
  .join('\n\n---\n\n');

// Use with Claude
const client = new anthropic.Anthropic();
const response = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 1024,
  system: systemPrompt,
  messages: [{ role: 'user', content: 'Hello!' }]
});
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Your AI Agent                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      SkillLoader                            │
│  - Orchestrates loading from multiple sources               │
│  - Handles errors gracefully                                │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ FilesystemSource│ │   GitSource     │ │  Custom Source  │
│   (local dir)   │ │  (git clone)    │ │   (your impl)   │
└─────────────────┘ └─────────────────┘ └─────────────────┘
              │               │               │
              └───────────────┼───────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      SkillParser                            │
│  - Parses markdown to Intermediate Representation (IR)      │
│  - Processes IR through plugin chain                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Plugin Pipeline                          │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │
│  │ metadataPlugin│  │ custom plugin │  │      ...      │   │
│  │ (YAML parse)  │  │  (your logic) │  │               │   │
│  └───────────────┘  └───────────────┘  └───────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Skill Object                          │
│  - metadata: name, description, version, author, tags...   │
│  - sections: parsed markdown headings                       │
│  - codeBlocks: extracted code snippets                      │
│  - content: raw markdown content                            │
└─────────────────────────────────────────────────────────────┘
```

## Packages

| Package | Description |
|---------|-------------|
| `@skill-toolbox/core` | Core parsing engine, plugin system, and skill loader |
| `@skill-toolbox/utils` | Shared types (`Skill`, `SkillIR`, `SkillMetadata`, etc.) |
| `@skill-toolbox/git-source` | Load skills from Git repositories |
| `@skill-toolbox/filesystem-source` | Load skills from local filesystem |
| `@skill-toolbox/plugin-metadata` | Parse YAML frontmatter in skill files |
| `@skill-toolbox/cli` | Command-line tool for skill management |
| `@skill-toolbox/agent` | Example AI agent application |

## Skill Format

Skills are markdown files with optional YAML frontmatter:

```markdown
---
name: code-reviewer
description: Reviews code for quality and best practices
version: "1.0.0"
author: Your Name
tags:
  - code-review
  - quality
---

# Code Reviewer

You are a code reviewer. Analyze code for:

- Bugs and potential issues
- Code style and readability
- Performance considerations
- Security vulnerabilities

## Output Format

Provide structured feedback with severity levels.
```

## API Reference

### SkillLoader

Main class for loading skills from multiple sources.

```typescript
import { SkillLoader } from '@skill-toolbox/core';

const loader = new SkillLoader({
  sources: [source1, source2],
  plugins: [plugin1, plugin2]
});

// Load all skills from all sources
const { skills, errors } = await loader.loadAll();

// Load from specific source
const result = await loader.loadFromSource(source);
```

### SkillSource Interface

Implement this interface to create custom sources:

```typescript
interface SkillSource {
  // Get source info before loading
  getInfo(): Promise<SourceInfo>;

  // Load skills from this source
  load(): Promise<LoadedSkill[]>;

  // Cleanup resources (optional)
  cleanup?(): Promise<void>;
}
```

### SkillParser

Parse markdown content into structured skill objects:

```typescript
import { SkillParser } from '@skill-toolbox/core';

const parser = new SkillParser({
  plugins: [metadataPlugin]
});

const skill = parser.parse(markdownContent);
```

### createSources Factory

Create source instances from configuration objects:

```typescript
import { createSources } from '@skill-toolbox/core/factory';

const sources = createSources([
  { type: 'filesystem', path: './skills', category: 'local' },
  { type: 'git', url: 'user/repo', branch: 'main' },
  { type: 'git', url: 'github:user/skills', path: 'skills/' }
]);
```

### Creating Custom Plugins

```typescript
import { SkillPlugin, SkillIR } from '@skill-toolbox/utils';

const myPlugin: SkillPlugin = {
  name: 'my-plugin',

  // Process the intermediate representation
  process(ir: SkillIR): SkillIR {
    // Modify tokens, extract data, etc.
    return ir;
  },

  // Contribute to final skill object
  finalize(skill: Skill, ir: SkillIR): Skill {
    return {
      ...skill,
      customField: extractFromIR(ir)
    };
  }
};
```

## CLI Usage

```bash
# Install CLI globally
npm install -g @skill-toolbox/cli

# Install skills from Git
skill-toolbox install user/skill-repo

# Install from local path
skill-toolbox install ./my-skills

# List installed skills
skill-toolbox list

# Validate a skill file
skill-toolbox validate ./skills/my-skill/SKILL.md
```

## Development

### Prerequisites

- Node.js 18+
- pnpm 8+

### Setup

```bash
# Clone the repository
git clone https://github.com/your-username/skill-toolbox.git
cd skill-toolbox

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

### Project Structure

```
skill-toolbox/
├── packages/
│   ├── core/              # Core parsing engine
│   ├── utils/             # Shared types and utilities
│   ├── git-source/        # Git repository adapter
│   ├── filesystem-source/ # Filesystem adapter
│   ├── cli/               # CLI tool
│   └── plugins/
│       └── metadata/      # YAML frontmatter plugin
├── apps/
│   └── agent/             # Example AI agent application
├── skills/                # Local skill storage
└── examples/              # Example skills
```

### Running Tests

```bash
# Test all packages
pnpm test

# Test specific package
cd packages/core && pnpm test

# Watch mode
pnpm test:watch
```

## Examples

See the [`examples/`](./examples/) directory for sample skills and usage patterns.

See [`apps/agent/`](./apps/agent/) for a complete AI agent implementation using Skill Toolbox.

## Roadmap

- [ ] NPM registry source adapter
- [ ] HTTP/HTTPS source adapter
- [ ] Skill validation and linting
- [ ] Skill dependency management
- [ ] Built-in skill templates

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.
