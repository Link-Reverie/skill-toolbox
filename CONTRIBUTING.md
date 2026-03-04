# Contributing to Skill Toolbox

Thank you for your interest in contributing to Skill Toolbox! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

Be respectful and inclusive. We welcome contributions from everyone.

## Development Setup

### Prerequisites

- Node.js 18 or higher
- pnpm 8 or higher

### Getting Started

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/skill-toolbox.git
cd skill-toolbox

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

## Project Structure

```
skill-toolbox/
├── packages/
│   ├── core/              # Core parsing engine
│   │   ├── src/
│   │   │   ├── parser/    # SkillParser implementation
│   │   │   ├── plugin/    # PluginManager implementation
│   │   │   ├── SkillLoader.ts
│   │   │   └── factory.ts
│   │   └── package.json
│   ├── utils/             # Shared types and utilities
│   │   ├── src/
│   │   │   ├── types/     # TypeScript interfaces
│   │   │   └── skill-utils.ts
│   │   └── package.json
│   ├── git-source/        # Git repository adapter
│   ├── filesystem-source/ # Filesystem adapter
│   ├── cli/               # CLI tool
│   └── plugins/
│       └── metadata/      # YAML frontmatter plugin
├── apps/
│   └── agent/             # Example AI agent
└── skills/                # Local skill storage
```

## Making Changes

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Your Changes

- Write clean, readable code
- Follow existing patterns in the codebase
- Add tests for new functionality
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run all tests
pnpm test

# Run tests for specific package
cd packages/core && pnpm test

# Run tests in watch mode
pnpm test:watch
```

### 4. Build Your Changes

```bash
pnpm build
```

## Coding Standards

### TypeScript

- Use strict TypeScript configuration
- Define explicit types for all public APIs
- Avoid `any` type when possible
- Use interfaces for object shapes

### Code Style

- Use meaningful variable and function names
- Keep functions small and focused
- Add JSDoc comments for public APIs

```typescript
/**
 * Parses markdown content into a Skill object.
 * @param content - Raw markdown content
 * @returns Parsed skill with metadata and sections
 */
export function parseSkill(content: string): Skill {
  // ...
}
```

### File Naming

- Use kebab-case for file names: `skill-loader.ts`
- Use PascalCase for class names: `SkillLoader`
- Use camelCase for functions and variables: `loadSkills`

## Commit Guidelines

We follow conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(core): add support for custom skill parsers
fix(git-source): handle shallow clone correctly
docs(readme): update installation instructions
test(utils): add tests for findSkillFile function
```

## Pull Request Process

### 1. Before Submitting

- [ ] All tests pass
- [ ] Code builds successfully
- [ ] Documentation is updated
- [ ] Commit messages follow guidelines

### 2. Submit PR

- Push your branch to your fork
- Open a pull request against `main`
- Fill out the PR template

### 3. PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Checklist
- [ ] Tests pass
- [ ] Documentation updated
- [ ] Commit messages follow guidelines
```

### 4. Review Process

- Maintainers will review your PR
- Address any feedback
- Once approved, a maintainer will merge

## Need Help?

- Open an issue for bugs or feature requests
- Start a discussion for questions

Thank you for contributing!
