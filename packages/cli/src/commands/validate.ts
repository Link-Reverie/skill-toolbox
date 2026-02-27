import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { SkillParser } from '@skill-toolbox/core';
import { metadataPlugin } from '@skill-toolbox/plugin-metadata';

export async function validateCommand(skillPath: string) {
  const parser = new SkillParser().use(metadataPlugin());

  try {
    const stat = await fs.stat(skillPath);

    if (stat.isDirectory()) {
      // Find skill file in directory
      const skillFile = await findSkillFile(skillPath);
      if (!skillFile) {
        console.log(chalk.red('✗'), skillPath);
        console.log(chalk.red('  Error: No skill file found (SKILL.md or README.md)'));
        process.exit(1);
      }
      skillPath = skillFile;
    }

    const markdown = await fs.readFile(skillPath, 'utf-8');
    const skill = await parser.parse(markdown);

    // Validate metadata
    if (!skill.metadata.name) {
      console.log(chalk.red('✗'), skillPath);
      console.log(chalk.red('  Error: Missing required metadata field: name'));
      process.exit(1);
    }

    if (!skill.metadata.version) {
      console.log(chalk.red('✗'), skillPath);
      console.log(chalk.red('  Error: Missing required metadata field: version'));
      process.exit(1);
    }

    console.log(chalk.green('✓'), skillPath);
    console.log(chalk.gray(`  Name: ${skill.metadata.name}`));
    console.log(chalk.gray(`  Version: ${skill.metadata.version}`));
    if (skill.metadata.description) {
      console.log(chalk.gray(`  Description: ${skill.metadata.description}`));
    }
    console.log();

  } catch (error) {
    console.log(chalk.red('✗'), skillPath);
    console.log(chalk.red(`  Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
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
