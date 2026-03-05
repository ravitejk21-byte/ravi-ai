import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { LLMClient, getAvailableProvider } from "@/lib/llm";
import { 
  hybridRetrieve, 
  retrieveWithReranking, 
  isLowConfidence, 
  formatRetrievedContext,
  RerankedResult 
} from "@/lib/retrieval";
import { 
  searchWeb, 
  needsCurrentInfo, 
  formatWebSearchContext,
  WebSearchResult 
} from "@/lib/webSearch";

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { 
      query, 
      workspaceId, 
      restrictToWorkspace = false,
      useHybrid = true,
      useReranking = true,
      useWebSearch = true,
      researchMode = false,
    } = await req.json();

    // Use RAG-aware provider selection
    const llmConfig = getAvailableProvider(true);
    const llm = new LLMClient(llmConfig);

    let kbResults: RerankedResult[] = [];
    let webResults: WebSearchResult[] = [];
    let usedWebSearch = false;
    let sources: any[] = [];

    // Step 1: Knowledge Base Retrieval (Hybrid + Reranking)
    if (useReranking) {
      kbResults = await retrieveWithReranking({
        query,
        userId: user.id,
        workspaceId,
        restrictToWorkspace,
        topK: 10,
        rerankTopN: researchMode ? 10 : 5,
      });
    } else {
      const results = await hybridRetrieve({
        query,
        userId: user.id,
        workspaceId,
        restrictToWorkspace,
        topK: 5,
        useHybrid,
      });
      kbResults = results.map(r => ({ ...r, finalScore: r.combinedScore || 0 }));
    }

    // Step 2: Check if web search is needed
    const similarityThreshold = parseFloat(process.env.RAG_SIMILARITY_THRESHOLD || "0.75");
    const shouldSearchWeb = useWebSearch && (
      researchMode ||
      needsCurrentInfo(query) ||
      isLowConfidence(kbResults, similarityThreshold)
    );

    // Step 3: Web Search (if needed and configured)
    if (shouldSearchWeb && process.env.WEB_SEARCH_API_KEY) {
      try {
        webResults = await searchWeb({
          query,
          maxResults: researchMode ? 10 : 5,
          includeAnswer: false,
        });
        usedWebSearch = webResults.length > 0;
      } catch (err) {
        console.warn("Web search failed:", err);
      }
    }

    // Step 4: Format context from all sources
    const kbContext = kbResults.length > 0 
      ? formatRetrievedContext(kbResults) 
      : "";
    
    const webContext = webResults.length > 0 
      ? formatWebSearchContext(webResults) 
      : "";

    // Step 5: Generate answer with citations
    let answer: string;
    let citations: any[] = [];

    if (researchMode) {
      // Research mode: structured answer with detailed citations
      const result = await generateResearchAnswer(llm, query, kbContext, webContext);
      answer = result.answer;
      citations = result.citations;
    } else {
      // Standard mode
      const systemPrompt = `You are a helpful consulting assistant. Answer the user's question based on the provided context.
${kbResults.length > 0 ? "Knowledge Base Sources:\n" + kbResults.map((r, i) => 
  `- [KB${i + 1}] ${r.documentName} (relevance: ${(r.finalScore * 100).toFixed(0)}%)`).join("\n") : ""}
${webResults.length > 0 ? "\nWeb Sources:\n" + webResults.map((r, i) => 
  `- [Web${i + 1}] ${r.title} - ${r.source}${r.publishedDate ? " (${r.publishedDate})" : ""}`).join("\n") : ""}

Instructions:
- Always cite your sources using [KB#] or [Web#] format
- If the context doesn't contain relevant information, say so clearly
- Be concise but thorough`;

      answer = await llm.generateText({
        systemPrompt,
        userPrompt: `Context from Knowledge Base:\n${kbContext}\n\nContext from Web Search:\n${webContext}\n\nQuestion: ${query}`,
        temperature: 0.3,
        maxTokens: 4000,
      });
    }

    // Build sources list for UI
    sources = [
      ...kbResults.map((r, i) => ({
        type: "kb",
        id: r.id,
        documentId: r.documentId,
        documentName: r.documentName,
        documentType: r.documentType,
        similarity: r.finalScore,
        vectorScore: r.vectorScore,
        keywordScore: r.keywordScore,
        content: r.content.slice(0, 300),
        citationRef: researchMode ? undefined : `[KB${i + 1}]`,
      })),
      ...webResults.map((r, i) => ({
        type: "web",
        title: r.title,
        url: r.url,
        source: r.source,
        publishedDate: r.publishedDate,
        snippet: r.snippet,
        citationRef: researchMode ? undefined : `[Web${i + 1}]`,
      })),
    ];

    return NextResponse.json({
      answer,
      sources,
      citations,
      metadata: {
        provider: llm.getProvider(),
        model: llm.getModel(),
        kbResultsCount: kbResults.length,
        webResultsCount: webResults.length,
        usedWebSearch,
        usedHybridSearch: useHybrid,
        usedReranking: useReranking,
        researchMode,
      },
    });
  } catch (error: any) {
    console.error("RAG query error:", error);
    
    if (error.message?.includes("No embedding provider") || error.message?.includes("RAG")) {
      return NextResponse.json(
        { 
          error: "RAG requires an embedding-capable provider.",
          suggestion: "For free RAG on Vercel: Set GEMINI_API_KEY at https://makersuite.google.com/app/apikey (includes free embeddings)",
          providers: [
            { name: "Gemini", key: "GEMINI_API_KEY", free: true, rag: true },
            { name: "OpenAI", key: "OPENAI_API_KEY", free: false, rag: true },
          ]
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Generate research-mode answer with structured citations
 */
async function generateResearchAnswer(
  llm: LLMClient,
  query: string,
  kbContext: string,
  webContext: string
): Promise<{ answer: string; citations: any[] }> {
  
  const systemPrompt = `You are a research assistant. Provide a comprehensive, well-structured answer with clear citations.

Format your response as JSON:
{
  "summary": "Brief executive summary (2-3 sentences)",
  "answer": "Detailed answer with inline citations [KB#] or [Web#]",
  "keyPoints": ["Point 1", "Point 2", ...],
  "confidence": "high|medium|low",
  "citations": [
    {"ref": "KB1", "source": "Document Name", "relevance": 95},
    ...
  ]
}

Guidelines:
- Always cite specific claims with [KB#] or [Web#]
- Include confidence level based on source quality
- Structure with clear sections
- Be objective and balanced`;

  const userPrompt = `Research Question: ${query}

Knowledge Base Context:
${kbContext || "(No relevant documents found)"}

Web Search Context:
${webContext || "(No web results found)"}

Provide a comprehensive research answer with citations.`;

  const response = await llm.generateText({
    systemPrompt,
    userPrompt,
    temperature: 0.2,
    maxTokens: 4000,
  });

  try {
    // Try to parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        answer: `${parsed.summary}\n\n${parsed.answer}\n\nKey Points:\n${parsed.keyPoints?.map((p: string) => `- ${p}`).join("\n") || ""}\n\nConfidence: ${parsed.confidence || "medium"}`,
        citations: parsed.citations || [],
      };
    }
  } catch (e) {
    // Fall through to return raw response
  }

  return { answer: response, citations: [] };
}
