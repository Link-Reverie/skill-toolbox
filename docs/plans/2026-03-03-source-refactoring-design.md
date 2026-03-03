# Source Design Refactoring

## Overview

Refactor the SkillSource design to improve usability, naming consistency, and type safety.

## Changes

### 1. GitSource skillPath Default Value

**Current**: Default is `'skills'`
**New**: Default is `''` (root directory)

```typescript
// GitSource.ts
this.skillPath = options.skillPath ?? '';  // Empty string means root directory
```

### 2. Naming Unification

| Original | New | Location |
|----------|-----|----------|
| `options.name` | `name` | Constructor param |
| `this.displayName` | `this.name` | GitSource internal |
| `this.sourceId` | `this.name` | FilesystemSource internal |
| `LoadedSkill.sourceId` | `LoadedSkill.source` | Return data |

### 3. Category Unification

Add optional `category` parameter with smart inference:

```typescript
// types/source.ts
interface SourceOptions {
  name?: string;
  category?: SourceCategory;  // New optional param
}

// FilesystemSource - inference rule
const defaultCategory = name === 'global' ? 'global' : 'local';

// GitSource - default 'git'
const defaultCategory = 'git';
```

### 4. Type Safety

Separate types for pre-load and post-load state:

```typescript
// types/source.ts

// Info before load()
interface SourceInfo {
  type: SourceType;
  category: SourceCategory;
  identifier: string;
}

// Info after load() (extended)
interface LoadedSourceInfo extends SourceInfo {
  path: string;  // Always exists after load
}

// Updated SourceLoadResult
interface SourceLoadResult {
  skills: LoadedSkill[];
  errors: Array<{ path: string; error: Error }>;
  info: LoadedSourceInfo;  // New: full info after load
}
```

### 5. Convenience API

Add factory function for easier usage:

```typescript
// core/src/factory.ts

interface SourceConfig =
  | {
      type: 'filesystem';
      path: string;
      name?: string;
      category?: SourceCategory;
    }
  | {
      type: 'git';
      source: string;
      skillPath?: string;
      name?: string;
      category?: SourceCategory;
      cacheDir?: string;
      shallow?: boolean;
    };

function createSkillLoader(options: {
  sources: SourceConfig[];
  plugins?: Plugin[];
}): SkillLoader;

// Usage example
const loader = createSkillLoader({
  sources: [
    { type: 'filesystem', path: './skills' },
    { type: 'git', source: 'user/repo', skillPath: '' },
  ],
});
```

## Files to Modify

| File | Changes |
|------|---------|
| `packages/utils/src/types/source.ts` | Add `LoadedSourceInfo`, modify `SourceLoadResult`, `sourceId` → `source` |
| `packages/filesystem-source/src/FilesystemSource.ts` | `sourceId` → `name`, add `category` param |
| `packages/git-source/src/GitSource.ts` | `skillPath` default, `displayName` → `name`, add `category` param |
| `packages/core/src/factory.ts` | New file - `createSkillLoader()` |
| `packages/core/src/index.ts` | Export factory |
| `apps/agent/src/skills/loader.ts` | Update usage |

## Breaking Changes

1. `LoadedSkill.sourceId` → `LoadedSkill.source`
2. `SourceLoadResult` now includes `info` field
3. GitSource `skillPath` default changed from `'skills'` to `''`

## Migration Guide

```typescript
// Before
const skill = result.skills[0];
console.log(skill.sourceId);

// After
const skill = result.skills[0];
console.log(skill.source);
```
