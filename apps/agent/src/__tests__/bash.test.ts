import { describe, it, expect } from 'vitest';
import { createBashTool } from '../tools/bash';

describe('Bash Tool', () => {
  const defaultConfig = {
    allowedCommands: ['echo', 'ls', 'node', 'npm'],
    timeout: 5000,
  };

  const { tool, executor } = createBashTool(defaultConfig);

  it('should have correct tool definition', () => {
    expect(tool.name).toBe('bash');
    expect(tool.description).toContain('Execute bash commands');
    expect(tool.input_schema.type).toBe('object');
    expect(tool.input_schema.properties.command).toBeDefined();
    expect(tool.input_schema.required).toContain('command');
  });

  it('should execute allowed command successfully', async () => {
    const result = await executor({ command: 'echo "Hello, World!"' });
    expect(result).toContain('Hello, World!');
  });

  it('should throw error for non-allowed command', async () => {
    await expect(executor({ command: 'rm test.txt' })).rejects.toThrow('Command not allowed');
  });

  it('should throw error for invalid command parameter', async () => {
    await expect(executor({ command: '' })).rejects.toThrow('Command is required');
    await expect(executor({})).rejects.toThrow('Command is required');
  });

  it('should handle command with arguments', async () => {
    const result = await executor({ command: 'echo "test" "args"' });
    expect(result).toContain('test');
    expect(result).toContain('args');
  });

  it('should report command execution success', async () => {
    const result = await executor({ command: 'echo "success"' });
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });

  it('should handle command timeout', async () => {
    const { executor: timeoutExecutor } = createBashTool({
      allowedCommands: ['sleep'],
      timeout: 100,
    });

    await expect(timeoutExecutor({ command: 'sleep 10' })).rejects.toThrow();
  }, 10000);

  it('should capture stdout', async () => {
    const result = await executor({ command: 'echo "stdout output"' });
    expect(result).toContain('stdout output');
  });

  it('should allow whitelisted commands from config', async () => {
    const customConfig = {
      allowedCommands: ['pwd', 'whoami'],
      timeout: 5000,
    };
    const { executor: customExecutor } = createBashTool(customConfig);

    const result = await customExecutor({ command: 'pwd' });
    expect(result).toBeDefined();
  });

  it('should block commands not in whitelist', async () => {
    const customConfig = {
      allowedCommands: ['echo'],
      timeout: 5000,
    };
    const { executor: customExecutor } = createBashTool(customConfig);

    await expect(customExecutor({ command: 'ls' })).rejects.toThrow('Command not allowed');
  });

  it('should handle empty allowed commands list', async () => {
    const { executor: emptyExecutor } = createBashTool({
      allowedCommands: [],
      timeout: 5000,
    });

    await expect(emptyExecutor({ command: 'echo "test"' })).rejects.toThrow(
      'Command not allowed'
    );
  });

  it('should extract base command correctly', async () => {
    // Test that 'echo "hello world"' extracts 'echo' as the base command
    const result = await executor({ command: 'echo "hello world"' });
    expect(result).toContain('hello world');
  });

  it('should handle commands with pipes (if allowed)', async () => {
    const { executor: pipeExecutor } = createBashTool({
      allowedCommands: ['echo', 'grep'],
      timeout: 5000,
    });

    // This should work as both echo and grep are allowed
    const result = await pipeExecutor({ command: 'echo "test" | grep test' });
    expect(result).toContain('test');
  });
});
