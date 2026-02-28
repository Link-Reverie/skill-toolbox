import Anthropic from '@anthropic-ai/sdk';
import type { AgentConfig } from './config';
import { SkillLoader } from './skills/loader';
import { buildSystemPrompt } from './skills/prompt';
import { ToolRegistry } from './tools/registry';
import { createReadTool } from './tools/read';
import { createWriteTool } from './tools/write';
import { createBashTool } from './tools/bash';
import { LLMClient, Message } from './llm/client';
import type { Skill } from '@skill-toolbox/utils';

export class Agent {
  private config: AgentConfig;
  private skills: Map<string, Skill>;
  private conversationHistory: Message[];
  private toolRegistry: ToolRegistry;
  private llmClient: LLMClient;

  constructor(config: AgentConfig) {
    this.config = config;
    this.skills = new Map();
    this.conversationHistory = [];
    this.toolRegistry = new ToolRegistry();
    this.llmClient = new LLMClient(config.apiKey, config.model, config.maxTokens);
  }

  async start(): Promise<void> {
    await this.loadSkills();
    this.registerTools();
    this.showStartupMessage();
  }

  async chat(userMessage: string): Promise<void> {
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    // Build system prompt
    const systemPrompt = buildSystemPrompt(this.skills);

    // Get tool definitions
    const tools = this.toolRegistry.getToolDefinitions();

    // Start chat loop
    await this.chatLoop(systemPrompt, tools);
  }

  getSkills(): Map<string, Skill> {
    return this.skills;
  }

  async reloadSkills(): Promise<void> {
    await this.loadSkills();
    console.log('Skills reloaded successfully.');
  }

  clearHistory(): void {
    this.conversationHistory = [];
    console.log('Conversation history cleared.');
  }

  private async loadSkills(): Promise<void> {
    const loader = new SkillLoader(this.config.skillsDir);
    this.skills = await loader.loadAll();
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
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                 Skill-Toolbox Agent                      ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`Model: ${this.config.model}`);
    console.log(`Skills loaded: ${this.skills.size}`);
    console.log('');
    if (this.skills.size > 0) {
      console.log('Available skills:');
      for (const [name, skill] of this.skills) {
        console.log(`  - ${name} (v${skill.metadata.version})`);
      }
    } else {
      console.log('No skills loaded.');
    }
    console.log('');
    console.log('Type your message and press Enter to chat.');
    console.log('Type /help to see available commands.');
    console.log('');
  }

  private async chatLoop(systemPrompt: string, tools: any[]): Promise<void> {
    let continueLoop = true;

    while (continueLoop) {
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
            console.log(`[Tool: ${toolUseBlock.name}]`);
            const result = await this.toolRegistry.execute(
              toolUseBlock.name,
              toolUseBlock.input
            );
            console.log(`[Result: ${result.substring(0, 100)}${result.length > 100 ? '...' : ''}]`);

            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUseBlock.id,
              content: result,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`[Error: ${errorMessage}]`);

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
        console.warn(`Unknown stop_reason: ${response.stop_reason}`);
        continueLoop = false;
      }
    }
  }
}
