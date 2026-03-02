import * as readline from 'readline';
import chalk from 'chalk';
import { loadConfig, type AgentConfig } from './config';
import { Agent } from './agent';
import { commands, type CommandContext } from './repl/commands';

/**
 * Main entry point for the agent application.
 * Loads config, initializes agent, and starts REPL loop.
 */
async function main(): Promise<void> {
  try {
    // Load configuration
    const config = loadConfig();

    // Create and start agent
    const agent = new Agent(config);
    await agent.start();

    // Start REPL loop
    await replLoop(agent, config);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(chalk.red(`Error: ${errorMessage}`));
    process.exit(1);
  }
}

/**
 * REPL (Read-Eval-Print Loop) for interactive agent communication.
 * Handles user input, commands, and chat messages.
 * @param agent - The agent instance
 * @param config - The agent configuration
 */
async function replLoop(agent: Agent, config: AgentConfig): Promise<void> {
  // Create command context
  let context: CommandContext = {
    skills: agent.getSkills(),
    skillsDir: config.skillsDir,
  };

  // Create readline interface (only once)
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.cyan('You: '),
  });

  // Handle graceful shutdown
  rl.on('close', () => {
    console.log(chalk.cyan('\nGoodbye! 👋\n'));
    process.exit(0);
  });

  // Show initial prompt
  rl.prompt();

  // Handle each line of input
  rl.on('line', async (input: string) => {
    try {
      // Trim and validate input
      const trimmedInput = input.trim();
      if (!trimmedInput) {
        rl.prompt();
        return;
      }

      // Check if input is a command
      if (trimmedInput.startsWith('/')) {
        // Parse command and arguments
        const parts = trimmedInput.slice(1).split(/\s+/);
        const commandName = parts[0];
        const args = parts.slice(1);

        // Look up command
        const command = commands[commandName];

        if (command) {
          // Execute command
          const result = await command.handler(args, context);

          // Handle special return values
          if (result === 'reload') {
            await agent.reloadSkills();
            // Update context with new skills
            context = {
              skills: agent.getSkills(),
              skillsDir: config.skillsDir,
            };
          } else if (result === 'clear') {
            agent.clearHistory();
          }
        } else {
          console.log(chalk.red(`Unknown command: /${commandName}`));
          console.log(chalk.gray('Type /help to see available commands.'));
        }
      } else {
        // Send message to agent
        await agent.chat(trimmedInput);
      }
    } catch (error) {
      // Handle errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`Error: ${errorMessage}`));
    }

    // Always show prompt again after processing
    rl.prompt();
  });
}

// Start the application
main();
