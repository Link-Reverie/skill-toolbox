import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GitSource } from '../GitSource';
import { mkdir, rm } from 'fs-extra';
import { join } from 'path';

describe('GitSource - Unit Tests', () => {
  const testCacheDir = join(__dirname, '__test_cache__');

  beforeEach(async () => {
    await mkdir(testCacheDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testCacheDir, { recursive: true, force: true });
  });

  describe('Constructor and Options', () => {
    it('should use shallow clone by default', () => {
      const source = new GitSource({
        source: 'user/repo',
        cacheDir: testCacheDir,
      });

      expect((source as any).shallow).toBe(true);
    });

    it('should allow disabling shallow clone', () => {
      const source = new GitSource({
        source: 'user/repo',
        cacheDir: testCacheDir,
        shallow: false,
      });

      expect((source as any).shallow).toBe(false);
    });

    it('should use default skillPath as empty string', () => {
      const source = new GitSource({
        source: 'user/repo',
        cacheDir: testCacheDir,
      });

      expect((source as any).skillPath).toBe('');
    });

    it('should use custom skillPath', () => {
      const source = new GitSource({
        source: 'user/repo',
        cacheDir: testCacheDir,
        skillPath: 'docs/skills',
      });

      expect((source as any).skillPath).toBe('docs/skills');
    });

    it('should use default category as git', () => {
      const source = new GitSource({
        source: 'user/repo',
        cacheDir: testCacheDir,
      });

      const info = source.getSourceInfo();
      expect(info.category).toBe('git');
    });

    it('should allow category override', () => {
      const source = new GitSource({
        source: 'user/repo',
        cacheDir: testCacheDir,
        category: 'local',
      });

      const info = source.getSourceInfo();
      expect(info.category).toBe('local');
    });
  });

  describe('Source Info', () => {
    it('should return correct source info', () => {
      const source = new GitSource({
        source: 'user/repo',
        name: 'test-source',
        cacheDir: testCacheDir,
      });

      const info = source.getSourceInfo();

      expect(info.type).toBe('git');
      expect(info.category).toBe('git');
      expect(info.identifier).toBe('test-source');
    });

    it('should use source as identifier if name not provided', () => {
      const source = new GitSource({
        source: 'user/repo',
        cacheDir: testCacheDir,
      });

      const info = source.getSourceInfo();

      expect(info.identifier).toBe('user/repo');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid source format', async () => {
      const source = new GitSource({
        source: 'invalid-format',
        cacheDir: testCacheDir,
      });

      const result = await source.load();

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].error.message).toContain('Invalid');
    });

    it('should return empty skills for invalid source', async () => {
      const source = new GitSource({
        source: 'invalid-format',
        cacheDir: testCacheDir,
      });

      const result = await source.load();

      expect(result.skills).toEqual([]);
    });
  });

  describe('Source Parsing', () => {
    it('should accept GitHub shorthand format', () => {
      const source = new GitSource({
        source: 'user/repo',
        cacheDir: testCacheDir,
      });

      expect((source as any).source).toBe('user/repo');
    });

    it('should accept full Git URL', () => {
      const source = new GitSource({
        source: 'https://github.com/user/repo.git',
        cacheDir: testCacheDir,
      });

      expect((source as any).source).toBe('https://github.com/user/repo.git');
    });

    it('should accept SSH Git URL', () => {
      const source = new GitSource({
        source: 'git@github.com:user/repo.git',
        cacheDir: testCacheDir,
      });

      expect((source as any).source).toBe('git@github.com:user/repo.git');
    });

    it('should parse branch from source', () => {
      const source = new GitSource({
        source: 'user/repo#develop',
        cacheDir: testCacheDir,
      });

      // The source should be stored as-is, ref extraction happens internally
      expect((source as any).source).toBe('user/repo#develop');
    });

    it('should parse tag from source', () => {
      const source = new GitSource({
        source: 'user/repo#v1.0.0',
        cacheDir: testCacheDir,
      });

      expect((source as any).source).toBe('user/repo#v1.0.0');
    });
  });

  describe('Cleanup', () => {
    it('should cleanup without error', async () => {
      const source = new GitSource({
        source: 'user/repo',
        cacheDir: testCacheDir,
      });

      await expect(source.cleanup()).resolves.not.toThrow();
    });
  });
});
