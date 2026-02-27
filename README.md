# Skill Toolbox

A plugin-based skill discovery and integration tool for managing Claude Code skills.

## Features

- 📦 **Monorepo Structure** - pnpm workspaces
- 🔌 **Plugin System** - Extensible architecture
- 📝 **CLI Tool** - Command-line interface for managing skills
- 🔍 **Git Integration** - Install skills from Git repositories
- 🎯 **TypeScript** - Full type safety

## Packages

- `@skill-toolbox/core` - Core parsing engine
- `@skill-toolbox/utils` - Shared utilities and types
- `@skill-toolbox/git-source` - Git repository adapter
- `@skill-toolbox/cli` - Command-line interface
- `@skill-toolbox/plugin-metadata` - Metadata parsing plugin

## Quick Start

### Install Dependencies

```bash
pnpm install
```

### Build All Packages

```bash
pnpm build
```

### Run Tests

```bash
pnpm test
```

### Use CLI

```bash
# Build CLI
pnpm cli:build

# Install a skill
node packages/cli/dist/index.js install user/skill-repo

# List skills
node packages/cli/dist/index.js list

# Validate a skill
node packages/cli/dist/index.js validate ./skills/my-skill
```

## Development

### Project Structure

```
packages/
├── core/           # Core parsing engine
├── utils/          # Shared utilities
├── git-source/     # Git adapter
├── cli/            # CLI tool
└── plugins/
    └── metadata/   # Metadata plugin
```

### Testing

Each package has its own test suite using Vitest.

```bash
# Test all packages
pnpm test

# Test specific package
cd packages/core && pnpm test
```

## License

MIT
