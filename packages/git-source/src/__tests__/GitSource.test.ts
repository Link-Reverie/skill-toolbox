import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import { GitSource } from '../GitSource';

describe('GitSource', () => {
  let source: GitSource;
  let tempDirs: string[];

  beforeEach(() => {
    source = new GitSource();
    tempDirs = [];
  });

  afterEach(async () => {
    // Clean up any temp directories
    for (const dir of tempDirs) {
      if (await fs.pathExists(dir)) {
        await fs.remove(dir);
      }
    }
  });

  describe('canHandle', () => {
    it('should handle github shorthand', async () => {
      expect(await source.canHandle('github:user/repo')).toBe(true);
    });

    it('should handle user/repo format', async () => {
      expect(await source.canHandle('user/repo')).toBe(true);
    });

    it('should handle user/repo:path format', async () => {
      expect(await source.canHandle('user/repo:docs/skills')).toBe(true);
    });

    it('should handle full git URL', async () => {
      expect(await source.canHandle('https://github.com/user/repo.git')).toBe(true);
    });

    it('should not handle invalid formats', async () => {
      expect(await source.canHandle('invalid-format')).toBe(false);
    });
  });

  describe('resolve', () => {
    it('should resolve github shorthand', async () => {
      const result = await source.resolve('github:user/repo');

      expect(result.type).toBe('git');
      expect(result.source).toBe('github:user/repo');
      expect(result.resolved).toBe('https://github.com/user/repo.git');
      expect(result.multiSkill).toBe(true);
      expect(result.skillPath).toBe('skills');
    });

    it('should resolve user/repo format', async () => {
      const result = await source.resolve('user/repo');

      expect(result.resolved).toBe('https://github.com/user/repo.git');
      expect(result.skillPath).toBe('skills');
    });

    it('should resolve user/repo:path format', async () => {
      const result = await source.resolve('user/repo:docs/skills');

      expect(result.resolved).toBe('https://github.com/user/repo.git');
      expect(result.skillPath).toBe('docs/skills');
    });

    it('should resolve full git URL', async () => {
      const result = await source.resolve('https://github.com/user/repo.git');

      expect(result.resolved).toBe('https://github.com/user/repo.git');
    });

    it('should throw error for invalid format', async () => {
      await expect(source.resolve('invalid-format'))
        .rejects.toThrow('Invalid source format');
    });
  });

  describe('security', () => {
    it('should reject path traversal in skillPath', async () => {
      // Use a valid source format but with traversal in skillPath
      // The regex allows alphanumeric, slashes, and dashes
      const meta = {
        type: 'git' as const,
        source: 'user/repo',
        resolved: 'https://github.com/user/repo.git',
        multiSkill: true,
        skillPath: '../../etc',  // Manually set skillPath with traversal
      };

      // Create a mock directory
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'skill-test-'));
      tempDirs.push(tempDir);

      await expect(source.discover(tempDir, meta))
        .rejects.toThrow('path traversal not allowed');
    });

    it('should reject absolute path in skillPath', async () => {
      // Use a valid source format but with absolute path in skillPath
      const meta = {
        type: 'git' as const,
        source: 'user/repo',
        resolved: 'https://github.com/user/repo.git',
        multiSkill: true,
        skillPath: '/etc/passwd',  // Manually set skillPath with absolute path
      };

      // Create a mock directory
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'skill-test-'));
      tempDirs.push(tempDir);

      await expect(source.discover(tempDir, meta))
        .rejects.toThrow('absolute paths not allowed');
    });
  });

  describe('fetch', () => {
    it('should clone repository to temp directory', async () => {
      const meta = await source.resolve('github:octocat/Hello-World');
      const localPath = await source.fetch(meta);

      tempDirs.push(localPath);

      // Verify directory exists
      expect(await fs.pathExists(localPath)).toBe(true);

      // Verify it contains .git directory
      expect(await fs.pathExists(path.join(localPath, '.git'))).toBe(true);

      // Cleanup
      await source.cleanup(localPath, meta);
    }, 30000);

    it('should use cached repository if exists', async () => {
      const cacheDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-cache-'));
      tempDirs.push(cacheDir);

      const meta = await source.resolve('github:octocat/Hello-World');

      // First fetch
      const path1 = await source.fetch(meta, { cacheDir });
      tempDirs.push(path1);

      // Second fetch should return same path
      const path2 = await source.fetch(meta, { cacheDir });

      expect(path1).toBe(path2);
      expect(await fs.pathExists(path1)).toBe(true);
    }, 30000);
  });

  describe('discover', () => {
    it('should discover single skill in root directory', async () => {
      // Create a mock skill directory
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'skill-test-'));
      tempDirs.push(tempDir);

      await fs.writeFile(path.join(tempDir, 'SKILL.md'), '# Test Skill\n---\nname: test-skill\nversion: 1.0.0\n---');

      const meta = {
        type: 'git' as const,
        source: 'test/repo',
        resolved: tempDir,
        multiSkill: true,
        skillPath: 'skills',
      };

      const skills = await source.discover(tempDir, meta);

      expect(skills).toHaveLength(1);
      expect(skills[0].name).toBe(path.basename(tempDir));
    });

    it('should discover multiple skills in skills directory', async () => {
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'skill-test-'));
      tempDirs.push(tempDir);

      // Create skills directory with multiple skills
      const skillsDir = path.join(tempDir, 'skills');
      await fs.ensureDir(skillsDir);

      const skill1Dir = path.join(skillsDir, 'skill1');
      const skill2Dir = path.join(skillsDir, 'skill2');

      await fs.ensureDir(skill1Dir);
      await fs.ensureDir(skill2Dir);

      await fs.writeFile(path.join(skill1Dir, 'SKILL.md'), '# Skill 1\n---\nname: skill1\nversion: 1.0.0\n---');
      await fs.writeFile(path.join(skill2Dir, 'SKILL.md'), '# Skill 2\n---\nname: skill2\nversion: 1.0.0\n---');

      const meta = {
        type: 'git' as const,
        source: 'test/repo',
        resolved: tempDir,
        multiSkill: true,
        skillPath: 'skills',
      };

      const skills = await source.discover(tempDir, meta);

      expect(skills).toHaveLength(2);
      expect(skills.map(s => s.name).sort()).toEqual(['skill1', 'skill2']);
    });
  });
});
