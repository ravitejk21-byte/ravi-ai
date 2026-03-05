# Environment Variables Reference

## ✅ Required for Vercel Deployment

These variables MUST be set for the app to work:

```bash
# Database (Supabase PostgreSQL with pgvector)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# NextAuth Configuration
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="your-random-secret-min-32-chars"

# AI Provider (Gemini REQUIRED for RAG on Vercel)
GEMINI_API_KEY="your-gemini-api-key"
DEFAULT_LLM_PROVIDER="gemini"
```

## 🆓 Optional Free Providers

Set these for fallback options:

```bash
# Groq - 1M tokens/day free (fast, no embeddings)
GROQ_API_KEY="gsk_your_groq_key"

# Cohere - 100 calls/month free
COHERE_API_KEY="your_cohere_key"

# Together AI - $5 free credit
TOGETHER_API_KEY="your_together_key"
```

## 💰 Optional Paid Provider

```bash
# OpenAI - Most powerful (paid)
OPENAI_API_KEY="sk-your_openai_key"
```

## 🏠 Local Development Only

These DON'T work on Vercel:

```bash
# Ollama - Local LLM (not for serverless)
OLLAMA_HOST="http://localhost:11434"
```

---

## 🔑 How to Get Each Key

### 1. Supabase Database URL
1. Go to https://supabase.com
2. Create new project
3. Wait for database to be ready
4. Go to **Settings > Database > Connection String**
5. Select **URI** format
6. Copy the string (includes password)

### 2. NextAuth Secret
Generate a random string:
```bash
openssl rand -base64 32
```
Or use any random string (min 32 characters)

### 3. Gemini API Key
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with Google
3. Click "Create API Key"
4. Copy the key (starts with `AIza`)

### 4. Groq API Key (Optional)
1. Go to https://console.groq.com
2. Sign up with email
3. Create API key
4. Copy the key (starts with `gsk_`)

---

## 🎯 Recommended Configurations

### Minimal (Free):
```bash
DATABASE_URL="your_supabase_url"
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="your_secret"
GEMINI_API_KEY="your_gemini_key"
DEFAULT_LLM_PROVIDER="gemini"
```

### With Fallbacks:
```bash
# Primary
GEMINI_API_KEY="your_gemini_key"
DEFAULT_LLM_PROVIDER="gemini"

# Fallbacks
GROQ_API_KEY="your_groq_key"
COHERE_API_KEY="your_cohere_key"
```

### Production (Paid):
```bash
# Use OpenAI for best quality
OPENAI_API_KEY="sk-your_key"
DEFAULT_LLM_PROVIDER="openai"

# Keep Gemini for free embeddings
GEMINI_API_KEY="your_gemini_key"
```

---

## ⚠️ Important Notes

1. **Never commit `.env` files** - Use Vercel dashboard for env vars
2. **Gemini is REQUIRED for RAG** - Only free provider with embeddings
3. **DATABASE_URL format** - Must be URI format from Supabase
4. **NEXTAUTH_URL** - Must match your actual Vercel domain

---

## 🔒 Security Best Practices

- Rotate `NEXTAUTH_SECRET` periodically
- Use separate API keys for dev/prod
- Monitor API usage in provider dashboards
- Enable RLS in Supabase for production
