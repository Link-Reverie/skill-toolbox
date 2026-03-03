import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { GitSource } from '@skill-toolbox/git-source';
import { FilesystemSource } from '@skill-toolbox/filesystem-source';
import { SkillLoader } from '@skill-toolbox/core';
import { metadataPlugin } from '@skill-toolbox/plugin-metadata';
import { SkillParser } from '@skill-toolbox/core';

export async function installCommand(source: string, options: { dir: string }) {
  const spinner = ora('Installing skill...').start();

  try {
    // Create loader with sources
    const parser = new SkillParser().use(metadataPlugin());
    const loader = new SkillLoader({
      sources: [
        new FilesystemSource(),
        new GitSource(),
      ],
      parser,
    });

    // Load skills from source
    spinner.text = 'Loading skill...';
    const result = await loader.loadFromSource(source);

    if (result.errors.length > 0) {
      for (const error of result.errors) {
        spinner.fail(chalk.red(`Error loading from ${error.source}: ${error.error.message}`));
      }
      process.exit(1);
    }

    if (result.skills.size === 0) {
      spinner.fail(chalk.red('No skills found'));
      process.exit(1);
    }

    // Install all loaded skills
    spinner.text = 'Installing skills...';
    await fs.ensureDir(options.dir);

    const installedSkills: string[] = [];
    for (const [name, skill] of result.skills) {
      // Get skill directory from raw path
      const skillDir = path.dirname(skill.raw.path || '');
      const targetDir = path.join(options.dir, name);

      // Copy skill to target directory
      await fs.copy(skillDir, targetDir, { overwrite: true });
      installedSkills.push(name);
    }

    spinner.succeed(chalk.green(`✓ ${installedSkills.length} skill(s) installed successfully!`));

    // Display installed skills info
    console.log('\nInstalled Skills:');
    for (const name of installedSkills) {
      const skill = result.skills.get(name);
      if (skill) {
        console.log(chalk.gray('  •'), chalk.cyan(name), chalk.gray(`v${skill.metadata.version}`));
        if (skill.metadata.description) {
          console.log(chalk.gray('    '), skill.metadata.description);
        }
      }
    }

  } catch (error) {
    spinner.fail(chalk.red(`Failed to install skill: ${error instanceof Error ? error.message : 'Unknown error'}`));
    process.exit(1);
  }
}
