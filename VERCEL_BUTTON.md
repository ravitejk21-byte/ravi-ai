# One-Click Vercel Deploy Configuration

## 🚀 Deploy Button

Add this to your README.md (replace `YOUR_USERNAME` with your GitHub username):

```markdown
## 🚀 One-Click Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fravitejk21-byte%2Fravi-ai&env=DATABASE_URL,NEXTAUTH_SECRET,NEXTAUTH_URL,GEMINI_API_KEY,DEFAULT_LLM_PROVIDER&envDescription=API%20Keys%20and%20Database%20configuration%20for%20Ravi%20AI&envLink=https%3A%2F%2Fgithub.com%2Fravitejk21-byte%2Fravi-ai%2Fblob%2Fmain%2FENV_REFERENCE.md&project-name=ravi-ai&repository-name=ravi-ai)

### Prerequisites
- [Vercel](https://vercel.com/signup) account (free)
- [Supabase](https://supabase.com) account (free)
- [Google AI Studio](https://makersuite.google.com/app/apikey) account (free)

### Quick Deploy (3 Steps)

**Step 1: Setup Supabase (2 minutes)**
1. Create project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and run:
   \`\`\`sql
   CREATE EXTENSION IF NOT EXISTS vector;
   \`\`\`
3. Go to **Settings > Database > Connection String**
4. Copy the **URI** format string

**Step 2: Get Gemini API Key (1 minute)**
1. Go to [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key

**Step 3: Click Deploy**
Click the button above ☝️ and enter:

| Variable | Value | Get From |
|----------|-------|----------|
| \`DATABASE_URL\` | Supabase connection string | Supabase > Settings > Database |
| \`NEXTAUTH_SECRET\` | Random string | Generate: \`openssl rand -base64 32\` |
| \`NEXTAUTH_URL\` | Your Vercel URL | Will be shown after deploy |
| \`GEMINI_API_KEY\` | Your Gemini key | Google AI Studio |
| \`DEFAULT_LLM_PROVIDER\` | \`gemini\` | - |

[Full Deployment Guide](./VERCEL_DEPLOY.md)
```

## 📋 Environment Variables Template

Create `.env.production`:

```bash
# Database (Supabase)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="your-random-secret-min-32-chars"

# AI Provider (Gemini REQUIRED for RAG on Vercel)
GEMINI_API_KEY="your-gemini-api-key"
DEFAULT_LLM_PROVIDER="gemini"
```

## 📊 Variable Reference

| Variable | Required | Default | Source |
|----------|----------|---------|--------|
| `DATABASE_URL` | ✅ Yes | - | Supabase |
| `NEXTAUTH_SECRET` | ✅ Yes | - | Generate |
| `NEXTAUTH_URL` | ✅ Yes | - | Vercel URL |
| `GEMINI_API_KEY` | ⭐⭐ Yes | - | Google AI Studio |
| `DEFAULT_LLM_PROVIDER` | ⭐⭐ Yes | `gemini` | - |
| `GROQ_API_KEY` | 🆓 Optional | - | Groq Console |
| `COHERE_API_KEY` | 🆓 Optional | - | Cohere |
| `OPENAI_API_KEY` | 💰 Optional | - | OpenAI |

## 🎯 Recommended Configuration

### For Free Tier (Recommended):
```bash
GEMINI_API_KEY=your_key_here
DEFAULT_LLM_PROVIDER=gemini
```

### With Fallbacks:
```bash
# Primary
GEMINI_API_KEY=your_gemini_key
DEFAULT_LLM_PROVIDER=gemini

# Fallbacks
GROQ_API_KEY=your_groq_key
COHERE_API_KEY=your_cohere_key
```

## ⚠️ Important Notes

1. **Gemini is REQUIRED for RAG/Knowledge Base** on Vercel (only free provider with embeddings)
2. **Ollama does NOT work** on Vercel (local only)
3. **DATABASE_URL format** - Must be URI format from Supabase
4. **NEXTAUTH_URL** - Must match your actual Vercel domain
5. **Repo must be PUBLIC** for Vercel one-click deploy

## 💰 Cost Breakdown (Free Tier)

| Service | Free Tier | Limit |
|---------|-----------|-------|
| Vercel | Hobby | Unlimited |
| Supabase | Free | 500MB DB |
| Gemini | Free | 60 req/min |
| **Total** | | **$0/month** |
