# Ravi AI - Vercel Deployment Checklist

## ✅ Pre-Deployment Verification

### 1. Gemini Configuration ✓
- **Embedding model:** `embedding-001` (Google's official embedding model)
- **Chat model:** `gemini-1.5-flash` (configurable to `gemini-1.5-pro`)
- **Context window:** 1M tokens (Flash) / 2M tokens (Pro)
- **Context enforcement:** Code truncates at 90% of limit with warnings
- **RAG support:** ✅ Yes - Gemini provides free embeddings

### 2. Provider Priority (RAG-Aware) ✓
When RAG/Knowledge Base is enabled, provider selection:
1. **Gemini** - Free + embeddings (RECOMMENDED)
2. **Gemini Pro** - Free + embeddings + larger context
3. **OpenAI** - Paid + embeddings (fallback)
4. **Ollama** - Local + embeddings (local dev only)

For generation-only (no RAG):
1. **Groq** - Fastest free option
2. **Gemini** - Free + embeddings
3. **Cohere** - Free tier
4. **Together** - Free credit
5. **Ollama** - Local
6. **OpenAI** - Paid

### 3. Vector Storage for Vercel ✓
**Solution:** Supabase PostgreSQL with pgvector
- ✅ Persistent storage (unlike Vercel filesystem)
- ✅ Free tier: 500MB database
- ✅ pgvector extension supported
- ✅ Connection pooling for serverless

**Alternative options:**
- Railway PostgreSQL
- AWS RDS
- Neon PostgreSQL

---

## 🚀 Deployment Steps

### Step 1: Prepare Repository
```bash
# Make sure all changes are committed
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### Step 2: Setup Supabase
1. Go to https://supabase.com
2. Create new project
3. Open SQL Editor
4. Run: `CREATE EXTENSION IF NOT EXISTS vector;`
5. Go to Settings > Database > Connection String
6. Copy **URI** format string

### Step 3: Get Gemini API Key
1. Go to https://makersuite.google.com/app/apikey
2. Create new key
3. Copy the key

### Step 4: Deploy to Vercel

#### Option A: Vercel Dashboard (Easiest)
1. Go to https://vercel.com/new
2. Import your GitHub repo
3. Configure:
   - **Framework Preset:** Next.js
   - **Build Command:** `prisma generate && next build`
4. Add Environment Variables:
   ```
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
   NEXTAUTH_SECRET=[GENERATE_WITH_OPENSSL]
   NEXTAUTH_URL=https://[YOUR_PROJECT].vercel.app
   GEMINI_API_KEY=[YOUR_GEMINI_KEY]
   DEFAULT_LLM_PROVIDER=gemini
   ```
5. Deploy

#### Option B: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Then set environment variables in Vercel dashboard
```

### Step 5: Run Migrations
```bash
# Set DATABASE_URL to Supabase URL temporarily
export DATABASE_URL="your_supabase_url"

# Run migrations
npx prisma migrate deploy
```

---

## ⚠️ Important Notes

### What Works on Vercel:
- ✅ Gemini (chat + embeddings)
- ✅ Groq (chat only)
- ✅ Cohere (chat only)
- ✅ Together AI (chat only)
- ✅ Supabase pgvector (vector storage)

### What Does NOT Work on Vercel:
- ❌ Ollama (requires local installation)
- ❌ Local PostgreSQL
- ❌ File system persistence

### For RAG/Knowledge Base on Vercel:
**MUST use Gemini** (only free provider with embeddings)
- Set `GEMINI_API_KEY`
- Set `DEFAULT_LLM_PROVIDER=gemini`
- Use Supabase for vector storage

---

## 🔧 Post-Deployment Verification

1. **Test Generation:**
   - Go to `/dashboard/deliverables/new`
   - Select a template
   - Generate content
   - Should show "Provider: gemini"

2. **Test RAG (if using Knowledge Base):**
   - Go to `/dashboard/knowledge`
   - Upload a document
   - Wait for indexing
   - Ask a question
   - Should return answer with citations

3. **Check Provider Info:**
   - Generation response includes: `provider`, `model`, `contextWindow`

---

## 💰 Cost Estimate (Free Tier)

| Service | Free Tier | Expected Usage |
|---------|-----------|----------------|
| Vercel | Unlimited hobby | ✅ Free |
| Supabase | 500MB + 2M requests | ✅ Free |
| Gemini | 60 req/min | ✅ Free |
| **Total** | | **$0/month** |

---

## 🆘 Troubleshooting

### "No embedding provider available"
- Set `GEMINI_API_KEY` (required for RAG on Vercel)
- Or use OpenAI (paid) for embeddings

### "Database connection failed"
- Check `DATABASE_URL` format
- Ensure Supabase project is active
- Try connection pooling URL from Supabase

### "Rate limit exceeded"
- Gemini: 60 req/min - wait a minute
- Consider upgrading or using multiple providers

---

**Ready to deploy! 🚀**
