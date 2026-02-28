import type { Tool, ToolExecutor } from './types';

export class ToolRegistry {
  private tools: Map<string, { tool: Tool; executor: ToolExecutor }> = new Map();

  register(tool: Tool, executor: ToolExecutor): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is already registered`);
    }
    this.tools.set(tool.name, { tool, executor });
  }

  getToolDefinitions(): Tool[] {
    return Array.from(this.tools.values()).map(({ tool }) => tool);
  }

  async execute(toolName: string, input: any): Promise<string> {
    const entry = this.tools.get(toolName);
    if (!entry) {
      throw new Error(`Tool "${toolName}" not found`);
    }

    try {
      return await entry.executor(input);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Tool "${toolName}" execution failed: ${message}`);
    }
  }

  has(toolName: string): boolean {
    return this.tools.has(toolName);
  }
}
