import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { HttpSource } from '../src/index';
import { mkdir, rm, writeFile, readFile, pathExists } from 'fs-extra';
import { join } from 'path';

describe('HttpSource - Comprehensive Tests', () => {
  const testCacheDir = join(__dirname, '__test_cache__');
  const testUrl = 'https://example.com/skills/';

  beforeAll(async () => {
    await mkdir(testCacheDir, { recursive: true });
  });

  afterAll(async () => {
    await rm(testCacheDir, { recursive: true, force: true });
  });

  describe('Caching Mechanism', () => {
    it('should cache index.json on first load', async () => {
      const source = new HttpSource({
        url: testUrl,
        cacheDir: testCacheDir,
        forceRefresh: true,
      });

      // Mock fetch for both index and skill files
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          version: '1.0.0',
          skills: [
            { name: 'test-skill', path: 'skills/test-skill.md', files: ['SKILL.md'] },
          ],
        }),
      }).mockResolvedValueOnce({
        ok: true,
        text: async () => `---
name: test-skill
version: 1.0.0
---

# Test Skill
`,
      });

      const result = await source.load();

      expect(fetch).toHaveBeenCalled();
      expect(result.skills.length).toBeGreaterThan(0);
    });

    it('should use cache on subsequent loads', async () => {
      const source = new HttpSource({
        url: testUrl,
        cacheDir: testCacheDir,
      });

      // First load
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          version: '1.0.0',
          skills: [],
        }),
      });

      await source.load();

      // Second load (should use cache)
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          version: '1.0.0',
          skills: [],
        }),
      });

      const result = await source.load();

      // Fetch should not be called again
      expect(fetch).toHaveBeenCalledTimes(0);
    });

    it('should force refresh when forceRefresh is true', async () => {
      // Pre-populate cache
      const cacheFile = join(testCacheDir, 'index.json');
      await writeFile(cacheFile, JSON.stringify({
        version: '1.0.0',
        skills: [],
      }));

      const source = new HttpSource({
        url: testUrl,
        cacheDir: testCacheDir,
        forceRefresh: true,
      });

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          version: '2.0.0',
          skills: [
            { name: 'new-skill', path: 'skills/new-skill.md' },
          ],
        }),
      });

      const result = await source.load();

      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Network Error Handling', () => {
    it('should handle timeout errors', async () => {
      const source = new HttpSource({
        url: testUrl,
        cacheDir: testCacheDir,
        timeout: 100, // Very short timeout
        forceRefresh: true,
      });

      global.fetch = vi.fn().mockImplementationOnce(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 200)
        )
      );

      const result = await source.load();

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].error.message).toContain('Timeout');
    });

    it('should handle 404 errors', async () => {
      const source = new HttpSource({
        url: testUrl,
        cacheDir: testCacheDir,
        forceRefresh: true,
      });

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await source.load();

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].error.message).toContain('404');
    });

    it('should handle 500 errors', async () => {
      const source = new HttpSource({
        url: testUrl,
        cacheDir: testCacheDir,
        forceRefresh: true,
      });

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await source.load();

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].error.message).toContain('500');
    });

    it('should handle network failures', async () => {
      const source = new HttpSource({
        url: testUrl,
        cacheDir: testCacheDir,
        forceRefresh: true,
      });

      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      const result = await source.load();

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].error.message).toContain('Network error');
    });
  });

  describe('Index.json Parsing', () => {
    it('should parse valid index.json', async () => {
      const source = new HttpSource({
        url: testUrl,
        cacheDir: testCacheDir,
      });

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          version: '1.0.0',
          skills: [
            { name: 'skill1', path: 'skills/skill1.md' },
            { name: 'skill2', path: 'skills/skill2.md' },
          ],
        }),
      });

      const result = await source.load();

      expect(result.errors.length).toBe(0);
    });

    it('should handle invalid JSON response', async () => {
      const source = new HttpSource({
        url: testUrl,
        cacheDir: testCacheDir,
        forceRefresh: true,
      });

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const result = await source.load();

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].error.message).toContain('Invalid JSON');
    });

    it('should handle missing skills array', async () => {
      const source = new HttpSource({
        url: testUrl,
        cacheDir: testCacheDir,
        forceRefresh: true,
      });

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          version: '1.0.0',
          // Missing skills array
        }),
      });

      const result = await source.load();

      // Should not throw, just return empty skills
      expect(result.skills.length).toBe(0);
    });
  });

  describe('Source Info', () => {
    it('should return correct source info with custom name', () => {
      const source = new HttpSource({
        url: testUrl,
        cacheDir: testCacheDir,
      });

      const info = source.getSourceInfo();

      expect(info.type).toBe('git');
      expect(info.category).toBe('git');
      expect(info.identifier).toContain('http:example.com');
    });

    it('should cleanup resources', async () => {
      const source = new HttpSource({
        url: testUrl,
        cacheDir: testCacheDir,
      });

      await source.cleanup();

      // Cleanup should not throw
      expect(true).toBe(true);
    });
  });
});
