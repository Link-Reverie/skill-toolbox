import fs from 'fs-extra';
import type { Tool, ToolExecutor } from './types';

export function createReadTool(): { tool: Tool; executor: ToolExecutor } {
  const tool: Tool = {
    name: 'read',
    description: 'Read file contents from the filesystem. Returns the file content as a string.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The absolute or relative path to the file to read',
        },
      },
      required: ['path'],
    },
  };

  const executor: ToolExecutor = async (input: any) => {
    if (!input.path || typeof input.path !== 'string') {
      throw new Error('Path is required and must be a string');
    }

    const filePath = input.path;

    if (!(await fs.pathExists(filePath))) {
      throw new Error(`File not found: ${filePath}`);
    }

    const stats = await fs.stat(filePath);
    if (!stats.isFile()) {
      throw new Error(`Path is not a file: ${filePath}`);
    }

    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  };

  return { tool, executor };
}
