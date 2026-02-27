#!/usr/bin/env node

import { Command } from 'commander';

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
  .action(() => {
    console.log('List command coming in next task!');
  });

program
  .command('validate <path>')
  .description('Validate skill format')
  .action((path: string) => {
    console.log(`Validating ${path}...`);
    console.log('Validate command coming in next task!');
  });

program.parse();
