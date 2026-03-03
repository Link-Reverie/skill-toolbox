import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { FilesystemSource } from '../FilesystemSource';

describe('FilesystemSource', () => {
  let source: FilesystemSource;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'filesystem-source-test-'));
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('constructor', () => {
    it('should create instance with required options', () => {
      source = new FilesystemSource({
        path: tempDir,
      });
      expect(source).toBeDefined();
    });

    it('should create instance with name option', () => {
      source = new FilesystemSource({
        path: tempDir,
        name: 'custom-name',
      });
      expect(source).toBeDefined();
    });

    it('should create instance with category option', () => {
      source = new FilesystemSource({
        path: tempDir,
        name: 'my-source',
        category: 'global',
      });
      expect(source).toBeDefined();
    });
  });

  describe('getSourceInfo', () => {
    it('should return source info with filesystem type', () => {
      source = new FilesystemSource({
        path: tempDir,
        name: 'test-source',
      });

      const info = source.getSourceInfo();

      expect(info.type).toBe('filesystem');
      expect(info.identifier).toBe('test-source');
      // path is only available after load()
    });

    it('should use directory name as identifier if name not provided', () => {
      source = new FilesystemSource({
        path: tempDir,
      });

      const info = source.getSourceInfo();

      expect(info.identifier).toBe(path.basename(tempDir));
    });

    it('should infer global category when name is global', () => {
      source = new FilesystemSource({
        path: tempDir,
        name: 'global',
      });

      const info = source.getSourceInfo();

      expect(info.category).toBe('global');
    });

    it('should infer local category when name is not global', () => {
      source = new FilesystemSource({
        path: tempDir,
        name: 'my-skills',
      });

      const info = source.getSourceInfo();

      expect(info.category).toBe('local');
    });

    it('should allow category override', () => {
      source = new FilesystemSource({
        path: tempDir,
        name: 'global',
        category: 'local',
      });

      const info = source.getSourceInfo();

      expect(info.category).toBe('local');
    });
  });

  describe('load', () => {
    it('should return error for non-existent path', async () => {
      source = new FilesystemSource({
        path: '/nonexistent/path',
      });

      const result = await source.load();

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].error.message).toContain('does not exist');
    });

    it('should load single skill from directory with SKILL.md', async () => {
      // Create a skill directory
      const skillDir = path.join(tempDir, 'my-skill');
      await fs.ensureDir(skillDir);
      await fs.writeFile(
        path.join(skillDir, 'SKILL.md'),
        '---\nname: my-skill\nversion: 1.0.0\n---\n# My Skill'
      );

      source = new FilesystemSource({
        path: skillDir,
      });

      const result = await source.load();

      expect(result.skills.length).toBe(1);
      expect(result.skills[0].baseName).toBe('my-skill');
      expect(result.skills[0].source).toBe('my-skill');
      expect(result.errors.length).toBe(0);
    });

    it('should load multiple skills from parent directory', async () => {
      // Create multiple skill directories
      const skill1Dir = path.join(tempDir, 'skill1');
      const skill2Dir = path.join(tempDir, 'skill2');

      await fs.ensureDir(skill1Dir);
      await fs.ensureDir(skill2Dir);

      await fs.writeFile(
        path.join(skill1Dir, 'SKILL.md'),
        '---\nname: skill1\nversion: 1.0.0\n---\n# Skill 1'
      );
      await fs.writeFile(
        path.join(skill2Dir, 'SKILL.md'),
        '---\nname: skill2\nversion: 1.0.0\n---\n# Skill 2'
      );

      source = new FilesystemSource({
        path: tempDir,
      });

      const result = await source.load();

      expect(result.skills.length).toBe(2);
      expect(result.skills.map(s => s.baseName).sort()).toEqual(['skill1', 'skill2']);
      expect(result.errors.length).toBe(0);
    });

    it('should load skill from README.md', async () => {
      const skillDir = path.join(tempDir, 'readme-skill');
      await fs.ensureDir(skillDir);
      await fs.writeFile(
        path.join(skillDir, 'README.md'),
        '---\nname: readme-skill\nversion: 1.0.0\n---\n# README Skill'
      );

      source = new FilesystemSource({
        path: skillDir,
      });

      const result = await source.load();

      expect(result.skills.length).toBe(1);
      expect(result.skills[0].baseName).toBe('readme-skill');
    });

    it('should skip hidden directories', async () => {
      // Create visible and hidden skill directories
      const visibleDir = path.join(tempDir, 'visible-skill');
      const hiddenDir = path.join(tempDir, '.hidden-skill');

      await fs.ensureDir(visibleDir);
      await fs.ensureDir(hiddenDir);

      await fs.writeFile(
        path.join(visibleDir, 'SKILL.md'),
        '---\nname: visible\nversion: 1.0.0\n---\n# Visible'
      );
      await fs.writeFile(
        path.join(hiddenDir, 'SKILL.md'),
        '---\nname: hidden\nversion: 1.0.0\n---\n# Hidden'
      );

      source = new FilesystemSource({
        path: tempDir,
      });

      const result = await source.load();

      expect(result.skills.length).toBe(1);
      expect(result.skills[0].baseName).toBe('visible-skill');
    });

    it('should return info with path after load', async () => {
      // Create a skill directory
      const skillDir = path.join(tempDir, 'my-skill');
      await fs.ensureDir(skillDir);
      await fs.writeFile(
        path.join(skillDir, 'SKILL.md'),
        '---\nname: my-skill\nversion: 1.0.0\n---\n# My Skill'
      );

      source = new FilesystemSource({
        path: skillDir,
        name: 'test-source',
        category: 'local',
      });

      const result = await source.load();

      expect(result.info.type).toBe('filesystem');
      expect(result.info.identifier).toBe('test-source');
      expect(result.info.category).toBe('local');
      expect(result.info.path).toBe(skillDir);
    });
  });

  describe('cleanup', () => {
    it('should not throw on cleanup', async () => {
      source = new FilesystemSource({
        path: tempDir,
      });

      await expect(source.cleanup()).resolves.not.toThrow();
    });
  });
});
