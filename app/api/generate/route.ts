import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { LLMClient, DELIVERABLE_SYSTEM_PROMPTS } from "@/lib/llm";
import { runQualityGate } from "@/lib/quality";

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      promptId,
      variables,
      workspaceId,
      title,
    }: {
      promptId: string;
      variables: Record<string, string>;
      workspaceId?: string;
      title: string;
    } = body;

    // Get prompt
    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId },
    });

    if (!prompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    // Build user prompt from variables
    const variableContext = Object.entries(variables)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");

    const userPrompt = `${variableContext}\n\n${prompt.instructions}`;

    // Get system prompt
    const systemPrompt =
      DELIVERABLE_SYSTEM_PROMPTS[prompt.outputType] || prompt.role;

    // Generate using unified LLM client (no RAG needed for generation)
    const llm = new LLMClient();
    const rawOutput = await llm.generateText({
      systemPrompt,
      userPrompt,
    });

    if (!rawOutput) {
      return NextResponse.json(
        { error: "Generation failed" },
        { status: 500 }
      );
    }

    // Run quality gate
    const qualityReport = await runQualityGate(rawOutput, prompt.outputType);

    // Save generation
    const generation = await prisma.generation.create({
      data: {
        title,
        promptId,
        variables,
        rawOutput,
        qualityScore: qualityReport.score,
        qualityFlags: qualityReport.checks,
        workspaceId: workspaceId || null,
      },
    });

    return NextResponse.json({
      generation,
      quality: qualityReport,
      provider: llm.getProvider(),
      model: llm.getModel(),
      contextWindow: llm.getContextWindow(),
    });
  } catch (error: any) {
    console.error("Generation error:", error);
    
    // Check for common free tier errors
    if (error.message?.includes("rate limit")) {
      return NextResponse.json(
        { 
          error: "Rate limit exceeded. Try using Gemini or switch providers.",
          suggestion: "Set GEMINI_API_KEY for free tier with higher limits"
        },
        { status: 429 }
      );
    }
    
    if (error.message?.includes("No LLM provider")) {
      return NextResponse.json(
        { 
          error: "No LLM provider configured.",
          suggestion: "Set GEMINI_API_KEY (free) at https://makersuite.google.com/app/apikey"
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
