// Backward-compatible OpenAI export
// This file re-exports from ai-providers.ts for compatibility with existing code
// New code should import directly from ai-providers.ts

export {
  openai,
  createChatCompletion,
  createEmbedding,
  getBestProvider,
  getAvailableProviders,
  getCurrentProvider,
  getProviderSuggestions,
  PROVIDER_CONFIGS,
  type LLMProvider,
} from './ai-providers';

// Default export for convenience
import { openai } from './ai-providers';
export default openai;