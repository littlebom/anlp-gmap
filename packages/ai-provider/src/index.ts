export { AIProviderFactory } from './factory';
export type {
  IAIProvider,
  AIProviderName,
  AIProviderConfig,
  CompletionOptions,
  StreamOptions,
} from './types';
export { GeminiProvider } from './providers/gemini';
export { OpenAIProvider } from './providers/openai';
export { ClaudeProvider } from './providers/claude';
export { OllamaProvider } from './providers/ollama';

// Prompt templates
export { NORMALIZATION_PROMPT, buildNormalizationPrompt } from './prompts/normalization';
export { CLUSTERING_PROMPT, buildClusteringPrompt } from './prompts/clustering';
export type { ClusteredCourse, ClusteredLesson } from './prompts/clustering';
export { GRADING_PROMPT, buildGradingPrompt } from './prompts/grading';
export { DEPENDENCY_PROMPT, buildDependencyPrompt } from './prompts/dependency';
export { TUTOR_SYSTEM_PROMPT, buildTutorSystemPrompt } from './prompts/tutor';
