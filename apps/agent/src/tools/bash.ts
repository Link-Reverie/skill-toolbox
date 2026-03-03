import { execa } from 'execa';
import type { Tool, ToolExecutor } from './types';

export interface BashToolConfig {
  allowedCommands: string[];
  timeout: number;
}

export function createBashTool(config: BashToolConfig): { tool: Tool; executor: ToolExecutor } {
  const tool: Tool = {
    name: 'bash',
    description:
      'Execute bash commands in a sandboxed environment. Only whitelisted commands are allowed.',
    input_schema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The bash command to execute',
        },
      },
      required: ['command'],
    },
  };

  /**
   * Check if command needs shell features (pipes, redirects, etc.)
   */
  function needsShell(command: string): boolean {
    const shellChars = ['|', '&', ';', '>', '<', '*', '?', '$', '`', '$(', '||', '&&'];
    return shellChars.some(char => command.includes(char));
  }

  /**
   * Parse command into executable and args
   * Handles quoted strings and basic escaping
   */
  function parseCommand(command: string): { executable: string; args: string[] } {
    // Remove extra whitespace
    command = command.trim();

    // Split by spaces, but respect quoted strings
    const args: string[] = [];
    let current = '';
    let inQuote = false;
    let quoteChar = '';

    for (let i = 0; i < command.length; i++) {
      const char = command[i];
      const nextChar = command[i + 1];

      if ((char === '"' || char === "'") && !inQuote) {
        inQuote = true;
        quoteChar = char;
      } else if (char === quoteChar && inQuote) {
        inQuote = false;
        quoteChar = '';
      } else if (char === ' ' && !inQuote) {
        if (current) {
          args.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }

    if (current) {
      args.push(current);
    }

    return {
      executable: args[0] || '',
      args: args.slice(1),
    };
  }

  const executor: ToolExecutor = async (input: any) => {
    if (!input.command || typeof input.command !== 'string') {
      throw new Error('Command is required and must be a string');
    }

    const command = input.command.trim();

    // Check if command needs shell (pipes, redirects, etc.)
    const useShell = needsShell(command);

    // Extract base command for whitelist check
    const { executable: baseCommand } = parseCommand(command);

    // Check if the base command is in the whitelist
    if (!config.allowedCommands.includes(baseCommand)) {
      throw new Error(
        `Command not allowed: "${baseCommand}". Allowed commands: ${config.allowedCommands.join(', ')}`
      );
    }

    try {
      let result;

      if (useShell) {
        // Complex command: use shell with proper executable
        const isWindows = process.platform === 'win32';
        const shell = isWindows ? 'bash' : 'sh';

        result = await execa(command, [], {
          shell,
          timeout: config.timeout,
          reject: true,
        });
      } else {
        // Simple command: use args array for safety
        const { executable, args } = parseCommand(command);

        result = await execa(executable, args, {
          timeout: config.timeout,
          reject: true,
        });
      }

      // Return stdout
      return result.stdout || '(no output)';
    } catch (error: any) {
      // Handle different error types
      if (error.timedOut) {
        throw new Error(`Command timed out after ${config.timeout}ms`);
      }

      if (error.exitCode !== undefined) {
        // Command executed but failed
        const stderr = error.stderr || '';
        const stdout = error.stdout || '';
        throw new Error(
          `Command failed with exit code ${error.exitCode}:\nstdout: ${stdout}\nstderr: ${stderr}`
        );
      }

      // Unknown error
      throw new Error(`Command execution failed: ${error.message}`);
    }
  };

  return { tool, executor };
}
