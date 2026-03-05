#!/bin/bash

# Ravi AI - Setup Script

echo "🚀 Setting up Ravi AI..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Setup environment
echo "🔧 Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  Please edit .env and add your:"
    echo "   - DATABASE_URL (PostgreSQL connection string)"
    echo "   - OPENAI_API_KEY (from OpenAI dashboard)"
    echo "   - NEXTAUTH_SECRET (random string for security)"
fi

# Setup database
echo "🗄️  Setting up database..."
echo "⚠️  Make sure PostgreSQL is running and database is created"
echo "   Then run: npx prisma migrate dev --name init"
echo "   And: npx prisma generate"

echo ""
echo "📋 Next steps:"
echo "1. Edit .env with your configuration"
echo "2. Run: npx prisma migrate dev --name init"
echo "3. Run: npm run dev"
echo ""
echo "🌐 App will be available at: http://localhost:3000"
