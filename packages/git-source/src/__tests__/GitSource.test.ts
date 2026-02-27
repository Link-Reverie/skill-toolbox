import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs-extra';
import { GitSource } from '../GitSource';

describe('GitSource', () => {
  it('should resolve github shorthand', async () => {
    const source = new GitSource();
    const result = await source.resolve('github:user/repo');

    expect(result.url).toBe('https://github.com/user/repo.git');
    expect(result.repo.owner).toBe('user');
    expect(result.repo.name).toBe('repo');
  });

  it('should resolve user/repo format', async () => {
    const source = new GitSource();
    const result = await source.resolve('user/repo');

    expect(result.url).toBe('https://github.com/user/repo.git');
  });

  it('should resolve full git URL', async () => {
    const source = new GitSource();
    const result = await source.resolve('https://github.com/user/repo.git');

    expect(result.url).toBe('https://github.com/user/repo.git');
  });

  it('should throw error for invalid format', async () => {
    const source = new GitSource();

    await expect(source.resolve('invalid-format'))
      .rejects.toThrow('Invalid source format');
  });
});

describe('GitSource clone', () => {
  it('should clone repository to temp directory', async () => {
    const source = new GitSource();
    const tempDir = await source.clone('https://github.com/octocat/Hello-World.git');

    // Verify directory exists
    expect(await fs.pathExists(tempDir)).toBe(true);

    // Verify it contains .git directory
    expect(await fs.pathExists(path.join(tempDir, '.git'))).toBe(true);

    // Clean up
    await fs.remove(tempDir);
  }, 30000);
});
