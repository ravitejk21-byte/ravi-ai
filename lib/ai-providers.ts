import OpenAI from 'openai';
import { createGroq } from '@ai-sdk/groq';
import { createTogetherAI } from '@ai-sdk/togetherai';
import { createOllama } from 'ollama-ai-provider';
import { generateText, embed } from 'ai';

// Provider types
export type LLMProvider = 'openai' | 'groq' | 'ollama' | 'together';

// Provider configuration
interface ProviderConfig {
  name: string;
  chatModel: string;
  embeddingModel?: string;
  supportsEmbeddings: boolean;
  freeTier: boolean;
  requiresKey: boolean;
}

// Provider configurations
export const PROVIDER_CONFIGS: Record<LLMProvider, ProviderConfig> = {
  openai: {
    name: 'OpenAI',
    chatModel: process.env.OPENAI_CHAT_MODEL || 'gpt-4-turbo-preview',
    embeddingModel: 'text-embedding-3-small',
    supportsEmbeddings: true,
    freeTier: false,
    requiresKey: true,
  },
  groq: {
    name: 'Groq',
    chatModel: process.env.GROQ_CHAT_MODEL || 'llama-3.3-70b-versatile',
    embeddingModel: undefined, // Groq doesn't have embeddings
    supportsEmbeddings: false,
    freeTier: true,
    requiresKey: true,
  },
  ollama: {
    name: 'Ollama (Local)',
    chatModel: process.env.OLLAMA_CHAT_MODEL || 'llama3.2',
    embeddingModel: process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text',
    supportsEmbeddings: true,
    freeTier: true,
    requiresKey: false,
  },
  together: {
    name: 'Together AI',
    chatModel: process.env.TOGETHER_CHAT_MODEL || 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    embeddingModel: process.env.TOGETHER_EMBEDDING_MODEL || 'togethercomputer/m2-bert-80M-8k-retrieval',
    supportsEmbeddings: true,
    freeTier: true,
    requiresKey: true,
  },
};

// Fallback chain: Groq → Ollama → Together
const FALLBACK_CHAIN: LLMProvider[] = ['groq', 'ollama', 'together'];

// Check if a provider is available
function isProviderAvailable(provider: LLMProvider): boolean {
  const config = PROVIDER_CONFIGS[provider];
  
  if (!config.requiresKey) {
    // Ollama - check if host is configured
    if (provider === 'ollama') {
      return !!process.env.OLLAMA_HOST || true; // Default localhost is fine
    }
    return true;
  }
  
  switch (provider) {
    case 'openai':
      return !!process.env.OPENAI_API_KEY;
    case 'groq':
      return !!process.env.GROQ_API_KEY;
    case 'together':
      return !!process.env.TOGETHER_API_KEY;
    default:
      return false;
  }
}

// Get the best available provider
export function getBestProvider(preferred?: LLMProvider): LLMProvider {
  // If preferred is specified and available, use it
  if (preferred && isProviderAvailable(preferred)) {
    return preferred;
  }
  
  // Check default provider
  const defaultProvider = process.env.DEFAULT_LLM_PROVIDER as LLMProvider;
  if (defaultProvider && isProviderAvailable(defaultProvider)) {
    return defaultProvider;
  }
  
  // Check OpenAI first (if user has it)
  if (isProviderAvailable('openai')) {
    return 'openai';
  }
  
  // Fall through free chain
  for (const provider of FALLBACK_CHAIN) {
    if (isProviderAvailable(provider)) {
      return provider;
    }
  }
  
  // Last resort - try Ollama (local, no key needed)
  return 'ollama';
}

// Get provider suggestions when no providers are available
export function getProviderSuggestions(): string[] {
  const suggestions: string[] = [];
  
  if (!process.env.GROQ_API_KEY) {
    suggestions.push('💡 Get a free Groq API key: https://console.groq.com/keys (1M tokens/day free)');
  }
  
  if (!process.env.TOGETHER_API_KEY) {
    suggestions.push('💡 Get a free Together AI key: https://api.together.xyz/settings/api-keys (free tier available)');
  }
  
  suggestions.push('💡 Install Ollama for completely free local AI: https://ollama.com/download');
  
  return suggestions;
}

// Create provider client
function createProviderClient(provider: LLMProvider) {
  switch (provider) {
    case 'openai':
      return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    case 'groq':
      return createGroq({ apiKey: process.env.GROQ_API_KEY! });
    case 'ollama':
      return createOllama({ baseURL: process.env.OLLAMA_HOST || 'http://localhost:11434/api' });
    case 'together':
      return createTogetherAI({ apiKey: process.env.TOGETHER_API_KEY! });
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// Unified chat completion interface
export async function createChatCompletion(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options?: {
    provider?: LLMProvider;
    temperature?: number;
    maxTokens?: number;
  }
) {
  const provider = getBestProvider(options?.provider);
  const config = PROVIDER_CONFIGS[provider];
  
  if (!isProviderAvailable(provider)) {
    const suggestions = getProviderSuggestions();
    throw new Error(
      `No AI provider available.\n\n` +
      suggestions.join('\n') +
      `\n\nSee FREE_SETUP.md for detailed instructions.`
    );
  }
  
  try {
    // Use Vercel AI SDK for Groq, Ollama, Together
    if (provider !== 'openai') {
      const client = createProviderClient(provider) as any;
      const model = client.chatModel(config.chatModel);
      
      const { text } = await generateText({
        model,
        messages,
        temperature: options?.temperature ?? 0.7,
        maxTokens: options?.maxTokens,
      });
      
      return {
        content: text,
        provider,
        model: config.chatModel,
      };
    }
    
    // Use OpenAI SDK directly for OpenAI
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: config.chatModel,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens,
    });
    
    return {
      content: completion.choices[0].message.content || '',
      provider,
      model: config.chatModel,
    };
  } catch (error) {
    console.error(`Error with ${provider}:`, error);
    
    // Try fallback if this wasn't already a fallback attempt
    if (options?.provider) {
      console.log(`Attempting fallback...`);
      return createChatCompletion(messages, { ...options, provider: undefined });
    }
    
    throw error;
  }
}

// Unified embedding interface
export async function createEmbedding(
  input: string,
  options?: {
    provider?: LLMProvider;
  }
): Promise<number[]> {
  const provider = options?.provider || getBestProvider();
  const config = PROVIDER_CONFIGS[provider];
  
  // If provider doesn't support embeddings, find one that does
  if (!config.supportsEmbeddings || !config.embeddingModel) {
    // Try to find a provider with embeddings
    const embeddingProviders: LLMProvider[] = ['openai', 'ollama', 'together'];
    const fallbackProvider = embeddingProviders.find(p => isProviderAvailable(p) && PROVIDER_CONFIGS[p].supportsEmbeddings);
    
    if (fallbackProvider) {
      return createEmbedding(input, { provider: fallbackProvider });
    }
    
    throw new Error(
      `No embedding provider available.\n\n` +
      `Options:\n` +
      `1. Set OPENAI_API_KEY for OpenAI embeddings\n` +
      `2. Install Ollama with nomic-embed-text: ollama pull nomic-embed-text\n` +
      `3. Set TOGETHER_API_KEY for Together AI embeddings\n\n` +
      `See FREE_SETUP.md for instructions.`
    );
  }
  
  try {
    // Use Vercel AI SDK for embeddings (Ollama, Together)
    if (provider === 'ollama') {
      const ollama = createOllama({ baseURL: process.env.OLLAMA_HOST || 'http://localhost:11434/api' });
      const { embedding } = await embed({
        model: ollama.embedding(config.embeddingModel!),
        value: input,
      });
      return embedding;
    }
    
    if (provider === 'together') {
      const together = createTogetherAI({ apiKey: process.env.TOGETHER_API_KEY! });
      const { embedding } = await embed({
        model: together.embedding(config.embeddingModel!),
        value: input,
      });
      return embedding;
    }
    
    // Use OpenAI SDK for OpenAI embeddings
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.embeddings.create({
      model: config.embeddingModel,
      input: input.slice(0, 8000), // Token limit safety
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error(`Embedding error with ${provider}:`, error);
    throw error;
  }
}

// Legacy OpenAI client export for backward compatibility
// This will use the best available provider
export const openai = {
  chat: {
    completions: {
      create: async (params: any) => {
        const messages = params.messages.map((m: any) => ({
          role: m.role as 'system' | 'user' | 'assistant',
          content: m.content,
        }));
        
        const result = await createChatCompletion(messages, {
          temperature: params.temperature,
          maxTokens: params.max_tokens,
        });
        
        // Return in OpenAI-compatible format
        return {
          choices: [{
            message: {
              role: 'assistant' as const,
              content: result.content,
            },
          }],
          model: result.model,
        };
      },
    },
  },
  embeddings: {
    create: async (params: any) => {
      const embedding = await createEmbedding(params.input, {
        provider: params.provider,
      });
      
      return {
        data: [{ embedding }],
        model: params.model,
      };
    },
  },
};

// Export provider info
export function getAvailableProviders(): Array<{ provider: LLMProvider; available: boolean; config: ProviderConfig }> {
  return (Object.keys(PROVIDER_CONFIGS) as LLMProvider[]).map(provider => ({
    provider,
    available: isProviderAvailable(provider),
    config: PROVIDER_CONFIGS[provider],
  }));
}

export function getCurrentProvider(): LLMProvider {
  return getBestProvider();
}