import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import {
  AIProviderConfig,
  CompletionOptions,
  IAIProvider,
  StreamOptions,
} from '../types';

export class ClaudeProvider implements IAIProvider {
  readonly name = 'claude' as const;
  private client: Anthropic;
  private model: string;

  constructor(config: AIProviderConfig) {
    this.client = new Anthropic({ apiKey: config.apiKey });
    this.model = config.model ?? 'claude-sonnet-4-6';
  }

  async complete(prompt: string, options?: CompletionOptions): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: options?.maxTokens ?? 4096,
      system: options?.systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    return textBlock?.type === 'text' ? textBlock.text : '';
  }

  async completeJSON<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    options?: CompletionOptions,
  ): Promise<T> {
    const jsonPrompt = `${prompt}\n\nRespond ONLY with valid JSON. No markdown, no code blocks, no explanation.`;
    const response = await this.complete(jsonPrompt, {
      ...options,
      temperature: options?.temperature ?? 0.3,
    });

    const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return schema.parse(parsed);
  }

  async *stream(
    prompt: string,
    options?: StreamOptions,
  ): AsyncIterable<string> {
    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: options?.maxTokens ?? 4096,
      system: options?.systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        const text = event.delta.text;
        options?.onToken?.(text);
        yield text;
      }
    }
  }

  async embed(_text: string): Promise<number[]> {
    throw new Error(
      'Claude does not support embeddings. Use Gemini or OpenAI for embeddings.',
    );
  }
}
