import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check if pgvector is available
    const vectorExt = await prisma.$queryRaw`
      SELECT * FROM pg_extension WHERE extname = 'vector'
    `;
    
    const hasVector = Array.isArray(vectorExt) && vectorExt.length > 0;
    
    // Count tables
    const tableCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    // Check embedding dimension
    let embeddingDimension = null;
    try {
      const dimCheck = await prisma.$queryRaw`
        SELECT atttypmod as dimension 
        FROM pg_attribute 
        WHERE attrelid = 'document_chunks'::regclass 
        AND attname = 'embedding'
      `;
      if (Array.isArray(dimCheck) && dimCheck.length > 0) {
        embeddingDimension = (dimCheck[0] as any).dimension;
      }
    } catch {
      // Table might not exist yet
    }
    
    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      checks: {
        database: "connected",
        pgvector: hasVector ? "enabled" : "disabled",
        tables: (tableCount as any)[0]?.count || 0,
        embeddingDimension: embeddingDimension,
      },
      version: "1.0.0",
    });
  } catch (error: any) {
    return NextResponse.json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error.message,
      checks: {
        database: "disconnected",
        pgvector: "unknown",
      },
    }, { status: 500 });
  }
}
