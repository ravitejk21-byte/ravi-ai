# Ravi AI - Complete Vercel Deployment Package

## 📦 What's Included

This package contains everything needed for one-click Vercel deployment.

### Files Overview

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Database schema with pgvector (768 dims for Gemini) |
| `supabase-setup.sql` | SQL script to setup Supabase |
| `VERCEL_BUTTON.md` | Deploy button configuration & README text |
| `app/api/health/route.ts` | Health check endpoint with dimension check |
| `VERIFICATION.md` | Post-deploy verification + troubleshooting |
| `ENV_REFERENCE.md` | Environment variables reference |
| `DEPLOY_PACKAGE.md` | This file - complete deployment guide |

---

## 🚀 Quick Deploy Checklist

### 1. Prepare Repository
```bash
# Ensure these files are committed:
git add prisma/schema.prisma supabase-setup.sql
git add app/api/health/route.ts
git add VERCEL_BUTTON.md VERIFICATION.md DEPLOY_PACKAGE.md ENV_REFERENCE.md
git commit -m "Add Vercel one-click deployment"
git push origin main
```

### 2. Update README.md
Add this section to your README (replace `YOUR_USERNAME`):

```markdown
## 🚀 One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FYOUR_USERNAME%2Fravi-ai)

### Prerequisites
- [Vercel](https://vercel.com/signup) account (free)
- [Supabase](https://supabase.com) account (free)
- [Google AI Studio](https://makersuite.google.com/app/apikey) account (free)

### Deploy in 3 Steps

**Step 1: Setup Supabase**
1. Create project at [supabase.com](https://supabase.com)
2. Run in SQL Editor: `CREATE EXTENSION IF NOT EXISTS vector;`
3. Copy connection string from Settings > Database

**Step 2: Get Gemini API Key**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create free API key

**Step 3: Click Deploy**
Click the button above ☝️ and enter your environment variables.

[Full Deployment Guide](./VERCEL_BUTTON.md)
```

### 3. Required Environment Variables

| Variable | Required | Source |
|----------|----------|--------|
| `DATABASE_URL` | ✅ Yes | Supabase > Settings > Database > URI |
| `NEXTAUTH_SECRET` | ✅ Yes | Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | ✅ Yes | Your Vercel URL |
| `GEMINI_API_KEY` | ⭐⭐ Yes | [Google AI Studio](https://makersuite.google.com/app/apikey) |
| `DEFAULT_LLM_PROVIDER` | ⭐⭐ Yes | Set to `gemini` |

### 4. Post-Deploy Steps

```bash
# 1. Run migrations
export DATABASE_URL="your_supabase_url"
npx prisma migrate deploy

# 2. Verify deployment
curl https://your-app.vercel.app/api/health

# 3. Run verification tests
# See VERIFICATION.md for detailed steps
```

---

## 🔧 Technical Specifications

### Database Schema
- **Provider:** PostgreSQL with pgvector
- **Embedding Dimensions:** 768 (Gemini embedding-001)
- **Vector Index:** ivfflat with cosine similarity
- **Index Params:** lists=100 (for <100k vectors)

### AI Provider Configuration
- **Primary:** Google Gemini (free tier, includes embeddings)
- **Fallbacks:** Groq, Cohere, Together AI, OpenAI
- **Context Windows:** Enforced in code
- **Rate Limits:** Handled with user-friendly errors

### Node.js Version
- **Required:** Node 20.x (specified in package.json engines)
- **Build:** `prisma generate && next build`

### File Storage
- **Vercel:** Ephemeral filesystem (not used for persistence)
- **Documents:** Stored in database (content field)
- **Embeddings:** Stored in pgvector (DocumentChunk table)

### Authentication
- **Provider:** NextAuth.js
- **Method:** Credentials (email/password)
- **Session:** JWT-based
- **Demo Mode:** Set `NEXTAUTH_SECRET=demo` for testing (not recommended for production)

---

## 💰 Cost Breakdown (Free Tier)

| Service | Free Tier | Limit |
|---------|-----------|-------|
| Vercel | Hobby | Unlimited |
| Supabase | Free | 500MB DB |
| Gemini | Free | 60 req/min |
| **Total** | | **$0/month** |

---

## 🆘 Support

### Common Issues

| Issue | Solution |
|-------|----------|
| Prisma migrate fails | Check DATABASE_URL format, ensure Supabase is active |
| pgvector missing | Run `CREATE EXTENSION IF NOT EXISTS vector;` |
| Dimension mismatch | Verify using Gemini (768) or update schema for OpenAI (1536) |
| RAG returns empty | Check embeddings exist, verify GEMINI_API_KEY |
| Build fails | Ensure `postinstall: prisma generate` in package.json |

### Resources
- **Deployment Issues:** See [VERCEL_BUTTON.md](./VERCEL_BUTTON.md)
- **Verification Steps:** See [VERIFICATION.md](./VERIFICATION.md)
- **Provider Setup:** See [FREE_SETUP.md](./FREE_SETUP.md)
- **Env Variables:** See [ENV_REFERENCE.md](./ENV_REFERENCE.md)

---

## ✅ Pre-Deployment Checklist

- [ ] Repository is PUBLIC on GitHub
- [ ] All files committed (prisma/, supabase-setup.sql, docs/)
- [ ] README.md updated with deploy button
- [ ] package.json has Node 20.x engine
- [ ] package.json has postinstall script
- [ ] vercel.json has correct buildCommand
- [ ] Supabase project created
- [ ] pgvector extension enabled
- [ ] Gemini API key obtained

---

**Ready to deploy! 🚀**

Click the Vercel button in your README or run:
```bash
vercel --prod
```
