# @skill-toolbox/filesystem-source

Filesystem source adapter for skill-toolbox. Enables loading skills from local directories and files.

## Installation

```bash
npm install @skill-toolbox/filesystem-source
# or
pnpm add @skill-toolbox/filesystem-source
# or
yarn add @skill-toolbox/filesystem-source
```

## Usage

### Basic Usage

```typescript
import { FilesystemSource } from '@skill-toolbox/filesystem-source';
import { SkillLoader } from '@skill-toolbox/core';

// Create a filesystem source
const fsSource = new FilesystemSource({
  path: './skills',
});

// Use with SkillLoader
const loader = new SkillLoader({ sources: [fsSource] });
const skills = await loader.loadAll();
```

### With Options

```typescript
import { FilesystemSource } from '@skill-toolbox/filesystem-source';

const fsSource = new FilesystemSource({
  // Path to skills directory or file (required)
  path: './skills',

  // Display name (default: 'filesystem' or 'global' for global skills)
  name: 'my-local-skills',

  // Category (default: 'local' or 'global' based on name)
  category: 'local',
});
```

### Using with Factory

```typescript
import { createSources } from '@skill-toolbox/core';
import { FilesystemSource } from '@skill-toolbox/filesystem-source';

const sources = createSources(
  [
    { type: 'filesystem', path: './skills', name: 'local' },
    { type: 'filesystem', path: '~/.claude/skills', name: 'global' },
  ],
  { FilesystemSource }
);
```

## Features

- **Single Skill Loading**: Load a skill from a directory containing a SKILL.md file
- **Multi-Skill Discovery**: Discover multiple skills in subdirectories
- **Direct File Loading**: Load a skill directly from a SKILL.md file
- **Relative Path Support**: Use relative paths resolved from current directory
- **Global Skills**: Load skills from global directories like `~/.claude/skills`

## Skill Discovery

The filesystem source discovers skills by:

1. **Directory with SKILL.md**: If the path points to a directory containing `SKILL.md`, loads that single skill
2. **Directory with subdirectories**: If the path points to a directory with subdirectories, discovers all skills in subdirectories that contain `SKILL.md`
3. **Direct file**: If the path points to a `.md` file, loads it directly as a skill

### Example directory structure

```
skills/
├── SKILL.md              # Single skill mode
└── subdirectory/
    ├── SKILL.md          # Discovered as separate skill
    └── other-file.md
```

## Source Info

The source provides the following info:

```typescript
{
  type: 'filesystem',
  category: 'local', // or 'global'
  identifier: 'my-local-skills', // or provided name
  path: '/absolute/path/to/skills'
}
```

## API

### `constructor(options: FilesystemSourceOptions)`

Creates a new FilesystemSource instance.

#### Options

- `path: string` - **Required**. Path to skills directory or file
- `name?: string` - Display name (default: `'filesystem'` or `'global'`)
- `category?: SourceCategory` - Category override (default: inferred from name)

### `load(): Promise<SourceLoadResult>`

Loads skills from the configured path.

### `getSourceInfo(): SourceInfo`

Returns source metadata.

### `cleanup(): Promise<void>`

Cleanup resources (no-op for this source).

## Error Handling

The source handles various error scenarios:
- Path does not exist
- Invalid skill files
- Permission errors

Errors are returned in the `errors` array of `SourceLoadResult`:
```typescript
const result = await fsSource.load();
if (result.errors.length > 0) {
  console.error('Failed to load skills:', result.errors);
}
```

## License

MIT
