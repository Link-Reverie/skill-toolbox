# OpenCode 特性借鉴实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 借鉴 OpenCode 的技能加载特性，通过插件和新的 Source 类型增强 Skill Toolbox

**Architecture:**
1. 增强 metadataPlugin - 添加 YAML 容错机制
2. 新增 DiscoverySource - 自动发现 .claude/skills, .agents/skills 等目录
3. 新增 HttpSource - 从远程 URL 发现和拉取技能
4. 新增 CompositeSource - 组合多个源，支持优先级覆盖

**Tech Stack:** TypeScript, js-yaml, node-fetch, zod (optional)

---

## Task 1: 增强 metadataPlugin - YAML 容错机制

**Files:**
- Modify: `packages/plugins/metadata/src/index.ts`
- Create: `packages/plugins/metadata/src/sanitize.ts`
- Test: `packages/plugins/metadata/test/index.test.ts`

**背景:** OpenCode 使用 `fallbackSanitization()` 处理非标准 YAML（如包含冒号的值），避免解析失败。

**Step 1: 创建 YAML 容错工具函数**

```typescript
// packages/plugins/metadata/src/sanitize.ts

/**
 * YAML frontmatter 容错处理
 * 处理非标准 YAML 格式，如包含冒号的值
 *
 * 移植自 OpenCode 的 fallbackSanitization
 */
export function sanitizeYamlFrontmatter(content: string): string {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return content;

  const frontmatter = match[1];
  const lines = frontmatter.split(/\r?\n/);
  const result: string[] = [];

  for (const line of lines) {
    // 跳过注释和空行
    if (line.trim().startsWith('#') || line.trim() === '') {
      result.push(line);
      continue;
    }

    // 跳过缩进的续行
    if (line.match(/^\s+/)) {
      result.push(line);
      continue;
    }

    // 匹配 key: value 模式
    const kvMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*)\s*:\s*(.*)$/);
    if (!kvMatch) {
      result.push(line);
      continue;
    }

    const key = kvMatch[1];
    const value = kvMatch[2].trim();

    // 跳过空值、已引用值、或使用块标量的值
    if (
      value === '' ||
      value === '>' ||
      value === '|' ||
      value.startsWith('"') ||
      value.startsWith("'")
    ) {
      result.push(line);
      continue;
    }

    // 如果值包含冒号，转换为块标量
    if (value.includes(':')) {
      result.push(`${key}: |-`);
      result.push(`  ${value}`);
      continue;
    }

    result.push(line);
  }

  const processed = result.join('\n');
  return content.replace(frontmatter, () => processed);
}
```

**Step 2: 更新 metadataPlugin 使用容错机制**

```typescript
// packages/plugins/metadata/src/index.ts (修改)

import yaml from 'js-yaml';
import type { SkillPlugin, SkillIR, SkillMetadata } from '@skill-toolbox/utils';
import { ParseError } from '@skill-toolbox/utils';
import { sanitizeYamlFrontmatter } from './sanitize';

export const metadataPlugin = (): SkillPlugin => ({
  name: 'metadata',
  version: '1.1.0',

  parse(ir: SkillIR): SkillIR {
    if (!ir.frontmatter) {
      throw new ParseError('Missing frontmatter: name and description are required');
    }

    let raw: Record<string, any>;

    try {
      // 首先尝试标准解析
      raw = yaml.load(ir.frontmatter) as Record<string, any>;
    } catch (firstError) {
      try {
        // 失败后尝试容错处理
        const sanitized = sanitizeYamlFrontmatter(ir.raw);
        const sanitizedFrontmatter = sanitized.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1];
        if (sanitizedFrontmatter) {
          raw = yaml.load(sanitizedFrontmatter) as Record<string, any>;
        } else {
          throw firstError;
        }
      } catch (error) {
        throw new ParseError(
          `Failed to parse frontmatter: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // 验证必需字段
    if (!raw.name) {
      throw new ParseError('Missing required field: name');
    }
    if (!raw.description) {
      throw new ParseError('Missing required field: description');
    }

    // 提取顶层和嵌套元数据
    const { metadata, ...topLevel } = raw;

    const result: SkillMetadata = {
      ...topLevel,
      ...(metadata && typeof metadata === 'object' ? metadata : {})
    };

    return { ...ir, metadata: result };
  }
});
```

**Step 3: 添加测试**

```typescript
// packages/plugins/metadata/test/sanitize.test.ts

import { describe, it, expect } from 'vitest';
import { sanitizeYamlFrontmatter } from '../src/sanitize';

describe('sanitizeYamlFrontmatter', () => {
  it('should handle YAML with colons in values', () => {
    const input = `---
name: test-skill
description: This is a test: with colon
---`;
    const result = sanitizeYamlFrontmatter(input);
    expect(result).toContain('description: |-');
    expect(result).toContain('  This is a test: with colon');
  });

  it('should preserve quoted values', () => {
    const input = `---
name: "test-skill"
description: "Already quoted"
---`;
    const result = sanitizeYamlFrontmatter(input);
    expect(result).toContain('description: "Already quoted"');
  });

  it('should preserve comments', () => {
    const input = `---
# This is a comment
name: test-skill
description: Test
---`;
    const result = sanitizeYamlFrontmatter(input);
    expect(result).toContain('# This is a comment');
  });
});
```

---

## Task 2: 新增 DiscoverySource - 自动发现技能目录

**Files:**
- Create: `packages/sources/discovery/src/index.ts`
- Create: `packages/sources/discovery/src/utils.ts`
- Create: `packages/sources/discovery/package.json`
- Create: `packages/sources/discovery/tsconfig.json`
- Create: `packages/sources/discovery/test/index.test.ts`

**背景:** OpenCode 从多个目录自动发现技能，包括全局 (`~/.claude/skills`) 和项目级 (向上遍历查找)。

**Step 1: 创建 package.json**

```json
{
  "name": "@skill-toolbox/discovery-source",
  "version": "0.0.1",
  "description": "Auto-discovery source for skills in multiple directories",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts --clean",
    "dev": "tsup src/index.ts --format cjs,esm --dts --watch",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@skill-toolbox/utils": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "tsup": "^8.0.0",
    "typescript": "^5.3.3",
    "vitest": "^1.2.0"
  },
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  }
}
```

**Step 2: 实现目录遍历工具**

```typescript
// packages/sources/discovery/src/utils.ts

import { opendir, stat } from 'fs/promises';
import { join, dirname, resolve } from 'path';

/**
 * 向上遍历目录，查找目标目录
 *
 * @param targets - 要查找的目标目录名列表
 * @param start - 起始目录
 * @param stop - 停止目录（不包含）
 * @returns 找到的目录路径列表
 */
export async function walkUp(
  targets: string[],
  start: string,
  stop?: string
): Promise<string[]> {
  const results: string[] = [];
  let current = resolve(start);

  while (true) {
    // 检查是否到达停止点
    if (stop && current === resolve(stop)) {
      break;
    }

    // 检查每个目标目录
    for (const target of targets) {
      const targetPath = join(current, target);
      try {
        const s = await stat(targetPath);
        if (s.isDirectory()) {
          results.push(targetPath);
        }
      } catch {
        // 目录不存在，继续
      }
    }

    // 向上一级
    const parent = dirname(current);
    if (parent === current) {
      // 到达根目录
      break;
    }
    current = parent;
  }

  return results;
}

/**
 * 检查目录是否存在
 */
export async function isDirectory(path: string): Promise<boolean> {
  try {
    const s = await stat(path);
    return s.isDirectory();
  } catch {
    return false;
  }
}
```

**Step 3: 实现 DiscoverySource**

```typescript
// packages/sources/discovery/src/index.ts

import { readdir, readFile } from 'fs/promises';
import { join, basename } from 'path';
import { homedir } from 'os';
import type {
  SkillSource,
  SourceInfo,
  SourceLoadResult,
  LoadedSkill,
  SourceCategory
} from '@skill-toolbox/utils';
import { walkUp, isDirectory } from './utils';

export interface DiscoverySourceOptions {
  /** 项目起始目录（默认: process.cwd()） */
  projectDir?: string;
  /** 工作树根目录（停止向上遍历） */
  worktreeRoot?: string;
  /** 要发现的外部目录名（默认: ['.claude', '.agents']） */
  externalDirs?: string[];
  /** 技能文件模式（默认: 'skills/**/SKILL.md'） */
  skillPattern?: string;
  /** 包含全局目录（默认: true） */
  includeGlobal?: boolean;
  /** 包含项目级目录（默认: true） */
  includeProject?: boolean;
}

/**
 * 自动发现技能目录的 Source
 *
 * 发现顺序（后发现的覆盖先发现的）：
 * 1. 全局目录: ~/.claude/skills, ~/.agents/skills
 * 2. 项目级目录: 从 projectDir 向上遍历查找 .claude/skills, .agents/skills
 */
export class DiscoverySource implements SkillSource {
  private options: Required<DiscoverySourceOptions>;
  private foundDirs: string[] = [];

  constructor(options: DiscoverySourceOptions = {}) {
    this.options = {
      projectDir: options.projectDir ?? process.cwd(),
      worktreeRoot: options.worktreeRoot ?? '/',
      externalDirs: options.externalDirs ?? ['.claude', '.agents'],
      skillPattern: options.skillPattern ?? 'skills/**/SKILL.md',
      includeGlobal: options.includeGlobal ?? true,
      includeProject: options.includeProject ?? true,
    };
  }

  getSourceInfo(): SourceInfo {
    return {
      type: 'filesystem',
      category: 'local' as SourceCategory,
      identifier: 'discovery',
    };
  }

  async load(): Promise<SourceLoadResult> {
    const skills: LoadedSkill[] = [];
    const errors: SourceLoadResult['errors'] = [];

    // 1. 发现全局目录
    if (this.options.includeGlobal) {
      const home = homedir();
      for (const dir of this.options.externalDirs) {
        const globalPath = join(home, dir);
        if (await isDirectory(globalPath)) {
          this.foundDirs.push(globalPath);
        }
      }
    }

    // 2. 发现项目级目录（向上遍历）
    if (this.options.includeProject) {
      const projectDirs = await walkUp(
        this.options.externalDirs,
        this.options.projectDir,
        this.options.worktreeRoot
      );
      this.foundDirs.push(...projectDirs);
    }

    // 3. 从每个发现的目录加载技能
    for (const dir of this.foundDirs) {
      const dirSkills = await this.loadSkillsFromDir(dir);
      for (const skill of dirSkills) {
        // 检查重复（后来的覆盖先来的）
        const existingIndex = skills.findIndex(s => s.baseName === skill.baseName);
        if (existingIndex >= 0) {
          skills[existingIndex] = skill;
        } else {
          skills.push(skill);
        }
      }
    }

    return {
      skills,
      errors,
      info: {
        ...this.getSourceInfo(),
        path: this.foundDirs.join(','),
      },
    };
  }

  private async loadSkillsFromDir(baseDir: string): Promise<LoadedSkill[]> {
    const skills: LoadedSkill[] = [];
    const skillsDir = join(baseDir, 'skills');

    if (!(await isDirectory(skillsDir))) {
      return skills;
    }

    // 遍历 skills 目录下的子目录
    try {
      const entries = await readdir(skillsDir, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const skillDir = join(skillsDir, entry.name);
        const skillFile = join(skillDir, 'SKILL.md');

        try {
          const content = await readFile(skillFile, 'utf-8');
          skills.push({
            name: `discovery/${entry.name}`,
            baseName: entry.name,
            source: 'discovery',
            path: skillFile,
            directory: skillDir,
            content,
          });
        } catch {
          // SKILL.md 不存在，跳过
        }
      }
    } catch {
      // 无法读取目录，跳过
    }

    return skills;
  }

  async cleanup(): Promise<void> {
    // 无需清理
  }
}

export { walkUp, isDirectory } from './utils';
```

---

## Task 3: 新增 HttpSource - 远程 URL 发现

**Files:**
- Create: `packages/sources/http/src/index.ts`
- Create: `packages/sources/http/src/types.ts`
- Create: `packages/sources/http/package.json`
- Create: `packages/sources/http/tsconfig.json`
- Create: `packages/sources/http/test/index.test.ts`

**背景:** OpenCode 通过 index.json 从远程 URL 拉取技能列表。

**Step 1: 创建 package.json**

```json
{
  "name": "@skill-toolbox/http-source",
  "version": "0.0.1",
  "description": "HTTP source for loading skills from remote URLs",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts --clean",
    "dev": "tsup src/index.ts --format cjs,esm --dts --watch",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@skill-toolbox/utils": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "tsup": "^8.0.0",
    "typescript": "^5.3.3",
    "vitest": "^1.2.0"
  },
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  }
}
```

**Step 2: 定义类型**

```typescript
// packages/sources/http/src/types.ts

/**
 * 远程技能索引格式（与 OpenCode 兼容）
 */
export interface RemoteSkillIndex {
  skills: Array<{
    name: string;
    description?: string;
    files: string[];
  }>;
}

/**
 * HTTP Source 配置选项
 */
export interface HttpSourceOptions {
  /** 远程技能索引 URL（如 https://example.com/.well-known/skills/） */
  url: string;
  /** 缓存目录（默认: ~/.cache/skill-toolbox/http） */
  cacheDir?: string;
  /** 请求超时（毫秒，默认: 30000） */
  timeout?: number;
  /** 强制刷新缓存 */
  forceRefresh?: boolean;
}
```

**Step 3: 实现 HttpSource**

```typescript
// packages/sources/http/src/index.ts

import { mkdir, readFile, writeFile, stat } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { createHash } from 'crypto';
import type { SkillSource, SourceInfo, SourceLoadResult, LoadedSkill } from '@skill-toolbox/utils';
import type { HttpSourceOptions, RemoteSkillIndex } from './types';

/**
 * HTTP Source - 从远程 URL 发现和拉取技能
 *
 * 使用方法：
 * ```typescript
 * const httpSource = new HttpSource({
 *   url: 'https://example.com/.well-known/skills/'
 * });
 * ```
 */
export class HttpSource implements SkillSource {
  private options: Required<Omit<HttpSourceOptions, 'cacheDir'>> & { cacheDir: string };
  private cachePath: string;

  constructor(options: HttpSourceOptions) {
    this.options = {
      url: options.url.endsWith('/') ? options.url : `${options.url}/`,
      cacheDir: options.cacheDir ?? join(homedir(), '.cache', 'skill-toolbox', 'http'),
      timeout: options.timeout ?? 30000,
      forceRefresh: options.forceRefresh ?? false,
    };

    // 使用 URL hash 作为缓存目录名
    const urlHash = createHash('md5').update(options.url).digest('hex').slice(0, 8);
    this.cachePath = join(this.options.cacheDir, urlHash);
  }

  getSourceInfo(): SourceInfo {
    const url = new URL(this.options.url);
    return {
      type: 'git', // 标记为 git 以便与其他远程源区分
      category: 'git',
      identifier: `http:${url.hostname}`,
    };
  }

  async load(): Promise<SourceLoadResult> {
    const skills: LoadedSkill[] = [];
    const errors: SourceLoadResult['errors'] = [];

    try {
      // 1. 获取或刷新缓存
      await this.ensureCache();

      // 2. 从缓存加载技能
      const index = await this.loadIndex();
      if (!index?.skills) {
        return { skills, errors, info: { ...this.getSourceInfo(), path: this.cachePath } };
      }

      // 3. 加载每个技能
      for (const skillInfo of index.skills) {
        try {
          const skillFile = join(this.cachePath, skillInfo.name, 'SKILL.md');
          const content = await readFile(skillFile, 'utf-8');

          skills.push({
            name: `${this.getSourceInfo().identifier}/${skillInfo.name}`,
            baseName: skillInfo.name,
            source: this.getSourceInfo().identifier,
            path: skillFile,
            directory: join(this.cachePath, skillInfo.name),
            content,
          });
        } catch (error) {
          errors.push({
            path: skillInfo.name,
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      }
    } catch (error) {
      errors.push({
        path: this.options.url,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }

    return {
      skills,
      errors,
      info: { ...this.getSourceInfo(), path: this.cachePath },
    };
  }

  private async ensureCache(): Promise<void> {
    const indexFile = join(this.cachePath, 'index.json');
    const needsRefresh = this.options.forceRefresh || !(await this.fileExists(indexFile));

    if (needsRefresh) {
      await this.refreshCache();
    }
  }

  private async refreshCache(): Promise<void> {
    // 1. 获取 index.json
    const indexUrl = new URL('index.json', this.options.url).href;
    const response = await fetch(indexUrl, {
      signal: AbortSignal.timeout(this.options.timeout),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch index: ${response.status}`);
    }

    const index: RemoteSkillIndex = await response.json();

    // 2. 创建缓存目录
    await mkdir(this.cachePath, { recursive: true });

    // 3. 下载每个技能的文件
    for (const skill of index.skills) {
      const skillDir = join(this.cachePath, skill.name);
      await mkdir(skillDir, { recursive: true });

      for (const file of skill.files) {
        const fileUrl = new URL(`${skill.name}/${file}`, this.options.url).href;
        const filePath = join(skillDir, file);

        try {
          const fileResponse = await fetch(fileUrl, {
            signal: AbortSignal.timeout(this.options.timeout),
          });

          if (fileResponse.ok) {
            const content = await fileResponse.text();
            await writeFile(filePath, content, 'utf-8');
          }
        } catch {
          // 忽略单个文件下载失败
        }
      }
    }

    // 4. 保存 index.json
    await writeFile(join(this.cachePath, 'index.json'), JSON.stringify(index, null, 2));
  }

  private async loadIndex(): Promise<RemoteSkillIndex | null> {
    try {
      const content = await readFile(join(this.cachePath, 'index.json'), 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await stat(path);
      return true;
    } catch {
      return false;
    }
  }

  async cleanup(): Promise<void> {
    // 保留缓存，不清理
  }
}

export type { RemoteSkillIndex, HttpSourceOptions } from './types';
```

---

## Task 4: 更新 core/factory.ts 支持新 Source 类型

**Files:**
- Modify: `packages/core/src/factory.ts`

**Step 1: 扩展 SourceConfig 类型**

```typescript
// 在 factory.ts 中添加

import { DiscoverySource } from '@skill-toolbox/discovery-source';
import { HttpSource } from '@skill-toolbox/http-source';

export interface SourceConfig {
  type: 'filesystem' | 'git' | 'discovery' | 'http';
  // filesystem
  path?: string;
  category?: 'local' | 'global';
  // git
  url?: string;
  branch?: string;
  skillPath?: string;
  // http
  cacheDir?: string;
  timeout?: number;
  // discovery
  projectDir?: string;
  worktreeRoot?: string;
  externalDirs?: string[];
}

export function createSource(config: SourceConfig): SkillSource {
  switch (config.type) {
    case 'filesystem':
      return new FilesystemSource({
        path: config.path!,
        category: config.category,
      });

    case 'git':
      return new GitSource({
        source: config.url!,
        branch: config.branch,
        skillPath: config.skillPath,
      });

    case 'discovery':
      return new DiscoverySource({
        projectDir: config.projectDir,
        worktreeRoot: config.worktreeRoot,
        externalDirs: config.externalDirs,
      });

    case 'http':
      return new HttpSource({
        url: config.url!,
        cacheDir: config.cacheDir,
        timeout: config.timeout,
      });

    default:
      throw new Error(`Unknown source type: ${(config as any).type}`);
  }
}

export function createSources(configs: SourceConfig[]): SkillSource[] {
  return configs.map(createSource);
}
```

---

## Task 5: 更新文档和导出

**Files:**
- Modify: `packages/core/package.json` - 添加新依赖
- Modify: `README.md` - 更新使用示例
- Create: `docs/DISCOVERY.md` - 发现机制文档

**Step 1: 更新 core/package.json**

```json
{
  "dependencies": {
    "@skill-toolbox/utils": "workspace:*",
    "@skill-toolbox/git-source": "workspace:*",
    "@skill-toolbox/filesystem-source": "workspace:*",
    "@skill-toolbox/discovery-source": "workspace:*",
    "@skill-toolbox/http-source": "workspace:*"
  }
}
```

**Step 2: 更新 README 使用示例**

```markdown
### 使用自动发现

\`\`\`typescript
import { SkillLoader } from '@skill-toolbox/core';
import { DiscoverySource } from '@skill-toolbox/discovery-source';
import { HttpSource } from '@skill-toolbox/http-source';

// 自动发现 ~/.claude/skills 和项目中的 .claude/skills
const discoverySource = new DiscoverySource({
  projectDir: process.cwd(),
  externalDirs: ['.claude', '.agents'],
});

// 从远程 URL 拉取技能
const httpSource = new HttpSource({
  url: 'https://example.com/.well-known/skills/',
});

const loader = new SkillLoader({
  sources: [discoverySource, httpSource],
});

const { skills } = await loader.loadAll();
\`\`\`
```

---

## 执行优先级

1. **Task 1** - YAML 容错（影响现有用户体验）
2. **Task 2** - DiscoverySource（核心新功能）
3. **Task 3** - HttpSource（远程发现）
4. **Task 4** - Factory 更新（集成）
5. **Task 5** - 文档更新
