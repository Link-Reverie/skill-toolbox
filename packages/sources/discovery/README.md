# @skill-toolbox/discovery-source

Auto-discovery source for skills in multiple directories (.claude, .agents, etc.)

## Features

- **Walk-up directory traversal**: Searches for skills directories starting from the current directory and walking up the directory tree
- **Multiple discovery locations**: Supports discovering skills from `.claude/skills`, `.agents/skills`, and custom directories
- **Global and project-level skills**: Can include both global (user home) and project-level skill directories
- **Configurable scope**: Control which directories to search with flexible options

## Installation

```bash
npm install @skill-toolbox/discovery-source
# or
pnpm add @skill-toolbox/discovery-source
# or
yarn add @skill-toolbox/discovery-source
```

## Usage

### Basic Usage

```typescript
import { DiscoverySource } from '@skill-toolbox/discovery-source';
import { SkillLoader } from '@skill-toolbox/core';

// Create a discovery source
const discoverySource = new DiscoverySource();

// Use with SkillLoader
const loader = new SkillLoader({ sources: [discoverySource] });
const skills = await loader.loadAll();
```

### With Options

```typescript
import { DiscoverySource } from '@skill-toolbox/discovery-source';

const discoverySource = new DiscoverySource({
  // Starting directory for discovery (default: process.cwd())
  projectDir: '/path/to/project',

  // Stop upward traversal at this directory
  worktreeRoot: '/path/to/worktree/root',

  // Custom external directories to discover (default: ['.claude', '.agents'])
  externalDirs: ['.claude', '.agents', '.custom'],

  // Include global directories like ~/.claude/skills (default: true)
  includeGlobal: true,

  // Include project-level directories (default: true)
  includeProject: true,
});
```

### Using with Factory

```typescript
import { createSources } from '@skill-toolbox/core';
import { DiscoverySource } from '@skill-toolbox/discovery-source';

const sources = createSources(
  [
    { type: 'discovery', projectDir: process.cwd() },
  ],
  { DiscoverySource }
);
```

## Discovery Algorithm

The discovery source uses a walk-up pattern to find skill directories:

1. Start from `projectDir` (or `process.cwd()` if not specified)
2. Look for `.claude/skills` and `.agents/skills` (or custom `externalDirs`) in the current directory
3. If found, add to the list of skill directories
4. Move to the parent directory and repeat
5. Stop when reaching `worktreeRoot` or filesystem root

If `includeGlobal` is true, also includes:
- `~/.claude/skills`
- `~/.agents/skills`

## Source Info

The source provides the following info:

```typescript
{
  type: 'filesystem',
  category: 'local',
  identifier: 'discovery',
  path: '/first/discovered/skills/directory'
}
```

## API

### `constructor(options?: DiscoverySourceOptions)`

Creates a new DiscoverySource instance.

#### Options

- `projectDir?: string` - Starting directory for discovery
- `worktreeRoot?: string` - Stop upward traversal at this directory
- `externalDirs?: string[]` - Custom external directory names (default: `['.claude', '.agents']`)
- `includeGlobal?: boolean` - Include global directories (default: `true`)
- `includeProject?: boolean` - Include project-level directories (default: `true`)

### `load(): Promise<SourceLoadResult>`

Loads all discovered skills.

### `getSourceInfo(): SourceInfo`

Returns source metadata.

### `cleanup(): Promise<void>`

Cleanup resources (no-op for this source).

## License

MIT
