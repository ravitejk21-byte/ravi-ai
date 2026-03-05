import { NextResponse } from "next/server";
import { DocType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { LLMClient } from "@/lib/llm";

// Helper function to chunk text
function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const chunk = text.slice(i, i + chunkSize);
    chunks.push(chunk);
    i += chunkSize - overlap;
  }
  return chunks;
}

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

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const workspaceId = formData.get("workspaceId") as string;
    const docType = formData.get("type") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Read file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Extract text (simplified - in production use pdf-parse, mammoth, etc.)
    let content = "";
    const textDecoder = new TextDecoder();
    try {
      content = textDecoder.decode(buffer);
    } catch {
      content = "[Binary content - text extraction required]";
    }

    // Create document record
    const document = await prisma.document.create({
      data: {
        name: file.name,
                  type: ((docType || "OTHER") as DocType),
        fileUrl: "local://" + file.name, // In production, upload to S3
        fileSize: file.size,
        content: content.slice(0, 10000), // Store preview
        userId: user.id,
        workspaceId: workspaceId || null,
      },
    });

    // Chunk and embed using unified LLM client (supports free providers)
    const llm = new LLMClient();
    const chunks = chunkText(content, 1000, 200);
    
    let chunksIndexed = 0;
    for (const chunk of chunks.slice(0, 50)) { // Limit to 50 chunks for MVP
      try {
        const embedding = await llm.createEmbedding(chunk.slice(0, 8000));

        // Store chunk with embedding
        await prisma.$executeRaw`
          INSERT INTO "document_chunks" (id, content, embedding, "documentId")
          VALUES (${crypto.randomUUID()}, ${chunk}, ${embedding}::vector, ${document.id})
        `;
        chunksIndexed++;
      } catch (err) {
        console.error("Failed to embed chunk:", err);
        // Continue with other chunks
      }
    }

    // Mark as indexed if at least some chunks were processed
    if (chunksIndexed > 0) {
      await prisma.document.update({
        where: { id: document.id },
        data: { isIndexed: true },
      });
    }

    return NextResponse.json({ 
      document, 
      chunksIndexed,
      totalChunks: chunks.length,
      provider: llm.getProvider(),
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    
    if (error.message?.includes("No embedding provider")) {
      return NextResponse.json(
        { 
          error: "No embedding provider configured.",
          suggestion: "For free embeddings: 1) Install Ollama, 2) Run: ollama pull nomic-embed-text, 3) Set OLLAMA_HOST in .env"
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

export async function GET() {
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

    const documents = await prisma.document.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { chunks: true },
        },
      },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
