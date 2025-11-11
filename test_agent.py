#!/usr/bin/env python3
"""
Test script for the Computer Use Agent
This script verifies that all components are properly installed and configured.
Author: MiniMax Agent
"""

import asyncio
import os
import sys
import json
from pathlib import Path

# Check if we're in the right environment
def check_dependencies():
    """Check if all required dependencies are available."""
    print("🔍 Checking dependencies...")
    
    # Check Python version
    python_version = sys.version_info
    if python_version.major < 3 or (python_version.major == 3 and python_version.minor < 8):
        print("❌ Python 3.8+ required")
        return False
    print(f"✅ Python {python_version.major}.{python_version.minor}.{python_version.micro}")
    
    # Check if required packages can be imported
    try:
        import google.generativeai
        print("✅ google-generativeai")
    except ImportError:
        print("❌ google-generativeai not installed")
        return False
    
    try:
        from playwright.async_api import async_playwright
        print("✅ playwright")
    except ImportError:
        print("❌ playwright not installed")
        return False
    
    return True

def check_api_key():
    """Check if API key is configured."""
    print("\n🔑 Checking API configuration...")
    
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("❌ GOOGLE_API_KEY not set")
        print("   Set it with: export GOOGLE_API_KEY=your_key_here")
        return False
    
    if len(api_key) < 20:
        print("❌ API key appears to be too short")
        return False
    
    print("✅ Google API key found")
    return True

async def test_browser():
    """Test browser initialization."""
    print("\n🌐 Testing browser initialization...")
    
    try:
        from playwright.async_api import async_playwright
        
        playwright = await async_playwright().start()
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()
        
        # Test basic navigation
        await page.goto("https://www.google.com")
        title = await page.title()
        
        await browser.close()
        await playwright.stop()
        
        print(f"✅ Browser test successful - Title: {title}")
        return True
        
    except Exception as e:
        print(f"❌ Browser test failed: {e}")
        return False

async def test_agent_initialization():
    """Test agent initialization."""
    print("\n🤖 Testing agent initialization...")
    
    try:
        from computer_use_agent import ComputerUseAgent, AgentConfig
        
        config = AgentConfig(
            headless=True,
            max_turns=1,
            api_key=os.getenv("GOOGLE_API_KEY")
        )
        
        agent = ComputerUseAgent(config)
        await agent.start()
        await agent.stop()
        
        print("✅ Agent initialization successful")
        return True
        
    except Exception as e:
        print(f"❌ Agent initialization failed: {e}")
        return False

async def test_mini_task():
    """Test the agent with a minimal task."""
    print("\n🧪 Testing agent with minimal task...")
    
    try:
        from computer_use_agent import ComputerUseAgent, AgentConfig
        
        config = AgentConfig(
            headless=True,
            max_turns=2,
            api_key=os.getenv("GOOGLE_API_KEY")
        )
        
        async with ComputerUseAgent(config) as agent:
            # Simple navigation test
            results = await agent.run_agent_loop(
                user_prompt="Go to google.com and tell me the page title",
                initial_url="https://google.com",
                safety_confirmation=False
            )
            
            if results['success']:
                print("✅ Mini task completed successfully")
                print(f"   Response: {results.get('final_response', 'N/A')}")
                return True
            else:
                print("❌ Mini task failed")
                return False
                
    except Exception as e:
        print(f"❌ Mini task failed: {e}")
        return False

def check_file_structure():
    """Check if all required files are present."""
    print("\n📁 Checking file structure...")
    
    required_files = [
        "computer_use_agent.py",
        "computer_use_agent.ts",
        "package.json",
        "requirements.txt",
        "setup.sh",
        "README.md"
    ]
    
    all_present = True
    for file in required_files:
        if Path(file).exists():
            print(f"✅ {file}")
        else:
            print(f"❌ {file} missing")
            all_present = False
    
    return all_present

def print_configuration_help():
    """Print helpful configuration information."""
    print("\n📋 Configuration Help:")
    print("\n1. Get your API key:")
    print("   - Visit: https://aistudio.google.com/app/apikey")
    print("   - Create a new API key")
    print("   - Copy the key")
    print("\n2. Set environment variable:")
    print("   export GOOGLE_API_KEY=your_api_key_here")
    print("\n3. Alternative: Create .env file:")
    print("   echo 'GOOGLE_API_KEY=your_key_here' > .env")
    print("   source .env")
    print("\n4. Test your setup:")
    print("   python3 test_agent.py")

def main():
    """Run all tests."""
    print("🧪 Computer Use Agent Test Suite")
    print("=" * 50)
    
    all_tests_passed = True
    
    # File structure check
    if not check_file_structure():
        all_tests_passed = False
    
    # Dependency check
    if not check_dependencies():
        all_tests_passed = False
    
    # API key check
    if not check_api_key():
        all_tests_passed = False
        print_configuration_help()
        return
    
    # Browser test
    if not asyncio.run(test_browser()):
        all_tests_passed = False
    
    # Agent initialization test
    if not asyncio.run(test_agent_initialization()):
        all_tests_passed = False
    
    # Mini task test
    if not asyncio.run(test_mini_task()):
        all_tests_passed = False
    
    print("\n" + "=" * 50)
    if all_tests_passed:
        print("🎉 All tests passed! Your agent is ready to use.")
        print("\nNext steps:")
        print("1. Review the README.md for detailed usage")
        print("2. Check the examples/ directory for sample tasks")
        print("3. Start with a simple task to get familiar")
    else:
        print("❌ Some tests failed. Please check the errors above.")
        print("\nTroubleshooting:")
        print("1. Run the setup script: ./setup.sh")
        print("2. Install dependencies manually: pip install -r requirements.txt")
        print("3. Install Playwright browsers: playwright install chromium")
        print("4. Ensure your API key is correctly set")
    
    print("\nFor help, see the README.md file or run: python3 -c 'import computer_use_agent; help(computer_use_agent)'")

if __name__ == "__main__":
    main()