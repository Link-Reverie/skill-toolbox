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

  const executor: ToolExecutor = async (input: any) => {
    if (!input.command || typeof input.command !== 'string') {
      throw new Error('Command is required and must be a string');
    }

    const command = input.command.trim();

    // Extract the base command (first word)
    const baseCommand = command.split(/\s+/)[0];

    // Check if the base command is in the whitelist
    if (!config.allowedCommands.includes(baseCommand)) {
      throw new Error(
        `Command not allowed: "${baseCommand}". Allowed commands: ${config.allowedCommands.join(', ')}`
      );
    }

    try {
      // Execute the command with timeout
      const result = await execa(command, [], {
        shell: true,
        timeout: config.timeout,
        reject: true,
      });

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
