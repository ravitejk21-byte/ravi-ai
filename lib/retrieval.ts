import { LLMClient, getAvailableProvider } from "./llm";
import { prisma } from "./prisma";

export interface RetrievedChunk {
  id: string;
  content: string;
  documentId: string;
  documentName: string;
  documentType?: string;
  similarity?: number;
  vectorScore?: number;
  keywordScore?: number;
  combinedScore?: number;
}

export interface HybridSearchOptions {
  query: string;
  userId: string;
  workspaceId?: string;
  restrictToWorkspace?: boolean;
  topK?: number;
  vectorWeight?: number;
  keywordWeight?: number;
  similarityThreshold?: number;
  useHybrid?: boolean;
}

export interface RerankedResult extends RetrievedChunk {
  rerankScore?: number;
  finalScore: number;
}

/**
 * Hybrid Retrieval: Combines vector similarity + keyword search with weighted scoring
 */
export async function hybridRetrieve(options: HybridSearchOptions): Promise<RetrievedChunk[]> {
  const {
    query,
    userId,
    workspaceId,
    restrictToWorkspace = false,
    topK = 10,
    vectorWeight = 0.7,
    keywordWeight = 0.3,
    similarityThreshold = parseFloat(process.env.RAG_SIMILARITY_THRESHOLD || "0.5"),
    useHybrid = true,
  } = options;

  // Get LLM client for embeddings
  const llmConfig = getAvailableProvider(true);
  const llm = new LLMClient(llmConfig);

  // Generate query embedding
  const queryEmbedding = await llm.createEmbedding(query);

  let chunks: any[] = [];

  if (useHybrid) {
    // Use database hybrid search function
    const workspaceClause = restrictToWorkspace && workspaceId
      ? `AND d."workspaceId" = '${workspaceId}'`
      : workspaceId
        ? `AND (d."workspaceId" = '${workspaceId}' OR d."workspaceId" IS NULL)`
        : "";

    chunks = await prisma.$queryRaw`
      SELECT * FROM hybrid_search(
        ${queryEmbedding}::vector,
        ${query},
        ${similarityThreshold},
        ${vectorWeight},
        ${keywordWeight},
        ${topK}
      )
      WHERE document_id IN (
        SELECT id FROM "documents" 
        WHERE "userId" = ${userId} ${prisma.$queryRawUnsafe(workspaceClause)}
      )
    `;
  } else {
    // Vector-only search (original behavior)
    const workspaceClause = restrictToWorkspace && workspaceId
      ? `AND d."workspaceId" = '${workspaceId}'`
      : workspaceId
        ? `AND (d."workspaceId" = '${workspaceId}' OR d."workspaceId" IS NULL)`
        : "";

    chunks = await prisma.$queryRaw`
      SELECT 
        dc.id,
        dc.content,
        dc."documentId" as document_id,
        d.name as document_name,
        d.type as document_type,
        1 - (dc.embedding <=> ${queryEmbedding}::vector) as vector_score,
        0 as keyword_score,
        1 - (dc.embedding <=> ${queryEmbedding}::vector) as combined_score
      FROM "document_chunks" dc
      JOIN "documents" d ON d.id = dc."documentId"
      WHERE d."userId" = ${userId}
        ${prisma.$queryRawUnsafe(workspaceClause)}
        AND dc.embedding IS NOT NULL
        AND 1 - (dc.embedding <=> ${queryEmbedding}::vector) > ${similarityThreshold}
      ORDER BY dc.embedding <=> ${queryEmbedding}::vector
      LIMIT ${topK}
    `;
  }

  return chunks.map((c) => ({
    id: c.id,
    content: c.content,
    documentId: c.document_id,
    documentName: c.document_name,
    documentType: c.document_type,
    vectorScore: parseFloat(c.vector_score?.toFixed(4) || 0),
    keywordScore: parseFloat(c.keyword_score?.toFixed(4) || 0),
    combinedScore: parseFloat(c.combined_score?.toFixed(4) || c.similarity || 0),
    similarity: parseFloat(c.combined_score?.toFixed(4) || c.similarity || 0),
  }));
}

/**
 * Rerank results using Cohere rerank API or Gemini as fallback
 */
export async function rerankResults(
  query: string,
  chunks: RetrievedChunk[],
  topN: number = 5
): Promise<RerankedResult[]> {
  if (chunks.length === 0) return [];

  // Try Cohere rerank first
  if (process.env.COHERE_API_KEY) {
    try {
      const { CohereClient } = await import("cohere-ai");
      const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });

      const response = await cohere.rerank({
        model: "rerank-english-v2.0",
        query,
        documents: chunks.map((c) => c.content),
        topN,
      });

      const reranked = response.results
        .map((result) => ({
          ...chunks[result.index],
          rerankScore: result.relevanceScore,
          finalScore: result.relevanceScore,
        }))
        .sort((a, b) => b.finalScore - a.finalScore);

      return reranked;
    } catch (err) {
      console.warn("Cohere reranking failed, falling back to Gemini:", err);
    }
  }

  // Fallback: Use Gemini to rerank
  return await rerankWithGemini(query, chunks, topN);
}

/**
 * Rerank using Gemini (free-tier friendly)
 */
async function rerankWithGemini(
  query: string,
  chunks: RetrievedChunk[],
  topN: number
): Promise<RerankedResult[]> {
  if (!process.env.GEMINI_API_KEY) {
    // No reranking available, return original order with combined scores
    return chunks
      .map((c) => ({ ...c, finalScore: c.combinedScore || c.similarity || 0 }))
      .slice(0, topN);
  }

  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Create prompt for reranking
    const passagesText = chunks
      .map((c, i) => `[${i}] ${c.content.slice(0, 500)}...`)
      .join("\n\n");

    const prompt = `You are a relevance judge. Rate how relevant each passage is to the query.

Query: "${query}"

Passages:
${passagesText}

Return ONLY a JSON array with relevance scores (0-1) for each passage index:
[0.95, 0.82, 0.45, ...]

Scores should reflect:
- 0.9-1.0: Directly answers the query
- 0.7-0.89: Highly relevant, contains key information
- 0.4-0.69: Somewhat relevant, partial match
- 0.0-0.39: Not relevant`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1 },
    });

    const responseText = result.response.text();
    const scoresMatch = responseText.match(/\[[\d.,\s]+\]/);
    
    if (scoresMatch) {
      const scores = JSON.parse(scoresMatch[0]);
      
      const reranked = chunks
        .map((chunk, i) => ({
          ...chunk,
          rerankScore: scores[i] || 0,
          finalScore: scores[i] || chunk.combinedScore || 0,
        }))
        .sort((a, b) => b.finalScore - a.finalScore)
        .slice(0, topN);

      return reranked;
    }
  } catch (err) {
    console.warn("Gemini reranking failed:", err);
  }

  // Final fallback: return original order
  return chunks
    .map((c) => ({ ...c, finalScore: c.combinedScore || c.similarity || 0 }))
    .slice(0, topN);
}

/**
 * Full retrieval pipeline: Hybrid search + Reranking
 */
export async function retrieveWithReranking(
  options: HybridSearchOptions & { rerankTopN?: number }
): Promise<RerankedResult[]> {
  const { rerankTopN = 5, ...retrieveOptions } = options;

  // Step 1: Hybrid retrieval
  const chunks = await hybridRetrieve({
    ...retrieveOptions,
    topK: Math.max(retrieveOptions.topK || 10, rerankTopN * 2),
  });

  if (chunks.length === 0) return [];

  // Step 2: Rerank
  const reranked = await rerankResults(options.query, chunks, rerankTopN);

  return reranked;
}

/**
 * Check if retrieval confidence is low (triggers web search)
 */
export function isLowConfidence(results: RerankedResult[], threshold: number = 0.75): boolean {
  if (results.length === 0) return true;
  const maxScore = Math.max(...results.map((r) => r.finalScore));
  return maxScore < threshold;
}

/**
 * Format retrieved chunks as context for LLM
 */
export function formatRetrievedContext(results: RerankedResult[]): string {
  return results
    .map((r, i) => 
      `[Source ${i + 1}: ${r.documentName} | Chunk: ${r.id.slice(0, 8)} | Score: ${(r.finalScore * 100).toFixed(1)}%]\n${r.content}`
    )
    .join("\n\n");
}
