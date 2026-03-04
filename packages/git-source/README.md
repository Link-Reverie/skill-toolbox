# @skill-toolbox/git-source

Git repository source adapter for skill-toolbox.

## Features

- **Remote repository support**: Load skills from any Git repository
- **Automatic cloning**: Handles repository cloning and caching
- **Branch and tag support**: Specify branches, tags, or commits
- **Shallow cloning**: Option for shallow clones to save space
- **Skill path configuration**: Load skills from subdirectories within the repository

## Installation

```bash
npm install @skill-toolbox/git-source
# or
pnpm add @skill-toolbox/git-source
# or
yarn add @skill-toolbox/git-source
```

## Usage

### Basic Usage

```typescript
import { GitSource } from '@skill-toolbox/git-source';
import { SkillLoader } from '@skill-toolbox/core';

// Create a Git source
const gitSource = new GitSource({
  source: 'user/skill-repo',
});

// Use with SkillLoader
const loader = new SkillLoader({ sources: [gitSource] });
const skills = await loader.loadAll();
```

### With Options

```typescript
import { GitSource } from '@skill-toolbox/git-source';

const gitSource = new GitSource({
  // Git repository source (required)
  source: 'user/skill-repo',

  // Skill path within repository (default: root)
  skillPath: 'docs/skills',

  // Display name (default: source)
  name: 'my-skills',

  // Category override (default: 'git')
  category: 'local',

  // Cache directory (default: ~/.cache/skill-toolbox/git)
  cacheDir: './cache',

  // Use shallow clone (default: true)
  shallow: true,
});
```

### Using with Factory

```typescript
import { createSources } from '@skill-toolbox/core';
import { GitSource } from '@skill-toolbox/git-source';

const sources = createSources(
  [
    { type: 'git', source: 'user/skill-repo', skillPath: 'skills' },
  ],
  { GitSource }
);
```

## Source Formats

The `source` option supports multiple formats:

### GitHub shorthand
```typescript
source: 'user/repo'  // Expands to https://github.com/user/repo
```

### Full Git URL
```typescript
source: 'https://github.com/user/repo.git'
source: 'git@github.com:user/repo.git'
```

### Branch/Tag/Commit
Specify a specific ref by appending `#ref`:
```typescript
source: 'user/repo#main'           // Branch
source: 'user/repo#v1.0.0'         // Tag
source: 'user/repo#abc123'         // Commit
```

## Caching

The Git source caches cloned repositories:
- Default location: `~/.cache/skill-toolbox/git/`
- Repository is cloned once and reused on subsequent loads
- Use `shallow: true` to minimize cache size

## Source Info

The source provides the following info:

```typescript
{
  type: 'git',
  category: 'git',
  identifier: 'user/repo',
  path: '~/.cache/skill-toolbox/git/user-repo'
}
```

## API

### `constructor(options: GitSourceOptions)`

Creates a new GitSource instance.

#### Options

- `source: string` - **Required**. Git repository source
- `skillPath?: string` - Skill path within repository (default: root)
- `name?: string` - Display name (default: source)
- `category?: SourceCategory` - Category override (default: 'git')
- `cacheDir?: string` - Cache directory (default: `~/.cache/skill-toolbox/git`)
- `shallow?: boolean` - Use shallow clone (default: `true`)

### `load(): Promise<SourceLoadResult>`

Loads skills from the Git repository.

### `getSourceInfo(): SourceInfo`

Returns source metadata.

### `cleanup(): Promise<void>`

Cleanup resources (removes cloned repository).

## Error Handling

The source handles various error scenarios:
- Repository not found
- Authentication failures
- Network errors
- Invalid skill files

Errors are returned in the `errors` array of `SourceLoadResult`:
```typescript
const result = await gitSource.load();
if (result.errors.length > 0) {
  console.error('Failed to load skills:', result.errors);
}
```

## Requirements

- Git must be installed and available in PATH
- Network access for cloning remote repositories

## License

MIT
