import { z } from 'zod';
import {
  AIProviderConfig,
  CompletionOptions,
  IAIProvider,
  StreamOptions,
} from '../types';

// Node 18+ has built-in globals, but TypeScript ES2021 lib doesn't declare them
declare const fetch: (url: string, init?: any) => Promise<any>;
declare class TextDecoder { constructor(); decode(input?: any, options?: any): string; }
declare function setTimeout(callback: (...args: any[]) => void, ms?: number): any;

export interface OllamaConfig extends AIProviderConfig {
  baseUrl?: string; // default: http://127.0.0.1:11434
}

export class OllamaProvider implements IAIProvider {
  readonly name = 'ollama' as const;
  private baseUrl: string;
  private model: string;

  constructor(config: OllamaConfig) {
    this.baseUrl = config.baseUrl || config.apiKey || 'http://127.0.0.1:11434';
    // If apiKey looks like a URL, use it as baseUrl
    if (this.baseUrl.startsWith('http')) {
      // Already a URL, use as-is
    } else {
      this.baseUrl = 'http://127.0.0.1:11434';
    }
    this.model = config.model ?? 'llama3.1';
  }

  /**
   * Check if the current model is a Qwen3 model (has thinking mode)
   */
  private isThinkingModel(): boolean {
    return this.model.startsWith('qwen3');
  }

  /**
   * Extract actual content from response, handling Qwen3 thinking mode
   * Qwen3 returns thinking in message.thinking and actual content in message.content
   * If content is empty but thinking exists, the model used all tokens on thinking
   */
  private extractContent(data: any): string {
    const content = data.message?.content || '';
    if (content) return content;

    // If content is empty and there's thinking, the model ran out of tokens
    // on thinking alone — this means num_predict was too low
    if (data.message?.thinking && !content) {
      // Try to extract useful content from thinking as last resort
      return '';
    }

    return '';
  }

  async complete(prompt: string, options?: CompletionOptions): Promise<string> {
    const messages: any[] = [];

    // For thinking models, add /no_think instruction to save tokens for actual output
    const systemContent = options?.systemPrompt
      ? (this.isThinkingModel() ? options.systemPrompt + '\n/no_think' : options.systemPrompt)
      : (this.isThinkingModel() ? '/no_think' : undefined);

    if (systemContent) {
      messages.push({ role: 'system', content: systemContent });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.maxTokens ?? 8192,
          num_ctx: 16384, // Large context window for big prompts
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return this.extractContent(data);
  }

  async completeJSON<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    options?: CompletionOptions,
  ): Promise<T> {
    const maxRetries = 2;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Increase tokens on retry
        const tokenMultiplier = attempt === 0 ? 1 : 2;
        const maxTokens = (options?.maxTokens ?? 8192) * tokenMultiplier;

        const jsonPrompt = `${prompt}\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no code blocks, no explanation. The JSON MUST match the exact structure shown in the Output Format above.`;

        // For JSON tasks, always disable thinking to maximize output tokens
        const systemContent = options?.systemPrompt
          ? options.systemPrompt + (this.isThinkingModel() ? '\n/no_think' : '')
          : (this.isThinkingModel() ? 'You are a helpful assistant that responds only in valid JSON. Follow the exact JSON structure requested.\n/no_think' : undefined);

        const messages: any[] = [];
        if (systemContent) {
          messages.push({ role: 'system', content: systemContent });
        }
        messages.push({ role: 'user', content: jsonPrompt });

        const response = await fetch(`${this.baseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.model,
            messages,
            stream: false,
            format: 'json', // Ollama native JSON mode
            options: {
              temperature: options?.temperature ?? 0.3,
              num_predict: maxTokens,
              num_ctx: 16384, // Large context window for big prompts + JSON output
            },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Ollama API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        const content = this.extractContent(data);

        if (!content || content.trim() === '' || content.trim() === '{}') {
          // Empty response — likely thinking consumed all tokens
          throw new Error(
            `Ollama returned empty JSON (model may need more tokens or /no_think failed). ` +
            `Thinking: ${data.message?.thinking ? 'yes' : 'no'}, ` +
            `Content length: ${(content || '').length}`
          );
        }

        const cleaned = content.replace(/```json\n?|\n?```/g, '').trim();
        let parsed = JSON.parse(cleaned);

        // Auto-fix: if model returned an array, try to wrap it in expected structure
        parsed = this.autoFixJsonStructure(parsed, schema);

        return schema.parse(parsed);
      } catch (error: any) {
        lastError = error;
        if (attempt < maxRetries) {
          // Wait briefly before retry
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    }

    throw lastError || new Error('completeJSON failed after retries');
  }

  /**
   * Try to auto-fix JSON structure when the model returns data in wrong shape.
   * Small LLMs often return arrays directly or use different key names.
   */
  private autoFixJsonStructure(parsed: any, schema: z.ZodSchema): any {
    // If already valid, return as-is
    const check = schema.safeParse(parsed);
    if (check.success) return parsed;

    // If model returned an array at top level, try wrapping with common keys
    if (Array.isArray(parsed)) {
      const wrapKeys = ['skills', 'courses', 'gradedCourses', 'dependencies'];
      for (const key of wrapKeys) {
        const wrapped = { [key]: parsed };
        const wrapCheck = schema.safeParse(wrapped);
        if (wrapCheck.success) return wrapped;
      }
    }

    // If model used slightly different keys, try to find the array field
    if (typeof parsed === 'object' && parsed !== null) {
      const values = Object.values(parsed);
      const arrayField = values.find((v) => Array.isArray(v));
      if (arrayField) {
        const wrapKeys = ['skills', 'courses', 'gradedCourses', 'dependencies'];
        for (const key of wrapKeys) {
          if (!(key in parsed)) {
            const attempt = { ...parsed, [key]: arrayField };
            const attemptCheck = schema.safeParse(attempt);
            if (attemptCheck.success) return attempt;
          }
        }
      }
    }

    // Return original — let schema.parse throw the proper error
    return parsed;
  }

  async *stream(
    prompt: string,
    options?: StreamOptions,
  ): AsyncIterable<string> {
    const messages: any[] = [];
    if (options?.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: true,
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.maxTokens ?? 8192,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama stream error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter((l: string) => l.trim());

      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          if (json.message?.content) {
            options?.onToken?.(json.message.content);
            yield json.message.content;
          }
        } catch {
          // Skip malformed lines
        }
      }
    }
  }

  async embed(text: string): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        input: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama embed error: ${response.status}`);
    }

    const data = await response.json();
    return data.embeddings?.[0] || [];
  }
}
