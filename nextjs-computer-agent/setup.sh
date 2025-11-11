#!/bin/bash

# AI Computer Use Agent - Setup Script
# This script sets up the complete Next.js application

set -e

echo "🤖 AI Computer Use Agent - Web Application Setup"
echo "================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18.17.0 or later."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | sed 's/v//')
REQUIRED_VERSION="18.17.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
    echo "✅ Node.js version $NODE_VERSION is compatible"
else
    echo "❌ Node.js version $NODE_VERSION is not compatible. Please upgrade to 18.17.0 or later."
    exit 1
fi

# Check if Google AI API key is set
if [ -z "$GOOGLE_GENERATIVE_AI_API_KEY" ]; then
    echo "⚠️  GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set."
    echo "   You can:"
    echo "   1. Set it in your shell: export GOOGLE_GENERATIVE_AI_API_KEY=your_key"
    echo "   2. Add it to .env.local file"
    echo "   3. Get an API key from: https://makersuite.google.com/app/apikey"
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🎭 Installing Playwright browsers..."
npx playwright install

echo ""
echo "🔍 Running type check..."
npm run type-check

echo ""
echo "🧹 Running lint check..."
npm run lint || echo "⚠️  Lint issues found, but continuing..."

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 To start the development server:"
echo "   npm run dev"
echo ""
echo "🌐 The application will be available at:"
echo "   http://localhost:3000"
echo ""
echo "📚 API Documentation:"
echo "   Health check: GET /api/agent?action=health"
echo "   Chat: POST /api/agent with {\"action\": \"chat\", \"message\": \"Hello\"}"
echo ""
echo "🛠️  Configuration:"
echo "   - Edit .env.local for environment variables"
echo "   - API key required: https://makersuite.google.com/app/apikey"
echo ""
echo "📖 For more information, see README.md"