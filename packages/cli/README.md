# @skill-toolbox/cli

Command-line interface for managing Claude Code skills.

## Installation

```bash
pnpm add -g @skill-toolbox/cli
```

## Usage

### Install a Skill

```bash
# From GitHub
skill-toolbox install github:user/skill-repo

# From user/repo shorthand
skill-toolbox install user/skill-repo

# From local path
skill-toolbox install ./local/skill

# Custom installation directory
skill-toolbox install user/skill-repo --dir ./my-skills
```

### List Installed Skills

```bash
skill-toolbox list

# Custom skills directory
skill-toolbox list --dir ./my-skills
```

### Validate a Skill

```bash
# Validate skill file
skill-toolbox validate ./skills/my-skill/SKILL.md

# Validate skill directory
skill-toolbox validate ./skills/my-skill
```

## Commands

- `install <source>` - Install a skill from git or local path
- `list` - List installed skills
- `validate <path>` - Validate skill format

## Options

- `-d, --dir <directory>` - Skills directory (default: ./skills)
- `-h, --help` - Show help
- `-V, --version` - Show version

## License

MIT
