# Skill Toolbox Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a plugin-based skill discovery and integration tool for managing Claude Code skills.

**Architecture:** Monorepo with pnpm workspaces, plugin-based hybrid parser using marked for markdown parsing and a plugin system for extensibility.

**Tech Stack:** TypeScript, pnpm workspaces, marked, js-yaml, vitest, tsup

---

## Task 1: Set Up Monorepo Structure

**Files:**
- Create: `pnpm-workspace.yaml`
- Modify: `package.json`
- Create: `tsconfig.base.json`

**Step 1: Update root package.json with workspaces config**

```json
{
  "name": "skill-toolbox",
  "version": "1.0.0",
  "private": true,
  "description": "A plugin-based skill discovery and integration tool",
  "scripts": {
    "dev": "pnpm -r run dev",
    "build": "pnpm -r run build",
    "test": "pnpm -r run test",
    "lint": "pnpm -r run lint",
    "clean": "pnpm -r run clean"
  },
  "keywords": ["skill", "claude", "agent", "toolbox", "monorepo"],
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "typescript": "^5.3.3",
    "vitest": "^1.2.0",
    "@typescript-eslint/parser": "^6.19.0",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "eslint": "^8.56.0",
    "prettier": "^3.2.4"
  },
  "packageManager": "pnpm@8.15.0"
}
```

**Step 2: Update pnpm-workspace.yaml**

```yaml
packages:
  - 'packages/*'
  - 'packages/plugins/*'
```

**Step 3: Create shared TypeScript config**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**Step 4: Install dependencies**

Run: `pnpm install`
Expected: Dependencies installed successfully

**Step 5: Commit**

```bash
git add pnpm-workspace.yaml package.json tsconfig.base.json pnpm-lock.yaml
git commit -m "chore: set up monorepo structure"
```

---

## Task 2: Create @skill-toolbox/utils Package Structure

**Files:**
- Create: `packages/utils/package.json`
- Create: `packages/utils/tsconfig.json`
- Create: `packages/utils/src/index.ts`

**Step 1: Create utils package.json**

```json
{
  "name": "@skill-toolbox/utils",
  "version": "1.0.0",
  "description": "Shared utilities and types for skill-toolbox",
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
  "devDependencies": {
    "tsup": "^8.0.0",
    "vitest": "^1.2.0"
  }
}
```

**Step 2: Create utils tsconfig.json**

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

```typescript
/**
 * @skill-toolbox/utils
 * Shared utilities and types for skill-toolbox
 */

export const VERSION = '1.0.0';
```

**Step 4: Install package dependencies**

Run: `cd packages/utils && pnpm install`
Expected: Dependencies installed

**Step 5: Commit**

```bash
git add packages/utils/
git commit -m "feat(utils): create package structure"
```

---

## Task 3: Define Core Types in @skill-toolbox/utils

**Files:**
- Create: `packages/utils/src/types/skill.ts`
- Create: `packages/utils/src/types/index.ts`
- Modify: `packages/utils/src/index.ts`
- Create: `packages/utils/src/types/__tests__/skill.test.ts`

**Step 1: Write failing test for Skill types**

```typescript
import { describe, it, expect } from 'vitest';
import type { Skill, SkillMetadata, SkillIR } from '../skill';

describe('Skill Types', () => {
  it('should accept valid SkillIR', () => {
    const ir: SkillIR = {
      frontmatter: 'name: test',
      tokens: [],
      raw: '# Test'
    };
    expect(ir.raw).toBe('# Test');
  });

  it('should accept valid SkillMetadata', () => {
    const metadata: SkillMetadata = {
      name: 'test-skill',
      version: '1.0.0'
    };
    expect(metadata.name).toBe('test-skill');
  });

  it('should accept valid Skill', () => {
    const skill: Skill = {
      metadata: {
        name: 'test',
        version: '1.0.0'
      },
      sections: [],
      codeBlocks: [],
      dependencies: [],
      references: [],
      raw: {
        markdown: '# Test'
      }
    };
    expect(skill.metadata.name).toBe('test');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/utils && pnpm test`
Expected: FAIL with "Cannot find module '../skill'"

**Step 3: Create skill type definitions**

```typescript
import type { Token } from 'marked';

/**
 * Intermediate Representation of a skill
 */
export interface SkillIR {
  /** YAML frontmatter raw content */
  frontmatter?: string;

  /** Marked parsed tokens */
  tokens: Token[];

  /** Raw markdown content */
  raw: string;

  /** Plugin extension fields */
  [key: string]: unknown;
}

/**
 * Skill metadata from YAML frontmatter
 */
export interface SkillMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
  tags?: string[];
  keywords?: string[];
  [key: string]: unknown;
}

/**
 * Skill section (extracted from headings)
 */
export interface SkillSection {
  level: number;
  title: string;
  content: string;
}

/**
 * Code block in skill
 */
export interface SkillCodeBlock {
  language: string;
  code: string;
  commands?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Skill dependency
 */
export interface SkillDependency {
  type: 'skill' | 'npm' | 'system';
  name: string;
  version?: string;
  optional?: boolean;
}

/**
 * Skill reference (to other skills or files)
 */
export interface SkillReference {
  type: 'skill' | 'file' | 'url';
  path: string;
  alias?: string;
}

/**
 * Complete parsed skill object
 */
export interface Skill {
  /** Metadata from frontmatter */
  metadata: SkillMetadata;

  /** Sections from headings */
  sections: SkillSection[];

  /** Code blocks */
  codeBlocks: SkillCodeBlock[];

  /** Dependencies */
  dependencies: SkillDependency[];

  /** References */
  references: SkillReference[];

  /** Raw content */
  raw: {
    markdown: string;
    path?: string;
    source?: string;
  };
}

/**
 * Plugin validation result
 */
export interface PluginValidationResult {
  valid: boolean;
  errors?: Array<{ message: string }>;
}
```

**Step 4: Create types index**

```typescript
export * from './skill';
```

**Step 5: Update main index.ts to export types**

```typescript
/**
 * @skill-toolbox/utils
 * Shared utilities and types for skill-toolbox
 */

export const VERSION = '1.0.0';

export * from './types';
```

**Step 6: Run test to verify it passes**

Run: `cd packages/utils && pnpm test`
Expected: PASS - all tests passing

**Step 7: Commit**

```bash
git add packages/utils/src/
git commit -m "feat(utils): define core skill types"
```

---

## Task 4: Define Plugin Interface

**Files:**
- Create: `packages/utils/src/types/plugin.ts`
- Modify: `packages/utils/src/types/index.ts`
- Create: `packages/utils/src/types/__tests__/plugin.test.ts`

**Step 1: Write failing test for Plugin interface**

```typescript
import { describe, it, expect } from 'vitest';
import type { SkillPlugin, SkillIR } from '../plugin';

describe('Plugin Types', () => {
  it('should accept valid SkillPlugin', () => {
    const plugin: SkillPlugin = {
      name: 'test-plugin',
      version: '1.0.0',
      parse: (ir: SkillIR) => ir
    };
    expect(plugin.name).toBe('test-plugin');
  });

  it('should allow async parse function', async () => {
    const plugin: SkillPlugin = {
      name: 'async-plugin',
      parse: async (ir: SkillIR) => {
        return { ...ir, custom: 'data' };
      }
    };

    const ir: SkillIR = { tokens: [], raw: '' };
    const result = await plugin.parse(ir);
    expect(result.custom).toBe('data');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/utils && pnpm test`
Expected: FAIL with "Cannot find module '../plugin'"

**Step 3: Create plugin type definitions**

```typescript
import type { SkillIR, PluginValidationResult } from './skill';

/**
 * Skill plugin interface
 */
export interface SkillPlugin {
  /** Plugin name */
  name: string;

  /** Plugin version */
  version?: string;

  /**
   * Parse and enhance the IR
   * Can be sync or async
   */
  parse: (ir: SkillIR) => SkillIR | Promise<SkillIR>;

  /**
   * Optional validation function
   */
  validate?(ir: SkillIR): PluginValidationResult | Promise<PluginValidationResult>;
}
```

**Step 4: Update types index**

```typescript
export * from './skill';
export * from './plugin';
```

**Step 5: Run test to verify it passes**

Run: `cd packages/utils && pnpm test`
Expected: PASS - all tests passing

**Step 6: Commit**

```bash
git add packages/utils/src/types/
git commit -m "feat(utils): define plugin interface"
```

---

## Task 5: Create Error Classes

**Files:**
- Create: `packages/utils/src/errors/index.ts`
- Create: `packages/utils/src/errors/__tests__/errors.test.ts`
- Modify: `packages/utils/src/index.ts`

**Step 1: Write failing test for error classes**

```typescript
import { describe, it, expect } from 'vitest';
import {
  SkillToolboxError,
  ParseError,
  ValidationError,
  PluginError,
  NotFoundError
} from '../index';

describe('Error Classes', () => {
  it('should create SkillToolboxError', () => {
    const error = new SkillToolboxError('Test error', 'TEST_CODE');
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.name).toBe('SkillToolboxError');
  });

  it('should create ParseError with details', () => {
    const error = new ParseError('Parse failed', { line: 10, column: 5 });
    expect(error.message).toBe('Parse failed');
    expect(error.code).toBe('PARSE_ERROR');
    expect(error.details).toEqual({ line: 10, column: 5 });
  });

  it('should create ValidationError with errors array', () => {
    const errors = [
      { field: 'name', message: 'Required' },
      { field: 'version', message: 'Invalid format' }
    ];
    const error = new ValidationError('Validation failed', errors);
    expect(error.errors).toHaveLength(2);
    expect(error.errors[0].field).toBe('name');
  });

  it('should create PluginError with plugin name', () => {
    const error = new PluginError('metadata', 'Failed to parse');
    expect(error.message).toContain('metadata');
    expect(error.message).toContain('Failed to parse');
  });

  it('should create NotFoundError', () => {
    const error = new NotFoundError('brainstorming', 'skill');
    expect(error.message).toContain('brainstorming');
    expect(error.message).toContain('skill');
    expect(error.code).toBe('NOT_FOUND');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/utils && pnpm test`
Expected: FAIL with "Cannot find module '../index'"

**Step 3: Create error classes**

```typescript
/**
 * Base error class for skill-toolbox
 */
export class SkillToolboxError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'SkillToolboxError';
  }
}

/**
 * Parse error
 */
export class ParseError extends SkillToolboxError {
  constructor(
    message: string,
    details?: { line?: number; column?: number; [key: string]: unknown }
  ) {
    super(message, 'PARSE_ERROR', details);
    this.name = 'ParseError';
  }
}

/**
 * Validation error
 */
export class ValidationError extends SkillToolboxError {
  constructor(
    message: string,
    public errors: Array<{ field: string; message: string }>
  ) {
    super(message, 'VALIDATION_ERROR', { errors });
    this.name = 'ValidationError';
  }
}

/**
 * Plugin error
 */
export class PluginError extends SkillToolboxError {
  constructor(
    pluginName: string,
    message: string,
    cause?: Error
  ) {
    super(
      `Plugin "${pluginName}" error: ${message}`,
      'PLUGIN_ERROR',
      { pluginName, cause: cause?.message }
    );
    this.name = 'PluginError';
  }
}

/**
 * Git source error
 */
export class GitSourceError extends SkillToolboxError {
  constructor(message: string, source?: string) {
    super(message, 'GIT_SOURCE_ERROR', { source });
    this.name = 'GitSourceError';
  }
}

/**
 * Network error
 */
export class NetworkError extends SkillToolboxError {
  constructor(message: string, public statusCode?: number) {
    super(message, 'NETWORK_ERROR', { statusCode });
    this.name = 'NetworkError';
  }
}

/**
 * Not found error
 */
export class NotFoundError extends SkillToolboxError {
  constructor(resource: string, type: 'skill' | 'file' | 'repository') {
    super(`${type} not found: ${resource}`, 'NOT_FOUND', { resource, type });
    this.name = 'NotFoundError';
  }
}
```

**Step 4: Update main index to export errors**

```typescript
/**
 * @skill-toolbox/utils
 * Shared utilities and types for skill-toolbox
 */

export const VERSION = '1.0.0';

export * from './types';
export * from './errors';
```

**Step 5: Run test to verify it passes**

Run: `cd packages/utils && pnpm test`
Expected: PASS - all tests passing

**Step 6: Commit**

```bash
git add packages/utils/src/
git commit -m "feat(utils): add error classes"
```

---

## Task 6: Create @skill-toolbox/core Package

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/src/index.ts`
- Modify: `packages/core/package.json` (add dependencies)

**Step 1: Create core package.json**

```json
{
  "name": "@skill-toolbox/core",
  "version": "1.0.0",
  "description": "Core parsing engine and plugin system for skill-toolbox",
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
    "marked": "^12.0.0"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "vitest": "^1.2.0"
  }
}
```

**Step 2: Create core tsconfig.json**

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

```typescript
/**
 * @skill-toolbox/core
 * Core parsing engine and plugin system
 */

export const VERSION = '1.0.0';
```

**Step 4: Install dependencies**

Run: `cd packages/core && pnpm install`
Expected: Dependencies installed, including workspace reference to utils

**Step 5: Commit**

```bash
git add packages/core/
git commit -m "feat(core): create package structure"
```

---

## Task 7: Implement PluginManager

**Files:**
- Create: `packages/core/src/plugin/PluginManager.ts`
- Create: `packages/core/src/plugin/__tests__/PluginManager.test.ts`
- Create: `packages/core/src/plugin/index.ts`

**Step 1: Write failing test for PluginManager**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { PluginManager } from '../PluginManager';
import type { SkillPlugin, SkillIR } from '@skill-toolbox/utils';

describe('PluginManager', () => {
  let manager: PluginManager;

  beforeEach(() => {
    manager = new PluginManager();
  });

  it('should register a plugin', () => {
    const plugin: SkillPlugin = {
      name: 'test',
      parse: (ir) => ir
    };

    manager.register(plugin);
    expect(manager.get('test')).toBe(plugin);
  });

  it('should throw error when registering duplicate plugin', () => {
    const plugin: SkillPlugin = {
      name: 'test',
      parse: (ir) => ir
    };

    manager.register(plugin);
    expect(() => manager.register(plugin)).toThrow('already registered');
  });

  it('should register multiple plugins', () => {
    const plugins: SkillPlugin[] = [
      { name: 'plugin1', parse: (ir) => ir },
      { name: 'plugin2', parse: (ir) => ir }
    ];

    manager.registerAll(plugins);
    expect(manager.get('plugin1')).toBeDefined();
    expect(manager.get('plugin2')).toBeDefined();
  });

  it('should process IR through plugins in order', async () => {
    const plugin1: SkillPlugin = {
      name: 'plugin1',
      parse: (ir) => ({ ...ir, step1: true })
    };

    const plugin2: SkillPlugin = {
      name: 'plugin2',
      parse: (ir) => ({ ...ir, step2: true })
    };

    manager.registerAll([plugin1, plugin2]);

    const ir: SkillIR = { tokens: [], raw: 'test' };
    const result = await manager.process(ir);

    expect(result.step1).toBe(true);
    expect(result.step2).toBe(true);
  });

  it('should support async plugins', async () => {
    const asyncPlugin: SkillPlugin = {
      name: 'async',
      parse: async (ir) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return { ...ir, async: true };
      }
    };

    manager.register(asyncPlugin);

    const ir: SkillIR = { tokens: [], raw: 'test' };
    const result = await manager.process(ir);

    expect(result.async).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/core && pnpm test`
Expected: FAIL with "Cannot find module '../PluginManager'"

**Step 3: Implement PluginManager**

```typescript
import type { SkillPlugin, SkillIR } from '@skill-toolbox/utils';
import { PluginError } from '@skill-toolbox/utils';

/**
 * Plugin manager for registering and executing plugins
 */
export class PluginManager {
  private plugins: Map<string, SkillPlugin> = new Map();

  /**
   * Register a plugin
   */
  register(plugin: SkillPlugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new PluginError(plugin.name, 'Plugin already registered');
    }
    this.plugins.set(plugin.name, plugin);
  }

  /**
   * Register multiple plugins
   */
  registerAll(plugins: SkillPlugin[]): void {
    plugins.forEach(plugin => this.register(plugin));
  }

  /**
   * Get a plugin by name
   */
  get(name: string): SkillPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Process IR through all registered plugins
   */
  async process(ir: SkillIR): Promise<SkillIR> {
    let result = ir;

    for (const plugin of this.plugins.values()) {
      try {
        result = await plugin.parse(result);
      } catch (error) {
        throw new PluginError(
          plugin.name,
          error instanceof Error ? error.message : 'Unknown error',
          error instanceof Error ? error : undefined
        );
      }
    }

    return result;
  }

  /**
   * Check if a plugin is registered
   */
  has(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Remove a plugin
   */
  remove(name: string): boolean {
    return this.plugins.delete(name);
  }

  /**
   * Clear all plugins
   */
  clear(): void {
    this.plugins.clear();
  }

  /**
   * Get all plugin names
   */
  getPluginNames(): string[] {
    return Array.from(this.plugins.keys());
  }
}
```

**Step 4: Create plugin index**

```typescript
export { PluginManager } from './PluginManager';
```

**Step 5: Run test to verify it passes**

Run: `cd packages/core && pnpm test`
Expected: PASS - all tests passing

**Step 6: Commit**

```bash
git add packages/core/src/plugin/
git commit -m "feat(core): implement PluginManager"
```

---

## Task 8: Implement SkillParser

**Files:**
- Create: `packages/core/src/parser/SkillParser.ts`
- Create: `packages/core/src/parser/__tests__/SkillParser.test.ts`
- Create: `packages/core/src/parser/index.ts`

**Step 1: Write failing test for SkillParser**

```typescript
import { describe, it, expect } from 'vitest';
import { SkillParser } from '../SkillParser';
import type { SkillIR } from '@skill-toolbox/utils';

describe('SkillParser', () => {
  it('should parse basic markdown to IR', async () => {
    const parser = new SkillParser();
    const markdown = '# Test\n\nContent here';

    const skill = await parser.parse(markdown);

    expect(skill.raw.markdown).toBe(markdown);
  });

  it('should extract frontmatter', async () => {
    const parser = new SkillParser();
    const markdown = `---
name: test-skill
version: 1.0.0
---
# Test`;

    const ir = await parser.parseToIR(markdown);

    expect(ir.frontmatter).toContain('name: test-skill');
    expect(ir.frontmatter).toContain('version: 1.0.0');
  });

  it('should parse markdown tokens', async () => {
    const parser = new SkillParser();
    const markdown = '# Heading\n\nParagraph';

    const ir = await parser.parseToIR(markdown);

    expect(ir.tokens).toBeDefined();
    expect(ir.tokens.length).toBeGreaterThan(0);
  });

  it('should support adding plugins', () => {
    const parser = new SkillParser();

    parser.use({
      name: 'test',
      parse: (ir) => ({ ...ir, test: true })
    });

    expect(parser.hasPlugin('test')).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/core && pnpm test`
Expected: FAIL with "Cannot find module '../SkillParser'"

**Step 3: Implement SkillParser (minimal implementation)**

```typescript
import { marked } from 'marked';
import type { Skill, SkillIR, SkillPlugin } from '@skill-toolbox/utils';
import { PluginManager } from '../plugin';

/**
 * Core skill parser
 */
export class SkillParser {
  private pluginManager: PluginManager;

  constructor(plugins?: SkillPlugin[]) {
    this.pluginManager = new PluginManager();
    if (plugins) {
      this.pluginManager.registerAll(plugins);
    }
  }

  /**
   * Parse markdown to IR (exposed for testing)
   */
  async parseToIR(markdown: string): Promise<SkillIR> {
    // Extract frontmatter
    const frontmatterMatch = markdown.match(/^---\n([\s\S]*?)\n---/);
    const frontmatter = frontmatterMatch?.[1];

    // Parse markdown to tokens
    const tokens = marked.lexer(markdown);

    return {
      frontmatter,
      tokens,
      raw: markdown
    };
  }

  /**
   * Parse markdown to Skill object
   */
  async parse(markdown: string): Promise<Skill> {
    // 1. Parse to IR
    const ir = await this.parseToIR(markdown);

    // 2. Process through plugins
    const processedIR = await this.pluginManager.process(ir);

    // 3. Convert to Skill object
    return this.irToSkill(processedIR);
  }

  /**
   * Add a plugin
   */
  use(plugin: SkillPlugin): this {
    this.pluginManager.register(plugin);
    return this;
  }

  /**
   * Check if a plugin is registered
   */
  hasPlugin(name: string): boolean {
    return this.pluginManager.has(name);
  }

  /**
   * Convert IR to Skill object
   */
  private irToSkill(ir: SkillIR): Skill {
    return {
      metadata: (ir.metadata as any) || { name: '', version: '' },
      sections: (ir.sections as any) || [],
      codeBlocks: (ir.codeBlocks as any) || [],
      dependencies: (ir.dependencies as any) || [],
      references: (ir.references as any) || [],
      raw: {
        markdown: ir.raw
      }
    };
  }
}
```

**Step 4: Create parser index**

```typescript
export { SkillParser } from './SkillParser';
```

**Step 5: Run test to verify it passes**

Run: `cd packages/core && pnpm test`
Expected: PASS - all tests passing

**Step 6: Commit**

```bash
git add packages/core/src/parser/
git commit -m "feat(core): implement SkillParser"
```

---

## Task 9: Update core index to export all components

**Files:**
- Modify: `packages/core/src/index.ts`

**Step 1: Update core index**

```typescript
/**
 * @skill-toolbox/core
 * Core parsing engine and plugin system
 */

export const VERSION = '1.0.0';

export { SkillParser } from './parser';
export { PluginManager } from './plugin';
```

**Step 2: Build and verify**

Run: `cd packages/core && pnpm build`
Expected: Build succeeds without errors

**Step 3: Commit**

```bash
git add packages/core/src/index.ts
git commit -m "feat(core): export public API"
```

---

## Task 10: Create Metadata Plugin Package

**Files:**
- Create: `packages/plugins/metadata/package.json`
- Create: `packages/plugins/metadata/tsconfig.json`
- Create: `packages/plugins/metadata/src/index.ts`
- Create: `packages/plugins/metadata/src/__tests__/index.test.ts`

**Step 1: Create metadata plugin package.json**

```json
{
  "name": "@skill-toolbox/plugin-metadata",
  "version": "1.0.0",
  "description": "Metadata plugin for parsing YAML frontmatter",
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
    "js-yaml": "^4.1.0"
  },
  "devDependencies": {
    "@types/js-yaml": "^4.0.9",
    "tsup": "^8.0.0",
    "vitest": "^1.2.0"
  }
}
```

**Step 2: Create metadata plugin tsconfig.json**

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Write failing test for metadata plugin**

```typescript
import { describe, it, expect } from 'vitest';
import { metadataPlugin } from '../index';
import type { SkillIR } from '@skill-toolbox/utils';

describe('Metadata Plugin', () => {
  it('should parse YAML frontmatter', () => {
    const plugin = metadataPlugin();
    const ir: SkillIR = {
      frontmatter: 'name: test\nversion: 1.0.0',
      tokens: [],
      raw: ''
    };

    const result = plugin.parse(ir);

    expect(result.metadata).toEqual({
      name: 'test',
      version: '1.0.0'
    });
  });

  it('should handle missing frontmatter', () => {
    const plugin = metadataPlugin();
    const ir: SkillIR = {
      tokens: [],
      raw: ''
    };

    const result = plugin.parse(ir);

    expect(result.metadata).toEqual({});
  });

  it('should validate required fields', () => {
    const plugin = metadataPlugin({ required: ['name', 'version'] });
    const ir: SkillIR = {
      frontmatter: 'name: test',
      tokens: [],
      raw: ''
    };

    expect(() => plugin.parse(ir)).toThrow('Missing required metadata fields');
  });
});
```

**Step 4: Run test to verify it fails**

Run: `cd packages/plugins/metadata && pnpm install && pnpm test`
Expected: FAIL with "Cannot find module '../index'"

**Step 5: Implement metadata plugin**

```typescript
import yaml from 'js-yaml';
import type { SkillPlugin, SkillIR, SkillMetadata } from '@skill-toolbox/utils';
import { ParseError } from '@skill-toolbox/utils';

export interface MetadataPluginOptions {
  /** Required metadata fields */
  required?: string[];
}

/**
 * Metadata plugin for parsing YAML frontmatter
 */
export const metadataPlugin = (options?: MetadataPluginOptions): SkillPlugin => ({
  name: 'metadata',
  version: '1.0.0',

  parse(ir: SkillIR): SkillIR {
    if (!ir.frontmatter) {
      return { ...ir, metadata: {} };
    }

    try {
      // Parse YAML
      const metadata = yaml.load(ir.frontmatter) as SkillMetadata;

      // Validate required fields
      if (options?.required) {
        const missing = options.required.filter(field => !metadata[field as keyof SkillMetadata]);
        if (missing.length > 0) {
          throw new ParseError(
            `Missing required metadata fields: ${missing.join(', ')}`,
            { missing }
          );
        }
      }

      return { ...ir, metadata };
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
```

**Step 6: Run test to verify it passes**

Run: `cd packages/plugins/metadata && pnpm test`
Expected: PASS - all tests passing

**Step 7: Commit**

```bash
git add packages/plugins/metadata/
git commit -m "feat(plugin-metadata): implement metadata plugin"
```

---

## Summary

This plan covers Phase 1 (MVP) implementation:

✅ **Task 1**: Monorepo structure setup
✅ **Task 2**: @skill-toolbox/utils package structure
✅ **Task 3**: Core type definitions
✅ **Task 4**: Plugin interface
✅ **Task 5**: Error classes
✅ **Task 6**: @skill-toolbox/core package structure
✅ **Task 7**: PluginManager implementation
✅ **Task 8**: SkillParser implementation
✅ **Task 9**: Core exports
✅ **Task 10**: Metadata plugin (first of 4 core plugins)

**Remaining plugins** (codeblocks, dependencies, references) will follow the same pattern and can be implemented in subsequent tasks.

**Testing approach**: Each task follows TDD (Test-Driven Development) with:
1. Write failing test
2. Implement minimal code
3. Verify test passes
4. Commit

**Next phases** after completing these tasks:
- Phase 2: CLI tool and git-source
- Phase 3: Additional features (search, local-source, caching)
- Phase 4: Documentation and ecosystem
