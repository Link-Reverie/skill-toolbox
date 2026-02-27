import { describe, it, expect } from 'vitest';
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
