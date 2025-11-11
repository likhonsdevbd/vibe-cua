#!/bin/bash

# Production Computer Use Agent Setup Script
# Built using Vercel AI SDK and Google Gemini patterns
# Author: MiniMax Agent
# Date: 2025-11-11

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Main setup function
main() {
    print_info "Setting up Production Computer Use Agent (Vercel AI SDK)..."
    echo
    print_info "This agent follows production best practices with enterprise-grade safety."
    echo

    # Check Node.js version
    if command_exists node; then
        NODE_VERSION=$(node --version)
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$NODE_MAJOR" -ge 18 ]; then
            print_success "Node.js found: $NODE_VERSION"
        else
            print_error "Node.js 18+ required. Current: $NODE_VERSION"
            echo "Please upgrade Node.js: https://nodejs.org/"
            exit 1
        fi
    else
        print_error "Node.js not found"
        echo "Please install Node.js 18+: https://nodejs.org/"
        exit 1
    fi

    # Check for API key
    if [ -z "$GOOGLE_API_KEY" ]; then
        print_warning "GOOGLE_API_KEY environment variable not set"
        echo "Please set your Gemini API key:"
        echo "  export GOOGLE_API_KEY=your_api_key_here"
        echo
        read -p "Enter your Google API key (or press Enter to skip): " api_key
        if [ ! -z "$api_key" ]; then
            export GOOGLE_API_KEY="$api_key"
            print_success "API key set for this session"
        else
            print_warning "You can set the API key later with: export GOOGLE_API_KEY=your_key"
        fi
        echo
    else
        print_success "GOOGLE_API_KEY is set"
    fi

    echo
    print_info "Installing dependencies..."

    # Install production dependencies
    if [ -f "package.json" ]; then
        npm install
        print_success "Dependencies installed"
    else
        print_error "package.json not found"
        exit 1
    fi

    # Install Playwright browsers
    print_info "Installing Playwright browsers..."
    npx playwright install chromium
    print_success "Playwright browsers installed"

    # Build the project
    print_info "Building TypeScript project..."
    npm run build
    print_success "Project built successfully"

    # Create environment file
    print_info "Creating environment configuration..."
    cat > .env << 'EOF'
# Production Computer Use Agent Configuration
# Generated on: 2025-11-11

# Required: Google API Key
GOOGLE_API_KEY=your_gemini_api_key_here

# Agent Configuration
HEADLESS=false
SAFETY_STRICT=true
ENABLE_LOGGING=true
REQUIRE_CONFIRMATION=true
MAX_STEPS=20
TIMEOUT_MS=30000
MAX_RETRIES=3

# Safety Configuration (Comma-separated)
ALLOWED_DOMAINS=*.google.com,*.github.com,*.stackoverflow.com,*.vercel.com,*.ai-sdk.dev

# Development Options
NODE_ENV=development
EOF

    print_success "Environment file created: .env"

    # Create examples directory if it doesn't exist
    if [ ! -d "examples" ]; then
        mkdir -p examples
        print_success "Examples directory created"
    fi

    # Create test configuration
    print_info "Creating test configuration..."
    cat > jest.config.js << 'EOF'
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};
EOF

    print_success "Test configuration created"

    # Create ESLint configuration
    print_info "Creating linting configuration..."
    cat > .eslintrc.js << 'EOF'
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  env: {
    node: true,
    jest: true,
  },
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
  ignorePatterns: ['dist/', 'node_modules/'],
};
EOF

    print_success "Linting configuration created"

    # Create Prettier configuration
    print_info "Creating code formatting configuration..."
    cat > .prettierrc << 'EOF'
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
EOF

    print_success "Code formatting configuration created"

    # Run type checking
    print_info "Running type check..."
    npm run type-check
    print_success "Type check passed"

    # Run linting
    print_info "Running linting..."
    npm run lint || print_warning "Linting issues found (non-blocking)"
    
    # Create deployment documentation
    print_info "Creating deployment guide..."
    cat > DEPLOYMENT.md << 'EOF'
# Production Deployment Guide

## Environment Variables

Set these environment variables in your production environment:

```bash
# Required
GOOGLE_API_KEY=your_production_api_key

# Recommended
HEADLESS=true                    # Use headless browser
SAFETY_STRICT=true               # Enable strict safety
ENABLE_LOGGING=true              # Enable logging
REQUIRE_CONFIRMATION=true        # Require user confirmation
MAX_STEPS=15                     # Limit steps for production
TIMEOUT_MS=20000                 # Shorter timeout
MAX_RETRIES=2                    # Limited retries
NODE_ENV=production              # Production mode
```

## Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build
RUN npx playwright install-deps
RUN npx playwright install chromium

EXPOSE 3000
USER node

CMD ["node", "dist/production_agent.js"]
```

## Security Best Practices

1. **API Key Management**: Use secret management services
2. **Network Security**: Restrict outbound connections
3. **Resource Limits**: Set CPU/memory limits
4. **Monitoring**: Enable comprehensive logging
5. **Updates**: Regularly update dependencies
EOF

    print_success "Deployment guide created: DEPLOYMENT.md"

    echo
    print_info "Setup Summary:"
    echo "✅ Node.js $(node --version) installed"
    echo "✅ Dependencies installed with Vercel AI SDK"
    echo "✅ TypeScript project built"
    echo "✅ Playwright browsers ready"
    echo "✅ Environment configuration created"
    echo "✅ Code quality tools configured"
    echo "✅ Deployment guide created"
    echo

    print_success "Production Computer Use Agent setup completed!"
    echo
    print_info "Next Steps:"
    echo "1. Set your API key: export GOOGLE_API_KEY=your_key"
    echo "2. Test the agent: npm run example:web-research"
    echo "3. Run type checking: npm run type-check"
    echo "4. Test the build: npm run build"
    echo "5. Review deployment guide: cat DEPLOYMENT.md"
    echo

    print_info "Available Commands:"
    echo "• npm run build          - Build the TypeScript project"
    echo "• npm run dev            - Run in development mode"
    echo "• npm run type-check     - Check TypeScript types"
    echo "• npm run lint           - Run ESLint"
    echo "• npm run test           - Run tests"
    echo "• npm run example:*      - Run example scripts"
    echo

    print_info "Documentation:"
    echo "• README.md              - Main documentation"
    echo "• DEPLOYMENT.md          - Deployment guide"
    echo "• examples/              - Usage examples"
    echo

    print_warning "Production Recommendations:"
    echo "• Use headless mode (HEADLESS=true)"
    echo "• Enable strict safety (SAFETY_STRICT=true)"
    echo "• Set appropriate timeouts"
    echo "• Monitor execution logs"
    echo "• Use environment-based configuration"
    echo

    print_success "🎉 Your production computer use agent is ready!"
}

# Run main function
main "$@"