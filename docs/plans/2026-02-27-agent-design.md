# Skill-Enhanced AI Chat Agent Design

**Date:** 2026-02-27
**Status:** Design Complete

## Overview

Create a skill-enhanced AI chat agent application that demonstrates how to use skill-toolbox packages. The agent automatically loads skills on startup, users chat directly with the AI, skills are injected as system prompts, and the AI can invoke tools to execute operations in a sandbox.

## Goals

- Demonstrate skill-toolbox package usage in a real application
- Provide a working example of skill-based AI agent
- Showcase integration with Anthropic Claude API
- Implement safe tool execution in sandboxed environment

## Architecture

### Components

1. **Agent (Main Controller)**
   - Manages loaded skills
   - Handles conversation history
   - Coordinates tool execution
   - Manages LLM client

2. **LLM Client**
   - Anthropic Messages API integration
   - Message formatting
   - Response parsing

3. **Skill Loader**
   - Auto-load skills from `./skills` directory
   - Use SkillParser + metadataPlugin
   - Convert skills to system prompts

4. **Tool System**
   - Tool registry (read, write, bash)
   - Anthropic tools specification compliance
   - Sandboxed execution

5. **REPL Interface**
   - User chat input
   - Management commands (/help, /skills, /install, etc.)
   - Response display

### Tech Stack

- **@anthropic-ai/sdk** - Anthropic API client
- **@skill-toolbox/core** - Skill parsing
- **@skill-toolbox/git-source** - Skill installation
- **@skill-toolbox/plugin-metadata** - Metadata parsing
- **@skill-toolbox/utils** - Shared types
- **vm2** - Code execution sandbox
- **inquirer** - Interactive REPL
- **chalk** - Terminal colors

## Core Flows

### Startup Flow

```
1. Load configuration from .env
2. Initialize Agent
3. Scan ./skills directory
4. For each skill:
   - Use SkillParser + metadataPlugin
   - Parse SKILL.md
   - Store in skills map
5. Build system prompt from all skills
6. Initialize tool registry
7. Connect to Anthropic API
8. Start REPL loop
```

### Chat Flow

```
User Input
  ↓
Agent.chat(userMessage)
  ↓
Build request:
  - system: merged skills as prompt
  - messages: history + new message
  - tools: tool definitions
  ↓
Call Anthropic API
  ↓
Response handling:
  - If text: display, done
  - If tool_use: execute tool → tool_result → retry
  ↓
Save to conversation history
```

### Tool Execution Flow

```
Tool call received (name + input)
  ↓
Permission check
  ↓
Sandbox execution:
  - read: readFile with path validation
  - write: writeFile with path validation
  - bash: exec with command whitelist
  ↓
Return result or error message
```

### REPL Command Flow

```
User input starts with '/'
  ↓
Parse command and arguments
  ↓
Execute command:
  - /help: Show help
  - /skills: List loaded skills
  - /install <source>: Install skill via GitSource
  - /reload: Reload all skills
  - /clear: Clear conversation
  - /exit: Exit application
```

## Tool Definitions

### Read Tool
```json
{
  "name": "read",
  "description": "Read file content",
  "input_schema": {
    "type": "object",
    "properties": {
      "path": { "type": "string", "description": "File path to read" }
    },
    "required": ["path"]
  }
}
```

### Write Tool
```json
{
  "name": "write",
  "description": "Write content to file",
  "input_schema": {
    "type": "object",
    "properties": {
      "path": { "type": "string", "description": "File path to write" },
      "content": { "type": "string", "description": "Content to write" }
    },
    "required": ["path", "content"]
  }
}
```

### Bash Tool
```json
{
  "name": "bash",
  "description": "Execute bash command",
  "input_schema": {
    "type": "object",
    "properties": {
      "command": { "type": "string", "description": "Bash command to execute" }
    },
    "required": ["command"]
  }
}
```

## Security

### Sandbox Restrictions

- File operations limited to current directory and subdirectories
- Bash command blacklist: `rm -rf`, `sudo`, `chmod`, `chown`, etc.
- Execution timeout: 30 seconds
- Memory limit: 512MB
- No network access from sandbox

### Permission Model

- All tools require user confirmation (optional, can be disabled)
- Path validation prevents directory traversal
- Command whitelist for bash execution

## File Structure

```
apps/agent/
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript config
├── .env                      # Environment variables
├── .env.example              # Example configuration
├── src/
│   ├── index.ts              # Entry point
│   ├── agent.ts              # Agent main class
│   ├── llm/
│   │   └── client.ts         # Anthropic API wrapper
│   ├── skills/
│   │   ├── loader.ts         # Load skills from directory
│   │   └── prompt.ts         # Build system prompt
│   ├── tools/
│   │   ├── registry.ts       # Tool registration
│   │   ├── read.ts           # Read file tool
│   │   ├── write.ts          # Write file tool
│   │   ├── bash.ts           # Bash command tool
│   │   └── sandbox.ts        # Sandbox executor
│   └── repl/
│       └── commands.ts       # REPL command handlers
├── skills/                   # Skills directory (auto-created)
└── README.md                 # Usage documentation
```

## Configuration

### Environment Variables

```bash
# Anthropic API
ANTHROPIC_API_KEY=sk-ant-xxx
ANTHROPIC_MODEL=claude-sonnet-4-6
ANTHROPIC_MAX_TOKENS=4096

# Sandbox
SANDBOX_TIMEOUT=30000
SANDBOX_MAX_MEMORY=512MB
ALLOWED_COMMANDS=ls,cat,echo,node,npm,pnpm

# Skills
SKILLS_DIR=./skills
```

### Default Configuration

```typescript
const config = {
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
  maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '4096'),
  skillsDir: process.env.SKILLS_DIR || './skills',
  sandbox: {
    timeout: parseInt(process.env.SANDBOX_TIMEOUT || '30000'),
    maxMemory: process.env.SANDBOX_MAX_MEMORY || '512MB',
    allowedCommands: process.env.ALLOWED_COMMANDS?.split(',') || [
      'ls', 'cat', 'echo', 'node', 'npm', 'pnpm'
    ]
  }
}
```

## Error Handling

### Error Types

1. **API Errors**
   - Rate limiting (429): Wait and retry
   - Authentication (401): Show error, exit
   - Network errors: Retry with backoff

2. **Tool Execution Errors**
   - Invalid paths: Return error message to AI
   - Permission denied: Return error message
   - Timeout: Kill process, return error

3. **Skill Loading Errors**
   - Invalid skill format: Skip skill, log warning
   - Missing files: Skip skill
   - Continue with valid skills

### Recovery Strategy

- All errors caught and handled gracefully
- AI receives error messages as tool_result
- Agent continues running after errors
- User can restart conversation with /clear

## Testing Strategy

### Unit Tests

- Agent skill loading
- System prompt building
- Tool execution
- Command parsing

### Integration Tests

- Full chat flow with mock API
- Tool execution with sandbox
- Skill installation flow

### Manual Testing

- Load real skills
- Test with actual Anthropic API
- Verify tool execution
- Test REPL commands

## Usage Example

### Installation

```bash
cd apps/agent
pnpm install
```

### Configuration

```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

### Running

```bash
pnpm start

🤖 Agent started with 2 skills loaded:
  - code-reviewer@1.0.0
  - test-generator@1.0.0

You: 帮我审查 src/index.ts 文件

Agent: [Uses code-reviewer skill, calls read tool, analyzes code...]
       [Returns review results]

You: /skills

Skills loaded:
  1. code-reviewer@1.0.0 - Code review assistant
  2. test-generator@1.0.0 - Generate unit tests

You: /install skill-toolbox/doc-writer

Installing skill from skill-toolbox/doc-writer...
✓ Skill "doc-writer" installed and loaded!

You: /exit
```

## Key Code Examples

### Using skill-toolbox

```typescript
import { SkillParser } from '@skill-toolbox/core'
import { metadataPlugin } from '@skill-toolbox/plugin-metadata'
import { GitSource } from '@skill-toolbox/git-source'

// Load skill from file
const parser = new SkillParser().use(metadataPlugin())
const markdown = await fs.readFile('./skills/my-skill/SKILL.md', 'utf-8')
const skill = await parser.parse(markdown)

// Install skill from Git
const gitSource = new GitSource()
const resolved = await gitSource.resolve('user/skill-repo')
const tempDir = await gitSource.clone(resolved.url)
await fs.copy(tempDir, './skills/my-skill')
```

### Building System Prompt

```typescript
buildSystemPrompt(): string {
  const skillPrompts = Array.from(this.skills.values())
    .map(skill => {
      return `---
name: ${skill.metadata.name}
version: ${skill.metadata.version}
---

${skill.raw.markdown}`
    })

  return `You are an AI assistant with the following skills:

${skillPrompts.join('\n\n---\n\n')}

Use these skills to help the user. You have access to tools for file operations and command execution.`
}
```

## Success Criteria

- ✅ Agent loads skills automatically on startup
- ✅ Users can chat naturally with the AI
- ✅ Skills are used as system prompts
- ✅ AI can invoke tools (read, write, bash)
- ✅ Tools execute in sandboxed environment
- ✅ REPL commands work correctly
- ✅ Clear documentation and examples
- ✅ Demonstrates skill-toolbox usage

## Future Enhancements

- Multi-turn skill context
- Dynamic skill switching
- Tool confirmation prompts
- Skill marketplace integration
- Conversation export/import
- Web UI version
