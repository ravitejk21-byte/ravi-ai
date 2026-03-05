#!/bin/bash

# Ravi AI - API Demo Script
# This script demonstrates the new RAG, Search, and Research endpoints

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "=========================================="
echo "Ravi AI API Demo"
echo "Base URL: $BASE_URL"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "Warning: jq is not installed. JSON output will be raw."
    JQ_CMD="cat"
else
    JQ_CMD="jq"
fi

# ============================================
# 1. RAG Query with Hybrid Retrieval
# ============================================
echo -e "${BLUE}1. RAG Query (Hybrid Retrieval + Reranking)${NC}"
echo "------------------------------------------"

curl -s -X POST "$BASE_URL/api/rag" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the key risk factors for cybersecurity in 2024?",
    "useHybrid": true,
    "useReranking": true,
    "useWebSearch": false
  }' | $JQ_CMD

echo ""
echo ""

# ============================================
# 2. RAG Query with Web Search Fallback
# ============================================
echo -e "${BLUE}2. RAG Query with Web Search (Low Confidence Trigger)${NC}"
echo "------------------------------------------"

curl -s -X POST "$BASE_URL/api/rag" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the latest AI regulations announced today?",
    "useHybrid": true,
    "useReranking": true,
    "useWebSearch": true
  }' | $JQ_CMD

echo ""
echo ""

# ============================================
# 3. Direct Web Search
# ============================================
echo -e "${BLUE}3. Direct Web Search${NC}"
echo "------------------------------------------"

curl -s -X POST "$BASE_URL/api/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SEC cybersecurity disclosure rules 2024",
    "maxResults": 5
  }' | $JQ_CMD

echo ""
echo ""

# ============================================
# 4. Web Search with Store Results
# ============================================
echo -e "${BLUE}4. Web Search + Store as Documents${NC}"
echo "------------------------------------------"

curl -s -X POST "$BASE_URL/api/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Internal audit best practices 2024",
    "maxResults": 3,
    "storeResults": true
  }' | $JQ_CMD

echo ""
echo ""

# ============================================
# 5. Research Mode (Multi-step)
# ============================================
echo -e "${BLUE}5. Research Mode (Multi-step Pipeline)${NC}"
echo "------------------------------------------"

curl -s -X POST "$BASE_URL/api/research" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the emerging risks in AI governance and how should internal audit respond?",
    "depth": "standard",
    "maxSubQuestions": 5
  }' | $JQ_CMD

echo ""
echo ""

# ============================================
# 6. Research Mode (Deep Dive)
# ============================================
echo -e "${BLUE}6. Research Mode (Deep Dive)${NC}"
echo "------------------------------------------"

curl -s -X POST "$BASE_URL/api/research" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "ESG reporting requirements for public companies",
    "depth": "deep",
    "maxSubQuestions": 6
  }' | $JQ_CMD

echo ""
echo ""

# ============================================
# 7. RAG with Research Mode Toggle
# ============================================
echo -e "${BLUE}7. RAG with Research Mode Enabled${NC}"
echo "------------------------------------------"

curl -s -X POST "$BASE_URL/api/rag" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Compare COSO and COBIT frameworks for IT governance",
    "researchMode": true,
    "useHybrid": true,
    "useReranking": true,
    "useWebSearch": true
  }' | $JQ_CMD

echo ""
echo ""

echo -e "${GREEN}Demo complete!${NC}"
echo ""
echo "Environment variables used:"
echo "  - WEB_SEARCH_PROVIDER: ${WEB_SEARCH_PROVIDER:-brave}"
echo "  - RAG_SIMILARITY_THRESHOLD: ${RAG_SIMILARITY_THRESHOLD:-0.75}"
echo "  - DEFAULT_LLM_PROVIDER: ${DEFAULT_LLM_PROVIDER:-gemini}"
