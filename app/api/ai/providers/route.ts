import { NextResponse } from "next/server";
import { 
  getAvailableProviders, 
  getCurrentProvider, 
  getProviderSuggestions,
  PROVIDER_CONFIGS,
  type LLMProvider 
} from "@/lib/ai-providers";

export async function GET() {
  try {
    const providers = getAvailableProviders();
    const currentProvider = getCurrentProvider();
    const suggestions = getProviderSuggestions();
    
    // Get detailed status for each provider
    const providerStatus = providers.map(({ provider, available, config }) => ({
      id: provider,
      name: config.name,
      available,
      freeTier: config.freeTier,
      supportsEmbeddings: config.supportsEmbeddings,
      chatModel: config.chatModel,
      embeddingModel: config.embeddingModel,
      isCurrent: provider === currentProvider,
    }));
    
    const hasAnyProvider = providers.some(p => p.available);
    const hasEmbeddingProvider = providers.some(p => p.available && p.config.supportsEmbeddings);
    
    return NextResponse.json({
      providers: providerStatus,
      currentProvider,
      hasAnyProvider,
      hasEmbeddingProvider,
      suggestions: hasAnyProvider ? [] : suggestions,
      setupComplete: hasAnyProvider && hasEmbeddingProvider,
      warnings: [
        !hasAnyProvider && "No AI providers configured. Chat features will not work.",
        !hasEmbeddingProvider && "No embedding provider configured. Knowledge base search will not work.",
      ].filter(Boolean),
    });
  } catch (error: any) {
    console.error("Provider status error:", error);
    return NextResponse.json(
      { 
        error: "Failed to check provider status",
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Test a specific provider
export async function POST(req: Request) {
  try {
    const { provider, type = "chat" } = await req.json();
    
    if (!provider) {
      return NextResponse.json({ error: "Provider is required" }, { status: 400 });
    }
    
    const { createChatCompletion, createEmbedding } = await import("@/lib/ai-providers");
    
    if (type === "chat") {
      const result = await createChatCompletion([
        { role: "user", content: "Say 'Provider test successful!' in 5 words or less." }
      ], { provider: provider as LLMProvider });
      
      return NextResponse.json({
        success: true,
        provider: result.provider,
        model: result.model,
        response: result.content,
      });
    } else if (type === "embedding") {
      const embedding = await createEmbedding("Test embedding", { provider: provider as LLMProvider });
      
      return NextResponse.json({
        success: true,
        provider,
        embeddingLength: embedding.length,
        sample: embedding.slice(0, 5),
      });
    }
    
    return NextResponse.json({ error: "Invalid test type" }, { status: 400 });
  } catch (error: any) {
    console.error("Provider test error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message 
      },
      { status: 500 }
    );
  }
}