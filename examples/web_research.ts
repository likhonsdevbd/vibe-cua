/**
 * Web Research Example
 * Demonstrates the production computer use agent conducting web research
 * 
 * This example shows how to use the agent for automated information gathering
 * with built-in safety measures and proper error handling.
 * 
 * Author: MiniMax Agent
 */

import { createComputerUseAgent, EnvironmentConfig, SafetyConfig } from '../production_agent';

async function main() {
  console.log('🔍 Web Research Example - Production Computer Use Agent');
  console.log('='.repeat(60));

  // Configuration
  const config: EnvironmentConfig = {
    apiKey: process.env.GOOGLE_API_KEY!,
    model: 'google/gemini-2.5-pro',
    maxSteps: 15,
    headless: false, // Set to true for production
    safetyStrict: true,
    enableLogging: true,
    maxRetries: 3,
    timeoutMs: 30000
  };

  // Safety configuration
  const safety: SafetyConfig = {
    strict: true,
    requireConfirmation: true,
    allowedDomains: [
      '*.google.com',
      '*.wikipedia.org',
      '*.github.com',
      '*.stackoverflow.com',
      '*.vercel.com',
      '*.ai-sdk.dev'
    ],
    blockedActions: [
      'delete_account',
      'make_payment',
      'enter_password',
      'accept_terms',
      'download_file',
      'install_software'
    ],
    riskPatterns: [
      'password', 'credit card', 'bank', 'financial', 'money',
      'delete', 'remove', 'install', 'download', 'file system',
      'sudo', 'admin', 'root', 'api_key', 'secret', 'private'
    ]
  };

  // Create agent
  const agent = createComputerUseAgent(config, safety);

  try {
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
    const result = await agent.executeTask(task, initialUrl);

    // Display results
    console.log('\n📊 RESEARCH RESULTS');
    console.log('='.repeat(30));
    console.log(`✅ Task Completed: ${result.success}`);
    console.log(`⏱️  Execution Time: ${result.executionTime}ms`);
    console.log(`🔄 Steps Taken: ${result.steps.length}`);
    console.log(`🌐 Final URL: ${result.metadata.finalUrl}`);
    console.log();

    if (result.finalResponse) {
      console.log('📝 SUMMARY:');
      console.log(result.finalResponse);
      console.log();
    }

    // Display execution log
    console.log('📋 EXECUTION LOG:');
    console.log('='.repeat(30));
    const logs = agent.getExecutionLog();
    logs.forEach((log, index) => {
      const timestamp = new Date(log.timestamp).toISOString().substr(11, 12);
      const prefix = log.level === 'error' ? '❌' : log.level === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`[${timestamp}] ${prefix} ${log.message}`);
    });

    // Provide usage statistics
    console.log('\n📈 USAGE STATISTICS:');
    console.log('='.repeat(30));
    console.log(`📄 Steps Executed: ${result.steps.length}`);
    console.log(`🏁 Final Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`⏰ Time to Complete: ${(result.executionTime / 1000).toFixed(2)}s`);
    console.log(`🤖 Model Used: ${result.metadata.model}`);

  } catch (error) {
    console.error('❌ Error occurred:', error);
    console.log('\n💡 Troubleshooting Tips:');
    console.log('1. Ensure GOOGLE_API_KEY is set in your environment');
    console.log('2. Check internet connection');
    console.log('3. Verify the Google API key has proper permissions');
    console.log('4. Make sure Playwright browsers are installed (npx playwright install)');
  }
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}