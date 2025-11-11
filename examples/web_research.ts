/**
 * Web Research Example - Google AI Computer Use Agent
 * Demonstrates the Google AI computer use agent conducting web research
 * 
 * This example shows how to use the Google AI computer agent for automated 
 * information gathering with built-in safety measures and proper error handling
 * using Vercel AI SDK with Google Generative AI provider.
 * 
 * Author: MiniMax Agent
 * Provider: Google Generative AI via @ai-sdk/google
 */

import { GoogleAIComputerAgent } from '../google_ai_computer_agent';

async function main() {
  console.log('🔍 Web Research Example - Google AI Computer Use Agent');
  console.log('='.repeat(60));

  // Configuration
  const config = {
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    model: 'gemini-2.5-pro',
    maxSteps: 15,
    headless: false, // Set to true for production
    safetyStrict: true,
    enableLogging: true,
    maxRetries: 3,
    timeoutMs: 30000
  };

  // Create Google AI computer agent
  const agent = new GoogleAIComputerAgent(config);

  try {
    // Initialize the agent
    await agent.initialize();
    console.log('✅ Agent initialized successfully');

    // Research task
    const task = `
    Search for information about "Google AI Gemini 2.5 Computer Use" on Google.
    Find the official documentation and extract the key features.
    Take a screenshot of the main page.
    Provide a summary of the capabilities mentioned.
    `;

    const initialUrl = 'https://www.google.com';

    console.log('Starting web research task...');
    console.log(`Task: ${task}`);
    console.log(`Initial URL: ${initialUrl}`);
    console.log();

    // Execute the task
    const result = await agent.runTask(task, initialUrl);

    // Display results
    console.log('\n📊 RESEARCH RESULTS');
    console.log('='.repeat(30));
    console.log(`✅ Task Completed: ${result.success}`);
    console.log(`⏱️  Execution Time: ${result.executionTime}ms`);
    console.log(`🔄 Steps Taken: ${result.totalSteps}`);
    console.log(`🌐 Final URL: ${result.finalURL}`);
    console.log(`📄 Page Title: ${result.finalTitle}`);
    console.log();

    if (result.result) {
      console.log('📝 AGENT RESPONSE:');
      console.log(result.result);
      console.log();
    }

    // Display session information
    const sessionInfo = agent.getSessionInfo();
    console.log('📋 SESSION INFO:');
    console.log('='.repeat(30));
    console.log(`🆔 Session ID: ${sessionInfo.sessionId}`);
    console.log(`⏰ Start Time: ${new Date(sessionInfo.startTime).toISOString()}`);
    console.log(`📊 Current Step: ${sessionInfo.currentStep}`);
    console.log(`🌐 Current URL: ${sessionInfo.currentURL}`);
    console.log(`📄 Page Title: ${sessionInfo.pageTitle}`);
    console.log();

    // Provide usage statistics
    console.log('📈 USAGE STATISTICS:');
    console.log('='.repeat(30));
    console.log(`📄 Steps Executed: ${result.totalSteps}`);
    console.log(`🏁 Final Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`⏰ Time to Complete: ${(result.executionTime / 1000).toFixed(2)}s`);
    console.log(`🤖 Model Used: ${config.model}`);
    console.log(`🏢 Provider: Google Generative AI via @ai-sdk/google`);

    // Save session data
    const sessionFile = `./session_${Date.now()}.json`;
    await agent.saveSession(sessionFile);
    console.log(`💾 Session data saved to: ${sessionFile}`);

  } catch (error) {
    console.error('❌ Error occurred:', error);
    console.log('\n💡 Troubleshooting Tips:');
    console.log('1. Ensure GOOGLE_GENERATIVE_AI_API_KEY is set in your environment');
    console.log('2. Check internet connection');
    console.log('3. Verify the Google API key has proper permissions');
    console.log('4. Make sure Playwright browsers are installed (npx playwright install)');
    console.log('5. Ensure @ai-sdk/google is installed (npm install @ai-sdk/google)');
  } finally {
    // Clean up
    await agent.close();
    console.log('\n🧹 Agent closed successfully');
  }
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}