import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import {
  AIProviderConfig,
  CompletionOptions,
  IAIProvider,
  StreamOptions,
} from '../types';

export class GeminiProvider implements IAIProvider {
  readonly name = 'gemini' as const;
  private client: GoogleGenerativeAI;
  private model: string;

  constructor(config: AIProviderConfig) {
    this.client = new GoogleGenerativeAI(config.apiKey);
    this.model = config.model ?? 'gemini-2.0-flash-lite';
  }

  async complete(prompt: string, options?: CompletionOptions): Promise<string> {
    const model = this.client.getGenerativeModel({
      model: this.model,
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 4096,
      },
    });

    const parts = [];
    if (options?.systemPrompt) {
      parts.push({ text: options.systemPrompt });
    }
    parts.push({ text: prompt });

    const result = await model.generateContent(parts.map((p) => p.text).join('\n\n'));
    return result.response.text();
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
    const model = this.client.getGenerativeModel({
      model: this.model,
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 4096,
      },
    });

    const result = await model.generateContentStream(prompt);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        options?.onToken?.(text);
        yield text;
      }
    }
  }

  async embed(text: string): Promise<number[]> {
    const model = this.client.getGenerativeModel({
      model: 'text-embedding-004',
    });
    const result = await model.embedContent(text);
    return result.embedding.values;
  }
}
