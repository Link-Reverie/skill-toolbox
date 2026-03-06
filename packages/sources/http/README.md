# @skill-toolbox/http-source

HTTP source for loading skills from remote URLs.

## Features

- **Remote skill loading**: Load skills from any HTTP/HTTPS URL
- **Caching**: Automatic caching of fetched skill indexes
- **Configurable timeout**: Set custom request timeouts
- **Force refresh**: Bypass cache when needed

## Installation

```bash
npm install @skill-toolbox/http-source
# or
pnpm add @skill-toolbox/http-source
# or
yarn add @skill-toolbox/http-source
```

## Usage

### Basic Usage

```typescript
import { HttpSource } from '@skill-toolbox/http-source';
import { SkillLoader } from '@skill-toolbox/core';

// Create an HTTP source
const httpSource = new HttpSource({
  url: 'https://example.com/.well-known/skills/',
});

// Use with SkillLoader
const loader = new SkillLoader({ sources: [httpSource] });
const skills = await loader.loadAll();
```

### With Options

```typescript
import { HttpSource } from '@skill-toolbox/http-source';

const httpSource = new HttpSource({
  // Remote skill index URL (required)
  url: 'https://example.com/skills/',

  // Cache directory (default: ~/.cache/skill-toolbox/http)
  cacheDir: './cache',

  // Request timeout in milliseconds (default: 30000)
  timeout: 60000,

  // Force refresh cache (default: false)
  forceRefresh: true,
});
```

### Using with Factory

```typescript
import { createSources } from '@skill-toolbox/core';
import { HttpSource } from '@skill-toolbox/http-source';

const sources = createSources(
  [
    { type: 'http', url: 'https://example.com/skills/' },
  ],
  { HttpSource }
);
```

## Skill Index Format

The HTTP source expects a JSON index at the specified URL. The index should have the following format:

```json
{
  "version": "1.0.0",
  "skills": [
    {
      "name": "skill-name",
      "path": "skills/skill-name.md",
      "description": "Skill description"
    }
  ]
}
```

The source will:
1. Fetch the index from the provided URL
2. Cache it locally
3. Load each skill by resolving the skill path relative to the base URL

## Caching

The HTTP source caches:
- The skill index JSON file
- Individual skill markdown files

Cache location: `~/.cache/skill-toolbox/http/` (or custom `cacheDir`)

To bypass the cache:
```typescript
const source = new HttpSource({
  url: 'https://example.com/skills/',
  forceRefresh: true, // Always fetch fresh data
});
```

## Source Info

The source provides the following info:

```typescript
{
  type: 'git',
  category: 'global',
  identifier: 'https://example.com/skills/',
  path: '~/.cache/skill-toolbox/http/<url-hash>'
}
```

## API

### `constructor(options: HttpSourceOptions)`

Creates a new HttpSource instance.

#### Options

- `url: string` - **Required**. Remote skill index URL
- `cacheDir?: string` - Cache directory (default: `~/.cache/skill-toolbox/http`)
- `timeout?: number` - Request timeout in ms (default: `30000`)
- `forceRefresh?: boolean` - Bypass cache (default: `false`)

### `load(): Promise<SourceLoadResult>`

Loads skills from the remote URL.

### `getSourceInfo(): SourceInfo`

Returns source metadata.

### `cleanup(): Promise<void>`

Cleanup resources (clears cache if needed).

## Error Handling

The source handles various error scenarios:
- Network timeouts
- HTTP errors (404, 500, etc.)
- Invalid JSON responses
- Missing skill files

Errors are returned in the `errors` array of `SourceLoadResult`:
```typescript
const result = await httpSource.load();
if (result.errors.length > 0) {
  console.error('Failed to load skills:', result.errors);
}
```

## License

MIT
