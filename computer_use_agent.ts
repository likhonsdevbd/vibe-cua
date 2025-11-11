/**
 * Gemini 2.5 Computer Use Agent (TypeScript)
 * A comprehensive computer-using agent that can perform tasks on your behalf.
 * Built using Google's Gemini 2.5 Computer Use model and Playwright for browser control.
 * 
 * Author: MiniMax Agent
 * Date: 2025-11-11
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { chromium, Browser, Page, BrowserContext } from 'playwright';

// Types and interfaces
interface AgentConfig {
  modelName: string;
  screenWidth: number;
  screenHeight: number;
  maxTurns: number;
  headless: boolean;
  timeout: number;
  safetyStrict: boolean;
  apiKey?: string;
  baseURL?: string;
}

interface FunctionCall {
  name: string;
  args: Record<string, any>;
  safetyDecision?: {
    type: string;
    explanation: string;
  };
}

interface FunctionResult {
  functionName: string;
  result: Record<string, any>;
  status: 'success' | 'error' | 'cancelled';
}

interface AgentTurn {
  turn: number;
  functionCalls: string[];
  results: FunctionResult[];
  timestamp: number;
  error?: string;
}

interface AgentResults {
  task: string;
  initialURL: string;
  turns: AgentTurn[];
  success: boolean;
  finalURL: string;
  finalResponse?: string;
  executionTime: number;
}

interface SafetyCheck {
  requiresConfirmation: boolean;
  reason: string;
}

// Default configuration
const DEFAULT_CONFIG: AgentConfig = {
  modelName: 'gemini-2.5-computer-use-preview-10-2025',
  screenWidth: 1440,
  screenHeight: 900,
  maxTurns: 20,
  headless: false,
  timeout: 30000,
  safetyStrict: true,
};

export class ComputerUseAgent {
  private config: AgentConfig;
  private client: GoogleGenerativeAI | null = null;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private conversationHistory: any[] = [];
  private currentURL: string = '';

  // Safety and security settings
  private allowedDomains: Set<string> = new Set();
  private blockedActions: Set<string> = new Set();
  private highRiskPatterns = [
    'password', 'credit card', 'bank', 'financial', 'money',
    'delete', 'remove', 'install', 'download', 'file'
  ];

  constructor(config: Partial<AgentConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Initialize API client
    if (this.config.apiKey) {
      this.client = new GoogleGenerativeAI(this.config.apiKey);
    } else if (process.env.GOOGLE_API_KEY) {
      this.client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    }

    if (!this.client) {
      throw new Error('Gemini API key not provided. Set GOOGLE_API_KEY environment variable or pass apiKey in config.');
    }
  }

  async start(): Promise<void> {
    console.log('Starting computer-use agent...');

    // Launch browser
    this.browser = await chromium.launch({
      headless: this.config.headless,
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    // Create browser context
    this.context = await this.browser.newContext({
      viewport: { width: this.config.screenWidth, height: this.config.screenHeight },
      javaScriptEnabled: true,
      ignoreHTTPSErrors: true
    });

    // Create new page
    this.page = await this.context.newPage();

    // Set up event listeners
    await this.page.setDefaultTimeout(this.config.timeout);

    console.log('Browser initialized successfully');
  }

  async stop(): Promise<void> {
    console.log('Stopping computer-use agent...');

    if (this.browser) {
      await this.browser.close();
    }

    console.log('Computer-use agent stopped');
  }

  async takeScreenshot(): Promise<Buffer> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    const screenshot = await this.page.screenshot({ type: 'png', fullPage: true });
    this.currentURL = this.page.url();
    return screenshot;
  }

  denormalizeCoordinates(x: number, y: number): { x: number; y: number } {
    return {
      x: Math.floor(x * this.config.screenWidth / 1000),
      y: Math.floor(y * this.config.screenHeight / 1000)
    };
  }

  private checkSafetyDecision(functionCall: FunctionCall): SafetyCheck {
    // Check for safety_decision in the function call
    if (functionCall.safetyDecision) {
      return {
        requiresConfirmation: true,
        reason: functionCall.safetyDecision.explanation || 'Action requires confirmation'
      };
    }

    // Check function name for high-risk actions
    const functionName = functionCall.name.toLowerCase();
    if (this.highRiskPatterns.some(pattern => functionName.includes(pattern))) {
      return {
        requiresConfirmation: true,
        reason: `Action '${functionName}' involves high-risk operations`
      };
    }

    // Check arguments for sensitive data
    const argsStr = JSON.stringify(functionCall.args).toLowerCase();
    if (this.highRiskPatterns.some(pattern => argsStr.includes(pattern))) {
      return {
        requiresConfirmation: true,
        reason: 'Action involves sensitive data or operations'
      };
    }

    return { requiresConfirmation: false, reason: '' };
  }

  private async askUserConfirmation(functionCall: FunctionCall, reason: string): Promise<boolean> {
    console.log('\n⚠️  SAFETY WARNING ⚠️');
    console.log(`Function: ${functionCall.name}`);
    console.log(`Arguments: ${JSON.stringify(functionCall.args, null, 2)}`);
    console.log(`Reason: ${reason}`);
    console.log('\nThis action may have significant consequences. Do you want to proceed?');

    while (true) {
      const response = await this.promptUser("Enter 'Y' to proceed, 'N' to cancel: ");
      const lowerResponse = response.toLowerCase().trim();
      
      if (['y', 'yes'].includes(lowerResponse)) {
        return true;
      } else if (['n', 'no'].includes(lowerResponse)) {
        return false;
      } else {
        console.log("Please enter 'Y' or 'N'");
      }
    }
  }

  private async promptUser(message: string): Promise<string> {
    return new Promise((resolve) => {
      process.stdout.write(message);
      process.stdin.resume();
      process.stdin.setEncoding('utf8');
      process.stdin.once('data', (data) => {
        process.stdin.pause();
        resolve(data.toString().trim());
      });
    });
  }

  async executeFunctionCall(functionCall: FunctionCall): Promise<Record<string, any>> {
    const { name, args } = functionCall;
    console.log(`Executing function: ${name} with args:`, args);

    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    try {
      switch (name) {
        case 'navigate':
          if (!args.url) {
            throw new Error('Navigate requires "url" argument');
          }
          await this.page.goto(args.url);
          await this.page.waitForLoadState('networkidle');
          return {
            status: 'success',
            url: this.page.url(),
            title: await this.page.title()
          };

        case 'click_at':
          const { x, y } = this.denormalizeCoordinates(args.x || 0, args.y || 0);
          await this.page.mouse.click(x, y);
          return { status: 'success', position: { x, y } };

        case 'type_text_at':
          const typeCoords = this.denormalizeCoordinates(args.x || 0, args.y || 0);
          const text = args.text || '';
          const clearBefore = args.clear_before_typing !== false;
          const pressEnter = args.press_enter !== false;

          // Try to focus the element at coordinates
          try {
            await this.page.click(`xpath=//*[@x='${typeCoords.x}' and @y='${typeCoords.y}']`, { 
              position: { x: typeCoords.x, y: typeCoords.y } 
            });
          } catch {
            // Fallback: click at coordinates
            await this.page.mouse.click(typeCoords.x, typeCoords.y);
          }

          if (clearBefore) {
            await this.page.keyboard.press('Control+a');
          }

          await this.page.keyboard.type(text);

          if (pressEnter) {
            await this.page.keyboard.press('Enter');
          }

          return { 
            status: 'success', 
            text, 
            position: { x: typeCoords.x, y: typeCoords.y } 
          };

        case 'scroll_document':
          const direction = args.direction || 'down';
          switch (direction) {
            case 'down':
              await this.page.keyboard.press('PageDown');
              break;
            case 'up':
              await this.page.keyboard.press('PageUp');
              break;
            case 'left':
              await this.page.keyboard.press('Control+PageUp');
              break;
            case 'right':
              await this.page.keyboard.press('Control+PageDown');
              break;
          }
          return { status: 'success', direction };

        case 'scroll_at':
          const scrollCoords = this.denormalizeCoordinates(args.x || 0, args.y || 0);
          const scrollDirection = args.direction || 'down';
          const magnitude = args.magnitude || 800;
          const scrollAmount = Math.floor(magnitude / 10);

          await this.page.evaluate(({ x, y, direction, amount }) => {
            switch (direction) {
              case 'down':
                window.scrollBy(0, amount);
                break;
              case 'up':
                window.scrollBy(0, -amount);
                break;
              case 'left':
                window.scrollBy(-amount, 0);
                break;
              case 'right':
                window.scrollBy(amount, 0);
                break;
            }
          }, { x: scrollCoords.x, y: scrollCoords.y, direction: scrollDirection, amount: scrollAmount });

          return { 
            status: 'success', 
            position: { x: scrollCoords.x, y: scrollCoords.y }, 
            direction: scrollDirection 
          };

        case 'wait_5_seconds':
          await new Promise(resolve => setTimeout(resolve, 5000));
          return { status: 'success', waited: 5 };

        case 'go_back':
          await this.page.goBack();
          await this.page.waitForLoadState('networkidle');
          return { status: 'success', url: this.page.url() };

        case 'go_forward':
          await this.page.goForward();
          await this.page.waitForLoadState('networkidle');
          return { status: 'success', url: this.page.url() };

        case 'search':
          await this.page.goto('https://www.google.com');
          await this.page.waitForLoadState('networkidle');
          return { status: 'success', url: this.page.url() };

        case 'key_combination':
          const keys = args.keys || '';
          await this.page.keyboard.press(keys);
          return { status: 'success', keys };

        default:
          console.warn(`Unknown function: ${name}`);
          return { status: 'error', message: `Unknown function: ${name}` };
      }
    } catch (error) {
      console.error(`Error executing function ${name}:`, error);
      return { status: 'error', error: error instanceof Error ? error.message : String(error) };
    }
  }

  async runAgentLoop(
    userPrompt: string, 
    initialURL?: string, 
    safetyConfirmation: boolean = true
  ): Promise<AgentResults> {
    console.log(`Starting agent loop for task: ${userPrompt}`);

    // Navigate to initial URL if provided
    if (initialURL && this.page) {
      await this.page.goto(initialURL);
      await this.page.waitForLoadState('networkidle');
    }

    // Take initial screenshot
    const initialScreenshot = await this.takeScreenshot();

    // Create initial content
    const userContent = {
      role: 'user',
      parts: [
        { text: userPrompt },
        {
          inlineData: {
            mimeType: 'image/png',
            data: initialScreenshot.toString('base64')
          }
        }
      ]
    };

    this.conversationHistory = [userContent];

    // Configure the model
    const model = this.client!.getGenerativeModel({ 
      model: this.config.modelName,
      systemInstruction: this.getSystemInstruction()
    });

    const generationConfig = {
      temperature: 0.1,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    };

    // Agent execution loop
    const results: AgentResults = {
      task: userPrompt,
      initialURL: initialURL || this.currentURL,
      turns: [],
      success: false,
      finalURL: this.currentURL,
      executionTime: Date.now()
    };

    for (let turn = 0; turn < this.config.maxTurns; turn++) {
      console.log(`--- Turn ${turn + 1} ---`);

      try {
        // Make API call
        const result = await model.generateContent({
          contents: this.conversationHistory,
          generationConfig
        });

        const response = result.response;
        const candidate = response.candidates?.[0];
        
        if (!candidate) {
          throw new Error('No candidate found in response');
        }

        this.conversationHistory.push(candidate.content);

        // Check if agent has finished the task
        const functionCalls = candidate.content.parts?.filter((part: any) => part.functionCall) || [];
        if (functionCalls.length === 0) {
          // Agent has provided a final response
          const textResponse = candidate.content.parts
            ?.filter((part: any) => part.text)
            ?.map((part: any) => part.text)
            ?.join(' ') || '';
          
          results.success = true;
          results.finalResponse = textResponse;
          console.log(`Agent completed task: ${textResponse}`);
          break;
        }

        // Process function calls
        const functionResults: FunctionResult[] = [];

        for (const functionCall of functionCalls) {
          const functionDict: FunctionCall = {
            name: functionCall.functionCall.name,
            args: functionCall.functionCall.args || {}
          };

          // Check if action requires confirmation
          if (safetyConfirmation) {
            const safetyCheck = this.checkSafetyDecision(functionDict);
            if (safetyCheck.requiresConfirmation) {
              const confirmed = await this.askUserConfirmation(functionDict, safetyCheck.reason);
              if (!confirmed) {
                console.log('User cancelled action');
                functionResults.push({
                  functionName: functionDict.name,
                  result: { 
                    status: 'cancelled',
                    reason: safetyCheck.reason
                  },
                  status: 'cancelled'
                });
                continue;
              } else {
                functionDict.args.safetyAcknowledged = 'true';
              }
            }
          }

          // Execute the function
          try {
            const executionResult = await this.executeFunctionCall(functionDict);
            functionResults.push({
              functionName: functionDict.name,
              result: executionResult,
              status: executionResult.status
            });
          } catch (error) {
            console.error('Error executing function:', error);
            functionResults.push({
              functionName: functionDict.name,
              result: { error: error instanceof Error ? error.message : String(error) },
              status: 'error'
            });
          }
        }

        // Take screenshot after all functions
        const screenshot = await this.takeScreenshot();
        
        // Add function responses to conversation
        const functionResponseContent = {
          role: 'user',
          parts: functionResults.map(result => ({
            functionResponse: {
              name: result.functionName,
              response: {
                status: result.result.status,
                url: this.currentURL,
                timestamp: Date.now(),
                ...result.result
              }
            }
          }))
        };
        
        // Add screenshot to the last function response
        if (functionResponseContent.parts.length > 0) {
          functionResponseContent.parts[0].functionResponse.inlineData = {
            mimeType: 'image/png',
            data: screenshot.toString('base64')
          };
        }

        this.conversationHistory.push(functionResponseContent);

        // Record this turn
        results.turns.push({
          turn: turn + 1,
          functionCalls: functionResults.map(fr => fr.functionName),
          results: functionResults,
          timestamp: Date.now()
        });

        // Check if all function calls failed
        if (functionResults.every(result => result.status === 'error' || result.status === 'cancelled')) {
          console.warn('All function calls failed or were cancelled');
          break;
        }

      } catch (error) {
        console.error(`Error in turn ${turn + 1}:`, error);
        results.turns.push({
          turn: turn + 1,
          error: error instanceof Error ? error.message : String(error),
          functionCalls: [],
          results: [],
          timestamp: Date.now()
        });
        break;
      }
    }

    results.executionTime = Date.now() - results.executionTime;
    results.finalURL = this.currentURL;

    console.log(`Agent loop completed in ${results.turns.length} turns`);
    return results;
  }

  private getSystemInstruction(): string {
    return `You are a computer-use agent powered by Gemini 2.5. You can interact with computer interfaces, perform web browsing, fill forms, and automate tasks.

IMPORTANT SAFETY RULES:
1. Always ask for user confirmation before performing any financial transactions, password entry, or sensitive operations
2. Do not automatically accept terms of service, privacy policies, or other legal agreements
3. Never attempt to bypass CAPTCHAs or other security measures
4. If you're unsure about an action, ask the user for guidance
5. Be transparent about what you're doing and provide clear feedback

Your available actions include:
- click_at(x, y): Click at normalized coordinates
- type_text_at(x, y, text): Type text at coordinates
- navigate(url): Navigate to a URL
- scroll_document(direction): Scroll the page (up, down, left, right)
- scroll_at(x, y, direction): Scroll at specific coordinates
- wait_5_seconds(): Wait for 5 seconds
- go_back(), go_forward(), search(): Browser navigation
- key_combination(keys): Press keyboard shortcuts

Work systematically to complete the user's task while maintaining safety and transparency.`;
  }
}

// Example usage
export async function main() {
  // Configuration
  const config: Partial<AgentConfig> = {
    headless: false, // Set to true for headless mode
    maxTurns: 10,    // Maximum number of agent turns
    safetyStrict: true
  };

  try {
    // Create and run the agent
    const agent = new ComputerUseAgent(config);
    await agent.start();

    // Example task
    const userPrompt = `
    Go to google.com, search for "latest AI developments 2025", 
    click on the first result, and summarize what you find.
    `;

    const results = await agent.runAgentLoop(
      userPrompt: userPrompt,
      initialURL: 'https://google.com',
      safetyConfirmation: true
    );

    console.log('\n=== AGENT RESULTS ===');
    console.log(`Task: ${results.task}`);
    console.log(`Success: ${results.success}`);
    console.log(`Turns: ${results.turns.length}`);
    console.log(`Final URL: ${results.finalURL}`);
    console.log(`Execution time: ${(results.executionTime / 1000).toFixed(2)} seconds`);

    if (results.finalResponse) {
      console.log(`Final Response: ${results.finalResponse}`);
    }

    await agent.stop();
  } catch (error) {
    console.error('Error running agent:', error);
  }
}

// CLI usage
if (require.main === module) {
  main().catch(console.error);
}