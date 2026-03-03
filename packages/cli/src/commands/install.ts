import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { GitSource } from '@skill-toolbox/git-source';
import { FilesystemSource } from '@skill-toolbox/filesystem-source';
import { metadataPlugin } from '@skill-toolbox/plugin-metadata';
import { SkillParser } from '@skill-toolbox/core';
import type { SkillSource } from '@skill-toolbox/utils';

/**
 * Detect if source is a Git URL or local path
 */
function isGitSource(source: string): boolean {
  // github:user/repo, user/repo, or full git URLs
  return (
    source.startsWith('github:') ||
    source.startsWith('https://') ||
    source.startsWith('git@') ||
    source.endsWith('.git') ||
    /^[\w-]+\/[\w-]+(:[\w\/-]*)?$/.test(source)
  );
}

export async function installCommand(source: string, options: { dir: string }) {
  const spinner = ora('Installing skill...').start();

  try {
    // Create appropriate source based on input
    let skillSource: SkillSource;
    if (isGitSource(source)) {
      spinner.text = 'Cloning repository...';
      skillSource = new GitSource({
        source,
        skillPath: '', // Auto-discover
      });
    } else {
      spinner.text = 'Loading from local path...';
      skillSource = new FilesystemSource({
        path: source,
      });
    }

    // Create parser
    const parser = new SkillParser().use(metadataPlugin());

    // Load skills directly from source
    spinner.text = 'Loading skills...';
    const result = await skillSource.load();

    if (result.errors.length > 0) {
      for (const error of result.errors) {
        spinner.fail(chalk.red(`Error loading from ${error.path}: ${error.error.message}`));
      }
      // Continue with successfully loaded skills
    }

    if (result.skills.length === 0) {
      spinner.fail(chalk.red('No skills found'));
      await skillSource.cleanup();
      process.exit(1);
    }

    // Install all loaded skills
    spinner.text = 'Installing skills...';
    await fs.ensureDir(options.dir);

    const installedSkills: Array<{ name: string; version?: string; description?: string }> = [];
    for (const skillData of result.skills) {
      // Parse skill to get metadata
      const skill = await parser.parse(skillData.content);
      const targetDir = path.join(options.dir, skillData.baseName);

      // Copy skill to target directory
      await fs.copy(skillData.directory, targetDir, { overwrite: true });
      installedSkills.push({
        name: skillData.baseName,
        version: skill.metadata.version,
        description: skill.metadata.description,
      });
    }

    // Cleanup temp resources
    await skillSource.cleanup();

    spinner.succeed(chalk.green(`✓ ${installedSkills.length} skill(s) installed successfully!`));

    // Display installed skills info
    console.log('\nInstalled Skills:');
    for (const skill of installedSkills) {
      console.log(chalk.gray('  •'), chalk.cyan(skill.name), skill.version ? chalk.gray(`v${skill.version}`) : '');
      if (skill.description) {
        console.log(chalk.gray('    '), skill.description);
      }
    }

  } catch (error) {
    spinner.fail(chalk.red(`Failed to install skill: ${error instanceof Error ? error.message : 'Unknown error'}`));
    process.exit(1);
  }
}
