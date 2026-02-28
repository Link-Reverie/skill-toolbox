import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { createReadTool } from '../tools/read';

describe('Read Tool', () => {
  const testDir = path.join(__dirname, 'test-read');
  const { tool, executor } = createReadTool();

  beforeEach(async () => {
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('should have correct tool definition', () => {
    expect(tool.name).toBe('read');
    expect(tool.description).toContain('Read file contents');
    expect(tool.input_schema.type).toBe('object');
    expect(tool.input_schema.properties.path).toBeDefined();
    expect(tool.input_schema.required).toContain('path');
  });

  it('should read file content successfully', async () => {
    const filePath = path.join(testDir, 'test.txt');
    const content = 'Hello, World!';
    await fs.writeFile(filePath, content);

    const result = await executor({ path: filePath });
    expect(result).toBe(content);
  });

  it('should read multiline file content', async () => {
    const filePath = path.join(testDir, 'multiline.txt');
    const content = 'Line 1\nLine 2\nLine 3';
    await fs.writeFile(filePath, content);

    const result = await executor({ path: filePath });
    expect(result).toBe(content);
  });

  it('should throw error for non-existent file', async () => {
    const filePath = path.join(testDir, 'nonexistent.txt');

    await expect(executor({ path: filePath })).rejects.toThrow('File not found');
  });

  it('should throw error for invalid path parameter', async () => {
    await expect(executor({ path: '' })).rejects.toThrow('Path is required');
    await expect(executor({})).rejects.toThrow('Path is required');
  });

  it('should handle relative paths', async () => {
    const filePath = path.join(testDir, 'relative.txt');
    const content = 'Relative content';
    await fs.writeFile(filePath, content);

    // Using absolute path should work
    const result = await executor({ path: filePath });
    expect(result).toBe(content);
  });

  it('should read JSON file', async () => {
    const filePath = path.join(testDir, 'data.json');
    const content = JSON.stringify({ key: 'value' }, null, 2);
    await fs.writeFile(filePath, content);

    const result = await executor({ path: filePath });
    expect(result).toBe(content);
  });

  it('should read empty file', async () => {
    const filePath = path.join(testDir, 'empty.txt');
    await fs.writeFile(filePath, '');

    const result = await executor({ path: filePath });
    expect(result).toBe('');
  });
});
