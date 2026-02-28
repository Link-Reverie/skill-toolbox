import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { SkillParser } from '@skill-toolbox/core';
import { metadataPlugin } from '@skill-toolbox/plugin-metadata';
import type { Skill } from '@skill-toolbox/utils';
import { GitSource } from '@skill-toolbox/git-source';

export interface CommandContext {
  skills: Map<string, Skill>;
  skillsDir: string;
}

export type CommandHandler = (
  args: string[],
  context: CommandContext
) => Promise<void | string>;

export const commands = {
  async help(_args: string[], _context: CommandContext): Promise<void> {
    console.log(chalk.bold('\nAvailable commands:\n'));
    console.log('  /help              Show this help message');
    console.log('  /skills            List loaded skills');
    console.log('  /install <source>  Install skill from Git source');
    console.log('  /reload            Reload all skills');
    console.log('  /clear             Clear conversation history');
    console.log('  /exit              Exit the agent\n');
  },

  async skills(_args: string[], context: CommandContext): Promise<void> {
    const { skills } = context;

    if (skills.size === 0) {
      console.log(chalk.yellow('\nNo skills loaded.\n'));
      return;
    }

    console.log(chalk.bold('\nLoaded skills:\n'));
    for (const [name, skill] of skills) {
      const version = skill.metadata.version || 'unknown';
      const description = skill.metadata.description || 'No description';
      console.log(`  ${chalk.cyan(name)} (${version})`);
      console.log(`    ${description}`);
    }
    console.log();
  },

  async install(args: string[], context: CommandContext): Promise<void> {
    const { skillsDir } = context;
    const source = args[0];

    if (!source) {
      console.log(chalk.red('\nError: No source specified'));
      console.log('Usage: /install <source>\n');
      return;
    }

    console.log(chalk.cyan(`\nInstalling skill from ${source}...`));

    const gitSource = new GitSource();
    let tempDir: string | undefined;

    try {
      // Resolve the source
      const resolved = await gitSource.resolve(source);
      console.log(`Resolved to: ${resolved.url}`);

      // Clone to temp directory
      tempDir = await gitSource.clone(resolved.url);
      console.log('Cloned successfully');

      // Parse skill to get name
      const skillFile = await findSkillFile(tempDir);
      if (!skillFile) {
        throw new Error('No skill file found in repository');
      }

      const markdown = await fs.readFile(skillFile, 'utf-8');
      const parser = new SkillParser().use(metadataPlugin());
      const skill = await parser.parse(markdown);

      if (!skill || !skill.metadata.name) {
        throw new Error('Invalid skill: missing name');
      }

      const skillName = skill.metadata.name;
      const targetDir = path.join(skillsDir, skillName);

      // Check if skill already exists
      if (await fs.pathExists(targetDir)) {
        console.log(chalk.yellow(`Skill "${skillName}" already exists, updating...`));
        await fs.remove(targetDir);
      }

      // Copy to skills directory
      await fs.copy(tempDir, targetDir);
      console.log(chalk.green(`\n✓ Skill "${skillName}" installed successfully!\n`));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(chalk.red(`\nFailed to install skill: ${message}\n`));
    } finally {
      // Clean up temp directory
      if (tempDir) {
        try {
          await fs.remove(tempDir);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    }
  },

  async reload(_args: string[], _context: CommandContext): Promise<string> {
    return 'reload';
  },

  async clear(_args: string[], _context: CommandContext): Promise<string> {
    return 'clear';
  },

  async exit(_args: string[], _context: CommandContext): Promise<void> {
    console.log(chalk.cyan('\nGoodbye!\n'));
    process.exit(0);
  }
};

async function findSkillFile(dir: string): Promise<string | null> {
  const candidates = ['SKILL.md', 'skill.md', 'README.md', 'readme.md'];

  for (const file of candidates) {
    const filePath = path.join(dir, file);
    if (await fs.pathExists(filePath)) {
      return filePath;
    }
  }

  return null;
}
