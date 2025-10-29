/**
 * Unified AI Provider Interface
 *
 * This module provides a common interface for different AI providers (Gemini, Grok, etc.)
 * allowing easy switching between models without changing the application code.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { GrokProvider } from './grok';

export type AIProvider = 'gemini' | 'grok';

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
}

export interface AIGenerationOptions {
  temperature?: number;
  maxOutputTokens?: number;
  useReasoning?: boolean;  // For Grok: choose between reasoning/non-reasoning
  systemPrompt?: string;
}

export class UnifiedAIProvider {
  private provider: AIProvider;
  private geminiClient?: any;
  private grokClient?: GrokProvider;

  constructor(config: AIProviderConfig) {
    this.provider = config.provider;

    switch (config.provider) {
      case 'gemini':
        if (!config.apiKey) {
          throw new Error('Gemini API key is required');
        }
        const genAI = new GoogleGenerativeAI(config.apiKey);
        this.geminiClient = genAI.getGenerativeModel({
          model: config.model || 'gemini-2.5-flash-lite'
        });
        break;

      case 'grok':
        if (!config.apiKey) {
          throw new Error('Grok API key is required');
        }
        this.grokClient = new GrokProvider(config.apiKey);
        break;

      default:
        throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
  }

  async generateContent(prompt: string, options?: AIGenerationOptions): Promise<string> {
    switch (this.provider) {
      case 'gemini':
        return this.generateWithGemini(prompt, options);
      case 'grok':
        return this.generateWithGrok(prompt, options);
      default:
        throw new Error(`Unsupported provider: ${this.provider}`);
    }
  }

  private async generateWithGemini(prompt: string, options?: AIGenerationOptions): Promise<string> {
    if (!this.geminiClient) {
      throw new Error('Gemini client not initialized');
    }

    const fullPrompt = options?.systemPrompt
      ? `${options.systemPrompt}\n\n${prompt}`
      : prompt;

    const result = await this.geminiClient.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: fullPrompt
            }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: options?.maxOutputTokens || 2048,
        temperature: options?.temperature || 0.8,
      },
    });

    const response = result.response;
    return response.text().trim();
  }

  private async generateWithGrok(prompt: string, options?: AIGenerationOptions): Promise<string> {
    if (!this.grokClient) {
      throw new Error('Grok client not initialized');
    }

    if (options?.systemPrompt) {
      return this.grokClient.generateStructuredContent(
        prompt,
        options.systemPrompt,
        options
      );
    } else {
      return this.grokClient.generateContent(prompt, options);
    }
  }

  /**
   * Get pricing information for the current provider
   */
  getPricingInfo(): { input: number; output: number; unit: string } {
    switch (this.provider) {
      case 'gemini':
        // Gemini 2.5 Flash Lite pricing (approximate)
        return {
          input: 0.0375,  // per 1M tokens
          output: 0.15,    // per 1M tokens
          unit: '1M tokens'
        };
      case 'grok':
        // Grok 4 Fast pricing (under 128k context)
        return {
          input: 0.20,   // per 1M tokens
          output: 0.50,  // per 1M tokens
          unit: '1M tokens'
        };
      default:
        throw new Error(`No pricing info for provider: ${this.provider}`);
    }
  }

  /**
   * Get provider name and model info
   */
  getProviderInfo(): { name: string; model: string } {
    switch (this.provider) {
      case 'gemini':
        return {
          name: 'Google Gemini',
          model: 'gemini-2.5-flash-lite'
        };
      case 'grok':
        return {
          name: 'xAI Grok',
          model: 'grok-4-fast'
        };
      default:
        return {
          name: 'Unknown',
          model: 'Unknown'
        };
    }
  }
}

/**
 * Factory function to create AI provider from environment variables
 */
export function createAIProvider(): UnifiedAIProvider {
  const provider = (process.env.NEXT_PUBLIC_AI_PROVIDER || 'gemini') as AIProvider;

  let apiKey: string | undefined;

  switch (provider) {
    case 'gemini':
      apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY environment variable is required');
      }
      break;
    case 'grok':
      apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
      if (!apiKey) {
        throw new Error('GROK_API_KEY or XAI_API_KEY environment variable is required');
      }
      break;
  }

  return new UnifiedAIProvider({
    provider,
    apiKey
  });
}