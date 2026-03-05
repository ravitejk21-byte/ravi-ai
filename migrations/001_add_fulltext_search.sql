-- Migration: Add Full-Text Search (tsvector + GIN index) to document_chunks
-- This enables hybrid retrieval: vector similarity + keyword search

-- 1. Add tsvector column for full-text search
ALTER TABLE "document_chunks" ADD COLUMN IF NOT EXISTS content_tsv tsvector;

-- 2. Create function to auto-update tsvector on content changes
CREATE OR REPLACE FUNCTION update_document_chunks_tsv()
RETURNS TRIGGER AS $$
BEGIN
    NEW.content_tsv := to_tsvector('english', COALESCE(NEW.content, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger to keep tsvector updated
DROP TRIGGER IF EXISTS document_chunks_tsv_update ON "document_chunks";
CREATE TRIGGER document_chunks_tsv_update
    BEFORE INSERT OR UPDATE ON "document_chunks"
    FOR EACH ROW
    EXECUTE FUNCTION update_document_chunks_tsv();

-- 4. Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_document_chunks_tsv 
ON "document_chunks" 
USING GIN (content_tsv);

-- 5. Backfill existing data with tsvector values
UPDATE "document_chunks" 
SET content_tsv = to_tsvector('english', COALESCE(content, ''))
WHERE content_tsv IS NULL;

-- 6. Create hybrid search function (combines vector + keyword)
CREATE OR REPLACE FUNCTION hybrid_search(
    query_embedding VECTOR(768),
    query_text TEXT,
    match_threshold FLOAT DEFAULT 0.5,
    vector_weight FLOAT DEFAULT 0.7,
    keyword_weight FLOAT DEFAULT 0.3,
    match_count INT DEFAULT 10
)
RETURNS TABLE(
    id TEXT,
    content TEXT,
    document_id TEXT,
    document_name TEXT,
    vector_score FLOAT,
    keyword_score FLOAT,
    combined_score FLOAT
)
LANGUAGE plpgsql
AS $$
DECLARE
    max_vector_score FLOAT;
    max_keyword_score FLOAT;
BEGIN
    -- Get max scores for normalization
    SELECT MAX(1 - (dc.embedding <=> query_embedding)) INTO max_vector_score
    FROM "document_chunks" dc
    WHERE 1 - (dc.embedding <=> query_embedding) > match_threshold;
    
    max_vector_score := GREATEST(max_vector_score, 0.0001);
    
    SELECT MAX(ts_rank(dc.content_tsv, plainto_tsquery('english', query_text))) INTO max_keyword_score
    FROM "document_chunks" dc
    WHERE dc.content_tsv @@ plainto_tsquery('english', query_text);
    
    max_keyword_score := GREATEST(max_keyword_score, 0.0001);

    RETURN QUERY
    WITH vector_results AS (
        SELECT 
            dc.id,
            dc.content,
            dc."documentId" as doc_id,
            1 - (dc.embedding <=> query_embedding) as sim_score
        FROM "document_chunks" dc
        WHERE 1 - (dc.embedding <=> query_embedding) > match_threshold
        ORDER BY dc.embedding <=> query_embedding
        LIMIT match_count * 2
    ),
    keyword_results AS (
        SELECT 
            dc.id,
            dc.content,
            dc."documentId" as doc_id,
            ts_rank(dc.content_tsv, plainto_tsquery('english', query_text)) as rank_score
        FROM "document_chunks" dc
        WHERE dc.content_tsv @@ plainto_tsquery('english', query_text)
        ORDER BY rank_score DESC
        LIMIT match_count * 2
    ),
    combined AS (
        SELECT 
            COALESCE(v.id, k.id) as chunk_id,
            COALESCE(v.content, k.content) as chunk_content,
            COALESCE(v.doc_id, k.doc_id) as doc_id,
            COALESCE(v.sim_score, 0) as v_score,
            COALESCE(k.rank_score, 0) as k_score
        FROM vector_results v
        FULL OUTER JOIN keyword_results k ON v.id = k.id
    )
    SELECT 
        c.chunk_id,
        c.chunk_content,
        c.doc_id,
        d.name as document_name,
        c.v_score as vector_score,
        c.k_score as keyword_score,
        (vector_weight * (c.v_score / max_vector_score) + 
         keyword_weight * (c.k_score / max_keyword_score)) as combined_score
    FROM combined c
    JOIN "documents" d ON d.id = c.doc_id
    ORDER BY combined_score DESC
    LIMIT match_count;
END;
$$;

-- 7. Create function for keyword-only search (fallback)
CREATE OR REPLACE FUNCTION keyword_search(
    query_text TEXT,
    match_count INT DEFAULT 10
)
RETURNS TABLE(
    id TEXT,
    content TEXT,
    document_id TEXT,
    document_name TEXT,
    keyword_score FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dc.id,
        dc.content,
        dc."documentId" as document_id,
        d.name as document_name,
        ts_rank(dc.content_tsv, plainto_tsquery('english', query_text)) as keyword_score
    FROM "document_chunks" dc
    JOIN "documents" d ON d.id = dc."documentId"
    WHERE dc.content_tsv @@ plainto_tsquery('english', query_text)
    ORDER BY keyword_score DESC
    LIMIT match_count;
END;
$$;

-- 8. Verify migration
SELECT 
    'Migration complete' as status,
    COUNT(*) as total_chunks,
    COUNT(content_tsv) as chunks_with_tsv
FROM "document_chunks";
