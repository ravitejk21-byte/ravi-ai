# Ravi AI - Consulting & Internal Audit Copilot

A professional web application for generating structured consulting deliverables including slide decks, audit plans, ERM frameworks, risk registers, and governance documentation.

## 🆓 **FREE TO USE** - No OpenAI Required!

Ravi AI supports **completely free** LLM providers. Run the entire application without paying for API access.

### Free Options Available:
- **Google Gemini** - 60 req/min free, **includes free embeddings** ⭐⭐ (Best for Vercel)
- **Groq** - 1M tokens/day free, fastest inference ⭐
- **Cohere** - 100 calls/month free, great for reranking 💬
- **Ollama** - Unlimited, runs locally on your computer 🖥️
- **Together AI** - $5 free credit on signup 🚀

👉 See [FREE_SETUP.md](./FREE_SETUP.md) for detailed free setup instructions.

---

## 🚀 Quick Start

### One-Click Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fravitejk21-byte%2Fravi-ai&env=DATABASE_URL,NEXTAUTH_SECRET,NEXTAUTH_URL,GEMINI_API_KEY,DEFAULT_LLM_PROVIDER&envDescription=API%20Keys%20and%20Database%20configuration%20for%20Ravi%20AI&envLink=https%3A%2F%2Fgithub.com%2Fravitejk21-byte%2Fravi-ai%2Fblob%2Fmain%2FENV_REFERENCE.md&project-name=ravi-ai&repository-name=ravi-ai)

### Prerequisites
- [Vercel](https://vercel.com/signup) account (free)
- [Supabase](https://supabase.com) account (free)
- [Google AI Studio](https://makersuite.google.com/app/apikey) account (free)
- [Brave Search](https://brave.com/search/api/) or [Tavily](https://tavily.com) API key (optional, for web search)

### Quick Deploy (3 Steps)

**Step 1: Setup Supabase (2 minutes)**
1. Create project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Go to **Settings > Database > Connection String**
4. Copy the **URI** format string

**Step 2: Get Gemini API Key (1 minute)**
1. Go to [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key

**Step 3: Click Deploy**
Click the button above ☝️ and enter your environment variables.

[Full Deployment Guide](./VERCEL_BUTTON.md)

---

## ✨ New Features (v2.0)

### 🔍 Upgrade 1: Hybrid Retrieval (RAG v2)
- **Vector + Keyword Search**: Combines semantic similarity with PostgreSQL full-text search
- **Intelligent Reranking**: Uses Cohere rerank API or Gemini for result ranking
- **Configurable Weights**: Adjust vector vs keyword importance
- **Better Citations**: Source name + chunk ID + similarity score

### 🌐 Upgrade 2: Web Search (Perplexity-style)
- **Automatic Trigger**: Web search activates when KB confidence is low
- **Current Info Detection**: Auto-detects queries about "latest", "today", "2024"
- **Multiple Providers**: Brave Search (2000 queries/month free) or Tavily (1000 requests/month free)
- **Store & Index**: Option to save web results as documents for future retrieval

### 🔬 Upgrade 3: Research Mode
- **Multi-step Pipeline**: Planner → Retrieval → Evidence Pack → Writer
- **Sub-question Generation**: Breaks complex questions into researchable parts
- **Evidence Synthesis**: Merges KB and web sources with citations
- **Confidence Scoring**: Reports confidence level based on source quality

---

## 🌟 Core Features

### 1. Prompt Studio
- Create, store, and version prompt templates
- Support for variables (Client Name, Sector, Framework, etc.)
- Structured prompt format: ROLE → OBJECTIVE → CONTEXT → INSTRUCTIONS → CONSTRAINTS → OUTPUT FORMAT

### 2. Deliverable Generator
- Generate consulting deliverables with AI
- Support for: PowerPoint outlines, audit reports, risk matrices, governance frameworks
- Export to: Markdown, DOCX, PPTX, CSV
- Quality Gate: Automated checks for assumptions, terminology, completeness, risk gaps, tone

### 3. Engagement Workspaces
- Organize work by client/project
- Store prompts, documents, deliverables, and notes per engagement
- Track project status and progress

### 4. Knowledge Base (RAG) - **UPGRADED**
- Upload documents (PDF, DOCX, TXT, MD)
- **Hybrid AI-powered search**: Vector + Full-text + Reranking
- **Web search fallback**: Auto-search when KB confidence is low
- **Research mode**: Multi-step research for complex questions
- Citations and source tracking

### 5. Pre-built Templates
- ERM Risk Appetite Statement
- Internal Audit Plan
- Risk Control Matrix
- Governance Framework
- Board Presentation

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with pgvector + tsvector/GIN (Supabase recommended)
- **AI**: Multiple providers (Gemini ⭐, Groq, Cohere, Together, OpenAI)
- **Web Search**: Brave Search API or Tavily API
- **Export**: docx, pptxgenjs

---

## 📡 API Endpoints

### RAG Query (with Hybrid Retrieval)
```bash
POST /api/rag
{
  "query": "What are the key risks?",
  "useHybrid": true,        // Enable vector + keyword search
  "useReranking": true,     // Enable result reranking
  "useWebSearch": true,     // Enable web fallback
  "researchMode": false     // Enable multi-step research
}
```

### Web Search
```bash
POST /api/search
{
  "query": "Latest SEC regulations",
  "maxResults": 5,
  "storeResults": false     // Save as documents
}
```

### Research Mode
```bash
POST /api/research
{
  "query": "AI governance risks",
  "depth": "standard",      // "quick" | "standard" | "deep"
  "maxSubQuestions": 5
}
```

See [demo-api.sh](./demo-api.sh) for complete examples.

---

## 💰 Cost Comparison

| Provider | Free Tier | Paid Cost | Embeddings | Reranking | Best For |
|----------|-----------|-----------|------------|-----------|----------|
| **Gemini** | 60 req/min + embeddings | $0.0005/1K tokens | ✅ Free | ✅ Via API | Vercel/RAG |
| **Groq** | 1M tokens/day | $0.0007/1K tokens | ❌ No | ❌ No | Speed |
| **Cohere** | 100 calls/month | $1.00/1K tokens | ❌ No | ✅ Free tier | Reranking |
| **Together** | $5 credit | $0.0006/1K tokens | ❌ No | ❌ No | Variety |
| **Ollama** | Unlimited | $0 (local) | ✅ Free | ❌ No | Local dev |
| **OpenAI** | None | $0.03/1K tokens | ✅ Paid | ❌ No | Power users |

**Web Search (Free Tiers):**
- **Brave Search**: 2000 queries/month free
- **Tavily**: 1000 requests/month free

**Recommendation for Vercel:** Use **Gemini** + **Brave Search**

---

## 🔐 Environment Variables

### Required
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (Supabase for Vercel) |
| `NEXTAUTH_SECRET` | Random secret for security |
| `NEXTAUTH_URL` | App URL |

### LLM Providers (Choose at least one)
| Variable | Description | Free Tier |
|----------|-------------|-----------|
| `GEMINI_API_KEY` | Google Gemini (recommended) | 60 req/min + embeddings |
| `GROQ_API_KEY` | Groq (fastest) | 1M tokens/day |
| `COHERE_API_KEY` | Cohere (reranking) | 100 calls/month |
| `OPENAI_API_KEY` | OpenAI (paid) | None |

### Web Search (Optional)
| Variable | Description | Free Tier |
|----------|-------------|-----------|
| `WEB_SEARCH_PROVIDER` | "brave" or "tavily" | - |
| `WEB_SEARCH_API_KEY` | API key for chosen provider | 2000 or 1000/month |

### RAG Configuration
| Variable | Default | Description |
|----------|---------|-------------|
| `RAG_SIMILARITY_THRESHOLD` | 0.75 | Trigger web search below this score |
| `RAG_VECTOR_WEIGHT` | 0.7 | Weight for vector search (0-1) |
| `RAG_KEYWORD_WEIGHT` | 0.3 | Weight for keyword search (0-1) |
| `RAG_RERANK_TOP_N` | 5 | Number of results after reranking |

### Research Mode
| Variable | Default | Description |
|----------|---------|-------------|
| `RESEARCH_DEPTH` | "standard" | Default depth: quick/standard/deep |
| `RESEARCH_MAX_SUBQUESTIONS` | 5 | Max sub-questions to generate |

See [ENV_REFERENCE.md](./ENV_REFERENCE.md) for all options.

---

## 🗄️ Database Migrations

### Initial Setup
```bash
# 1. Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

# 2. Run hybrid search migration
psql $DATABASE_URL -f migrations/001_add_fulltext_search.sql
```

The migration adds:
- `content_tsv` tsvector column with GIN index
- Auto-update trigger for full-text search
- `hybrid_search()` function for combined vector + keyword search
- `keyword_search()` function for fallback

---

## 📁 Project Structure

```
ravi-ai/
├── app/
│   ├── api/
│   │   ├── rag/route.ts          # Hybrid RAG endpoint
│   │   ├── search/route.ts       # Web search endpoint
│   │   └── research/route.ts     # Research mode endpoint
│   └── ...
├── lib/
│   ├── llm.ts                    # Multi-provider LLM client
│   ├── retrieval.ts              # Hybrid retrieval + reranking ⭐ NEW
│   ├── webSearch.ts              # Web search integration ⭐ NEW
│   └── ...
├── migrations/
│   └── 001_add_fulltext_search.sql   # Hybrid search migration ⭐ NEW
├── demo-api.sh                   # API demo script ⭐ NEW
├── supabase-setup.sql
└── README.md
```

---

## 🧪 Testing the API

Run the demo script to test all endpoints:

```bash
# Set your base URL
export BASE_URL=http://localhost:3000

# Run demo
./demo-api.sh
```

Or test individual endpoints:

```bash
# Test hybrid RAG
curl -X POST http://localhost:3000/api/rag \
  -H "Content-Type: application/json" \
  -d '{"query": "What are ESG risks?", "useHybrid": true}'

# Test web search
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Latest AI regulations"}'

# Test research mode
curl -X POST http://localhost:3000/api/research \
  -H "Content-Type: application/json" \
  -d '{"query": "AI governance risks", "depth": "deep"}'
```

---

## 📝 License

MIT License - Built for Ravi Tej

---

## 🤝 Support

- **Free Setup Guide**: See [FREE_SETUP.md](./FREE_SETUP.md)
- **Vercel Deployment**: See [VERCEL_BUTTON.md](./VERCEL_BUTTON.md)
- **API Demo**: See [demo-api.sh](./demo-api.sh)

**Enjoy your free AI consulting copilot! 🚀**
