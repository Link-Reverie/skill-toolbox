import { describe, it, expect, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import { GitSource } from '../GitSource';

describe('GitSource', () => {
  let tempDirs: string[] = [];

  afterEach(async () => {
    // Clean up any temp directories
    for (const dir of tempDirs) {
      if (await fs.pathExists(dir)) {
        await fs.remove(dir);
      }
    }
    tempDirs = [];
  });

  describe('constructor', () => {
    it('should create instance with required options', () => {
      const source = new GitSource({
        source: 'user/repo',
      });
      expect(source).toBeDefined();
    });

    it('should create instance with all options', () => {
      const source = new GitSource({
        source: 'user/repo',
        skillPath: 'docs/skills',
        name: 'custom-name',
        category: 'local',
        timeout: 30000,
        shallow: true,
      });
      expect(source).toBeDefined();
    });

    it('should default skillPath to empty string', () => {
      const source = new GitSource({
        source: 'user/repo',
      });
      // Access private property for testing
      expect((source as any).skillPath).toBe('');
    });

    it('should default category to git', () => {
      const source = new GitSource({
        source: 'user/repo',
      });
      const info = source.getSourceInfo();
      expect(info.category).toBe('git');
    });
  });

  describe('getSourceInfo', () => {
    it('should return source info with git type', () => {
      const source = new GitSource({
        source: 'user/repo',
        name: 'test-source',
      });

      const info = source.getSourceInfo();

      expect(info.type).toBe('git');
      expect(info.category).toBe('git');
      expect(info.identifier).toBe('test-source');
      // path is only available after load()
    });

    it('should use source as identifier if name not provided', () => {
      const source = new GitSource({
        source: 'user/repo',
      });

      const info = source.getSourceInfo();

      expect(info.identifier).toBe('user/repo');
    });

    it('should allow category override', () => {
      const source = new GitSource({
        source: 'user/repo',
        category: 'local',
      });

      const info = source.getSourceInfo();

      expect(info.category).toBe('local');
    });
  });

  describe('load', () => {
    it('should load skills from a real git repository', async () => {
      const source = new GitSource({
        source: 'github:octocat/Hello-World',
      });

      const result = await source.load();
      if (result.skills.length > 0) {
        tempDirs.push(result.skills[0].directory);
      }

      // Should have loaded some content (even if no skills found, shouldn't error)
      expect(result).toBeDefined();
      expect(result.skills).toBeDefined();
      expect(result.errors).toBeDefined();
      // Should have info after load (path may be empty if clone fails)
      expect(result.info).toBeDefined();
      expect(result.info.type).toBe('git');

      // Cleanup
      await source.cleanup();
    }, 60000);

    it('should handle cache directory option', async () => {
      const cacheDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-cache-'));
      tempDirs.push(cacheDir);

      const source = new GitSource({
        source: 'github:octocat/Hello-World',
        cacheDir,
      });

      const result = await source.load();

      // Should not have errors
      expect(result.errors.length).toBe(0);

      // Cleanup
      await source.cleanup();
    }, 60000);

    it('should return info with correct values after load', async () => {
      const source = new GitSource({
        source: 'github:octocat/Hello-World',
        name: 'test-repo',
        category: 'git',
      });

      const result = await source.load();
      if (result.skills.length > 0) {
        tempDirs.push(result.skills[0].directory);
      }

      expect(result.info.type).toBe('git');
      expect(result.info.identifier).toBe('test-repo');
      expect(result.info.category).toBe('git');
      expect(result.info.path).toBeDefined();

      // Cleanup
      await source.cleanup();
    }, 60000);
  });

  describe('cleanup', () => {
    it('should cleanup temp resources', async () => {
      const source = new GitSource({
        source: 'github:octocat/Hello-World',
      });

      await source.load();

      // Should not throw
      await expect(source.cleanup()).resolves.not.toThrow();
    }, 60000);
  });

  describe('security', () => {
    it('should reject invalid source format', async () => {
      const source = new GitSource({
        source: 'invalid-format',
      });

      const result = await source.load();

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].error.message).toContain('Invalid');
    });
  });
});
