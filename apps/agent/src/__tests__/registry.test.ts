import { describe, it, expect } from 'vitest';
import { ToolRegistry } from '../tools/registry';
import type { Tool, ToolExecutor } from '../tools/types';

describe('ToolRegistry', () => {
  const sampleTool: Tool = {
    name: 'test_tool',
    description: 'A test tool',
    input_schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
      required: ['message'],
    },
  };

  const sampleExecutor: ToolExecutor = async (input: any) => {
    return `Received: ${input.message}`;
  };

  it('should register a tool', () => {
    const registry = new ToolRegistry();
    registry.register(sampleTool, sampleExecutor);

    expect(registry.has('test_tool')).toBe(true);
  });

  it('should throw error when registering duplicate tool', () => {
    const registry = new ToolRegistry();
    registry.register(sampleTool, sampleExecutor);

    expect(() => registry.register(sampleTool, sampleExecutor)).toThrow(
      'Tool "test_tool" is already registered'
    );
  });

  it('should return tool definitions', () => {
    const registry = new ToolRegistry();
    registry.register(sampleTool, sampleExecutor);

    const definitions = registry.getToolDefinitions();
    expect(definitions).toHaveLength(1);
    expect(definitions[0]).toEqual(sampleTool);
  });

  it('should execute a tool', async () => {
    const registry = new ToolRegistry();
    registry.register(sampleTool, sampleExecutor);

    const result = await registry.execute('test_tool', { message: 'Hello' });
    expect(result).toBe('Received: Hello');
  });

  it('should throw error when executing non-existent tool', async () => {
    const registry = new ToolRegistry();

    await expect(registry.execute('non_existent', {})).rejects.toThrow(
      'Tool "non_existent" not found'
    );
  });

  it('should handle tool execution errors', async () => {
    const registry = new ToolRegistry();
    const errorExecutor: ToolExecutor = async () => {
      throw new Error('Execution failed');
    };

    registry.register(sampleTool, errorExecutor);

    await expect(registry.execute('test_tool', {})).rejects.toThrow(
      'Tool "test_tool" execution failed: Execution failed'
    );
  });

  it('should check if tool exists', () => {
    const registry = new ToolRegistry();

    expect(registry.has('test_tool')).toBe(false);

    registry.register(sampleTool, sampleExecutor);

    expect(registry.has('test_tool')).toBe(true);
  });
});
