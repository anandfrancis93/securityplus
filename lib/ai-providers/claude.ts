/**
 * Claude Sonnet 4.5 API Provider
 *
 * Anthropic's Claude API for high-quality question generation
 * Model: claude-sonnet-4.5-20250929
 *
 * Pricing:
 * - Input: $3.00 per 1M tokens
 * - Output: $15.00 per 1M tokens
 *
 * Features:
 * - 200K context window
 * - Superior instruction following (85.96% IFEval)
 * - Excellent for structured output and complex reasoning
 */

import Anthropic from '@anthropic-ai/sdk';

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class ClaudeProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey: apiKey,
    });
  }

  async generateContent(prompt: string, options?: {
    temperature?: number;
    maxOutputTokens?: number;
    useReasoning?: boolean;
  }): Promise<string> {
    try {
      const message = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: options?.maxOutputTokens ?? 2048,
        temperature: options?.temperature ?? 0.8,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      // Extract text content from response
      const textContent = message.content.find(block => block.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in Claude response');
      }

      return textContent.text;
    } catch (error) {
      console.error('Error calling Claude API:', error);
      throw error;
    }
  }

  async generateStructuredContent(
    prompt: string,
    systemPrompt?: string,
    options?: {
      temperature?: number;
      maxOutputTokens?: number;
      useReasoning?: boolean;
    }
  ): Promise<string> {
    try {
      const message = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: options?.maxOutputTokens ?? 2048,
        temperature: options?.temperature ?? 0.8,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      // Extract text content from response
      const textContent = message.content.find(block => block.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in Claude response');
      }

      return textContent.text;
    } catch (error) {
      console.error('Error calling Claude API:', error);
      throw error;
    }
  }
}
