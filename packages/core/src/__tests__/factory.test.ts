import { describe, it, expect } from 'vitest';
import { createSources, type SourceConfig } from '../factory';
import type { SkillSource, SourceInfo, SourceLoadResult } from '@skill-toolbox/utils';

// Mock implementations for testing
class MockFilesystemSource implements SkillSource {
  constructor(private options: { path: string; name?: string; category?: string }) {}

  getSourceInfo(): SourceInfo {
    const name = this.options.name || 'mock-fs';
    return {
      type: 'filesystem',
      category: (this.options.category as any) || (name === 'global' ? 'global' : 'local'),
      identifier: name,
    };
  }

  async load(): Promise<SourceLoadResult> {
    return {
      skills: [],
      errors: [],
      info: {
        type: 'filesystem',
        category: this.getSourceInfo().category,
        identifier: this.getSourceInfo().identifier,
        path: this.options.path,
      },
    };
  }

  async cleanup(): Promise<void> {}
}

class MockGitSource implements SkillSource {
  constructor(private options: { source: string; skillPath?: string; name?: string; category?: string; cacheDir?: string; shallow?: boolean }) {}

  getSourceInfo(): SourceInfo {
    return {
      type: 'git',
      category: (this.options.category as any) || 'git',
      identifier: this.options.name || this.options.source,
    };
  }

  async load(): Promise<SourceLoadResult> {
    return {
      skills: [],
      errors: [],
      info: {
        type: 'git',
        category: this.getSourceInfo().category,
        identifier: this.getSourceInfo().identifier,
        path: '/mock/path',
      },
    };
  }

  async cleanup(): Promise<void> {}
}

class MockDiscoverySource implements SkillSource {
  constructor(_options: { projectDir?: string; worktreeRoot?: string; externalDirs?: string[]; includeGlobal?: boolean; includeProject?: boolean }) {}

  getSourceInfo(): SourceInfo {
    return {
      type: 'filesystem',
      category: 'local',
      identifier: 'discovery',
    };
  }

  async load(): Promise<SourceLoadResult> {
    return {
      skills: [],
      errors: [],
      info: {
        type: 'filesystem',
        category: 'local',
        identifier: 'discovery',
        path: '/mock/discovery',
      },
    };
  }

  async cleanup(): Promise<void> {}
}

class MockHttpSource implements SkillSource {
  constructor(private options: { url: string; name?: string; cacheDir?: string; timeout?: number }) {}

  getSourceInfo(): SourceInfo {
    return {
      type: 'git',
      category: 'global',
      identifier: this.options.name || this.options.url,
    };
  }

  async load(): Promise<SourceLoadResult> {
    return {
      skills: [],
      errors: [],
      info: {
        type: 'git',
        category: 'global',
        identifier: this.getSourceInfo().identifier,
        path: '/mock/http',
      },
    };
  }

  async cleanup(): Promise<void> {}
}

describe('createSources', () => {
  const imports = {
    FilesystemSource: MockFilesystemSource as any,
    GitSource: MockGitSource as any,
    DiscoverySource: MockDiscoverySource as any,
    HttpSource: MockHttpSource as any,
  };

  it('should create filesystem source with minimal config', () => {
    const configs: SourceConfig[] = [
      { type: 'filesystem', path: './skills' },
    ];

    const sources = createSources(configs, imports);

    expect(sources.length).toBe(1);
    expect(sources[0]).toBeInstanceOf(MockFilesystemSource);

    const info = sources[0].getSourceInfo();
    expect(info.type).toBe('filesystem');
    expect(info.category).toBe('local');
  });

  it('should create filesystem source with all options', () => {
    const configs: SourceConfig[] = [
      {
        type: 'filesystem',
        path: './skills',
        name: 'my-skills',
        category: 'global',
      },
    ];

    const sources = createSources(configs, imports);

    expect(sources.length).toBe(1);
    const info = sources[0].getSourceInfo();
    expect(info.identifier).toBe('my-skills');
    expect(info.category).toBe('global');
  });

  it('should create git source with minimal config', () => {
    const configs: SourceConfig[] = [
      { type: 'git', source: 'user/repo' },
    ];

    const sources = createSources(configs, imports);

    expect(sources.length).toBe(1);
    expect(sources[0]).toBeInstanceOf(MockGitSource);

    const info = sources[0].getSourceInfo();
    expect(info.type).toBe('git');
    expect(info.category).toBe('git');
    expect(info.identifier).toBe('user/repo');
  });

  it('should create git source with all options', () => {
    const configs: SourceConfig[] = [
      {
        type: 'git',
        source: 'user/repo',
        skillPath: 'docs/skills',
        name: 'custom-name',
        category: 'local',
        cacheDir: './cache',
        shallow: false,
      },
    ];

    const sources = createSources(configs, imports);

    expect(sources.length).toBe(1);
    const info = sources[0].getSourceInfo();
    expect(info.identifier).toBe('custom-name');
    expect(info.category).toBe('local');
  });

  it('should create multiple sources in order', () => {
    const configs: SourceConfig[] = [
      { type: 'filesystem', path: './local-skills', name: 'local' },
      { type: 'git', source: 'user/repo', name: 'remote' },
      { type: 'filesystem', path: './global-skills', name: 'global' },
    ];

    const sources = createSources(configs, imports);

    expect(sources.length).toBe(3);
    expect(sources[0]).toBeInstanceOf(MockFilesystemSource);
    expect(sources[1]).toBeInstanceOf(MockGitSource);
    expect(sources[2]).toBeInstanceOf(MockFilesystemSource);

    expect(sources[0].getSourceInfo().identifier).toBe('local');
    expect(sources[1].getSourceInfo().identifier).toBe('remote');
    expect(sources[2].getSourceInfo().identifier).toBe('global');
  });

  it('should infer filesystem category as local when name is not global', () => {
    const configs: SourceConfig[] = [
      { type: 'filesystem', path: './skills', name: 'my-skills' },
    ];

    const sources = createSources(configs, imports);
    const info = sources[0].getSourceInfo();

    expect(info.category).toBe('local');
  });

  it('should infer filesystem category as global when name is global', () => {
    const configs: SourceConfig[] = [
      { type: 'filesystem', path: './skills', name: 'global' },
    ];

    const sources = createSources(configs, imports);
    const info = sources[0].getSourceInfo();

    expect(info.category).toBe('global');
  });

  it('should allow category override for filesystem source', () => {
    const configs: SourceConfig[] = [
      { type: 'filesystem', path: './skills', name: 'global', category: 'local' },
    ];

    const sources = createSources(configs, imports);
    const info = sources[0].getSourceInfo();

    expect(info.category).toBe('local');
  });

  it('should default git category to git', () => {
    const configs: SourceConfig[] = [
      { type: 'git', source: 'user/repo', name: 'my-repo' },
    ];

    const sources = createSources(configs, imports);
    const info = sources[0].getSourceInfo();

    expect(info.category).toBe('git');
  });

  it('should allow category override for git source', () => {
    const configs: SourceConfig[] = [
      { type: 'git', source: 'user/repo', category: 'local' },
    ];

    const sources = createSources(configs, imports);
    const info = sources[0].getSourceInfo();

    expect(info.category).toBe('local');
  });

  it('should return empty array for empty configs', () => {
    const sources = createSources([], imports);
    expect(sources.length).toBe(0);
  });
});
