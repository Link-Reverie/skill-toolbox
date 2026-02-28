import fs from 'fs-extra';
import path from 'path';
import type { Tool, ToolExecutor } from './types';

export function createWriteTool(): { tool: Tool; executor: ToolExecutor } {
  const tool: Tool = {
    name: 'write',
    description: 'Write content to a file. Creates parent directories if they do not exist. Overwrites existing files.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The absolute or relative path to the file to write',
        },
        content: {
          type: 'string',
          description: 'The content to write to the file',
        },
      },
      required: ['path', 'content'],
    },
  };

  const executor: ToolExecutor = async (input: any) => {
    if (!input.path || typeof input.path !== 'string') {
      throw new Error('Path is required and must be a string');
    }

    if (!input.content || typeof input.content !== 'string') {
      throw new Error('Content is required and must be a non-empty string');
    }

    const filePath = input.path;
    const content = input.content;

    // Ensure parent directory exists
    await fs.ensureDir(path.dirname(filePath));

    // Write content to file
    await fs.writeFile(filePath, content, 'utf-8');

    const bytesWritten = Buffer.byteLength(content, 'utf-8');
    return `Successfully wrote ${bytesWritten} bytes to ${filePath}`;
  };

  return { tool, executor };
}
