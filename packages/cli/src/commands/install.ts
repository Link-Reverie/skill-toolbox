import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { GitSource } from '@skill-toolbox/git-source';
import { SkillParser } from '@skill-toolbox/core';
import { metadataPlugin } from '@skill-toolbox/plugin-metadata';

export async function installCommand(source: string, options: { dir: string }) {
  const spinner = ora('Installing skill...').start();

  try {
    // Check if source is a local path
    const isLocal = await fs.pathExists(source);
    let skillDir: string;
    let shouldCleanup = false;

    if (isLocal) {
      // Use local path directly
      spinner.text = 'Installing from local path...';
      const stat = await fs.stat(source);

      if (stat.isDirectory()) {
        skillDir = source;
      } else {
        // If it's a file, use the parent directory
        skillDir = path.dirname(source);
      }
    } else {
      // Use Git source
      const gitSource = new GitSource();

      // 1. Resolve source
      spinner.text = 'Resolving source...';
      const resolved = await gitSource.resolve(source);

      // 2. Clone to temp directory
      spinner.text = `Cloning from ${resolved.url}...`;
      skillDir = await gitSource.clone(resolved.url);
      shouldCleanup = true;
    }

    // 3. Validate skill
    spinner.text = 'Validating skill...';
    const skillFile = await findSkillFile(skillDir);

    if (!skillFile) {
      spinner.fail(chalk.red('Invalid skill: no skill file found'));
      if (shouldCleanup) {
        await fs.remove(skillDir);
      }
      process.exit(1);
    }

    const markdown = await fs.readFile(skillFile, 'utf-8');
    const parser = new SkillParser().use(metadataPlugin());
    const skill = await parser.parse(markdown);

    if (!skill || !skill.metadata.name) {
      spinner.fail(chalk.red('Invalid skill: missing required metadata'));
      if (shouldCleanup) {
        await fs.remove(skillDir);
      }
      process.exit(1);
    }

    // 4. Install
    spinner.text = 'Installing skill...';
    const targetDir = path.join(options.dir, skill.metadata.name);
    await fs.ensureDir(options.dir);
    await fs.copy(skillDir, targetDir);

    // 5. Clean up temp directory if it was cloned
    if (shouldCleanup) {
      await fs.remove(skillDir);
    }

    spinner.succeed(chalk.green(`✓ Skill "${skill.metadata.name}" installed successfully!`));

    console.log('\nSkill Info:');
    console.log(chalk.gray('  Name:'), skill.metadata.name);
    console.log(chalk.gray('  Version:'), skill.metadata.version);
    if (skill.metadata.description) {
      console.log(chalk.gray('  Description:'), skill.metadata.description);
    }

  } catch (error) {
    spinner.fail(chalk.red(`Failed to install skill: ${error instanceof Error ? error.message : 'Unknown error'}`));
    process.exit(1);
  }
}

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
