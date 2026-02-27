#!/usr/bin/env node

import { Command } from 'commander';
import { listCommand } from './commands/list';
import { validateCommand } from './commands/validate';

const program = new Command();

program
  .name('skill-toolbox')
  .description('CLI tool for discovering and managing Claude Code skills')
  .version('1.0.0');

program
  .command('install <source>')
  .description('Install a skill from git repository or local path')
  .option('-d, --dir <directory>', 'Installation directory', './skills')
  .action(async (source: string, options) => {
    console.log(`Installing skill from ${source}...`);
    console.log('Install command coming in next task!');
  });

program
  .command('list')
  .description('List installed skills')
  .option('-d, --dir <directory>', 'Skills directory', './skills')
  .action(async (options) => {
    await listCommand(options.dir);
  });

program
  .command('validate <path>')
  .description('Validate skill format')
  .action(async (skillPath: string) => {
    await validateCommand(skillPath);
  });

program.parse();
