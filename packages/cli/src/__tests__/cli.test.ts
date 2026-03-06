import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execa } from 'execa';
import { mkdir, writeFile, rm } from 'fs-extra';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('CLI Integration Tests', () => {
  const cliPath = join(__dirname, '../../dist/index.js');
  const testDir = join(__dirname, '__test_fixtures__');
  const skillsDir = join(testDir, 'skills');

  beforeAll(async () => {
    // Create test directories
    await mkdir(skillsDir, { recursive: true });

    // Create a test skill
    const testSkill = join(skillsDir, 'test-skill');
    await mkdir(testSkill, { recursive: true });
    await writeFile(join(testSkill, 'SKILL.md'), `---
name: test-skill
version: 1.0.0
description: A test skill
---

# Test Skill

This is a test skill for CLI testing.
`);
  });

  afterAll(async () => {
    // Cleanup test directories
    await rm(testDir, { recursive: true, force: true });
  });

  describe('list command', () => {
    it('should list installed skills', async () => {
      const result = await execa('node', [cliPath, 'list', '-d', skillsDir]);

      expect(result.stdout).toContain('test-skill');
      expect(result.stdout).toContain('1.0.0');
      expect(result.stdout).toContain('A test skill');
      expect(result.stdout).toContain('Total: 1 skill(s)');
    });

    it('should show message when no skills found', async () => {
      const emptyDir = join(testDir, 'empty');
      await mkdir(emptyDir, { recursive: true });

      const result = await execa('node', [cliPath, 'list', '-d', emptyDir]);

      expect(result.stdout).toContain('No skills found');
      expect(result.stdout).toContain('Install skills with: skill-toolbox install <source>');

      await rm(emptyDir, { recursive: true });
    });
  });

  describe('validate command', () => {
    it('should validate a valid skill', async () => {
      const skillPath = join(skillsDir, 'test-skill', 'SKILL.md');
      const result = await execa('node', [cliPath, 'validate', skillPath]);

      expect(result.exitCode).toBe(0);
    });

    it('should fail for invalid skill path', async () => {
      const result = await execa('node', [cliPath, 'validate', './non-existent.md'], {
        reject: false,
      });

      expect(result.exitCode).not.toBe(0);
    });
  });

  describe('help and version', () => {
    it('should show help', async () => {
      const result = await execa('node', [cliPath, '--help']);

      expect(result.stdout).toContain('skill-toolbox');
      expect(result.stdout).toContain('CLI tool for discovering and managing Claude Code skills');
      expect(result.stdout).toContain('install');
      expect(result.stdout).toContain('list');
      expect(result.stdout).toContain('validate');
    });

    it('should show version', async () => {
      const result = await execa('node', [cliPath, '--version']);

      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/);
    });
  });
});
