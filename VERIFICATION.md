# Post-Deploy Verification Guide

## ✅ Quick Health Check

### 1. Test API Health
```bash
curl https://your-app.vercel.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-03-05T10:30:00.000Z",
  "checks": {
    "database": "connected",
    "pgvector": "enabled",
    "tables": 10,
    "embeddingDimension": 768
  },
  "version": "1.0.0"
}
```

---

## 🧪 Full Verification Steps

### Step 1: Create Knowledge Base
1. Go to `https://your-app.vercel.app/dashboard/knowledge`
2. Upload a test document (PDF, DOCX, or TXT)
3. Select document type (e.g., "Audit Manual")
4. Click "Upload Document"
5. **Verify:** Document appears in list with "Indexed" badge

### Step 2: Verify Vector Storage
In Supabase SQL Editor, run:
```sql
-- Check documents were created
SELECT COUNT(*) as document_count FROM "documents";

-- Check embeddings were created
SELECT COUNT(*) as chunk_count FROM "document_chunks";

-- Check vector dimensions (should be 768 for Gemini)
SELECT 
  document_id,
  embedding IS NOT NULL as has_embedding,
  pg_column_size(embedding) as embedding_bytes
FROM "document_chunks"
LIMIT 5;
```

Expected:
- `document_count` >= 1
- `chunk_count` >= 1
- `has_embedding` = true
- `embedding_bytes` ~ 3100 (768 floats × 4 bytes)

### Step 3: Run RAG Query
1. In Knowledge Base page, scroll to "Query Knowledge Base"
2. Enter: "What are the key findings in the document?"
3. Click "Query Documents"
4. **Verify:** 
   - Answer is generated
   - Sources are shown with similarity scores
   - Response includes "Provider: gemini"

### Step 4: Generate Deliverable
1. Go to `https://your-app.vercel.app/dashboard/deliverables/new`
2. Select template: "ERM Risk Appetite Statement"
3. Fill in variables:
   - Organization Name: "Test Corp"
   - Industry: "Technology"
   - Strategic Objectives: "Growth and innovation"
4. Click "Generate"
5. **Verify:**
   - Content is generated
   - Quality Gate score is shown
   - Provider info shows Gemini

### Step 5: Verify Data Persistence
```sql
-- Check generations were saved
SELECT COUNT(*) as generation_count FROM "generations";

-- Check exports (if you exported anything)
SELECT COUNT(*) as export_count FROM "exports";
```

---

## 🐛 Common Failures & Fixes

### 1. Prisma Migrate Fails

**Error:**
```
Error: P1001: Can't reach database server
```

**Causes:**
- Invalid DATABASE_URL
- Supabase project paused
- Network connectivity issue

**Fix:**
```bash
# 1. Verify DATABASE_URL format
# Should be: postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# 2. Check Supabase project is active
# Go to Supabase dashboard > Project Settings

# 3. Try connection pooling URL if direct fails
# Use connection pooler URL from Supabase
```

---

### 2. pgvector Extension Missing

**Error:**
```
Error: Unknown type: 'vector'
```

**Fix:**
```sql
-- Run in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify
SELECT * FROM pg_extension WHERE extname = 'vector';
```

---

### 3. Embeddings Dimension Mismatch

**Error:**
```
Error: Expected 768 dimensions, got 1536
```

**Causes:**
- Using OpenAI embeddings (1536 dims) with Gemini schema (768 dims)
- Schema mismatch between local and production

**Fix:**
```bash
# 1. Check which embedding provider is being used
# View logs in Vercel dashboard

# 2. If using OpenAI, regenerate Prisma client with correct dimensions
# OR update schema to match your embedding provider

# 3. For Gemini (768 dims) - this is correct
# For OpenAI (1536 dims) - update schema.prisma:
# embedding Unsupported("vector(1536)")?
```

---

### 4. RAG Query Returns Empty

**Symptoms:**
- Query runs but no sources returned
- "No relevant information found" message

**Causes:**
- Documents not indexed (no embeddings)
- Query doesn't match document content
- Similarity threshold too high

**Fix:**
```sql
-- Check if embeddings exist
SELECT COUNT(*) FROM "document_chunks" WHERE embedding IS NOT NULL;

-- If 0, documents weren't indexed
-- Check Vercel logs for embedding errors

-- Check specific document chunks
SELECT 
  dc.id,
  dc.content,
  dc.embedding IS NOT NULL as has_embedding
FROM "document_chunks" dc
JOIN "documents" d ON d.id = dc."documentId"
WHERE d.name = 'your-document.pdf';
```

---

### 5. "No embedding provider available"

**Error:**
```
Error: No embedding provider available. For free RAG on Vercel:
Set GEMINI_API_KEY at https://makersuite.google.com/app/apikey
```

**Fix:**
1. Set `GEMINI_API_KEY` in Vercel environment variables
2. Redeploy the application
3. Verify key is valid at Google AI Studio

---

### 6. NEXTAUTH_URL Mismatch

**Error:**
```
Error: Invalid NEXTAUTH_URL
```

**Fix:**
```bash
# Must match your actual Vercel domain
NEXTAUTH_URL="https://ravi-ai.vercel.app"  # NOT localhost
```

---

### 7. Build Fails on Vercel

**Error:**
```
Error: Command "prisma generate" failed
```

**Fix:**
```bash
# Ensure postinstall script is in package.json
"scripts": {
  "postinstall": "prisma generate"
}

# Or update build command in vercel.json
"buildCommand": "prisma generate && next build"
```

---

## 📊 Expected Database State After Verification

```sql
-- After successful verification, you should see:

SELECT 
  (SELECT COUNT(*) FROM "users") as users,
  (SELECT COUNT(*) FROM "documents") as documents,
  (SELECT COUNT(*) FROM "document_chunks") as chunks,
  (SELECT COUNT(*) FROM "generations") as generations,
  (SELECT COUNT(*) FROM "prompts") as prompts;

-- Expected: users=1, documents=1+, chunks=5+, generations=1+
```

---

## 🎯 Success Criteria

✅ Health check returns "healthy"
✅ pgvector shows "enabled"
✅ embeddingDimension shows 768
✅ Document uploads successfully
✅ Embeddings created (chunks > 0)
✅ RAG query returns answer with sources
✅ Deliverable generation works
✅ Data persists after page refresh

**All checks passed? Your deployment is ready! 🚀**

---

## 🆘 Still Stuck?

Check these resources:
- [ENV_REFERENCE.md](./ENV_REFERENCE.md) - Environment variable help
- [VERCEL_BUTTON.md](./VERCEL_BUTTON.md) - Deployment guide
- [FREE_SETUP.md](./FREE_SETUP.md) - Provider setup
