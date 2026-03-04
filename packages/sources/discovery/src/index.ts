import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import type {
  SkillSource,
  SourceInfo,
  SourceLoadResult,
  LoadedSkill,
  SourceCategory,
} from '@skill-toolbox/utils';
import { walkUp, isDirectory } from './utils';

export interface DiscoverySourceOptions {
  /** Project starting directory (default: process.cwd()) */
  projectDir?: string;
  /** Worktree root directory (stops upward traversal) */
  worktreeRoot?: string;
  /** External directory names to discover (default: ['.claude', '.agents']) */
  externalDirs?: string[];
  /** Include global directories (default: true) */
  includeGlobal?: boolean;
  /** Include project-level directories (default: true) */
  includeProject?: boolean;
}

/**
 * Auto-discovery source for skills
 *
 * Discovery order (later overwrites earlier):
 * 1. Global directories: ~/.claude/skills, ~/.agents/skills
 * 2. Project directories: walk up from projectDir to find .claude/skills, .agents/skills
 *
 * @example
 * ```typescript
 * const discovery = new DiscoverySource({
 *   projectDir: process.cwd(),
 *   externalDirs: ['.claude', '.agents'],
 * });
 *
 * const { skills } = await discovery.load();
 * ```
 */
export class DiscoverySource implements SkillSource {
  private options: Required<DiscoverySourceOptions>;
  private foundDirs: string[] = [];

  constructor(options: DiscoverySourceOptions = {}) {
    this.options = {
      projectDir: options.projectDir ?? process.cwd(),
      worktreeRoot: options.worktreeRoot ?? '/',
      externalDirs: options.externalDirs ?? ['.claude', '.agents'],
      includeGlobal: options.includeGlobal ?? true,
      includeProject: options.includeProject ?? true,
    };
  }

  getSourceInfo(): SourceInfo {
    return {
      type: 'filesystem',
      category: 'local' as SourceCategory,
      identifier: 'discovery',
    };
  }

  async load(): Promise<SourceLoadResult> {
    const skills: LoadedSkill[] = [];
    const errors: SourceLoadResult['errors'] = [];

    // 1. Discover global directories
    if (this.options.includeGlobal) {
      const home = homedir();
      for (const dir of this.options.externalDirs) {
        const globalPath = join(home, dir);
        if (await isDirectory(globalPath)) {
          this.foundDirs.push(globalPath);
        }
      }
    }

    // 2. Discover project-level directories (walk up)
    if (this.options.includeProject) {
      const projectDirs = await walkUp(
        this.options.externalDirs,
        this.options.projectDir,
        this.options.worktreeRoot
      );
      this.foundDirs.push(...projectDirs);
    }

    // 3. Load skills from each discovered directory
    for (const dir of this.foundDirs) {
      const dirSkills = await this.loadSkillsFromDir(dir);
      for (const skill of dirSkills) {
        // Check for duplicates (later overwrites earlier)
        const existingIndex = skills.findIndex((s) => s.baseName === skill.baseName);
        if (existingIndex >= 0) {
          skills[existingIndex] = skill;
        } else {
          skills.push(skill);
        }
      }
    }

    return {
      skills,
      errors,
      info: {
        ...this.getSourceInfo(),
        // Return first found dir as primary path, or empty if none
        path: this.foundDirs.length > 0 ? this.foundDirs[0] : '',
        // Store all found dirs in metadata
        metadata: { allDirs: this.foundDirs },
      },
    };
  }

  private async loadSkillsFromDir(baseDir: string): Promise<LoadedSkill[]> {
    const skills: LoadedSkill[] = [];
    const skillsDir = join(baseDir, 'skills');

    if (!(await isDirectory(skillsDir))) {
      return skills;
    }

    // Traverse subdirectories in skills/
    try {
      const entries = await readdir(skillsDir, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const skillDir = join(skillsDir, entry.name);
        const skillFile = join(skillDir, 'SKILL.md');

        try {
          const content = await readFile(skillFile, 'utf-8');
          skills.push({
            name: `discovery/${entry.name}`,
            baseName: entry.name,
            source: 'discovery',
            path: skillFile,
            directory: skillDir,
            content,
          });
        } catch {
          // SKILL.md doesn't exist, skip
        }
      }
    } catch {
      // Unable to read directory, skip
    }

    return skills;
  }

  async cleanup(): Promise<void> {
    // No cleanup needed
  }
}

export { walkUp, isDirectory } from './utils';
