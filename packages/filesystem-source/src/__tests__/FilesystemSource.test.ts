import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { FilesystemSource } from '../FilesystemSource';

describe('FilesystemSource', () => {
  let source: FilesystemSource;
  let tempDir: string;

  beforeEach(async () => {
    source = new FilesystemSource();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'filesystem-source-test-'));
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('canHandle', () => {
    it('should handle absolute paths that exist', async () => {
      const testFile = path.join(tempDir, 'test.txt');
      await fs.writeFile(testFile, 'test');

      const result = await source.canHandle(testFile);
      expect(result).toBe(true);
    });

    it('should not handle paths that do not exist', async () => {
      const result = await source.canHandle('/nonexistent/path');
      expect(result).toBe(false);
    });

    it('should handle relative paths with cwd', async () => {
      const sourceWithCwd = new FilesystemSource({ cwd: tempDir });
      const testFile = 'test.txt';
      await fs.writeFile(path.join(tempDir, testFile), 'test');

      const result = await sourceWithCwd.canHandle(testFile);
      expect(result).toBe(true);
    });
  });

  describe('resolve', () => {
    it('should resolve absolute paths', async () => {
      const testDir = path.join(tempDir, 'skill-dir');
      await fs.ensureDir(testDir);

      const meta = await source.resolve(testDir);

      expect(meta.type).toBe('filesystem');
      expect(meta.source).toBe(testDir);
      expect(meta.resolved).toBe(testDir);
      expect(meta.multiSkill).toBe(true);
    });

    it('should resolve relative paths with cwd', async () => {
      const sourceWithCwd = new FilesystemSource({ cwd: tempDir });
      const testDir = 'skill-dir';
      await fs.ensureDir(path.join(tempDir, testDir));

      const meta = await sourceWithCwd.resolve(testDir);

      expect(meta.resolved).toBe(path.join(tempDir, testDir));
    });

    it('should throw for non-existent paths', async () => {
      await expect(source.resolve('/nonexistent')).rejects.toThrow();
    });
  });

  describe('fetch', () => {
    it('should return resolved path', async () => {
      const testDir = path.join(tempDir, 'skill-dir');
      await fs.ensureDir(testDir);

      const meta = await source.resolve(testDir);
      const result = await source.fetch(meta);

      expect(result).toBe(testDir);
    });
  });

  describe('discover', () => {
    it('should discover single skill in directory', async () => {
      const skillDir = path.join(tempDir, 'my-skill');
      await fs.ensureDir(skillDir);
      await fs.writeFile(path.join(skillDir, 'SKILL.md'), '# My Skill');

      const meta = await source.resolve(skillDir);
      const skills = await source.discover(skillDir, meta);

      expect(skills).toHaveLength(1);
      expect(skills[0].name).toBe('my-skill');
      expect(skills[0].path).toBe(path.join(skillDir, 'SKILL.md'));
    });

    it('should discover multiple skills in parent directory', async () => {
      const skillsDir = path.join(tempDir, 'skills');
      const skill1Dir = path.join(skillsDir, 'skill1');
      const skill2Dir = path.join(skillsDir, 'skill2');

      await fs.ensureDir(skill1Dir);
      await fs.ensureDir(skill2Dir);
      await fs.writeFile(path.join(skill1Dir, 'SKILL.md'), '# Skill 1');
      await fs.writeFile(path.join(skill2Dir, 'SKILL.md'), '# Skill 2');

      const meta = await source.resolve(skillsDir);
      const skills = await source.discover(skillsDir, meta);

      expect(skills).toHaveLength(2);
      expect(skills.map(s => s.name).sort()).toEqual(['skill1', 'skill2']);
    });

    it('should handle skill file directly', async () => {
      const skillFile = path.join(tempDir, 'SKILL.md');
      await fs.writeFile(skillFile, '# My Skill');

      const meta = await source.resolve(skillFile);
      const skills = await source.discover(skillFile, meta);

      expect(skills).toHaveLength(1);
      expect(skills[0].path).toBe(skillFile);
    });
  });
});
