import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { LLMClient, getAvailableProvider } from "@/lib/llm";
import { hybridRetrieve, retrieveWithReranking, formatRetrievedContext } from "@/lib/retrieval";
import { searchWeb, formatWebSearchContext, WebSearchResult } from "@/lib/webSearch";
import { prisma } from "@/lib/prisma";

/**
 * Research Mode API - Multi-step research pipeline
 * 
 * Pipeline:
 * 1. Planner: Break question into sub-questions
 * 2. Retrieval: Run KB + Web for each sub-question
 * 3. Evidence pack: Merge sources with citations
 * 4. Writer: Final structured answer with citations + confidence
 */
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
      maxSubQuestions = 5,
      depth = "standard", // "quick" | "standard" | "deep"
    } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const llmConfig = getAvailableProvider(true);
    const llm = new LLMClient(llmConfig);

    // Step 1: Planner - Break into sub-questions
    const subQuestions = await generateSubQuestions(llm, query, maxSubQuestions);

    // Step 2: Retrieval - Gather evidence for each sub-question
    const evidencePack: EvidenceItem[] = [];
    
    for (const subQ of subQuestions) {
      const evidence = await gatherEvidence(subQ, user.id, workspaceId, depth);
      evidencePack.push(...evidence);
    }

    // Step 3: Deduplicate and rank evidence
    const uniqueEvidence = deduplicateEvidence(evidencePack);
    const rankedEvidence = await rankEvidence(llm, query, uniqueEvidence);

    // Step 4: Writer - Generate final answer
    const researchReport = await generateResearchReport(llm, query, rankedEvidence, subQuestions);

    return NextResponse.json({
      query,
      subQuestions,
      evidence: rankedEvidence.map(e => ({
        ...e,
        content: e.content.slice(0, 500) + (e.content.length > 500 ? "..." : ""),
      })),
      report: researchReport,
      metadata: {
        provider: llm.getProvider(),
        model: llm.getModel(),
        evidenceCount: rankedEvidence.length,
        kbSources: rankedEvidence.filter(e => e.type === "kb").length,
        webSources: rankedEvidence.filter(e => e.type === "web").length,
      },
    });
  } catch (error: any) {
    console.error("Research mode error:", error);
    return NextResponse.json(
      { error: "Research failed", message: error.message },
      { status: 500 }
    );
  }
}

interface EvidenceItem {
  id: string;
  type: "kb" | "web";
  content: string;
  source: string;
  sourceUrl?: string;
  publishedDate?: string;
  relevanceScore: number;
  subQuestion: string;
  citationRef: string;
}

async function generateSubQuestions(
  llm: LLMClient,
  query: string,
  maxQuestions: number
): Promise<string[]> {
  const systemPrompt = `You are a research planner. Break down the user's question into specific sub-questions that need to be answered.

Rules:
- Generate 3-${maxQuestions} sub-questions
- Each should be specific and answerable
- Cover different aspects of the main question
- Return ONLY a JSON array of strings`;

  const userPrompt = `Main Question: "${query}"

Generate sub-questions as JSON array:`;

  const response = await llm.generateText({
    systemPrompt,
    userPrompt,
    temperature: 0.3,
    maxTokens: 1000,
  });

  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    // Fall back to parsing as list
  }

  // Fallback: parse numbered list
  return response
    .split("\n")
    .filter(line => /^\d+\./.test(line.trim()))
    .map(line => line.replace(/^\d+\.\s*/, "").trim())
    .slice(0, maxQuestions);
}

async function gatherEvidence(
  subQuestion: string,
  userId: string,
  workspaceId?: string,
  depth: string = "standard"
): Promise<EvidenceItem[]> {
  const evidence: EvidenceItem[] = [];
  const topK = depth === "deep" ? 8 : depth === "quick" ? 3 : 5;

  // KB Retrieval
  try {
    const kbResults = await retrieveWithReranking({
      query: subQuestion,
      userId,
      workspaceId,
      topK,
      rerankTopN: topK,
    });

    for (const result of kbResults) {
      evidence.push({
        id: `kb-${result.id}`,
        type: "kb",
        content: result.content,
        source: result.documentName,
        relevanceScore: result.finalScore,
        subQuestion,
        citationRef: `KB:${result.documentName}`,
      });
    }
  } catch (err) {
    console.warn("KB retrieval failed for sub-question:", err);
  }

  // Web Search (if configured)
  if (process.env.WEB_SEARCH_API_KEY) {
    try {
      const webResults = await searchWeb({
        query: subQuestion,
        maxResults: depth === "deep" ? 5 : 3,
      });

      for (const result of webResults) {
        evidence.push({
          id: `web-${Buffer.from(result.url).toString("base64").slice(0, 16)}`,
          type: "web",
          content: result.snippet,
          source: result.title,
          sourceUrl: result.url,
          publishedDate: result.publishedDate,
          relevanceScore: result.score || 0.5,
          subQuestion,
          citationRef: `Web:${result.source}`,
        });
      }
    } catch (err) {
      console.warn("Web search failed for sub-question:", err);
    }
  }

  return evidence;
}

function deduplicateEvidence(evidence: EvidenceItem[]): EvidenceItem[] {
  const seen = new Set<string>();
  const unique: EvidenceItem[] = [];

  for (const item of evidence) {
    // Create fingerprint from content (first 100 chars)
    const fingerprint = item.content.slice(0, 100).toLowerCase().replace(/\s+/g, " ");
    
    if (!seen.has(fingerprint)) {
      seen.add(fingerprint);
      unique.push(item);
    }
  }

  return unique;
}

async function rankEvidence(
  llm: LLMClient,
  query: string,
  evidence: EvidenceItem[]
): Promise<EvidenceItem[]> {
  if (evidence.length <= 10) {
    // Sort by relevance score if small set
    return evidence.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  // For larger sets, use LLM to rerank
  const evidenceText = evidence
    .map((e, i) => `[${i}] ${e.content.slice(0, 200)}... (Source: ${e.source})`)
    .join("\n\n");

  const systemPrompt = `Rate the relevance of each evidence item to the research question.
Return ONLY a JSON array of scores (0-1) for each index.`;

  const userPrompt = `Research Question: ${query}

Evidence Items:\n${evidenceText}

Relevance scores as JSON array:`;

  try {
    const response = await llm.generateText({
      systemPrompt,
      userPrompt,
      temperature: 0.1,
      maxTokens: 500,
    });

    const jsonMatch = response.match(/\[[\d.,\s]+\]/);
    if (jsonMatch) {
      const scores = JSON.parse(jsonMatch[0]);
      evidence.forEach((e, i) => {
        if (scores[i] !== undefined) {
          e.relevanceScore = scores[i];
        }
      });
    }
  } catch (err) {
    console.warn("Evidence reranking failed:", err);
  }

  return evidence.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

interface ResearchReport {
  summary: string;
  answer: string;
  keyFindings: string[];
  sources: { citation: string; source: string; relevance: number }[];
  confidence: "high" | "medium" | "low";
  confidenceReason: string;
}

async function generateResearchReport(
  llm: LLMClient,
  query: string,
  evidence: EvidenceItem[],
  subQuestions: string[]
): Promise<ResearchReport> {
  const topEvidence = evidence.slice(0, 15);
  
  const evidenceContext = topEvidence
    .map((e, i) => `[${i + 1}] ${e.content}\n(Source: ${e.source}, Sub-question: ${e.subQuestion})`)
    .join("\n\n");

  const systemPrompt = `You are a research analyst. Synthesize the evidence into a comprehensive report.

Return JSON format:
{
  "summary": "Executive summary (3-4 sentences)",
  "answer": "Detailed answer with inline citations [1], [2], etc.",
  "keyFindings": ["Finding 1", "Finding 2", ...],
  "sources": [{"citation": "[1]", "source": "Source Name", "relevance": 0.95}, ...],
  "confidence": "high|medium|low",
  "confidenceReason": "Why this confidence level"
}

Guidelines:
- Cite every major claim with [number]
- Be objective and balanced
- Note any gaps or uncertainties
- Confidence based on source quality and agreement`;

  const userPrompt = `Research Question: ${query}

Sub-questions explored:
${subQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}

Evidence:
${evidenceContext}

Synthesize a research report as JSON:`;

  const response = await llm.generateText({
    systemPrompt,
    userPrompt,
    temperature: 0.2,
    maxTokens: 4000,
  });

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.warn("Failed to parse research report JSON:", e);
  }

  // Fallback: return structured text
  return {
    summary: response.slice(0, 500),
    answer: response,
    keyFindings: [],
    sources: topEvidence.map((e, i) => ({
      citation: `[${i + 1}]`,
      source: e.source,
      relevance: e.relevanceScore,
    })),
    confidence: "medium",
    confidenceReason: "Based on available evidence",
  };
}
