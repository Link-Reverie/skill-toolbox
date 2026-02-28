import Anthropic from '@anthropic-ai/sdk';
import type { Tool } from '../tools/types';

export interface Message {
  role: 'user' | 'assistant';
  content: string | Anthropic.ContentBlock[];
}

export class LLMClient {
  private client: Anthropic;
  private model: string;
  private maxTokens: number;

  constructor(apiKey: string, model: string, maxTokens: number) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
    this.maxTokens = maxTokens;
  }

  async chat(
    systemPrompt: string,
    messages: Message[],
    tools: Tool[]
  ): Promise<Anthropic.Message> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      tools: tools,
    });

    return response;
  }
}
