-- Supabase Setup Script for Ravi AI
-- Run this in Supabase SQL Editor before deploying

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Verify extension is installed
SELECT * FROM pg_extension WHERE extname = 'vector';

-- 3. Note: Prisma migrations will create all tables
-- The following is for reference and manual verification:

/*
-- Document chunks table with vector support
CREATE TABLE IF NOT EXISTS "document_chunks" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    embedding VECTOR(768),  -- Gemini embedding-001 dimensions
    "documentId" TEXT NOT NULL REFERENCES "documents"(id) ON DELETE CASCADE
);
*/

-- 4. Create index for vector similarity search (run AFTER Prisma migration)
-- ivfflat is recommended for up to ~1M vectors with good recall/speed balance
-- For >1M vectors, consider hnsw index instead

-- Note: Run this AFTER the first migration when document_chunks table exists
/*
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding 
ON "document_chunks" 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);  -- Adjust based on data size: 100 for <100k vectors
*/

-- Alternative: hnsw index (better for >1M vectors, higher recall)
/*
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_hnsw
ON "document_chunks"
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
*/

-- 5. Create helper function for similarity search
CREATE OR REPLACE FUNCTION match_documents(
    query_embedding VECTOR(768),
    match_threshold FLOAT,
    match_count INT
)
RETURNS TABLE(
    id TEXT,
    content TEXT,
    document_id TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id,
        dc.content,
        dc."documentId" as document_id,
        1 - (dc.embedding <=> query_embedding) as similarity
    FROM "document_chunks" dc
    WHERE 1 - (dc.embedding <=> query_embedding) > match_threshold
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- 6. Grant permissions (if using Row Level Security)
-- ALTER TABLE "document_chunks" ENABLE ROW LEVEL SECURITY;

-- 7. Post-migration verification queries:
/*
-- Check if pgvector is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check table structure
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'document_chunks';

-- Check index exists
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'document_chunks';
*/
