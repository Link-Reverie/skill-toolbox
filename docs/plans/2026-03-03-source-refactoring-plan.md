# Source Refactoring Implementation Plan

## Step 1: Update Type Definitions

**File**: `packages/utils/src/types/source.ts`

- [ ] Rename `LoadedSkill.sourceId` to `LoadedSkill.source`
- [ ] Add `LoadedSourceInfo` interface extending `SourceInfo`
- [ ] Add `info: LoadedSourceInfo` to `SourceLoadResult`
- [ ] Add optional `category` to base source options

## Step 2: Update FilesystemSource

**File**: `packages/filesystem-source/src/FilesystemSource.ts`

- [ ] Rename `sourceId` to `name` internally
- [ ] Add optional `category` parameter to `FilesystemSourceOptions`
- [ ] Update category inference logic
- [ ] Return `info` in `load()` result
- [ ] Update all references to use `source` instead of `sourceId`

## Step 3: Update GitSource

**File**: `packages/git-source/src/GitSource.ts`

- [ ] Change `skillPath` default from `'skills'` to `''`
- [ ] Rename `displayName` to `name` internally
- [ ] Add optional `category` parameter to `GitSourceOptions`
- [ ] Update category inference logic
- [ ] Return `info` in `load()` result
- [ ] Update all references to use `source` instead of `sourceId`

## Step 4: Create Factory Function

**File**: `packages/core/src/factory.ts` (new)

- [ ] Define `SourceConfig` union type
- [ ] Implement `createSkillLoader()` function
- [ ] Handle source instantiation based on type
- [ ] Apply default plugins if not specified

## Step 5: Update Exports

**File**: `packages/core/src/index.ts`

- [ ] Export `createSkillLoader` and `SourceConfig`

## Step 6: Update Tests

**Files**:
- `packages/filesystem-source/src/__tests__/FilesystemSource.test.ts`
- `packages/git-source/src/__tests__/GitSource.test.ts`

- [ ] Update tests for `source` instead of `sourceId`
- [ ] Add tests for `category` parameter
- [ ] Add tests for new `info` field in result

## Step 7: Update Consumer

**File**: `apps/agent/src/skills/loader.ts`

- [ ] Update to use new API
- [ ] Optionally migrate to `createSkillLoader()` if beneficial

## Verification

- [ ] Run all tests: `pnpm test`
- [ ] Build all packages: `pnpm build`
- [ ] Verify no breaking changes in consumer apps