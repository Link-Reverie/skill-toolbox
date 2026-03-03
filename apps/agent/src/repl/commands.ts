import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
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

export const commands: Record<string, { description: string; handler: CommandHandler }> = {
  help: {
    description: 'Show available commands',
    handler: async () => {
      console.log(chalk.bold('\nAvailable Commands:\n'));
      console.log('  /help              - Show this help message');
      console.log('  /skills            - List loaded skills');
      console.log('  /install <source>  - Install skill from Git source');
      console.log('  /reload            - Reload all skills');
      console.log('  /clear             - Clear conversation history');
      console.log('  /exit              - Exit the agent\n');
    },
  },

  skills: {
    description: 'List loaded skills',
    handler: async (_args, context) => {
      const { skills } = context;

      if (skills.size === 0) {
        console.log(chalk.yellow('\nNo skills loaded.\n'));
        return;
      }

      console.log(chalk.bold('\nLoaded Skills:\n'));
      let index = 1;
      for (const [name, skill] of skills) {
        console.log(chalk.green(`  ${index}. ${name}`) + chalk.gray(`@${skill.metadata.version}`));
        if (skill.metadata.description) {
          console.log(chalk.gray(`     ${skill.metadata.description}`));
        }
        index++;
      }
      console.log(chalk.dim(`\nTotal: ${skills.size} skill(s)\n`));
    },
  },

  install: {
    description: 'Install skill from Git source',
    handler: async (args, context) => {
      const { skillsDir } = context;
      const source = args[0];

      if (!source) {
        return chalk.red('Error: Please specify a skill source');
      }

      console.log(chalk.cyan(`\nInstalling skill from ${source}...`));

      const gitSource = new GitSource({
        source,
        skillPath: '', // Auto-discover skills in root directory
      });

      try {
        // Load skills from the Git source
        const result = await gitSource.load();

        if (result.errors.length > 0) {
          for (const err of result.errors) {
            console.log(chalk.red(`Error: ${err.error.message}`));
          }
          return;
        }

        if (result.skills.length === 0) {
          console.log(chalk.yellow('No skills found in repository'));
          return;
        }

        // Install each skill
        const installedSkills: string[] = [];
        for (const skillData of result.skills) {
          const targetDir = path.join(skillsDir, skillData.baseName);

          // Check if skill already exists
          if (await fs.pathExists(targetDir)) {
            console.log(chalk.yellow(`Skill "${skillData.baseName}" already exists, updating...`));
            await fs.remove(targetDir);
          }

          // Copy to skills directory
          await fs.copy(skillData.directory, targetDir);
          installedSkills.push(skillData.baseName);
        }

        console.log(chalk.green(`\n✓ ${installedSkills.length} skill(s) installed successfully!`));
        for (const name of installedSkills) {
          console.log(chalk.gray(`  • ${name}`));
        }
        console.log();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(chalk.red(`\nFailed to install skill: ${message}\n`));
      } finally {
        // Clean up temp resources
        await gitSource.cleanup();
      }
      return;
    },
  },

  reload: {
    description: 'Reload all skills',
    handler: async () => {
      console.log(chalk.cyan('\nReloading skills...'));
      // Note: Actual reload will be handled by Agent class
      return 'reload';
    },
  },

  clear: {
    description: 'Clear conversation history',
    handler: async () => {
      return 'clear';
    },
  },

  exit: {
    description: 'Exit the agent',
    handler: async () => {
      console.log(chalk.cyan('\nGoodbye! 👋\n'));
      process.exit(0);
    },
  },
};
