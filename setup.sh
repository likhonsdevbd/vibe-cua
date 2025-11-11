#!/bin/bash

# Computer Use Agent Setup Script
# This script sets up the Gemini 2.5 Computer Use Agent environment
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
    print_info "Setting up Gemini 2.5 Computer Use Agent..."
    echo
    
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
    
    # Check for required commands
    print_info "Checking system requirements..."
    
    # Check for Node.js (optional)
    if command_exists node; then
        node_version=$(node --version)
        print_success "Node.js found: $node_version"
        NODE_AVAILABLE=true
    else
        print_warning "Node.js not found - TypeScript version won't work"
        NODE_AVAILABLE=false
    fi
    
    # Check for Python (optional)
    if command_exists python3; then
        python_version=$(python3 --version)
        print_success "Python 3 found: $python_version"
        PYTHON_AVAILABLE=true
    else
        print_warning "Python 3 not found - Python version won't work"
        PYTHON_AVAILABLE=false
    fi
    
    # Check for pip
    if command_exists pip3; then
        print_success "pip3 found"
        PIP_AVAILABLE=true
    elif command_exists pip; then
        print_success "pip found"
        PIP_AVAILABLE=true
    else
        print_error "pip not found - required for Python dependencies"
        PIP_AVAILABLE=false
    fi
    
    # Check for npm (optional)
    if command_exists npm; then
        npm_version=$(npm --version)
        print_success "npm found: $npm_version"
        NPM_AVAILABLE=true
    else
        print_warning "npm not found - TypeScript dependencies won't be installed"
        NPM_AVAILABLE=false
    fi
    
    echo
    print_info "Setting up available implementations..."
    
    # Setup Python version
    if [ "$PYTHON_AVAILABLE" = true ] && [ "$PIP_AVAILABLE" = true ]; then
        print_info "Setting up Python version..."
        
        # Create virtual environment (optional)
        if [ -d "venv" ]; then
            print_info "Virtual environment already exists"
        else
            read -p "Create Python virtual environment? (y/N): " create_venv
            if [[ $create_venv =~ ^[Yy]$ ]]; then
                python3 -m venv venv
                source venv/bin/activate
                print_success "Virtual environment created and activated"
            fi
        fi
        
        # Install Python dependencies
        print_info "Installing Python dependencies..."
        if [ -f "requirements.txt" ]; then
            pip3 install -r requirements.txt
            print_success "Python dependencies installed"
        else
            pip3 install google-generativeai playwright
            print_success "Core Python dependencies installed"
        fi
        
        # Install Playwright browsers
        print_info "Installing Playwright browsers..."
        playwright install chromium
        print_success "Playwright browsers installed"
        
    else
        print_warning "Skipping Python setup (Python or pip not available)"
    fi
    
    # Setup TypeScript version
    if [ "$NODE_AVAILABLE" = true ] && [ "$NPM_AVAILABLE" = true ]; then
        print_info "Setting up TypeScript version..."
        
        # Install TypeScript dependencies
        if [ -f "package.json" ]; then
            npm install
            print_success "TypeScript dependencies installed"
        else
            print_warning "package.json not found - skipping npm install"
        fi
        
        # Install Playwright browsers
        if [ -d "node_modules" ]; then
            npx playwright install chromium
            print_success "Playwright browsers installed for TypeScript"
        else
            print_warning "Node modules not found - please run 'npm install' first"
        fi
        
    else
        print_warning "Skipping TypeScript setup (Node.js or npm not available)"
    fi
    
    echo
    print_info "Creating example configuration..."
    
    # Create example config file
    cat > agent_config.json << 'EOF'
{
  "apiKey": "your_gemini_api_key_here",
  "modelName": "gemini-2.5-computer-use-preview-10-2025",
  "screenWidth": 1440,
  "screenHeight": 900,
  "maxTurns": 20,
  "headless": false,
  "timeout": 30000,
  "safetyStrict": true,
  "allowedDomains": [
    "*.google.com",
    "*.github.com",
    "*.stackoverflow.com"
  ],
  "blockedActions": [],
  "maxExecutionTime": 300
}
EOF
    
    print_success "Example configuration created: agent_config.json"
    
    # Create environment file template
    cat > .env.example << 'EOF'
# Gemini API Configuration
GOOGLE_API_KEY=your_gemini_api_key_here

# Optional: Custom base URL (for enterprise deployments)
# GEMINI_BASE_URL=https://your-custom-endpoint.com

# Browser Configuration
HEADLESS=false
SCREEN_WIDTH=1440
SCREEN_HEIGHT=900
MAX_TURNS=20
TIMEOUT=30000

# Safety Settings
SAFETY_STRICT=true
ENABLE_SAFETY_CONFIRMATION=true
EOF
    
    print_success "Environment template created: .env.example"
    
    # Create examples directory
    mkdir -p examples
    
    # Create example usage files
    cat > examples/basic_example.py << 'EOF'
import asyncio
import os
from computer_use_agent import ComputerUseAgent, AgentConfig

async def main():
    # Configure the agent
    config = AgentConfig(
        api_key=os.getenv("GOOGLE_API_KEY"),
        headless=False,
        max_turns=10,
        safety_strict=True
    )
    
    # Create and run the agent
    async with ComputerUseAgent(config) as agent:
        # Example task: Search for information
        user_prompt = """
        Go to google.com, search for "artificial intelligence 2025", 
        click on the first result, and summarize what you find.
        """
        
        results = await agent.run_agent_loop(
            user_prompt=user_prompt,
            initial_url="https://google.com",
            safety_confirmation=True
        )
        
        print(f"Task completed: {results['success']}")
        print(f"Final response: {results.get('final_response', 'N/A')}")

if __name__ == "__main__":
    asyncio.run(main())
EOF
    
    cat > examples/basic_example.ts << 'EOF'
import { ComputerUseAgent } from '../computer_use_agent';

async function main() {
  // Configuration
  const config = {
    headless: false,
    maxTurns: 10,
    safetyStrict: true
  };

  try {
    // Create and run the agent
    const agent = new ComputerUseAgent(config);
    await agent.start();

    // Example task
    const userPrompt = `
      Go to google.com, search for "artificial intelligence 2025", 
      click on the first result, and summarize what you find.
    `;

    const results = await agent.runAgentLoop(
      userPrompt,
      'https://google.com',
      true
    );

    console.log('Task completed:', results.success);
    console.log('Final response:', results.finalResponse);

    await agent.stop();
  } catch (error) {
    console.error('Error:', error);
  }
}

main().catch(console.error);
EOF
    
    print_success "Example usage files created in examples/ directory"
    
    echo
    print_info "Setup complete! Next steps:"
    echo
    echo "1. Set your API key:"
    echo "   export GOOGLE_API_KEY=your_api_key_here"
    echo
    echo "2. Run a Python example:"
    echo "   python3 examples/basic_example.py"
    echo
    echo "3. Or run a TypeScript example:"
    echo "   npm run dev examples/basic_example.ts"
    echo
    echo "4. Test the agent manually:"
    echo "   python3 computer_use_agent.py"
    echo
    echo "For more information, see the README.md file"
    echo
    
    print_success "Computer Use Agent setup completed!"
}

# Run main function
main "$@"