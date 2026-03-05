import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { searchWeb, WebSearchResult, needsCurrentInfo } from "@/lib/webSearch";

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { 
      query, 
      maxResults = 5, 
      includeAnswer = false,
      searchDepth = "basic",
      storeResults = false,
    } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Check if web search is configured
    if (!process.env.WEB_SEARCH_API_KEY) {
      return NextResponse.json(
        { 
          error: "Web search not configured",
          message: "Set WEB_SEARCH_API_KEY in environment variables",
          providers: [
            { name: "Brave Search", url: "https://brave.com/search/api/", freeTier: "2000 queries/month" },
            { name: "Tavily", url: "https://tavily.com", freeTier: "1000 requests/month" },
          ]
        },
        { status: 503 }
      );
    }

    // Perform web search
    const results = await searchWeb({
      query,
      maxResults,
      includeAnswer,
      searchDepth: searchDepth as "basic" | "advanced",
    });

    // Optionally store results as documents (if requested)
    let storedCount = 0;
    if (storeResults) {
      const { prisma } = await import("@/lib/prisma");
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      if (user) {
        const { storeWebDocument } = await import("@/lib/webSearch");
        for (const result of results.slice(0, 3)) {
          try {
            await storeWebDocument(result.url, user.id);
            storedCount++;
          } catch (err) {
            console.warn(`Failed to store ${result.url}:`, err);
          }
        }
      }
    }

    return NextResponse.json({
      query,
      results,
      metadata: {
        provider: process.env.WEB_SEARCH_PROVIDER || "brave",
        totalResults: results.length,
        needsCurrentInfo: needsCurrentInfo(query),
        storedCount: storeResults ? storedCount : undefined,
      },
    });
  } catch (error: any) {
    console.error("Web search error:", error);
    
    return NextResponse.json(
      { error: "Web search failed", message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const maxResults = parseInt(searchParams.get("limit") || "5");

    if (!query) {
      return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
    }

    if (!process.env.WEB_SEARCH_API_KEY) {
      return NextResponse.json(
        { error: "Web search not configured", message: "Set WEB_SEARCH_API_KEY" },
        { status: 503 }
      );
    }

    const results = await searchWeb({ query, maxResults });

    return NextResponse.json({
      query,
      results,
      metadata: {
        provider: process.env.WEB_SEARCH_PROVIDER || "brave",
        totalResults: results.length,
      },
    });
  } catch (error: any) {
    console.error("Web search error:", error);
    return NextResponse.json(
      { error: "Web search failed", message: error.message },
      { status: 500 }
    );
  }
}
