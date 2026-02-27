import chalk from 'chalk';
import { SkillRegistry } from '../registry';

export async function listCommand(skillsDir: string) {
  const registry = new SkillRegistry(skillsDir);
  const skills = await registry.listAll();

  if (skills.length === 0) {
    console.log(chalk.yellow('No skills found.'));
    console.log(chalk.gray('\nInstall skills with: skill-toolbox install <source>'));
    return;
  }

  console.log(chalk.bold('\nInstalled Skills:\n'));

  for (const skill of skills) {
    console.log(chalk.green(`  ${skill.metadata.name}`) + chalk.gray(`@${skill.metadata.version}`));
    if (skill.metadata.description) {
      console.log(chalk.gray(`    ${skill.metadata.description}`));
    }
  }

  console.log(chalk.gray(`\nTotal: ${skills.length} skill(s)\n`));
}
