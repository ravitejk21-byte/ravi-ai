# Ravi AI Upgrades - Implementation Summary

## Overview
This document summarizes the 3 major upgrades implemented for Ravi AI.

---

## ✅ UPGRADE 1: Hybrid Retrieval (MUST-HAVE)

### Files Created/Modified:
- **NEW**: `lib/retrieval.ts` - Core hybrid retrieval logic
- **NEW**: `migrations/001_add_fulltext_search.sql` - Database migration
- **MODIFIED**: `app/api/rag/route.ts` - Updated to use hybrid retrieval

### Features:
1. **Postgres Full-Text Search**: Added `tsvector` column with GIN index on `document_chunks.content`
2. **Hybrid Search Function**: `hybrid_search()` combines vector topK + keyword topK
3. **Scoring Blend**: Weighted sum of normalized vector and keyword scores
4. **Reranking**: 
   - Primary: Cohere rerank API (if `COHERE_API_KEY` is set)
   - Fallback: Gemini-based reranking
   - Final fallback: Combined scores

### Environment Variables:
```bash
RAG_VECTOR_WEIGHT=0.7        # Weight for vector similarity
RAG_KEYWORD_WEIGHT=0.3       # Weight for keyword search
RAG_SIMILARITY_THRESHOLD=0.75 # Trigger web search below this
RAG_RERANK_TOP_N=5           # Results after reranking
```

### API Usage:
```bash
curl -X POST /api/rag \
  -d '{"query": "...", "useHybrid": true, "useReranking": true}'
```

---

## ✅ UPGRADE 2: Web Search (Perplexity-style)

### Files Created:
- **NEW**: `lib/webSearch.ts` - Web search integration
- **NEW**: `app/api/search/route.ts` - Direct web search endpoint

### Features:
1. **Multiple Providers**: Brave Search (2000 queries/month free) or Tavily (1000 requests/month free)
2. **Auto-Trigger Conditions**:
   - KB retrieval low confidence (max similarity < threshold)
   - User asks for "latest/current/today/2024"
3. **Store & Index**: Option to save web pages as documents
4. **Rich Results**: Title, snippet, URL, published date, source

### Environment Variables:
```bash
WEB_SEARCH_PROVIDER=brave        # or "tavily"
WEB_SEARCH_API_KEY=your_key_here
BRAVE_API_KEY=alternative_key    # optional
TAVILY_API_KEY=alternative_key   # optional
```

### API Usage:
```bash
# Direct web search
curl -X POST /api/search \
  -d '{"query": "Latest SEC rules", "maxResults": 5}'

# RAG with web fallback
curl -X POST /api/rag \
  -d '{"query": "...", "useWebSearch": true}'
```

---

## ✅ UPGRADE 3: Research Mode (Multi-step)

### Files Created:
- **NEW**: `app/api/research/route.ts` - Research mode endpoint

### Pipeline:
1. **Planner**: Breaks question into 3-6 sub-questions
2. **Retrieval**: Runs KB + Web search for each sub-question
3. **Evidence Pack**: Merges and deduplicates sources
4. **Writer**: Generates structured answer with citations + confidence

### Features:
- Configurable depth: "quick" | "standard" | "deep"
- Evidence ranking by relevance
- Confidence scoring (high/medium/low)
- Structured JSON output with summary, key findings, sources

### Environment Variables:
```bash
RESEARCH_DEPTH=standard          # Default depth
RESEARCH_MAX_SUBQUESTIONS=5      # Max sub-questions
```

### API Usage:
```bash
# Research mode endpoint
curl -X POST /api/research \
  -d '{"query": "AI governance risks", "depth": "deep"}'

# Via RAG endpoint
curl -X POST /api/rag \
  -d '{"query": "...", "researchMode": true}'
```

---

## 📁 File Structure

```
ravi-ai/
├── app/api/
│   ├── rag/route.ts          # UPDATED - Hybrid + Web + Research
│   ├── search/route.ts       # NEW - Web search endpoint
│   └── research/route.ts     # NEW - Research mode endpoint
├── lib/
│   ├── retrieval.ts          # NEW - Hybrid retrieval + reranking
│   ├── webSearch.ts          # NEW - Web search integration
│   └── prisma.ts             # NEW - Prisma client
├── migrations/
│   └── 001_add_fulltext_search.sql  # NEW - DB migration
├── demo-api.sh               # NEW - API demo script
├── .env.example              # UPDATED - New env vars
└── README.md                 # UPDATED - Documentation
```

---

## 🔧 Setup Instructions

### 1. Database Migration
```bash
# Run the migration
psql $DATABASE_URL -f migrations/001_add_fulltext_search.sql
```

### 2. Environment Variables
Copy from `.env.example` and configure:
```bash
# Required for RAG
GEMINI_API_KEY=your_gemini_key

# For web search
WEB_SEARCH_PROVIDER=brave
WEB_SEARCH_API_KEY=your_brave_key

# RAG tuning (optional)
RAG_SIMILARITY_THRESHOLD=0.75
RAG_VECTOR_WEIGHT=0.7
RAG_KEYWORD_WEIGHT=0.3
```

### 3. Test the API
```bash
# Make script executable and run
chmod +x demo-api.sh
./demo-api.sh
```

---

## 💰 Free Tier Limits

| Service | Free Tier | Best For |
|---------|-----------|----------|
| Gemini | 60 req/min + embeddings | LLM + Embeddings |
| Brave Search | 2000 queries/month | Web search |
| Tavily | 1000 requests/month | Web search (alternative) |
| Cohere | 100 calls/month | Reranking (optional) |

**Total cost for local development: $0**

---

## 🎯 Key Features Summary

| Feature | Hybrid Retrieval | Web Search | Research Mode |
|---------|-----------------|------------|---------------|
| Vector Search | ✅ | ❌ | ✅ |
| Keyword Search | ✅ | ❌ | ✅ |
| Reranking | ✅ | ❌ | ✅ |
| Web Results | ❌ | ✅ | ✅ |
| Auto-trigger | ❌ | ✅ | ✅ |
| Multi-step | ❌ | ❌ | ✅ |
| Sub-questions | ❌ | ❌ | ✅ |
| Confidence Score | ❌ | ❌ | ✅ |

---

## 🚀 Next Steps

1. Run database migration
2. Set environment variables
3. Test with `demo-api.sh`
4. Integrate UI toggle for "Research Mode"
5. Add citations display in chat UI
