import { z } from 'zod';

export type AIProviderName = 'gemini' | 'openai' | 'claude' | 'ollama';

export interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface StreamOptions extends CompletionOptions {
  onToken?: (token: string) => void;
}

export interface AIProviderConfig {
  apiKey: string;
  model?: string;
}

export interface IAIProvider {
  readonly name: AIProviderName;

  complete(prompt: string, options?: CompletionOptions): Promise<string>;

  completeJSON<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    options?: CompletionOptions,
  ): Promise<T>;

  stream(
    prompt: string,
    options?: StreamOptions,
  ): AsyncIterable<string>;

  embed(text: string): Promise<number[]>;
}
