import Anthropic from '@anthropic-ai/sdk';
import chalk from 'chalk';
import type { AgentConfig } from './config';
import { SkillLoader } from './skills/loader';
import { buildSystemPrompt } from './skills/prompt';
import { ToolRegistry } from './tools/registry';
import { createReadTool } from './tools/read';
import { createWriteTool } from './tools/write';
import { createBashTool } from './tools/bash';
import { LLMClient, Message } from './llm/client';
import type { Skill } from '@skill-toolbox/utils';
import type { Tool } from './tools/types';

// Constants
const MAX_TOOL_RESULT_PREVIEW = 100;
const MAX_CHAT_ITERATIONS = 50;

export class Agent {
  private config: AgentConfig;
  private skills: Map<string, Skill>;
  private conversationHistory: Message[];
  private toolRegistry: ToolRegistry;
  private llmClient: LLMClient;
  private skillLoader: SkillLoader;

  constructor(config: AgentConfig) {
    this.config = config;
    this.skills = new Map();
    this.conversationHistory = [];
    this.toolRegistry = new ToolRegistry();
    this.llmClient = new LLMClient(
      config.apiKey,
      config.model,
      config.maxTokens,
      config.baseURL
    );
    this.skillLoader = new SkillLoader({
      skillsDir: config.skillsDir,
      enableDiscovery: config.enableDiscovery,
      enableHttp: config.enableHttp,
      httpUrls: config.httpUrls,
      projectDir: config.projectDir,
    });
  }

  /**
   * Start the agent by loading skills, registering tools, and displaying startup message.
   * Should be called once before using the agent.
   */
  async start(): Promise<void> {
    try {
      await this.loadSkills();
      this.registerTools();
      this.showStartupMessage();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`Failed to start agent: ${errorMessage}`));
      throw error;
    }
  }

  /**
   * Send a chat message to the agent and handle the response.
   * Manages conversation history and tool execution automatically.
   * @param userMessage - The message from the user
   */
  async chat(userMessage: string): Promise<void> {
    // Validate input
    if (!userMessage || userMessage.trim().length === 0) {
      console.log(chalk.yellow('Please enter a non-empty message.'));
      return;
    }

    try {
      // Add user message to history
      this.conversationHistory.push({
        role: 'user',
        content: userMessage,
      });

      // Build system prompt
      const sourceLocations = this.skillLoader.getSourceLocations();
      const systemPrompt = buildSystemPrompt(this.skills, sourceLocations);

      // Get tool definitions
      const tools = this.toolRegistry.getToolDefinitions();

      // Start chat loop
      await this.chatLoop(systemPrompt, tools);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`Chat error: ${errorMessage}`));

      // Remove the failed user message from history
      this.conversationHistory.pop();
    }
  }

  /**
   * Get the map of loaded skills.
   * @returns Map of skill name to Skill object
   */
  getSkills(): Map<string, Skill> {
    return this.skills;
  }

  /**
   * Reload all skills from disk.
   * Useful for updating skills without restarting the agent.
   */
  async reloadSkills(): Promise<void> {
    try {
      await this.loadSkills();
      console.log(chalk.green('Skills reloaded successfully.'));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`Failed to reload skills: ${errorMessage}`));
      throw error;
    }
  }

  /**
   * Clear the conversation history.
   * Starts a fresh conversation without reloading skills.
   */
  clearHistory(): void {
    this.conversationHistory = [];
    console.log(chalk.green('Conversation history cleared.'));
  }

  private async loadSkills(): Promise<void> {
    this.skills = await this.skillLoader.loadAll();
  }

  private registerTools(): void {
    // Register read tool
    const readTool = createReadTool();
    this.toolRegistry.register(readTool.tool, readTool.executor);

    // Register write tool
    const writeTool = createWriteTool();
    this.toolRegistry.register(writeTool.tool, writeTool.executor);

    // Register bash tool with sandbox config
    const bashTool = createBashTool({
      allowedCommands: this.config.sandbox.allowedCommands,
      timeout: this.config.sandbox.timeout,
    });
    this.toolRegistry.register(bashTool.tool, bashTool.executor);
  }

  private showStartupMessage(): void {
    console.log('');
    console.log(chalk.cyan('╔═══════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan('║') + chalk.bold.white('                 Skill-Toolbox Agent                      ') + chalk.cyan('║'));
    console.log(chalk.cyan('╚═══════════════════════════════════════════════════════════╝'));
    console.log('');
    console.log(`${chalk.blue('Model:')} ${this.config.model}`);
    console.log(`${chalk.blue('Skills loaded:')} ${this.skills.size}`);
    console.log('');
    if (this.skills.size > 0) {
      console.log(chalk.bold('Available skills:'));
      for (const [name] of this.skills) {
        console.log(`  ${chalk.green('•')} ${name}`);
      }
    } else {
      console.log(chalk.yellow('No skills loaded.'));
    }
    console.log('');
    console.log(chalk.gray('Type your message and press Enter to chat.'));
    console.log(chalk.gray('Type /help to see available commands.'));
    console.log('');
  }

  private async chatLoop(systemPrompt: string, tools: Tool[]): Promise<void> {
    let continueLoop = true;
    let iterations = 0;

    while (continueLoop) {
      // Safety guard against infinite loops
      iterations++;
      if (iterations > MAX_CHAT_ITERATIONS) {
        console.error(
          chalk.red(`Maximum iterations (${MAX_CHAT_ITERATIONS}) reached. Stopping to prevent infinite loop.`)
        );
        break;
      }

      try {
        // Call LLM
        const response = await this.llmClient.chat(systemPrompt, this.conversationHistory, tools);

        // Handle response based on stop_reason
        if (response.stop_reason === 'end_turn') {
          // Extract text content
          const textBlocks = response.content.filter(
            (block): block is Anthropic.TextBlock => block.type === 'text'
          );

          if (textBlocks.length > 0) {
            const text = textBlocks.map((block) => block.text).join('');
            console.log(`\n${text}\n`);

            // Add assistant message to history
            this.conversationHistory.push({
              role: 'assistant',
              content: response.content,
            });
          }

          // End the loop
          continueLoop = false;
        } else if (response.stop_reason === 'tool_use') {
          // Add assistant message to history
          this.conversationHistory.push({
            role: 'assistant',
            content: response.content,
          });

          // Extract tool use blocks
          const toolUseBlocks = response.content.filter(
            (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
          );

          // Execute tools and collect results
          const toolResults: Anthropic.ToolResultBlockParam[] = [];

          for (const toolUseBlock of toolUseBlocks) {
            try {
              console.log(chalk.cyan(`[Tool: ${toolUseBlock.name}]`));
              // Output tool parameters
              const params = JSON.stringify(toolUseBlock.input, null, 2);
              console.log(chalk.gray(`[Params: ${params}]`));

              const result = await this.toolRegistry.execute(
                toolUseBlock.name,
                toolUseBlock.input
              );
              const preview = result.substring(0, MAX_TOOL_RESULT_PREVIEW);
              const ellipsis = result.length > MAX_TOOL_RESULT_PREVIEW ? '...' : '';
              console.log(chalk.gray(`[Result: ${preview}${ellipsis}]`));

              toolResults.push({
                type: 'tool_result',
                tool_use_id: toolUseBlock.id,
                content: result,
              });
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              console.error(chalk.red(`[Error: ${errorMessage}]`));

              toolResults.push({
                type: 'tool_result',
                tool_use_id: toolUseBlock.id,
                content: `Error: ${errorMessage}`,
                is_error: true,
              });
            }
          }

          // Add tool results to history
          this.conversationHistory.push({
            role: 'user',
            content: toolResults,
          });

          // Continue the loop
          continueLoop = true;
        } else {
          // Unknown stop_reason
          console.warn(chalk.yellow(`Unknown stop_reason: ${response.stop_reason}`));
          continueLoop = false;
        }
      } catch (error) {
        // Handle API errors (authentication, rate limit, network, etc.)
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(chalk.red(`\nAPI Error: ${errorMessage}\n`));

        // Provide helpful suggestions based on common errors
        if (errorMessage.includes('401') || errorMessage.includes('authentication')) {
          console.error(chalk.yellow('Tip: Check that your ANTHROPIC_API_KEY is valid in .env file'));
        } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
          console.error(chalk.yellow('Tip: Rate limit reached. Wait a moment before trying again.'));
        } else if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('network')) {
          console.error(chalk.yellow('Tip: Network error. Check your internet connection.'));
        }

        // End the loop on error
        break;
      }
    }
  }
}
