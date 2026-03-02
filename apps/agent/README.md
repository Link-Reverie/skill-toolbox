# AI Agent with Skill-Toolbox

A demonstration agent that integrates with AI models and provides a pluggable skill-toolbox system. This agent can execute tools (read, write, bash) and load external skills dynamically.

## Overview

This agent demonstrates:
- Integration with AI models (OpenAI, Anthropic, etc.)
- A pluggable skill-toolbox architecture
- Tool execution (read, write, bash) with sandbox restrictions
- Dynamic skill loading and management
- Interactive REPL interface

## Installation

```bash
# Install dependencies
pnpm install

# Or with npm
npm install
```

## Configuration

Create a `.env` file in the `apps/agent` directory:

```env
# Required: API key for AI provider
API_KEY=your_api_key_here

# Optional: Base URL for API (default: https://api.openai.com/v1)
API_BASE_URL=https://api.openai.com/v1

# Optional: Model to use (default: gpt-4)
MODEL=gpt-4

# Optional: Temperature for responses (default: 0.7)
TEMPERATURE=0.7

# Optional: Max tokens in response (default: 2000)
MAX_TOKENS=2000

# Optional: System prompt (default: built-in prompt)
SYSTEM_PROMPT="You are a helpful assistant with access to tools."

# Optional: Sandbox restrictions (default: true)
SANDBOX_ENABLED=true

# Optional: Whitelisted commands for bash tool (default: see below)
WHITELIST_COMMANDS=ls,cat,pwd,echo,git,node,npm,pnpm
```

## Usage

### Starting the Agent

```bash
# Development mode with hot reload
pnpm dev

# Production mode
pnpm start

# Or build and run
pnpm build
node dist/index.js
```

### Chatting with AI

Once the agent starts, you'll see an interactive REPL prompt:

```
🤖 Agent REPL
Type "help" for available commands
You: Hello, can you help me?
```

The AI has access to tools and can:
- Read files from your filesystem
- Write/create files
- Execute whitelisted bash commands
- Use loaded skills

### REPL Commands

The REPL supports several built-in commands:

- **`help`** - Display available commands
- **`skills`** - List loaded skills
- **`install <skill>`** - Install a skill from npm or local path
- **`reload`** - Reload all skills
- **`clear`** - Clear the screen
- **`exit`** - Exit the REPL

### Installing Skills

Skills can be installed dynamically:

```bash
# Install from npm
You: /install @agent/skill-weather

# Install from local path
You: /install ./skills/my-custom-skill

# List installed skills
You: /skills
```

Skills are stored in the `skills/` directory and can be:
- npm packages
- Local directories with a `skill.js` or `index.js` file
- Git repositories

## Available Tools

The agent provides three core tools that the AI can use:

### `read` Tool
Read file contents from the filesystem.
- Parameters: `path` (string) - Path to the file
- Returns: File contents as string
- Restricted: Cannot read files outside working directory

### `write` Tool
Write content to files.
- Parameters: `path` (string), `content` (string)
- Returns: Success/failure message
- Restricted: Cannot write outside working directory

### `bash` Tool
Execute whitelisted bash commands.
- Parameters: `command` (string) - Command to execute
- Returns: Command output
- Restricted: Only whitelisted commands allowed

## Security

The agent implements several security measures:

### Sandbox Restrictions

When `SANDBOX_ENABLED=true` (default):
- File operations restricted to working directory
- Bash commands restricted to whitelist
- No access to environment variables
- No network access from tools

### Command Whitelist

Only these commands are allowed by default:
- `ls`, `cat`, `pwd`, `echo`
- `git` (read-only operations)
- `node`, `npm`, `pnpm`

Additional commands can be added via `WHITELIST_COMMANDS` env var.

### Skill Isolation

Skills run in isolated contexts with:
- Limited API access
- Separate module loading
- No direct filesystem access (must use tools)

## Configuration Options

All configuration is done through environment variables in the `.env` file:

| Environment Variable | Required | Default | Description |
|---------------------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | Yes | - | Anthropic API key |
| `ANTHROPIC_BASE_URL` | No | - | Custom API base URL (for proxies or custom endpoints) |
| `ANTHROPIC_MODEL` | No | `claude-sonnet-4-6` | Claude model to use |
| `ANTHROPIC_MAX_TOKENS` | No | `4096` | Maximum tokens in response |
| `SKILLS_DIR` | No | `./skills` | Directory for storing skills |
| `SANDBOX_TIMEOUT` | No | `30000` | Tool execution timeout (ms) |
| `SANDBOX_MAX_MEMORY` | No | `512MB` | Maximum memory for tool execution |
| `ALLOWED_COMMANDS` | No | `ls,cat,echo,node,npm,pnpm` | Comma-separated whitelisted bash commands |

## Development

```bash
# Run in development mode
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build

# Lint code
pnpm lint

# Format code
pnpm format
```

## Example Session

Here's a realistic example session:

```
🤖 Agent REPL
Type "help" for available commands

You: Hello! Can you read the package.json file?

AI: I'll read the package.json file for you.

[Uses read tool]
{
  "name": "agent",
  "version": "1.0.0",
  "description": "AI Agent with skill-toolbox",
  ...
}

I've read the package.json file. It shows this is version 1.0.0 of the agent package.

You: Can you create a new file called notes.txt with some content?

AI: I'll create the notes.txt file for you.

[Uses write tool]
File created successfully at notes.txt

Done! I've created notes.txt with your content.

You: What bash commands can you run?

AI: I can run whitelisted bash commands like ls, cat, pwd, echo, git, node, npm, and pnpm. Would you like me to run any of these?

You: List the files in the current directory

AI: I'll list the files for you.

[Uses bash tool]
dist/
node_modules/
src/
package.json
tsconfig.json
...

Here are the files in the current directory.

You: /install @agent/skill-weather

Installing skill @agent/skill-weather...
✓ Skill installed successfully

You: /skills

Loaded skills:
- core (built-in)
- @agent/skill-weather

You: exit

Goodbye! 👋
```

## Architecture

```
apps/agent/
├── src/
│   ├── index.ts          # Entry point
│   ├── agent.ts          # Agent class
│   ├── repl.ts           # REPL interface
│   ├── tools/
│   │   ├── read.ts       # Read tool
│   │   ├── write.ts      # Write tool
│   │   └── bash.ts       # Bash tool
│   ├── skills/           # Skill management
│   └── sandbox/          # Security sandbox
├── skills/               # Installed skills
├── dist/                 # Compiled output
├── .env                  # Configuration
└── package.json
```

## Creating Custom Skills

Skills are JavaScript modules that export specific hooks:

```javascript
// my-skill/index.js
module.exports = {
  name: 'my-skill',
  version: '1.0.0',

  // Called when skill is loaded
  onLoad(agent) {
    console.log('Skill loaded!');
  },

  // Called when skill is unloaded
  onUnload() {
    console.log('Skill unloaded!');
  },

  // Define custom tools
  tools: {
    myCustomTool: {
      description: 'Does something cool',
      parameters: {
        type: 'object',
        properties: {
          input: { type: 'string' }
        }
      },
      execute: async (params) => {
        return `Result: ${params.input}`;
      }
    }
  }
};
```

## Troubleshooting

### API Key Issues
```
Error: Invalid API key
```
Ensure your `API_KEY` in `.env` is correct and has proper permissions.

### Sandbox Violations
```
Error: Command not allowed: rm
```
The command is not in the whitelist. Add it to `WHITELIST_COMMANDS` or disable sandbox (not recommended).

### Skill Loading Errors
```
Error: Cannot find skill 'my-skill'
```
Ensure the skill is installed in the `skills/` directory or provide the full path.

## Contributing

Contributions are welcome! Please read the contributing guidelines first.

## License

MIT

---

Built with ❤️ as a demonstration of skill-toolbox architecture
