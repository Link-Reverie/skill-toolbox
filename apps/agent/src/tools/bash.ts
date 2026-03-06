import { execa } from 'execa';
import type { Tool, ToolExecutor } from './types';
import { CommandSandbox, type SandboxConfig } from './sandbox';

/** Maximum command length to prevent abuse */
const MAX_COMMAND_LENGTH = 4096;

/**
 * Check if a command string uses shell features that require shell execution.
 */
function needsShell(command: string): boolean {
  return /[|&;><`$]|\$\(/.test(command);
}

/**
 * Parse a simple command string into executable + args.
 * Handles single/double quotes and backslash escaping.
 */
function parseCommand(command: string): { executable: string; args: string[] } {
  const tokens: string[] = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';
  let escaped = false;

  for (const char of command.trim()) {
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === '\\' && !inQuote) {
      escaped = true;
      continue;
    }

    if ((char === '"' || char === "'") && !inQuote) {
      inQuote = true;
      quoteChar = char;
      continue;
    }

    if (char === quoteChar && inQuote) {
      inQuote = false;
      quoteChar = '';
      continue;
    }

    if (char === ' ' && !inQuote) {
      if (current) {
        tokens.push(current);
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (current) {
    tokens.push(current);
  }

  return {
    executable: tokens[0] || '',
    args: tokens.slice(1),
  };
}

/**
 * Resolve the appropriate shell for the current platform.
 */
function resolveShell(): string | true {
  if (process.platform === 'win32') {
    return process.env.ComSpec || 'cmd.exe';
  }
  return '/bin/sh';
}

export { type SandboxConfig } from './sandbox';

export function createBashTool(config: SandboxConfig): { tool: Tool; executor: ToolExecutor } {
  const sandbox = new CommandSandbox(config);

  const tool: Tool = {
    name: 'bash',
    description:
      'Execute shell commands in a sandboxed environment. ' +
      'Commands are validated against a permission preset with subcommand-level control. ' +
      'Dangerous patterns (e.g., curl|bash, rm -rf /) are always blocked. ' +
      'Returns stdout and stderr combined.',
    input_schema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The shell command to execute (e.g., "ls -la", "cat file.txt | grep error")',
        },
        cwd: {
          type: 'string',
          description: 'Working directory for the command (optional, defaults to project root)',
        },
      },
      required: ['command'],
    },
  };

  const executor: ToolExecutor = async (input: any) => {
    // --- Input validation ---
    if (!input.command || typeof input.command !== 'string') {
      throw new Error('Command is required and must be a string');
    }

    const command = input.command.trim();

    if (command.length === 0) {
      throw new Error('Command cannot be empty');
    }

    if (command.length > MAX_COMMAND_LENGTH) {
      throw new Error(
        `Command too long (${command.length} chars, max ${MAX_COMMAND_LENGTH})`
      );
    }

    // --- Three-layer sandbox validation ---
    const validation = sandbox.validate(command);
    if (!validation.allowed) {
      throw new Error(validation.reason || 'Command not allowed');
    }

    // --- Execution ---
    const cwd = input.cwd || sandbox.defaultCwd || process.cwd();
    const useShell = needsShell(command);

    try {
      let result;

      if (useShell) {
        const shell = resolveShell();

        result = await execa(command, {
          shell,
          timeout: sandbox.timeout,
          cwd,
        });
      } else {
        const { executable, args } = parseCommand(command);

        result = await execa(executable, args, {
          timeout: sandbox.timeout,
          cwd,
        });
      }

      // --- Combine stdout + stderr for complete output ---
      const parts: string[] = [];
      if (result.stdout) parts.push(result.stdout);
      if (result.stderr) parts.push(`[stderr] ${result.stderr}`);

      return parts.length > 0 ? parts.join('\n') : '(no output)';
    } catch (error: any) {
      if (error.timedOut) {
        throw new Error(`Command timed out after ${sandbox.timeout}ms`);
      }

      if (error.exitCode !== undefined) {
        const parts: string[] = [`Exit code ${error.exitCode}`];
        if (error.stdout) parts.push(`stdout:\n${error.stdout}`);
        if (error.stderr) parts.push(`stderr:\n${error.stderr}`);
        throw new Error(parts.join('\n'));
      }

      throw new Error(`Command execution failed: ${error.message}`);
    }
  };

  return { tool, executor };
}
