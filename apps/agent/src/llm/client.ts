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

  constructor(apiKey: string, model: string, maxTokens: number, baseURL?: string) {
    this.client = new Anthropic({
      apiKey,
      baseURL: baseURL,
    });
    this.model = model;
    this.maxTokens = maxTokens;
  }

  async chat(
    systemPrompt: string,
    messages: Message[],
    tools: Tool[]
  ): Promise<Anthropic.Message> {
    try {
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
    } catch (error: any) {
      // Enhance error messages for common API errors
      if (error.status === 401) {
        throw new Error('Authentication failed. Please check your ANTHROPIC_API_KEY in .env file.');
      } else if (error.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      } else if (error.status === 500) {
        throw new Error('Anthropic API server error. Please try again later.');
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new Error('Network error. Please check your internet connection.');
      } else if (error.message) {
        throw new Error(`API request failed: ${error.message}`);
      } else {
        throw new Error('Unknown API error occurred.');
      }
    }
  }
}
