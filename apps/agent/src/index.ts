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

  // Helper function to prompt for input (using raw stdin/stdout)
  const prompt = (message: string): Promise<string> => {
    return new Promise((resolve) => {
      process.stdout.write(message);

      let input = '';

      // Set stdin to raw mode for character-by-character input
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding('utf8');

      const onData = (char: string) => {
        // Handle Ctrl+C
        if (char === '\u0003') {
          console.log(chalk.cyan('\nGoodbye! 👋\n'));
          process.exit(0);
        }

        // Handle Enter key
        if (char === '\n' || char === '\r') {
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.removeListener('data', onData);
          console.log(); // New line after input
          resolve(input);
          return;
        }

        // Handle backspace
        if (char === '\u007F' || char === '\b') {
          if (input.length > 0) {
            input = input.slice(0, -1);
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            process.stdout.write(message + input);
          }
          return;
        }

        // Ignore other control characters
        if (char.charCodeAt(0) < 32) {
          return;
        }

        // Append character to input
        input += char;
        process.stdout.write(char);
      };

      process.stdin.on('data', onData);
    });
  };

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log(chalk.cyan('\nGoodbye! 👋\n'));
    process.exit(0);
  });

  // Main REPL loop
  while (true) {
    try {
      // Get user input
      const input = await prompt(chalk.cyan('You: '));

      // Trim and validate input
      const trimmedInput = input.trim();
      if (!trimmedInput) {
        continue;
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

      // Don't exit on error, continue the loop
      // This prevents the app from crashing and keeps the REPL running
    }
  }
}

// Start the application
main();
