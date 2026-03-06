import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { DiscoverySource } from '../src/index';
import { walkUp, isDirectory } from '../src/utils';

describe('DiscoverySource', () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = join(tmpdir(), `discovery-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });

    // Create test structure:
    // tempDir/
    //   project/
    //     .claude/skills/test-skill/SKILL.md
    //     .agents/skills/agent-skill/SKILL.md
    //   other/

    const projectDir = join(tempDir, 'project');
    const claudeSkillsDir = join(projectDir, '.claude', 'skills', 'test-skill');
    const agentsSkillsDir = join(projectDir, '.agents', 'skills', 'agent-skill');

    await mkdir(claudeSkillsDir, { recursive: true });
    await mkdir(agentsSkillsDir, { recursive: true });

    await writeFile(
      join(claudeSkillsDir, 'SKILL.md'),
      `---
name: test-skill
description: A test skill from .claude
---
# Test Skill`
    );

    await writeFile(
      join(agentsSkillsDir, 'SKILL.md'),
      `---
name: agent-skill
description: A test skill from .agents
---
# Agent Skill`
    );
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('should discover skills from .claude and .agents directories', async () => {
    const projectDir = join(tempDir, 'project');
    const source = new DiscoverySource({
      projectDir,
      includeGlobal: false,
      worktreeRoot: tempDir, // Stop at temp root
    });

    const { skills } = await source.load();

    // Filter to only include skills from our temp directory
    const tempSkills = skills.filter(s => s.path.startsWith(tempDir));
    expect(tempSkills.length).toBe(2);
    expect(tempSkills.map((s) => s.baseName).sort()).toEqual(['agent-skill', 'test-skill']);
  });

  it('should return correct source info', () => {
    const source = new DiscoverySource();
    const info = source.getSourceInfo();

    expect(info.type).toBe('filesystem');
    expect(info.identifier).toBe('discovery');
  });

  it('should handle project without skill directories', async () => {
    const emptyDir = join(tempDir, 'other');
    await mkdir(emptyDir, { recursive: true });

    const source = new DiscoverySource({
      projectDir: emptyDir,
      includeGlobal: false,
      worktreeRoot: tempDir, // Stop at temp root
    });

    const { skills } = await source.load();
    // Filter to only include skills from our temp directory
    const tempSkills = skills.filter(s => s.path.startsWith(tempDir));
    expect(tempSkills.length).toBe(0);
  });
});

describe('walkUp', () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = join(tmpdir(), `walkup-test-${Date.now()}`);
    await mkdir(join(tempDir, 'a', 'b', 'c'), { recursive: true });
    await mkdir(join(tempDir, 'a', '.claude'), { recursive: true });
    await mkdir(join(tempDir, 'a', 'b', '.agents'), { recursive: true });
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('should find directories walking up', async () => {
    const startDir = join(tempDir, 'a', 'b', 'c');
    const dirs = await walkUp(['.claude', '.agents'], startDir, tempDir);

    // Filter to only include directories in our temp dir
    const tempDirs = dirs.filter(d => d.startsWith(tempDir));
    expect(tempDirs.length).toBe(2);
    expect(tempDirs.some((d) => d.endsWith('.agents'))).toBe(true);
    expect(tempDirs.some((d) => d.endsWith('.claude'))).toBe(true);
  });

  it('should stop at specified directory', async () => {
    const startDir = join(tempDir, 'a', 'b', 'c');
    const stopDir = join(tempDir, 'a', 'b');

    const dirs = await walkUp(['.claude'], startDir, stopDir);

    // Should only find .agents in b/, not .claude in a/
    expect(dirs.length).toBe(0);
  });
});

describe('isDirectory', () => {
  it('should return true for directories', async () => {
    const result = await isDirectory(tmpdir());
    expect(result).toBe(true);
  });

  it('should return false for non-existent paths', async () => {
    const result = await isDirectory('/non/existent/path');
    expect(result).toBe(false);
  });
});
