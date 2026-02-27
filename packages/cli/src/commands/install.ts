import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { GitSource } from '@skill-toolbox/git-source';
import { SkillRegistry } from '../registry';

export async function installCommand(source: string, options: { dir: string }) {
  const spinner = ora('Installing skill...').start();

  try {
    const registry = new SkillRegistry(options.dir);
    const gitSource = new GitSource();

    // 1. Resolve source
    spinner.text = 'Resolving source...';
    const resolved = await gitSource.resolve(source);

    // 2. Clone to temp directory
    spinner.text = `Cloning from ${resolved.url}...`;
    const tempDir = await gitSource.clone(resolved.url);

    // 3. Validate skill
    spinner.text = 'Validating skill...';
    const skill = await registry.get(path.basename(tempDir));

    if (!skill || !skill.metadata.name) {
      spinner.fail(chalk.red('Invalid skill: missing required metadata'));
      await fs.remove(tempDir);
      process.exit(1);
    }

    // 4. Install
    spinner.text = 'Installing skill...';
    const targetDir = path.join(options.dir, skill.metadata.name);
    await fs.ensureDir(options.dir);
    await fs.copy(tempDir, targetDir);

    // 5. Clean up
    await fs.remove(tempDir);

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
