# Free LLM Setup Guide for Ravi AI

This guide explains how to run Ravi AI using **completely free** Large Language Models (LLMs).

---

## 🆓 Free LLM Options (Pick One or More)

### Option 1: Groq ⭐ (RECOMMENDED - Fastest)
**Best for:** Quick setup, no local installation, blazing fast inference

**Free Tier:**
- 1,000,000 tokens per day
- Models: Llama 3 70B, Llama 3 8B, Mixtral 8x7B, Gemma
- Speed: 800+ tokens/second (fastest available)

**Setup:**
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up with email (instant, no credit card)
3. Create API key
4. Add to `.env`:
   ```
   GROQ_API_KEY=gsk_your_key_here
   DEFAULT_LLM_PROVIDER=groq
   ```

---

### Option 2: Google Gemini 🌐 (Best for Embeddings)
**Best for:** Free embeddings included, good for RAG/knowledge base

**Free Tier:**
- 60 requests per minute
- Models: Gemini 1.5 Flash, Gemini 1.5 Pro
- Includes: Free text embeddings for RAG

**Setup:**
1. Go to [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Create API key
4. Add to `.env`:
   ```
   GEMINI_API_KEY=your_key_here
   DEFAULT_LLM_PROVIDER=gemini
   ```

**Pros:**
- ✅ Free embeddings (saves OpenAI costs)
- ✅ 1M token context window
- ✅ Multilingual support

---

### Option 3: Cohere 💬 (Best for Enterprise)
**Best for:** High-quality command models, good for structured outputs

**Free Tier:**
- 100 API calls per month
- Models: Command R, Command R+
- Good for: Long-form content, reasoning tasks

**Setup:**
1. Go to [cohere.com](https://cohere.com)
2. Sign up for trial (no credit card)
3. Get Trial API key from dashboard
4. Add to `.env`:
   ```
   COHERE_API_KEY=your_key_here
   DEFAULT_LLM_PROVIDER=cohere
   ```

---

### Option 4: Ollama 🖥️ (COMPLETELY FREE - Local)
**Best for:** Privacy, no internet needed, unlimited usage

**Cost:** $0 forever - runs entirely on your computer

**Requirements:**
- 8GB RAM minimum (16GB+ recommended)
- ~5GB disk space per model

**Setup:**

**Step 1: Install Ollama**
```bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows: Download from https://ollama.com/download
```

**Step 2: Pull a Model**
```bash
# Recommended: Llama 3 (best quality/speed balance)
ollama pull llama3

# Alternative: Smaller/faster model
ollama pull llama3:8b

# For embeddings (needed for RAG)
ollama pull nomic-embed-text
```

**Step 3: Start Ollama Server**
```bash
ollama serve
```

**Step 4: Configure Ravi AI**
Add to `.env`:
```
OLLAMA_HOST=http://localhost:11434
DEFAULT_LLM_PROVIDER=ollama
```

---

### Option 5: Together AI 🚀 (Most Models)
**Best for:** Access to 100+ open source models

**Free Tier:**
- $5 credit on signup (~2 million tokens)
- 100+ models available

**Setup:**
1. Go to [api.together.xyz](https://api.together.xyz)
2. Sign up with email
3. Get API key from dashboard
4. Add to `.env`:
   ```
   TOGETHER_API_KEY=your_key_here
   DEFAULT_LLM_PROVIDER=together
   ```

---

## 📊 Free Tier Comparison

| Provider | Free Amount | Models | Speed | Embeddings | Setup |
|----------|-------------|--------|-------|------------|-------|
| **Groq** | 1M tokens/day | Llama 3, Mixtral | ⚡⚡⚡⚡⚡ | ❌ | ⭐ Easy |
| **Gemini** | 60 req/min | Gemini Flash/Pro | ⚡⚡⚡⚡ | ✅ Free | ⭐ Easy |
| **Cohere** | 100 calls/month | Command R/R+ | ⚡⚡⚡ | ❌ | ⭐ Easy |
| **Together** | $5 credit | 100+ models | ⚡⚡⚡ | ❌ | ⭐ Easy |
| **Ollama** | Unlimited | 100+ models | ⚡⚡⚡ | ✅ Free | ⭐⭐ Medium |
| **OpenAI** | None | GPT-4 | ⚡⚡⚡⚡ | ✅ Paid | ⭐ Easy |

---

## 🎯 Recommended Combinations

### For Most Users (Best Free Setup):
```env
# Use Gemini for everything (includes free embeddings)
GEMINI_API_KEY=your_gemini_key
DEFAULT_LLM_PROVIDER=gemini
```

### For Speed (Fastest Responses):
```env
# Use Groq for generation + Gemini for embeddings
GROQ_API_KEY=your_groq_key
GEMINI_API_KEY=your_gemini_key
DEFAULT_LLM_PROVIDER=groq
```

### For Privacy (100% Offline):
```env
# Use Ollama for everything
OLLAMA_HOST=http://localhost:11434
DEFAULT_LLM_PROVIDER=ollama
```

### For Heavy Usage (Maximum Free Tokens):
```env
# Set all free keys - app will auto-fallback if one hits limits
GROQ_API_KEY=your_groq_key
GEMINI_API_KEY=your_gemini_key
COHERE_API_KEY=your_cohere_key
DEFAULT_LLM_PROVIDER=groq
```

---

## 🚀 Quick Start Commands

### Fastest Setup (Groq - 30 seconds):
```bash
# 1. Get API key at console.groq.com

# 2. Configure
echo "GROQ_API_KEY=gsk_your_key" >> .env
echo "DEFAULT_LLM_PROVIDER=groq" >> .env

# 3. Run
npm run dev
```

### Best Free Setup (Gemini - includes embeddings):
```bash
# 1. Get API key at makersuite.google.com

# 2. Configure
echo "GEMINI_API_KEY=your_key" >> .env
echo "DEFAULT_LLM_PROVIDER=gemini" >> .env

# 3. Run
npm run dev
```

### Local Setup (Ollama - 100% free):
```bash
# 1. Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# 2. Download models
ollama pull llama3
ollama pull nomic-embed-text

# 3. Start server
ollama serve

# 4. Configure (in another terminal)
echo "OLLAMA_HOST=http://localhost:11434" >> .env
echo "DEFAULT_LLM_PROVIDER=ollama" >> .env
npm run dev
```

---

## 💡 Pro Tips

1. **Start with Gemini** if you need embeddings (for Knowledge Base)
2. **Use Groq** for fastest response times on generation tasks
3. **Combine providers:** Groq for generation + Gemini for embeddings
4. **Ollama for development** - unlimited testing without API limits
5. **Set multiple keys** - app auto-fallbacks if one provider fails

---

## ❓ Troubleshooting

### "No LLM provider available"
Set at least one of:
- `GROQ_API_KEY`
- `GEMINI_API_KEY`
- `COHERE_API_KEY`
- `TOGETHER_API_KEY`
- Or use Ollama locally

### "No embedding provider available"
For free embeddings, either:
1. Set `GEMINI_API_KEY` (includes free embeddings)
2. Install Ollama: `ollama pull nomic-embed-text`

### Groq rate limit hit
- Free tier: 1M tokens/day
- If exceeded, wait 24 hours or switch to Gemini

### Gemini rate limit hit
- Free tier: 60 requests/minute
- Slow down requests or switch to Groq

### Ollama connection refused
- Make sure `ollama serve` is running
- Check `OLLAMA_HOST` matches your setup

---

## 📈 Upgrading from Free

If you outgrow free tiers:

| Provider | Paid Tier | Cost |
|----------|-----------|------|
| Groq | Pay-as-you-go | $0.70/million tokens |
| Gemini | Pay-as-you-go | $0.50/million tokens |
| OpenAI | GPT-4 | $30/million tokens |

---

**Questions?** Check the main README.md or open an issue.

**Enjoy your completely free AI consulting copilot! 🚀**
