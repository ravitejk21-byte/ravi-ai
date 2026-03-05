import { LLMClient, getAvailableProvider } from "./llm";

export interface WebSearchResult {
  title: string;
  snippet: string;
  url: string;
  publishedDate?: string;
  source: string;
  score?: number;
}

export interface WebSearchOptions {
  query: string;
  maxResults?: number;
  includeAnswer?: boolean;
  searchDepth?: "basic" | "advanced";
  includeDomains?: string[];
  excludeDomains?: string[];
}

// Check if query indicates need for current/latest information
export function needsCurrentInfo(query: string): boolean {
  const currentInfoKeywords = [
    "latest", "current", "today", "recent", "news", "update",
    "2024", "2025", "2026", "this year", "last week", "last month",
    "just announced", "breaking", "new release", "recently",
  ];
  
  const lowerQuery = query.toLowerCase();
  return currentInfoKeywords.some((kw) => lowerQuery.includes(kw));
}

/**
 * Search the web using configured provider (Tavily or Brave)
 */
export async function searchWeb(options: WebSearchOptions): Promise<WebSearchResult[]> {
  const provider = process.env.WEB_SEARCH_PROVIDER || "brave";
  
  switch (provider.toLowerCase()) {
    case "tavily":
      return await searchTavily(options);
    case "brave":
    default:
      return await searchBrave(options);
  }
}

/**
 * Tavily Search API - Free tier: 1000 requests/month
 */
async function searchTavily(options: WebSearchOptions): Promise<WebSearchResult[]> {
  const apiKey = process.env.WEB_SEARCH_API_KEY || process.env.TAVILY_API_KEY;
  
  if (!apiKey) {
    throw new Error("Tavily API key not configured. Set WEB_SEARCH_API_KEY or TAVILY_API_KEY");
  }

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: apiKey,
      query: options.query,
      max_results: options.maxResults || 5,
      include_answer: options.includeAnswer || false,
      search_depth: options.searchDepth || "basic",
      include_domains: options.includeDomains,
      exclude_domains: options.excludeDomains,
    }),
  });

  if (!response.ok) {
    throw new Error(`Tavily search failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  
  return (data.results || []).map((r: any) => ({
    title: r.title,
    snippet: r.content || r.snippet,
    url: r.url,
    publishedDate: r.published_date,
    source: new URL(r.url).hostname.replace(/^www\./, ""),
    score: r.score,
  }));
}

/**
 * Brave Search API - Free tier: 2000 queries/month
 */
async function searchBrave(options: WebSearchOptions): Promise<WebSearchResult[]> {
  const apiKey = process.env.WEB_SEARCH_API_KEY || process.env.BRAVE_API_KEY;
  
  if (!apiKey) {
    throw new Error("Brave API key not configured. Set WEB_SEARCH_API_KEY or BRAVE_API_KEY");
  }

  const params = new URLSearchParams({
    q: options.query,
    count: String(options.maxResults || 5),
    offset: "0",
    mkt: "en-US",
    safesearch: "moderate",
    freshness: "all", // or "pd" (past day), "pw" (past week), "pm" (past month)
    text_decorations: "false",
    text_format: "Raw",
  });

  const response = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Accept-Encoding": "gzip",
      "X-Subscription-Token": apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Brave search failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  
  return (data.web?.results || []).map((r: any) => ({
    title: r.title,
    snippet: r.description,
    url: r.url,
    publishedDate: r.age,
    source: r.profile?.name || new URL(r.url).hostname.replace(/^www\./, ""),
    score: r.score,
  }));
}

/**
 * Fetch and extract content from a web page
 */
export async function fetchWebPage(url: string): Promise<{ title: string; content: string; url: string }> {
  try {
    // Use a content extraction service or fetch directly
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }

    const html = await response.text();
    
    // Simple HTML to text extraction
    const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || url;
    
    // Remove scripts, styles, and tags
    let content = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Limit content length
    content = content.slice(0, 10000);

    return { title, content, url };
  } catch (err) {
    console.error(`Failed to fetch ${url}:`, err);
    return { title: url, content: "", url };
  }
}

/**
 * Store web page as document in database (optional feature)
 */
export async function storeWebDocument(
  url: string,
  userId: string,
  workspaceId?: string
): Promise<{ documentId: string; chunkCount: number }> {
  const { prisma } = await import("./prisma");
  const { LLMClient, getAvailableProvider } = await import("./llm");
  const { v4: uuidv4 } = await import("uuid");

  // Fetch page content
  const { title, content } = await fetchWebPage(url);

  if (!content) {
    throw new Error("Failed to extract content from web page");
  }

  // Create document
  const document = await prisma.document.create({
    data: {
      id: uuidv4(),
      name: title.slice(0, 200),
      type: "web",
      content: content.slice(0, 50000), // Limit stored content
      url,
      userId,
      workspaceId: workspaceId || null,
      source: "web_search",
    },
  });

  // Chunk and embed content
  const llmConfig = getAvailableProvider(true);
  const llm = new LLMClient(llmConfig);

  const chunks = chunkText(content, 1000, 200);
  let chunkCount = 0;

  for (const chunkContent of chunks) {
    try {
      const embedding = await llm.createEmbedding(chunkContent);
      
      await prisma.$executeRaw`
        INSERT INTO "document_chunks" (id, content, embedding, "documentId", content_tsv)
        VALUES (
          ${uuidv4()},
          ${chunkContent},
          ${embedding}::vector,
          ${document.id},
          to_tsvector('english', ${chunkContent})
        )
      `;
      chunkCount++;
    } catch (err) {
      console.warn("Failed to create embedding for chunk:", err);
    }
  }

  return { documentId: document.id, chunkCount };
}

/**
 * Simple text chunking
 */
function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  let currentChunk = "";
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > chunkSize) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += " " + sentence;
    }
  }
  
  if (currentChunk) chunks.push(currentChunk.trim());
  
  // Create overlapping chunks
  if (overlap > 0 && chunks.length > 1) {
    const overlapped: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      let chunk = chunks[i];
      if (i > 0) {
        const prevEnd = chunks[i - 1].slice(-overlap);
        chunk = prevEnd + " " + chunk;
      }
      overlapped.push(chunk);
    }
    return overlapped;
  }
  
  return chunks;
}

/**
 * Format web search results as context for LLM
 */
export function formatWebSearchContext(results: WebSearchResult[]): string {
  return results
    .map((r, i) => 
      `[Web Source ${i + 1}: ${r.title} | ${r.source}${r.publishedDate ? " | " + r.publishedDate : ""}]\n${r.snippet}`
    )
    .join("\n\n");
}

/**
 * Combined search: KB + Web (for research mode)
 */
export async function combinedSearch(
  query: string,
  userId: string,
  options: {
    workspaceId?: string;
    useWebSearch?: boolean;
    maxWebResults?: number;
  } = {}
): Promise<{
  kbResults: any[];
  webResults: WebSearchResult[];
  usedWebSearch: boolean;
}> {
  const { hybridRetrieve, isLowConfidence } = await import("./retrieval");
  
  // First, try KB retrieval
  const kbResults = await hybridRetrieve({
    query,
    userId,
    workspaceId: options.workspaceId,
    topK: 5,
  });

  // Check if we need web search
  const kbResultsWithScore = kbResults.map(r => ({ ...r, finalScore: r.combinedScore || r.similarity || 0 }));
  const needsWeb = options.useWebSearch || 
                   needsCurrentInfo(query) || 
                   isLowConfidence(kbResultsWithScore, parseFloat(process.env.RAG_SIMILARITY_THRESHOLD || "0.75"));

  let webResults: WebSearchResult[] = [];
  
  if (needsWeb && process.env.WEB_SEARCH_API_KEY) {
    try {
      webResults = await searchWeb({
        query,
        maxResults: options.maxWebResults || 5,
      });
    } catch (err) {
      console.warn("Web search failed:", err);
    }
  }

  return {
    kbResults,
    webResults,
    usedWebSearch: webResults.length > 0,
  };
}
