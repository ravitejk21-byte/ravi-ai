import OpenAI from "openai";
import { Groq } from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CohereClient } from "cohere-ai";

// Provider types
type LLMProvider = "openai" | "groq" | "ollama" | "together" | "gemini" | "cohere";

interface LLMConfig {
  provider: LLMProvider;
  model: string;
  apiKey?: string;
  baseURL?: string;
  supportsEmbeddings: boolean;
  contextWindow: number;
}

// Default configurations for all providers including free tiers
export const LLM_CONFIGS: Record<string, LLMConfig> = {
  // === FREE PROVIDERS WITH EMBEDDINGS (Best for RAG) ===
  
  // Gemini - 60 requests/min free + FREE EMBEDDINGS
  gemini: {
    provider: "gemini",
    model: "gemini-1.5-flash",
    apiKey: process.env.GEMINI_API_KEY,
    supportsEmbeddings: true,
    contextWindow: 1000000, // 1M tokens
  },
  gemini_pro: {
    provider: "gemini",
    model: "gemini-1.5-pro",
    apiKey: process.env.GEMINI_API_KEY,
    supportsEmbeddings: true,
    contextWindow: 2000000, // 2M tokens
  },
  
  // === FREE PROVIDERS WITHOUT EMBEDDINGS ===
  
  // Groq - 1M tokens/day free (NO EMBEDDINGS)
  groq: {
    provider: "groq",
    model: "llama3-70b-8192",
    apiKey: process.env.GROQ_API_KEY,
    supportsEmbeddings: false,
    contextWindow: 8192,
  },
  groq_fast: {
    provider: "groq",
    model: "llama3-8b-8192",
    apiKey: process.env.GROQ_API_KEY,
    supportsEmbeddings: false,
    contextWindow: 8192,
  },
  groq_mixtral: {
    provider: "groq",
    model: "mixtral-8x7b-32768",
    apiKey: process.env.GROQ_API_KEY,
    supportsEmbeddings: false,
    contextWindow: 32768,
  },
  
  // Cohere - 100 calls/month free (NO EMBEDDINGS)
  cohere: {
    provider: "cohere",
    model: "command-r",
    apiKey: process.env.COHERE_API_KEY,
    supportsEmbeddings: false,
    contextWindow: 128000,
  },
  cohere_plus: {
    provider: "cohere",
    model: "command-r-plus",
    apiKey: process.env.COHERE_API_KEY,
    supportsEmbeddings: false,
    contextWindow: 128000,
  },
  
  // Together AI - $5 free credit (NO EMBEDDINGS)
  together: {
    provider: "together",
    model: "meta-llama/Llama-3-70b-chat-hf",
    apiKey: process.env.TOGETHER_API_KEY,
    supportsEmbeddings: false,
    contextWindow: 8192,
  },
  
  // Ollama - Completely free, local + EMBEDDINGS
  ollama: {
    provider: "ollama",
    model: "llama3",
    baseURL: process.env.OLLAMA_HOST || "http://localhost:11434",
    supportsEmbeddings: true,
    contextWindow: 8192,
  },
  
  // === PAID PROVIDERS ===
  
  openai: {
    provider: "openai",
    model: "gpt-4-turbo-preview",
    apiKey: process.env.OPENAI_API_KEY,
    supportsEmbeddings: true,
    contextWindow: 128000,
  },
  openai_35: {
    provider: "openai",
    model: "gpt-3.5-turbo",
    apiKey: process.env.OPENAI_API_KEY,
    supportsEmbeddings: true,
    contextWindow: 16385,
  },
};

// Priority order for auto-detection (RAG-aware)
// If RAG is needed, prioritize providers with embeddings
export function getProviderPriority(requiresEmbeddings: boolean = false): string[] {
  if (requiresEmbeddings) {
    // Only providers that support embeddings
    return [
      "gemini",      // Free + embeddings
      "gemini_pro",  // Free + embeddings + large context
      "openai",      // Paid + embeddings
      "ollama",      // Local + embeddings
    ];
  }
  
  // All providers (free first)
  return [
    "groq",        // Fastest free
    "gemini",      // Free + embeddings
    "cohere",      // Free
    "together",    // Free credit
    "ollama",      // Local
    "openai",      // Paid
  ];
}

// Get available provider (RAG-aware selection)
export function getAvailableProvider(requiresEmbeddings: boolean = false): LLMConfig {
  const preferred = process.env.DEFAULT_LLM_PROVIDER;

  // Check if preferred provider is available and meets requirements
  if (preferred && LLM_CONFIGS[preferred]) {
    const config = LLM_CONFIGS[preferred];
    // If embeddings required, verify provider supports them
    if (requiresEmbeddings && !config.supportsEmbeddings) {
      console.warn(`Provider ${preferred} doesn't support embeddings. Falling back to RAG-capable provider.`);
    } else if (config.provider === "ollama" || config.apiKey) {
      return config;
    }
  }

  // Auto-detect in priority order
  const priority = getProviderPriority(requiresEmbeddings);
  
  for (const providerKey of priority) {
    const config = LLM_CONFIGS[providerKey];
    if (!config) continue;
    
    // Ollama is always available if configured
    if (config.provider === "ollama") {
      return config;
    }
    
    // Check if API key is set
    if (config.apiKey) {
      return config;
    }
  }

  // Fallback: if RAG required but no embedding provider, throw error
  if (requiresEmbeddings) {
    throw new Error(
      "No embedding-capable provider available. For free RAG, set GEMINI_API_KEY at https://makersuite.google.com/app/apikey"
    );
  }

  // Default to Ollama as final fallback
  return LLM_CONFIGS.ollama;
}

// Get all available providers for UI
export function getAvailableProvidersList(): { key: string; name: string; config: LLMConfig; isFree: boolean; supportsRAG: boolean }[] {
  return [
    { key: "gemini", name: "Google Gemini Flash", config: LLM_CONFIGS.gemini, isFree: true, supportsRAG: true },
    { key: "gemini_pro", name: "Google Gemini Pro", config: LLM_CONFIGS.gemini_pro, isFree: true, supportsRAG: true },
    { key: "groq", name: "Groq (Llama 3 70B)", config: LLM_CONFIGS.groq, isFree: true, supportsRAG: false },
    { key: "groq_fast", name: "Groq Fast (Llama 3 8B)", config: LLM_CONFIGS.groq_fast, isFree: true, supportsRAG: false },
    { key: "cohere", name: "Cohere Command R", config: LLM_CONFIGS.cohere, isFree: true, supportsRAG: false },
    { key: "together", name: "Together AI", config: LLM_CONFIGS.together, isFree: true, supportsRAG: false },
    { key: "ollama", name: "Ollama (Local)", config: LLM_CONFIGS.ollama, isFree: true, supportsRAG: true },
    { key: "openai", name: "OpenAI GPT-4", config: LLM_CONFIGS.openai, isFree: false, supportsRAG: true },
  ].filter(p => p.config.provider === "ollama" || p.config.apiKey || !process.env.DEFAULT_LLM_PROVIDER);
}

// Unified LLM client
export class LLMClient {
  private config: LLMConfig;
  private client: any;
  private geminiClient?: GoogleGenerativeAI;
  private cohereClient?: CohereClient;

  constructor(config?: LLMConfig) {
    this.config = config || getAvailableProvider();
    this.client = this.initializeClient();
  }

  private initializeClient() {
    switch (this.config.provider) {
      case "groq":
        return new Groq({ apiKey: this.config.apiKey });
      case "openai":
        return new OpenAI({ apiKey: this.config.apiKey });
      case "ollama":
        return new OpenAI({
          baseURL: `${this.config.baseURL}/v1`,
          apiKey: "ollama",
        });
      case "together":
        return new OpenAI({
          baseURL: "https://api.together.xyz/v1",
          apiKey: this.config.apiKey,
        });
      case "gemini":
        this.geminiClient = new GoogleGenerativeAI(this.config.apiKey || "");
        return null;
      case "cohere":
        this.cohereClient = new CohereClient({ token: this.config.apiKey || "" });
        return null;
      default:
        throw new Error(`Unknown provider: ${this.config.provider}`);
    }
  }

  async chat({
    messages,
    temperature = 0.7,
    maxTokens = 4000,
    stream = false,
  }: {
    messages: { role: "system" | "user" | "assistant"; content: string }[];
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  }) {
    // Enforce context window limit
    const totalContent = messages.map(m => m.content).join("");
    const estimatedTokens = totalContent.length / 4; // Rough estimate
    
    if (estimatedTokens > this.config.contextWindow * 0.9) {
      console.warn(`Warning: Approaching context window limit (${this.config.contextWindow} tokens)`);
    }

    // Handle Gemini
    if (this.config.provider === "gemini" && this.geminiClient) {
      const model = this.geminiClient.getGenerativeModel({ model: this.config.model });
      
      const systemMsg = messages.find(m => m.role === "system")?.content || "";
      const userMsg = messages.find(m => m.role === "user")?.content || "";
      const prompt = systemMsg ? `${systemMsg}\n\n${userMsg}` : userMsg;
      
      // Truncate if needed (Gemini has large context but let's be safe)
      const maxChars = this.config.contextWindow * 3; // Approximate chars
      const truncatedPrompt = prompt.slice(0, maxChars);
      
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: truncatedPrompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: Math.min(maxTokens, 8192), // Gemini output limit
        },
      });
      
      return {
        choices: [{
          message: {
            content: result.response.text(),
          },
        }],
      };
    }

    // Handle Cohere
    if (this.config.provider === "cohere" && this.cohereClient) {
      const systemMsg = messages.find(m => m.role === "system")?.content || "";
      const userMsg = messages.find(m => m.role === "user")?.content || "";
      
      const response = await this.cohereClient.chat({
        model: this.config.model,
        message: userMsg,
        preamble: systemMsg,
        temperature,
        maxTokens: Math.min(maxTokens, 4096),
      });
      
      return {
        choices: [{
          message: {
            content: response.text,
          },
        }],
      };
    }

    // OpenAI-compatible providers (Groq, Together, Ollama, OpenAI)
    const response = await this.client.chat.completions.create({
      model: this.config.model,
      messages,
      temperature,
      max_tokens: Math.min(maxTokens, this.config.contextWindow / 2),
      stream,
    });

    return response;
  }

  async generateText({
    systemPrompt,
    userPrompt,
    temperature = 0.7,
    maxTokens = 4000,
  }: {
    systemPrompt: string;
    userPrompt: string;
    temperature?: number;
    maxTokens?: number;
  }) {
    const response = await this.chat({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature,
      maxTokens,
    });

    return response.choices[0].message.content;
  }

  async streamText({
    systemPrompt,
    userPrompt,
  }: {
    systemPrompt: string;
    userPrompt: string;
  }) {
    return this.chat({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: true,
    });
  }

  // Embeddings (for RAG)
  async createEmbedding(input: string): Promise<number[]> {
    // Validate input length (most models have token limits)
    const estimatedTokens = input.length / 4;
    const maxInputTokens = 8192; // Common embedding limit
    
    let truncatedInput = input;
    if (estimatedTokens > maxInputTokens) {
      truncatedInput = input.slice(0, maxInputTokens * 4);
      console.warn(`Input truncated for embedding (${estimatedTokens} tokens > ${maxInputTokens} limit)`);
    }

    // Try Gemini embeddings first (free tier)
    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "embedding-001" });
        const result = await model.embedContent(truncatedInput);
        return result.embedding.values;
      } catch (err) {
        console.warn("Gemini embedding failed, trying fallback:", err);
      }
    }

    // Try OpenAI embeddings
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const response = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: truncatedInput,
        });
        return response.data[0].embedding;
      } catch (err) {
        console.warn("OpenAI embedding failed, trying fallback:", err);
      }
    }

    // Fallback to Ollama embeddings
    if (process.env.OLLAMA_HOST || this.config.provider === "ollama") {
      try {
        const baseURL = process.env.OLLAMA_HOST || "http://localhost:11434";
        const response = await fetch(`${baseURL}/api/embeddings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "nomic-embed-text",
            prompt: truncatedInput,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Ollama error: ${response.status}`);
        }
        
        const data = await response.json();
        return data.embedding;
      } catch (err) {
        console.warn("Ollama embedding failed:", err);
      }
    }

    throw new Error(
      "No embedding provider available. For free RAG on Vercel:\n" +
      "1. Set GEMINI_API_KEY (free embeddings) at https://makersuite.google.com/app/apikey\n" +
      "2. Or use Supabase pgvector with OpenAI embeddings"
    );
  }

  supportsEmbeddings(): boolean {
    return this.config.supportsEmbeddings;
  }

  getProvider() {
    return this.config.provider;
  }

  getModel() {
    return this.config.model;
  }

  getContextWindow() {
    return this.config.contextWindow;
  }

  isFree() {
    return this.config.provider !== "openai";
  }
}

// System prompts for different deliverable types
export const DELIVERABLE_SYSTEM_PROMPTS: Record<string, string> = {
  SLIDES: `You are an expert consulting presentation designer. Create structured slide outlines for executive/board-level presentations.

Format each slide with:
- Slide Title (clear, action-oriented)
- Key Points (3-5 bullets)
- Speaker Notes (key messages to convey)
- Visual Recommendation (chart, diagram, table, image)

Use consulting frameworks where applicable. Ensure logical flow and executive-ready language.`,

  REPORT: `You are a senior internal audit professional. Create structured audit report sections following IPPF standards.

Structure:
- Executive Summary
- Background & Scope
- Findings (with risk ratings: Critical/High/Medium/Low)
- Root Cause Analysis
- Recommendations (with priority and timeline)
- Management Response

Use neutral, objective tone. Be specific and evidence-based.`,

  TABLE: `You are a data structuring expert. Create well-formatted tables for consulting deliverables.

Use clear column headers. Include all relevant fields. Ensure data consistency. Format for Excel/CSV export.`,

  MATRIX: `You are an ERM specialist. Create Risk Control Matrices following ISO 31000/COSO frameworks.

Columns: Risk ID, Risk Category, Risk Description, Likelihood, Impact, Risk Rating, Existing Controls, Control Effectiveness, Residual Risk, Recommended Actions`,

  PLAN: `You are an internal audit planning expert. Create comprehensive audit plans following GIAS/IPPF.

Include: Objectives, Scope, Methodology, Timeline, Resource Requirements, Risk Assessment, Key Stakeholders`,

  PROPOSAL: `You are a consulting partner. Create compelling proposal structures.

Sections: Executive Summary, Understanding of Client Needs, Proposed Approach, Methodology, Team, Timeline, Investment, Why Us`,

  CHARTER: `You are a governance expert. Create governance framework documents.

Include: Purpose, Authority, Responsibilities, Composition, Reporting Lines, Meeting Cadence, Decision Rights`,
};

// Legacy compatibility - uses new client internally
export async function generateWithPrompt({
  systemPrompt,
  userPrompt,
  temperature = 0.7,
  maxTokens = 4000,
}: {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}) {
  const client = new LLMClient();
  return client.generateText({
    systemPrompt,
    userPrompt,
    temperature,
    maxTokens,
  });
}

export async function streamGenerate({
  systemPrompt,
  userPrompt,
}: {
  systemPrompt: string;
  userPrompt: string;
}) {
  const client = new LLMClient();
  return client.streamText({ systemPrompt, userPrompt });
}

// Legacy OpenAI export for compatibility
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy",
});
