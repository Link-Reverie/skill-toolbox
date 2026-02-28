import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { ToolRegistry } from '../tools/registry';
import { createReadTool, createWriteTool, createBashTool } from '../tools';

describe('Tools Integration', () => {
  const testDir = path.join(__dirname, 'test-integration');
  let registry: ToolRegistry;

  beforeEach(async () => {
    await fs.ensureDir(testDir);
    registry = new ToolRegistry();

    // Register all tools
    const readTool = createReadTool();
    const writeTool = createWriteTool();
    const bashTool = createBashTool({
      allowedCommands: ['echo', 'cat', 'ls'],
      timeout: 5000,
    });

    registry.register(readTool.tool, readTool.executor);
    registry.register(writeTool.tool, writeTool.executor);
    registry.register(bashTool.tool, bashTool.executor);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('should register all tools', () => {
    const definitions = registry.getToolDefinitions();
    expect(definitions).toHaveLength(3);
    expect(definitions.map((t) => t.name)).toContain('read');
    expect(definitions.map((t) => t.name)).toContain('write');
    expect(definitions.map((t) => t.name)).toContain('bash');
  });

  it('should write and read file using tools', async () => {
    const filePath = path.join(testDir, 'test.txt');
    const content = 'Hello from tool!';

    // Write file using write tool
    await registry.execute('write', { path: filePath, content });

    // Read file using read tool
    const result = await registry.execute('read', { path: filePath });

    expect(result).toBe(content);
  });

  it('should execute bash command and use result', async () => {
    const bashResult = await registry.execute('bash', { command: 'echo "test output"' });
    expect(bashResult).toContain('test output');
  });

  it('should handle tool errors gracefully', async () => {
    // Try to read non-existent file
    await expect(
      registry.execute('read', { path: path.join(testDir, 'nonexistent.txt') })
    ).rejects.toThrow('File not found');

    // Try to execute non-allowed command
    await expect(registry.execute('bash', { command: 'rm test.txt' })).rejects.toThrow(
      'Command not allowed'
    );
  });

  it('should validate tool inputs', async () => {
    // Invalid read input
    await expect(registry.execute('read', {})).rejects.toThrow('Path is required');

    // Invalid write input
    await expect(
      registry.execute('write', { path: '/tmp/test.txt' })
    ).rejects.toThrow('Content is required');

    // Invalid bash input
    await expect(registry.execute('bash', {})).rejects.toThrow('Command is required');
  });

  it('should work with tool definitions for LLM', () => {
    const definitions = registry.getToolDefinitions();

    // Verify each tool has required Anthropic schema properties
    for (const tool of definitions) {
      expect(tool.name).toBeDefined();
      expect(tool.description).toBeDefined();
      expect(tool.input_schema.type).toBe('object');
      expect(tool.input_schema.properties).toBeDefined();
    }
  });
});
