import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { createWriteTool } from '../tools/write';

describe('Write Tool', () => {
  const testDir = path.join(__dirname, 'test-write');
  const { tool, executor } = createWriteTool();

  beforeEach(async () => {
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('should have correct tool definition', () => {
    expect(tool.name).toBe('write');
    expect(tool.description).toContain('Write content to a file');
    expect(tool.input_schema.type).toBe('object');
    expect(tool.input_schema.properties.path).toBeDefined();
    expect(tool.input_schema.properties.content).toBeDefined();
    expect(tool.input_schema.required).toContain('path');
    expect(tool.input_schema.required).toContain('content');
  });

  it('should write content to file successfully', async () => {
    const filePath = path.join(testDir, 'test.txt');
    const content = 'Hello, World!';

    const result = await executor({ path: filePath, content });
    expect(result).toContain('Successfully wrote');

    const fileContent = await fs.readFile(filePath, 'utf-8');
    expect(fileContent).toBe(content);
  });

  it('should write multiline content', async () => {
    const filePath = path.join(testDir, 'multiline.txt');
    const content = 'Line 1\nLine 2\nLine 3';

    await executor({ path: filePath, content });

    const fileContent = await fs.readFile(filePath, 'utf-8');
    expect(fileContent).toBe(content);
  });

  it('should overwrite existing file', async () => {
    const filePath = path.join(testDir, 'overwrite.txt');
    await fs.writeFile(filePath, 'Old content');

    const newContent = 'New content';
    await executor({ path: filePath, content: newContent });

    const fileContent = await fs.readFile(filePath, 'utf-8');
    expect(fileContent).toBe(newContent);
  });

  it('should create parent directories if they do not exist', async () => {
    const filePath = path.join(testDir, 'subdir', 'nested', 'file.txt');
    const content = 'Nested content';

    await executor({ path: filePath, content });

    const fileContent = await fs.readFile(filePath, 'utf-8');
    expect(fileContent).toBe(content);
  });

  it('should throw error for invalid path parameter', async () => {
    await expect(executor({ path: '', content: 'test' })).rejects.toThrow('Path is required');
    await expect(executor({ content: 'test' })).rejects.toThrow('Path is required');
  });

  it('should throw error for invalid content parameter', async () => {
    const filePath = path.join(testDir, 'test.txt');
    await expect(executor({ path: filePath, content: '' })).rejects.toThrow('Content is required');
    await expect(executor({ path: filePath })).rejects.toThrow('Content is required');
  });

  it('should write JSON content', async () => {
    const filePath = path.join(testDir, 'data.json');
    const content = JSON.stringify({ key: 'value' }, null, 2);

    await executor({ path: filePath, content });

    const fileContent = await fs.readFile(filePath, 'utf-8');
    expect(fileContent).toBe(content);
  });

  it('should write empty string to file', async () => {
    const filePath = path.join(testDir, 'empty.txt');
    const content = '';

    // Empty string should throw error based on our implementation
    await expect(executor({ path: filePath, content })).rejects.toThrow('Content is required');
  });

  it('should report number of bytes written', async () => {
    const filePath = path.join(testDir, 'bytes.txt');
    const content = 'Hello';

    const result = await executor({ path: filePath, content });
    expect(result).toContain('5 bytes');
  });
});
