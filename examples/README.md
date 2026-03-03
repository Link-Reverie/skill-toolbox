# GitSource 快速参考

## 最常用法

```typescript
import { GitSource } from '@skill-toolbox/git-source';
import { SkillLoader, SkillParser } from '@skill-toolbox/core';
import { metadataPlugin } from '@skill-toolbox/plugin-metadata';

// 创建加载器
const loader = new SkillLoader({
  sources: [new GitSource()],
  parser: new SkillParser().use(metadataPlugin()),
});

// 加载技能
const result = await loader.loadFromSource('ComposioHQ/awesome-claude-skills:');
console.log(`Loaded ${result.skills.size} skills`);
```

## 源格式

| 格式 | 示例 | 说明 |
|------|------|------|
| `user/repo` | `anthropics/skills` | 从默认 `skills` 目录加载 |
| `user/repo:path` | `user/repo:docs/skills` | 从指定目录加载 |
| `user/repo:` | `ComposioHQ/awesome-claude-skills:` | 从根目录加载 |
| `github:user/repo` | `github:anthropics/skills` | GitHub 前缀格式 |
| 完整 URL | `https://github.com/user/repo.git` | 完整 Git URL |

## 仓库结构

### 标准结构（推荐）

```
skills-repo/
├── skills/              # 默认目录
│   ├── skill-a/
│   │   └── SKILL.md
│   └── skill-b/
│       └── SKILL.md
└── README.md
```

加载：`loader.loadFromSource('user/skills-repo')`

### 根目录结构

```
skills-repo/
├── skill-a/
│   └── SKILL.md
├── skill-b/
│   └── SKILL.md
└── README.md
```

加载：`loader.loadFromSource('user/skills-repo:')`

### 自定义路径

```
project/
├── docs/
│   └── skills/
│       └── skill-x/
│           └── SKILL.md
└── src/
```

加载：`loader.loadFromSource('user/project:docs/skills')`

## 缓存配置

### 不使用缓存（默认）

```typescript
const loader = new SkillLoader({
  sources: [new GitSource()],
  parser: new SkillParser().use(metadataPlugin()),
});
```

### 使用缓存

```typescript
const gitSource = new GitSource({
  defaultCacheDir: './skill-cache'
});

const loader = new SkillLoader({
  sources: [gitSource],
  parser: new SkillParser().use(metadataPlugin()),
});
```

## 完整示例

```typescript
import { GitSource } from '@skill-toolbox/git-source';
import { SkillLoader, SkillParser } from '@skill-toolbox/core';
import { metadataPlugin } from '@skill-toolbox/plugin-metadata';

async function loadSkills() {
  const loader = new SkillLoader({
    sources: [new GitSource()],
    parser: new SkillParser().use(metadataPlugin()),
  });

  const result = await loader.loadFromSource('ComposioHQ/awesome-claude-skills:');

  // 成功加载的技能
  console.log(`Loaded ${result.skills.size} skills:`);
  for (const [name, skill] of result.skills) {
    console.log(`  • ${name}`);
  }

  // 加载失败的文件
  if (result.errors.length > 0) {
    console.log(`\nFailed ${result.errors.length} files:`);
    result.errors.forEach(err => {
      console.log(`  • ${err.source}: ${err.error.message}`);
    });
  }
}

loadSkills().catch(console.error);
```

## 常见问题

### 1. 没有发现技能

**原因**: 技能不在默认的 `skills` 目录

**解决**: 使用 `user/repo:` 加载根目录，或 `user/repo:path` 指定路径

### 2. Missing frontmatter 错误

**原因**: SKILL.md 缺少必需字段

**解决**: 添加 frontmatter:

```markdown
---
name: my-skill
description: Skill description
---

# Content here
```

### 3. 加载速度慢

**原因**: 每次都克隆仓库

**解决**: 启用缓存:

```typescript
const gitSource = new GitSource({
  defaultCacheDir: './skill-cache'
});
```

## 更多信息

- 📖 [完整使用指南](../docs/git-source-usage.md)
- 🚀 [快速开始示例](./gitsource-quickstart.ts)
- 📦 [API 文档](../packages/git-source/README.md)
