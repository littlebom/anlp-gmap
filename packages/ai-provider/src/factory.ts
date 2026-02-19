import { AIProviderConfig, AIProviderName, IAIProvider } from './types';
import { GeminiProvider } from './providers/gemini';
import { OpenAIProvider } from './providers/openai';
import { ClaudeProvider } from './providers/claude';
import { OllamaProvider } from './providers/ollama';

export class AIProviderFactory {
  static create(
    provider: AIProviderName,
    config: AIProviderConfig,
  ): IAIProvider {
    switch (provider) {
      case 'gemini':
        return new GeminiProvider(config);
      case 'openai':
        return new OpenAIProvider(config);
      case 'claude':
        return new ClaudeProvider(config);
      case 'ollama':
        return new OllamaProvider(config);
      default:
        throw new Error(`Unknown AI provider: ${provider}`);
    }
  }
}
