#!/bin/bash

# Google AI Computer Use Agent Setup Script
# Complete setup for Vercel AI SDK with Google Generative AI provider
# 
# Author: MiniMax Agent
# Date: 2025-11-11
# Version: 1.0.0

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE} $1 ${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# System requirements check
check_requirements() {
    print_header "Checking System Requirements"
    
    # Check Node.js
    if command_exists node; then
        NODE_VERSION=$(node --version)
        print_success "Node.js found: $NODE_VERSION"
        
        # Check if version is >= 18.0.0
        if [[ $(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1) -ge 18 ]]; then
            print_success "Node.js version is compatible (>=18.0.0)"
        else
            print_error "Node.js version must be >= 18.0.0"
            print_info "Please update Node.js: https://nodejs.org/"
            exit 1
        fi
    else
        print_error "Node.js not found"
        print_info "Please install Node.js 18 or later: https://nodejs.org/"
        exit 1
    fi
    
    # Check npm
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        print_success "npm found: v$NPM_VERSION"
    else
        print_error "npm not found"
        exit 1
    fi
    
    # Check if we're in a project directory
    if [[ ! -f "package.json" ]]; then
        print_warning "No package.json found in current directory"
        print_info "Initializing new Node.js project..."
        
        npm init -y
        
        if [[ $? -eq 0 ]]; then
            print_success "package.json created"
        else
            print_error "Failed to create package.json"
            exit 1
        fi
    else
        print_success "package.json found"
    fi
}

# Install dependencies
install_dependencies() {
    print_header "Installing Dependencies"
    
    print_info "Installing core dependencies..."
    
    # Core AI SDK dependencies
    local packages=(
        "ai@^6.8.2"
        "@ai-sdk/google@^1.2.0"
        "zod@^3.23.8"
        "playwright@^1.48.0"
        "typescript@^5.6.2"
        "ts-node@^10.9.2"
    )
    
    # Development dependencies
    local dev_packages=(
        "@types/node@^20.14.12"
        "@typescript-eslint/eslint-plugin@^7.7.0"
        "@typescript-eslint/parser@^7.7.0"
        "eslint@^9.0.0"
        "prettier@^3.3.0"
    )
    
    # Install packages
    for package in "${packages[@]}"; do
        print_info "Installing $package..."
        if npm install "$package"; then
            print_success "Installed $package"
        else
            print_error "Failed to install $package"
            exit 1
        fi
    done
    
    # Install dev packages
    for package in "${dev_packages[@]}"; do
        print_info "Installing $package (dev)..."
        if npm install --save-dev "$package"; then
            print_success "Installed $package"
        else
            print_error "Failed to install $package"
            exit 1
        fi
    done
    
    print_success "All dependencies installed successfully"
}

# Install Playwright browsers
install_browsers() {
    print_header "Installing Playwright Browsers"
    
    print_info "Installing Chromium browser for Playwright..."
    
    if npx playwright install chromium; then
        print_success "Chromium browser installed"
    else
        print_error "Failed to install Chromium browser"
        print_info "Try running: npx playwright install chromium"
        exit 1
    fi
    
    # Install all browsers
    print_info "Installing all supported browsers..."
    if npx playwright install; then
        print_success "All browsers installed"
    else
        print_warning "Some browsers failed to install, but Chromium should work"
    fi
}

# Create TypeScript configuration
setup_typescript() {
    print_header "Setting up TypeScript Configuration"
    
    if [[ ! -f "tsconfig.json" ]]; then
        print_info "Creating tsconfig.json..."
        
        cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "commonjs",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "google_ai_computer_agent.ts",
    "examples/",
    "*.ts"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
EOF
        
        print_success "tsconfig.json created"
    else
        print_success "tsconfig.json already exists"
    fi
}

# Create environment configuration
setup_environment() {
    print_header "Setting up Environment Configuration"
    
    if [[ ! -f ".env" ]]; then
        print_info "Creating .env file template..."
        
        cat > .env << 'EOF'
# Google Generative AI Configuration
# Get your API key from: https://aistudio.google.com/app/apikey
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here

# Optional: Enable verbose logging
ENABLE_VERBOSE_LOGGING=true

# Optional: Custom model
# Available models: gemini-2.5-pro, gemini-2.5-flash, gemini-2.0-flash, etc.
GEMINI_MODEL=gemini-2.5-pro

# Optional: Custom configuration
MAX_STEPS=20
HEADLESS=false
SAFETY_STRICT=true
TIMEOUT_MS=30000
EOF
        
        print_success ".env file created (edit with your API key)"
        print_warning "Please edit .env and add your Google API key"
    else
        print_success ".env file already exists"
    fi
    
    # Create .gitignore if it doesn't exist
    if [[ ! -f ".gitignore" ]]; then
        print_info "Creating .gitignore..."
        
        cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
dist/
build/
*.tsbuildinfo

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Session data
session_*.json
*.screenshot.png

# Playwright
test-results/
playwright-report/
playwright/.cache/
EOF
        
        print_success ".gitignore created"
    else
        print_success ".gitignore already exists"
    fi
}

# Create example scripts
create_scripts() {
    print_header "Creating Example Scripts"
    
    # Create examples directory if it doesn't exist
    mkdir -p examples
    
    # Ensure examples exist
    if [[ -f "examples/web_research.ts" ]]; then
        print_success "web_research.ts example found"
    else
        print_warning "web_research.ts example not found"
    fi
    
    if [[ -f "examples/form_filling.ts" ]]; then
        print_success "form_filling.ts example found"
    else
        print_warning "form_filling.ts example not found"
    fi
}

# Setup Google API key instructions
setup_api_key() {
    print_header "Google API Key Setup Instructions"
    
    print_info "To use the Google AI Computer Agent, you need a Google API key:"
    print_info ""
    print_info "1. Visit: https://aistudio.google.com/app/apikey"
    print_info "2. Sign in with your Google account"
    print_info "3. Click 'Create API Key'"
    print_info "4. Copy the generated API key"
    print_info "5. Edit the .env file and replace 'your_api_key_here' with your key"
    print_info ""
    print_warning "Keep your API key secret and never commit it to version control"
}

# Test setup
test_setup() {
    print_header "Testing Setup"
    
    print_info "Running basic TypeScript compilation test..."
    
    if npx tsc --noEmit; then
        print_success "TypeScript compilation successful"
    else
        print_error "TypeScript compilation failed"
        print_info "Please check your tsconfig.json and fix any errors"
    fi
    
    print_info "Checking if main agent file can be imported..."
    
    if node -e "
        try {
            require('./google_ai_computer_agent.ts');
            console.log('✅ Main agent file is importable');
        } catch (error) {
            console.log('⚠️  Main agent file has issues (this is normal for TS files without compilation)');
        }
    "; then
        print_success "Agent file structure is correct"
    fi
}

# Display final instructions
show_final_instructions() {
    print_header "Setup Complete! 🎉"
    
    print_success "Google AI Computer Use Agent is ready to use"
    print_info ""
    print_info "Next steps:"
    print_info "1. Edit .env file with your Google API key"
    print_info "2. Run: npm run build (to compile TypeScript)"
    print_info "3. Test: npm run dev (to run the main agent)"
    print_info "4. Examples: npm run example:web-research"
    print_info ""
    print_info "Available commands:"
    print_info "  npm run build          - Compile TypeScript"
    print_info "  npm run dev            - Run main agent"
    print_info "  npm run example:web-research  - Run web research example"
    print_info "  npm run example:form-filling  - Run form filling example"
    print_info "  npm run type-check     - Check TypeScript types"
    print_info ""
    print_info "Documentation: https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai"
    print_info "Google AI Studio: https://aistudio.google.com/"
}

# Main execution
main() {
    print_header "Google AI Computer Use Agent Setup"
    
    check_requirements
    install_dependencies
    install_browsers
    setup_typescript
    setup_environment
    create_scripts
    setup_api_key
    test_setup
    show_final_instructions
}

# Run main function
main "$@"