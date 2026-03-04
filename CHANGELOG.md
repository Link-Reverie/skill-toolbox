# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2025-03-04

### Added

- **Core Package** (`@skill-toolbox/core`)
  - `SkillParser` - Parse markdown to skill intermediate representation
  - `SkillLoader` - Load skills from multiple sources
  - `PluginManager` - Manage plugin pipeline
  - `createSources` factory function

- **Utils Package** (`@skill-toolbox/utils`)
  - Type definitions: `Skill`, `SkillIR`, `SkillMetadata`, `SkillPlugin`
  - Source types: `SkillSource`, `SourceInfo`, `LoadedSkill`
  - Utility functions: `findSkillFile`

- **Git Source** (`@skill-toolbox/git-source`)
  - Clone and cache Git repositories
  - Support for GitHub shorthand (`user/repo`)
  - Support for custom paths within repos (`user/repo:path`)
  - Shallow clone support

- **Filesystem Source** (`@skill-toolbox/filesystem-source`)
  - Load skills from local directories
  - Single file or directory support
  - Source categorization (local/global)

- **Metadata Plugin** (`@skill-toolbox/plugin-metadata`)
  - Parse YAML frontmatter
  - Required fields: `name`, `description`
  - Optional fields: `version`, `author`, `tags`, `license`

- **CLI** (`@skill-toolbox/cli`)
  - `install` command - Install skills from Git or local paths
  - `list` command - List installed skills
  - `validate` command - Validate skill format

- **Agent Example** (`@skill-toolbox/agent`)
  - Interactive AI chat agent
  - Multi-source skill loading
  - Tool execution (read, write, bash)
  - Conversation history management

[0.0.1]: https://github.com/your-username/skill-toolbox/releases/tag/v0.0.1
