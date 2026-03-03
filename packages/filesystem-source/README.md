# @skill-toolbox/filesystem-source

Filesystem source adapter for skill-toolbox. Enables loading skills from local directories and files.

## Installation

```bash
npm install @skill-toolbox/filesystem-source
```

## Usage

### Basic Usage

```typescript
import { FilesystemSource } from '@skill-toolbox/filesystem-source';

const source = new FilesystemSource();

// Check if source can handle a path
const canHandle = await source.canHandle('/path/to/skills');

// Resolve path to metadata
const meta = await source.resolve('/path/to/skills');

// Fetch (validates path exists)
const localPath = await source.fetch(meta);

// Discover skills
const skills = await source.discover(localPath, meta);
```

### With Custom Working Directory

```typescript
const source = new FilesystemSource({
  cwd: '/base/directory'
});

// Now relative paths are resolved from cwd
const meta = await source.resolve('./skills');
```

## Features

- **Single Skill Loading**: Load a skill from a directory containing a SKILL.md file
- **Multi-Skill Discovery**: Discover multiple skills in subdirectories
- **Direct File Loading**: Load a skill directly from a SKILL.md file
- **Relative Path Support**: Use relative paths with custom working directory

## API

### `FilesystemSource`

#### Constructor

```typescript
constructor(options?: FilesystemSourceOptions)
```

**Options:**
- `cwd` - Base directory for relative paths (default: `process.cwd()`)

#### Methods

##### `canHandle(source: string): Promise<boolean>`

Check if the source string is a valid filesystem path.

##### `resolve(source: string): Promise<SkillSourceMeta>`

Resolve the source string to metadata.

##### `fetch(meta: SkillSourceMeta, options?: FetchOptions): Promise<string>`

Validate and return the path (no actual fetching needed for filesystem).

##### `discover(localPath: string, meta: SkillSourceMeta): Promise<DiscoveredSkill[]>`

Discover skills in the given path.

## License

MIT
