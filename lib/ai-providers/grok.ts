/**
 * Grok 4 Fast API Provider
 *
 * xAI's Grok API is OpenAI-compatible, using standard chat completions format
 * Models available: grok-4-fast-reasoning, grok-4-fast-non-reasoning
 *
 * Pricing (under 128k context):
 * - Input: $0.20 per 1M tokens
 * - Output: $0.50 per 1M tokens
 */

export interface GrokMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GrokChatCompletionRequest {
  model: 'grok-4-fast-reasoning' | 'grok-4-fast-non-reasoning' | 'grok-2-latest';
  messages: GrokMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

export interface GrokChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class GrokProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    // xAI endpoint - compatible with OpenAI format
    this.baseUrl = 'https://api.x.ai/v1';
  }

  async generateContent(prompt: string, options?: {
    temperature?: number;
    maxOutputTokens?: number;
    useReasoning?: boolean;
  }): Promise<string> {
    const model = options?.useReasoning !== false
      ? 'grok-4-fast-reasoning'
      : 'grok-4-fast-non-reasoning';

    const request: GrokChatCompletionRequest = {
      model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: options?.temperature ?? 0.8,
      max_tokens: options?.maxOutputTokens ?? 2048
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Grok API error: ${response.status} - ${error}`);
      }

      const data: GrokChatCompletionResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from Grok API');
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error calling Grok API:', error);
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
    const model = options?.useReasoning !== false
      ? 'grok-4-fast-reasoning'
      : 'grok-4-fast-non-reasoning';

    const messages: GrokMessage[] = [];

    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      });
    }

    messages.push({
      role: 'user',
      content: prompt
    });

    const request: GrokChatCompletionRequest = {
      model,
      messages,
      temperature: options?.temperature ?? 0.8,
      max_tokens: options?.maxOutputTokens ?? 2048
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Grok API error: ${response.status} - ${error}`);
      }

      const data: GrokChatCompletionResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from Grok API');
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error calling Grok API:', error);
      throw error;
    }
  }
}