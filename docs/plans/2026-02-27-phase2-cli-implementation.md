# Phase 2: CLI Tool and Git Source Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement CLI tool for managing skills and Git source adapter for cloning skill repositories.

**Architecture:** CLI package uses commander for command-line interface, Git source package uses execa for git operations, both integrate with core parsing engine from Phase 1.

**Tech Stack:** TypeScript, commander, chalk, ora, execa, fs-extra, inquirer

---

## Phase 2 Overview

**Packages to implement:**
1. `@skill-toolbox/git-source` - Git repository adapter
2. `@skill-toolbox/cli` - Command-line interface tool

**Commands to implement:**
- `skill-toolbox install <source>` - Install skill from git/ local
- `skill-toolbox list` - List installed skills
- `skill-toolbox validate <path>` - Validate skill format

**Total Tasks:** 15 tasks

---

## Task 1: Create @skill-toolbox/git-source Package Structure

**Files:**
- Create: `packages/git-source/package.json`
- Create: `packages/git-source/tsconfig.json`
- Create: `packages/git-source/src/index.ts`

**Step 1: Create git-source package.json**

Create `packages/git-source/package.json`:

```json
{
  "name": "@skill-toolbox/git-source",
  "version": "1.0.0",
  "description": "Git repository source adapter for skill-toolbox",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "dev": "tsup src/index.ts --format cjs,esm --dts --watch",
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "test": "vitest run",
    "test:watch": "vitest",
    "clean": "rm -rf dist *.tsbuildinfo"
  },
  "dependencies": {
    "@skill-toolbox/utils": "workspace:*",
    "execa": "^8.0.0",
    "fs-extra": "^11.2.0"
  },
  "devDependencies": {
    "@types/fs-extra": "^11.0.4",
    "tsup": "^8.0.0",
    "vitest": "^1.2.0"
  }
}
```

**Step 2: Create git-source tsconfig.json**

Create `packages/git-source/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Create placeholder index.ts**

Create `packages/git-source/src/index.ts`:

```typescript
/**
 * @skill-toolbox/git-source
 * Git repository source adapter
 */

export const VERSION = '1.0.0';
```

**Step 4: Install dependencies**

Run: `cd packages/git-source && pnpm install`
Expected: Dependencies installed successfully

**Step 5: Commit**

```bash
git add packages/git-source/
git commit -m "feat(git-source): create package structure"
```

---

## Task 2: Implement GitSource Class - resolve() Method

**Files:**
- Create: `packages/git-source/src/GitSource.ts`
- Create: `packages/git-source/src/__tests__/GitSource.test.ts`
- Create: `packages/git-source/src/types.ts`

**Step 1: Write failing test for resolve()**

Create `packages/git-source/src/__tests__/GitSource.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { GitSource } from '../GitSource';

describe('GitSource', () => {
  it('should resolve github shorthand', async () => {
    const source = new GitSource();
    const result = await source.resolve('github:user/repo');

    expect(result.url).toBe('https://github.com/user/repo.git');
    expect(result.repo.owner).toBe('user');
    expect(result.repo.name).toBe('repo');
  });

  it('should resolve user/repo format', async () => {
    const source = new GitSource();
    const result = await source.resolve('user/repo');

    expect(result.url).toBe('https://github.com/user/repo.git');
  });

  it('should resolve full git URL', async () => {
    const source = new GitSource();
    const result = await source.resolve('https://github.com/user/repo.git');

    expect(result.url).toBe('https://github.com/user/repo.git');
  });

  it('should throw error for invalid format', async () => {
    const source = new GitSource();

    await expect(source.resolve('invalid-format'))
      .rejects.toThrow('Invalid source format');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/git-source && pnpm test`
Expected: FAIL with "Cannot find module '../GitSource'"

**Step 3: Create types**

Create `packages/git-source/src/types.ts`:

```typescript
export interface ResolvedSource {
  /** Git URL */
  url: string;
  /** Repository information */
  repo: {
    owner: string;
    name: string;
    branch?: string;
    path?: string;
  };
  /** Cached path if already cached */
  cached?: string;
}

export interface GitSourceOptions {
  /** Cache directory */
  cacheDir?: string;
  /** Clone timeout in milliseconds */
  timeout?: number;
  /** Use shallow clone */
  shallow?: boolean;
}
```

**Step 4: Implement GitSource.resolve()**

Create `packages/git-source/src/GitSource.ts`:

```typescript
import path from 'path';
import os from 'os';
import type { ResolvedSource, GitSourceOptions } from './types';
import { GitSourceError } from '@skill-toolbox/utils';

export class GitSource {
  private cacheDir: string;
  private timeout: number;
  private shallow: boolean;

  constructor(options?: GitSourceOptions) {
    this.cacheDir = options?.cacheDir || path.join(os.homedir(), '.skill-toolbox', 'cache');
    this.timeout = options?.timeout || 60000;
    this.shallow = options?.shallow ?? true;
  }

  /**
   * Resolve source string to Git URL
   */
  async resolve(source: string): Promise<ResolvedSource> {
    // 1. GitHub shorthand: github:user/repo
    if (source.startsWith('github:')) {
      const parts = source.slice(7).split('/');
      if (parts.length !== 2) {
        throw new GitSourceError('Invalid GitHub format', source);
      }
      const [owner, name] = parts;
      return {
        url: `https://github.com/${owner}/${name}.git`,
        repo: { owner, name }
      };
    }

    // 2. user/repo format (default to GitHub)
    if (/^[\w-]+\/[\w-]+$/.test(source)) {
      const [owner, name] = source.split('/');
      return {
        url: `https://github.com/${owner}/${name}.git`,
        repo: { owner, name }
      };
    }

    // 3. Full Git URL
    const urlMatch = source.match(/github\.com[\/:]([\w-]+)\/([\w-]+)/);
    if (urlMatch) {
      return {
        url: source,
        repo: { owner: urlMatch[1], name: urlMatch[2] }
      };
    }

    throw new GitSourceError(`Invalid source format: ${source}`, source);
  }
}
```

**Step 5: Run test to verify it passes**

Run: `cd packages/git-source && pnpm test`
Expected: PASS - 4 tests

**Step 6: Commit**

```bash
git add packages/git-source/src/
git commit -m "feat(git-source): implement resolve method"
```

---

## Task 3: Implement GitSource.clone() Method

**Files:**
- Modify: `packages/git-source/src/GitSource.ts`
- Modify: `packages/git-source/src/__tests__/GitSource.test.ts`

**Step 1: Write test for clone()**

Add to `packages/git-source/src/__tests__/GitSource.test.ts`:

```typescript
import fs from 'fs-extra';

describe('GitSource clone', () => {
  it('should clone repository to temp directory', async () => {
    const source = new GitSource();
    const tempDir = await source.clone('https://github.com/octocat/Hello-World.git');

    // Verify directory exists
    expect(await fs.pathExists(tempDir)).toBe(true);

    // Verify it contains .git directory
    expect(await fs.pathExists(path.join(tempDir, '.git'))).toBe(true);

    // Clean up
    await fs.remove(tempDir);
  }, 30000);
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/git-source && pnpm test`
Expected: FAIL with "source.clone is not a function"

**Step 3: Implement clone()**

Add to `packages/git-source/src/GitSource.ts`:

```typescript
import { execa } from 'execa';
import fs from 'fs-extra';

export class GitSource {
  // ... existing code ...

  /**
   * Clone repository to temporary directory
   */
  async clone(url: string, options?: { branch?: string }): Promise<string> {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'skill-'));

    const args = ['clone'];

    if (this.shallow) {
      args.push('--depth', '1');
    }

    if (options?.branch) {
      args.push('--branch', options.branch);
    }

    args.push(url, tempDir);

    await execa('git', args, {
      timeout: this.timeout,
      stdio: 'pipe'
    });

    return tempDir;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/git-source && pnpm test`
Expected: PASS - 5 tests (4 + 1 new)

**Step 5: Commit**

```bash
git add packages/git-source/src/
git commit -m "feat(git-source): implement clone method"
```

---

## Task 4: Export GitSource from package

**Files:**
- Modify: `packages/git-source/src/index.ts`

**Step 1: Update index.ts**

Update `packages/git-source/src/index.ts`:

```typescript
/**
 * @skill-toolbox/git-source
 * Git repository source adapter
 */

export const VERSION = '1.0.0';

export { GitSource } from './GitSource';
export type { ResolvedSource, GitSourceOptions } from './types';
```

**Step 2: Build and verify**

Run: `cd packages/git-source && pnpm build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add packages/git-source/src/index.ts
git commit -m "feat(git-source): export public API"
```

---

## Task 5: Create @skill-toolbox/cli Package Structure

**Files:**
- Create: `packages/cli/package.json`
- Create: `packages/cli/tsconfig.json`
- Create: `packages/cli/src/index.ts`

**Step 1: Create cli package.json**

Create `packages/cli/package.json`:

```json
{
  "name": "@skill-toolbox/cli",
  "version": "1.0.0",
  "description": "Command-line interface for skill-toolbox",
  "bin": {
    "skill-toolbox": "./dist/index.js"
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "dev": "tsup src/index.ts --format cjs --watch",
    "build": "tsup src/index.ts --format cjs",
    "test": "vitest run",
    "test:watch": "vitest",
    "clean": "rm -rf dist *.tsbuildinfo"
  },
  "dependencies": {
    "@skill-toolbox/core": "workspace:*",
    "@skill-toolbox/utils": "workspace:*",
    "@skill-toolbox/git-source": "workspace:*",
    "commander": "^12.0.0",
    "chalk": "^5.3.0",
    "ora": "^8.0.0",
    "fs-extra": "^11.2.0"
  },
  "devDependencies": {
    "@types/fs-extra": "^11.0.4",
    "tsup": "^8.0.0",
    "vitest": "^1.2.0"
  }
}
```

**Step 2: Create cli tsconfig.json**

Create `packages/cli/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Create placeholder index.ts with shebang**

Create `packages/cli/src/index.ts`:

```typescript
#!/usr/bin/env node

/**
 * @skill-toolbox/cli
 * Command-line interface for skill-toolbox
 */

console.log('skill-toolbox CLI coming soon!');
```

**Step 4: Install dependencies**

Run: `cd packages/cli && pnpm install`
Expected: Dependencies installed

**Step 5: Commit**

```bash
git add packages/cli/
git commit -m "feat(cli): create package structure"
```

---

## Task 6: Implement CLI Entry Point

**Files:**
- Modify: `packages/cli/src/index.ts`

**Step 1: Implement CLI entry with commander**

Update `packages/cli/src/index.ts`:

```typescript
#!/usr/bin/env node

import { Command } from 'commander';

const program = new Command();

program
  .name('skill-toolbox')
  .description('CLI tool for discovering and managing Claude Code skills')
  .version('1.0.0');

program
  .command('install <source>')
  .description('Install a skill from git repository or local path')
  .option('-d, --dir <directory>', 'Installation directory', './skills')
  .action(async (source: string, options) => {
    console.log(`Installing skill from ${source}...`);
    console.log('Install command coming in next task!');
  });

program
  .command('list')
  .description('List installed skills')
  .action(() => {
    console.log('List command coming in next task!');
  });

program
  .command('validate <path>')
  .description('Validate skill format')
  .action((path: string) => {
    console.log(`Validating ${path}...`);
    console.log('Validate command coming in next task!');
  });

program.parse();
```

**Step 2: Build and test**

Run: `cd packages/cli && pnpm build`
Run: `node dist/index.js --help`
Expected: Shows help text with commands

**Step 3: Commit**

```bash
git add packages/cli/src/index.ts
git commit -m "feat(cli): implement entry point with commander"
```

---

## Task 7: Implement 'list' Command

**Files:**
- Create: `packages/cli/src/commands/list.ts`
- Create: `packages/cli/src/registry.ts`

**Step 1: Create SkillRegistry for managing installed skills**

Create `packages/cli/src/registry.ts`:

```typescript
import fs from 'fs-extra';
import path from 'path';
import { SkillParser } from '@skill-toolbox/core';
import type { Skill } from '@skill-toolbox/utils';

export class SkillRegistry {
  constructor(private skillsDir: string) {}

  async listAll(): Promise<Skill[]> {
    const skills: Skill[] = [];

    if (!(await fs.pathExists(this.skillsDir))) {
      return skills;
    }

    const entries = await fs.readdir(this.skillsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const skill = await this.get(entry.name);
      if (skill) {
        skills.push(skill);
      }
    }

    return skills;
  }

  async get(name: string): Promise<Skill | null> {
    const skillPath = path.join(this.skillsDir, name);
    if (!(await fs.pathExists(skillPath))) {
      return null;
    }

    const skillFile = await this.findSkillFile(skillPath);
    if (!skillFile) {
      return null;
    }

    const markdown = await fs.readFile(skillFile, 'utf-8');
    const parser = new SkillParser();
    return parser.parse(markdown);
  }

  private async findSkillFile(dir: string): Promise<string | null> {
    const candidates = ['SKILL.md', 'skill.md', 'README.md', 'readme.md'];

    for (const file of candidates) {
      const filePath = path.join(dir, file);
      if (await fs.pathExists(filePath)) {
        return filePath;
      }
    }

    return null;
  }
}
```

**Step 2: Implement list command**

Create `packages/cli/src/commands/list.ts`:

```typescript
import chalk from 'chalk';
import { SkillRegistry } from '../registry';

export async function listCommand(skillsDir: string) {
  const registry = new SkillRegistry(skillsDir);
  const skills = await registry.listAll();

  if (skills.length === 0) {
    console.log(chalk.yellow('No skills found.'));
    console.log(chalk.gray('\nInstall skills with: skill-toolbox install <source>'));
    return;
  }

  console.log(chalk.bold('\nInstalled Skills:\n'));

  for (const skill of skills) {
    console.log(chalk.green(`  ${skill.metadata.name}`) + chalk.gray(`@${skill.metadata.version}`));
    if (skill.metadata.description) {
      console.log(chalk.gray(`    ${skill.metadata.description}`));
    }
  }

  console.log(chalk.gray(`\nTotal: ${skills.length} skill(s)\n`));
}
```

**Step 3: Update CLI entry to use list command**

Update `packages/cli/src/index.ts`:

```typescript
import { listCommand } from './commands/list';

program
  .command('list')
  .description('List installed skills')
  .option('-d, --dir <directory>', 'Skills directory', './skills')
  .action(async (options) => {
    await listCommand(options.dir);
  });
```

**Step 4: Test list command**

Run: `cd packages/cli && pnpm build`
Run: `node dist/index.js list`
Expected: Shows "No skills found" (no skills installed yet)

**Step 5: Commit**

```bash
git add packages/cli/src/
git commit -m "feat(cli): implement list command"
```

---

## Task 8: Implement 'validate' Command

**Files:**
- Create: `packages/cli/src/commands/validate.ts`

**Step 1: Implement validate command**

Create `packages/cli/src/commands/validate.ts`:

```typescript
import chalk from 'chalk';
import fs from 'fs-extra';
import { SkillParser } from '@skill-toolbox/core';

export async function validateCommand(skillPath: string) {
  const parser = new SkillParser();

  try {
    const stat = await fs.stat(skillPath);

    if (stat.isDirectory()) {
      // Find skill file in directory
      const skillFile = await findSkillFile(skillPath);
      if (!skillFile) {
        console.log(chalk.red('✗'), skillPath);
        console.log(chalk.red('  Error: No skill file found (SKILL.md or README.md)'));
        process.exit(1);
      }
      skillPath = skillFile;
    }

    const markdown = await fs.readFile(skillPath, 'utf-8');
    const skill = await parser.parse(markdown);

    // Validate metadata
    if (!skill.metadata.name) {
      console.log(chalk.red('✗'), skillPath);
      console.log(chalk.red('  Error: Missing required metadata field: name'));
      process.exit(1);
    }

    if (!skill.metadata.version) {
      console.log(chalk.red('✗'), skillPath);
      console.log(chalk.red('  Error: Missing required metadata field: version'));
      process.exit(1);
    }

    console.log(chalk.green('✓'), skillPath);
    console.log(chalk.gray(`  Name: ${skill.metadata.name}`));
    console.log(chalk.gray(`  Version: ${skill.metadata.version}`));
    if (skill.metadata.description) {
      console.log(chalk.gray(`  Description: ${skill.metadata.description}`));
    }
    console.log();

  } catch (error) {
    console.log(chalk.red('✗'), skillPath);
    console.log(chalk.red(`  Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
    process.exit(1);
  }
}

async function findSkillFile(dir: string): Promise<string | null> {
  const candidates = ['SKILL.md', 'skill.md', 'README.md', 'readme.md'];

  for (const file of candidates) {
    const filePath = path.join(dir, file);
    if (await fs.pathExists(filePath)) {
      return filePath;
    }
  }

  return null;
}
```

**Step 2: Update CLI entry to use validate command**

Add to `packages/cli/src/index.ts`:

```typescript
import { validateCommand } from './commands/validate';
import path from 'path';

program
  .command('validate <path>')
  .description('Validate skill format')
  .action(async (skillPath: string) => {
    await validateCommand(skillPath);
  });
```

**Step 3: Test validate command**

Run: `cd packages/cli && pnpm build`
Run: `node dist/index.js validate ../plugins/metadata`
Expected: Shows validation success for metadata plugin

**Step 4: Commit**

```bash
git add packages/cli/src/
git commit -m "feat(cli): implement validate command"
```

---

## Task 9: Implement 'install' Command (Part 1 - Basic Structure)

**Files:**
- Create: `packages/cli/src/commands/install.ts`

**Step 1: Implement install command structure**

Create `packages/cli/src/commands/install.ts`:

```typescript
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { GitSource } from '@skill-toolbox/git-source';
import { SkillRegistry } from '../registry';

export async function installCommand(source: string, options: { dir: string }) {
  const spinner = ora('Installing skill...').start();

  try {
    const registry = new SkillRegistry(options.dir);
    const gitSource = new GitSource();

    // 1. Resolve source
    spinner.text = 'Resolving source...';
    const resolved = await gitSource.resolve(source);

    // 2. Clone to temp directory
    spinner.text = `Cloning from ${resolved.url}...`;
    const tempDir = await gitSource.clone(resolved.url);

    // 3. Validate skill
    spinner.text = 'Validating skill...';
    const skill = await registry.get(path.basename(tempDir));

    if (!skill || !skill.metadata.name) {
      spinner.fail(chalk.red('Invalid skill: missing required metadata'));
      await fs.remove(tempDir);
      process.exit(1);
    }

    // 4. Install
    spinner.text = 'Installing skill...';
    const targetDir = path.join(options.dir, skill.metadata.name);
    await fs.ensureDir(options.dir);
    await fs.copy(tempDir, targetDir);

    // 5. Clean up
    await fs.remove(tempDir);

    spinner.succeed(chalk.green(`✓ Skill "${skill.metadata.name}" installed successfully!`));

    console.log('\nSkill Info:');
    console.log(chalk.gray('  Name:'), skill.metadata.name);
    console.log(chalk.gray('  Version:'), skill.metadata.version);
    if (skill.metadata.description) {
      console.log(chalk.gray('  Description:'), skill.metadata.description);
    }

  } catch (error) {
    spinner.fail(chalk.red(`Failed to install skill: ${error instanceof Error ? error.message : 'Unknown error'}`));
    process.exit(1);
  }
}
```

**Step 2: Update CLI entry to use install command**

Add to `packages/cli/src/index.ts`:

```typescript
import { installCommand } from './commands/install';

program
  .command('install <source>')
  .description('Install a skill from git repository or local path')
  .option('-d, --dir <directory>', 'Installation directory', './skills')
  .action(async (source: string, options) => {
    await installCommand(source, options);
  });
```

**Step 3: Build CLI**

Run: `cd packages/cli && pnpm build`

**Step 4: Commit**

```bash
git add packages/cli/src/
git commit -m "feat(cli): implement install command"
```

---

## Task 10: Update Root package.json Scripts

**Files:**
- Modify: `package.json`

**Step 1: Add CLI-specific scripts**

Update root `package.json` scripts:

```json
{
  "scripts": {
    "dev": "pnpm -r run dev",
    "build": "pnpm -r run build",
    "test": "pnpm -r run test",
    "lint": "pnpm -r run lint",
    "clean": "pnpm -r run clean",
    "cli": "pnpm --filter @skill-toolbox/cli run dev",
    "cli:build": "pnpm --filter @skill-toolbox/cli run build"
  }
}
```

**Step 2: Test CLI from root**

Run: `pnpm cli:build && node packages/cli/dist/index.js --help`
Expected: Shows CLI help

**Step 3: Commit**

```bash
git add package.json
git commit -m "chore: add CLI scripts to root package.json"
```

---

## Task 11: Create Example Skill for Testing

**Files:**
- Create: `examples/test-skill/SKILL.md`

**Step 1: Create example skill**

Create `examples/test-skill/SKILL.md`:

```markdown
---
name: test-skill
version: 1.0.0
description: An example skill for testing CLI commands
author: Skill Toolbox Team
tags:
  - testing
  - example
---

# Test Skill

This is an example skill for testing the CLI commands.

## Overview

This skill demonstrates:
- YAML frontmatter parsing
- Basic skill structure
- CLI validation

## Usage

\`\`\`bash
skill-toolbox validate ./examples/test-skill
\`\`\`

## Examples

### Example 1

Some example content here.

\`\`\`bash
echo "Hello, World!"
\`\`\`
```

**Step 2: Test validate command**

Run: `pnpm cli:build && node packages/cli/dist/index.js validate ./examples/test-skill`
Expected: Shows validation success

**Step 3: Commit**

```bash
git add examples/
git commit -m "docs: add example skill for testing"
```

---

## Task 12: Test Install Command End-to-End

**Files:**
- None (testing only)

**Step 1: Test install from local path**

Run: `node packages/cli/dist/index.js install ./examples/test-skill --dir ./test-skills`
Expected: Skill installed successfully

**Step 2: Test list command**

Run: `node packages/cli/dist/index.js list --dir ./test-skills`
Expected: Shows installed test-skill

**Step 3: Clean up test**

Run: `rm -rf ./test-skills`

**Step 4: Document in README**

No commit needed (testing only)

---

## Task 13: Add CLI README

**Files:**
- Create: `packages/cli/README.md`

**Step 1: Create CLI README**

Create `packages/cli/README.md`:

```markdown
# @skill-toolbox/cli

Command-line interface for managing Claude Code skills.

## Installation

\`\`\`bash
pnpm add -g @skill-toolbox/cli
\`\`\`

## Usage

### Install a Skill

\`\`\`bash
# From GitHub
skill-toolbox install github:user/skill-repo

# From user/repo shorthand
skill-toolbox install user/skill-repo

# From local path
skill-toolbox install ./local/skill

# Custom installation directory
skill-toolbox install user/skill-repo --dir ./my-skills
\`\`\`

### List Installed Skills

\`\`\`bash
skill-toolbox list

# Custom skills directory
skill-toolbox list --dir ./my-skills
\`\`\`

### Validate a Skill

\`\`\`bash
# Validate skill file
skill-toolbox validate ./skills/my-skill/SKILL.md

# Validate skill directory
skill-toolbox validate ./skills/my-skill
\`\`\`

## Commands

- `install <source>` - Install a skill from git or local path
- `list` - List installed skills
- `validate <path>` - Validate skill format

## Options

- `-d, --dir <directory>` - Skills directory (default: ./skills)
- `-h, --help` - Show help
- `-V, --version` - Show version

## License

MIT
```

**Step 2: Commit**

```bash
git add packages/cli/README.md
git commit -m "docs(cli): add README"
```

---

## Task 14: Update Root README

**Files:**
- Modify: `README.md`

**Step 1: Update root README**

Update `README.md`:

```markdown
# Skill Toolbox

A plugin-based skill discovery and integration tool for managing Claude Code skills.

## Features

- 📦 **Monorepo Structure** - pnpm workspaces
- 🔌 **Plugin System** - Extensible architecture
- 📝 **CLI Tool** - Command-line interface for managing skills
- 🔍 **Git Integration** - Install skills from Git repositories
- 🎯 **TypeScript** - Full type safety

## Packages

- `@skill-toolbox/core` - Core parsing engine
- `@skill-toolbox/utils` - Shared utilities and types
- `@skill-toolbox/git-source` - Git repository adapter
- `@skill-toolbox/cli` - Command-line interface
- `@skill-toolbox/plugin-metadata` - Metadata parsing plugin

## Quick Start

### Install Dependencies

\`\`\`bash
pnpm install
\`\`\`

### Build All Packages

\`\`\`bash
pnpm build
\`\`\`

### Run Tests

\`\`\`bash
pnpm test
\`\`\`

### Use CLI

\`\`\`bash
# Build CLI
pnpm cli:build

# Install a skill
node packages/cli/dist/index.js install user/skill-repo

# List skills
node packages/cli/dist/index.js list

# Validate a skill
node packages/cli/dist/index.js validate ./skills/my-skill
\`\`\`

## Development

### Project Structure

\`\`\`
packages/
├── core/           # Core parsing engine
├── utils/          # Shared utilities
├── git-source/     # Git adapter
├── cli/            # CLI tool
└── plugins/
    └── metadata/   # Metadata plugin
\`\`\`

### Testing

Each package has its own test suite using Vitest.

\`\`\`bash
# Test all packages
pnpm test

# Test specific package
cd packages/core && pnpm test
\`\`\`

## License

MIT
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: update root README with Phase 2 features"
```

---

## Task 15: Final Verification and Summary

**Files:**
- None (verification only)

**Step 1: Run all tests**

Run: `pnpm test`
Expected: All tests pass across all packages

**Step 2: Build all packages**

Run: `pnpm build`
Expected: All packages build successfully

**Step 3: Test CLI commands end-to-end**

Run: `node packages/cli/dist/index.js --help`
Run: `node packages/cli/dist/index.js validate ./examples/test-skill`
Expected: All commands work

**Step 4: Create summary document**

Create commit with Phase 2 completion:

```bash
git add .
git commit -m "feat: complete Phase 2 - CLI tool and Git source

Phase 2 Complete:
- @skill-toolbox/git-source package with clone and resolve
- @skill-toolbox/cli package with install, list, validate commands
- SkillRegistry for managing installed skills
- Example skill for testing
- Complete documentation

Packages implemented: 2
Commands implemented: 3
Tests passing: 5+"
```

---

## Summary

**Phase 2 完成内容：**

✅ **15 个任务全部完成**
- 2 个新包: git-source, cli
- 3 个 CLI 命令: install, list, validate
- Git 集成: clone 和 resolve
- Skill 管理系统
- 完整文档和示例

**技术栈:**
- commander - CLI 框架
- chalk - 终端颜色
- ora - Loading 动画
- execa - Git 命令
- fs-extra - 文件系统

**下一步 Phase 3:**
- 实现 search 命令
- 实现 local-source 包
- 缓存机制
- 错误处理优化
