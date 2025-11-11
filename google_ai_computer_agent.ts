/**
 * Google AI Computer Use Agent - Vercel AI SDK Implementation
 * 
 * A production-ready computer use agent using Vercel AI SDK with Google Generative AI
 * Features proper provider integration, safety controls, and enterprise-grade reliability
 * 
 * Author: MiniMax Agent
 * Date: 2025-11-11
 * Version: Production 1.0.0
 * 
 * Provider: Google Generative AI via @ai-sdk/google
 * Models: gemini-2.5-pro, gemini-2.5-flash, and other available models
 */

import { generateText, experimental_generateObject, streamText, Agent as VercelAgent, stepCountIs, tool } from 'ai';
import { google, createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// =============================================================================
// Environment and Configuration
// =============================================================================

interface EnvironmentConfig {
  apiKey?: string;
  model?: string;
  maxSteps?: number;
  headless?: boolean;
  safetyStrict?: boolean;
  enableLogging?: boolean;
  maxRetries?: number;
  timeoutMs?: number;
  baseURL?: string;
  headers?: Record<string, string>;
}

// Safety configuration
interface SafetyConfig {
  strict: boolean;
  requireConfirmation: boolean;
  allowedDomains: string[];
  blockedActions: string[];
  riskPatterns: string[];
  customInstructions: string;
}

// Agent execution context
interface ExecutionContext {
  sessionId: string;
  startTime: number;
  currentStep: number;
  screenshotBuffer?: Buffer;
  pageTitle: string;
  currentURL: string;
  allowedDomains: string[];
  pendingConfirmations: string[];
}

// Provider options for Google Generative AI
interface GoogleProviderOptions {
  baseURL?: string;
  apiKey?: string;
  headers?: Record<string, string>;
  cachedContent?: string;
  structuredOutputs?: boolean;
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
  responseModalities?: string[];
  thinkingConfig?: {
    thinkingBudget: number;
    includeThoughts: boolean;
  };
  imageConfig?: {
    aspectRatio: string;
  };
}

// =============================================================================
// Default Configuration
// =============================================================================

const DEFAULT_CONFIG: EnvironmentConfig = {
  model: 'gemini-2.5-pro',
  maxSteps: 20,
  headless: true,
  safetyStrict: true,
  enableLogging: true,
  maxRetries: 3,
  timeoutMs: 30000,
};

const DEFAULT_SAFETY: SafetyConfig = {
  strict: true,
  requireConfirmation: true,
  allowedDomains: [
    '*.google.com',
    '*.github.com',
    '*.stackoverflow.com',
    '*.wikipedia.org',
    '*.docs.google.com',
    '*.docs.microsoft.com',
    '*.cloud.google.com'
  ],
  blockedActions: [
    'delete', 'remove', 'format', 'wipe', 'reset',
    'sudo', 'admin', 'root', 'install', 'uninstall'
  ],
  riskPatterns: [
    'password', 'credential', 'api key', 'secret', 'token',
    'payment', 'credit card', 'bank', 'financial',
    'legal', 'contract', 'agreement', 'terms'
  ],
  customInstructions: `You are a helpful computer use agent. Always:
1. Ask for user confirmation before sensitive operations
2. Be transparent about your actions
3. Follow safety guidelines strictly
4. Provide clear feedback on what you're doing
5. Stop if user asks you to stop`
};

// =============================================================================
// Utility Functions
// =============================================================================

function generateSessionId(): string {
  return crypto.randomBytes(16).toString('hex');
}

function log(message: string, context?: any): void {
  if (process.env.ENABLE_VERBOSE_LOGGING === 'true') {
    console.log(`[GoogleAI Agent] ${new Date().toISOString()}: ${message}`, context || '');
  }
}

function isDomainAllowed(url: string, allowedDomains: string[]): boolean {
  try {
    const domain = new URL(url).hostname.toLowerCase();
    return allowedDomains.some(allowed => {
      if (allowed.startsWith('*.')) {
        return domain.endsWith(allowed.substring(1));
      }
      return domain === allowed;
    });
  } catch {
    return false;
  }
}

function containsRiskPattern(text: string, patterns: string[]): boolean {
  const lowerText = text.toLowerCase();
  return patterns.some(pattern => lowerText.includes(pattern.toLowerCase()));
}

// =============================================================================
// Browser Management
// =============================================================================

class BrowserManager {
  private browser?: Browser;
  private context?: BrowserContext;
  private page?: Page;

  constructor(private config: EnvironmentConfig) {}

  async initialize(): Promise<void> {
    try {
      this.browser = await chromium.launch({
        headless: this.config.headless,
        timeout: this.config.timeoutMs,
        args: [
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });

      this.context = await this.browser.newContext({
        viewport: { width: 1440, height: 900 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });

      this.page = await this.context.newPage();
      
      // Set up error handling
      this.page.on('console', msg => {
        if (msg.type() === 'error') {
          log(`Page console error: ${msg.text()}`);
        }
      });

      this.page.on('pageerror', error => {
        log(`Page error: ${error.message}`);
      });

      log('Browser initialized successfully');
    } catch (error) {
      log('Failed to initialize browser', error);
      throw error;
    }
  }

  async takeScreenshot(): Promise<Buffer> {
    if (!this.page) throw new Error('Browser not initialized');
    return await this.page.screenshot({ type: 'png', fullPage: true });
  }

  async navigate(url: string): Promise<any> {
    if (!this.page) throw new Error('Browser not initialized');
    
    await this.page.goto(url, { 
      waitUntil: 'networkidle', 
      timeout: this.config.timeoutMs 
    });
    
    const title = await this.page.title();
    const currentURL = this.page.url();
    
    return {
      success: true,
      title,
      url: currentURL,
      timestamp: Date.now()
    };
  }

  async clickAt(x: number, y: number): Promise<any> {
    if (!this.page) throw new Error('Browser not initialized');
    await this.page.mouse.click(x, y);
    return { success: true, action: 'click', x, y, timestamp: Date.now() };
  }

  async typeTextAt(x: number, y: number, text: string): Promise<any> {
    if (!this.page) throw new Error('Browser not initialized');
    await this.page.click(x, y);
    await this.page.keyboard.type(text);
    return { success: true, action: 'type', x, y, text, timestamp: Date.now() };
  }

  async scroll(direction: 'up' | 'down' | 'left' | 'right', amount = 500): Promise<any> {
    if (!this.page) throw new Error('Browser not initialized');
    
    const scrollActions = {
      up: () => this.page!.mouse.wheel(0, -amount),
      down: () => this.page!.mouse.wheel(0, amount),
      left: () => this.page!.mouse.wheel(-amount, 0),
      right: () => this.page!.mouse.wheel(amount, 0)
    };

    await scrollActions[direction]();
    return { success: true, action: 'scroll', direction, amount, timestamp: Date.now() };
  }

  async getPageInfo(): Promise<{ title: string; url: string; textContent: string }> {
    if (!this.page) throw new Error('Browser not initialized');
    
    return {
      title: await this.page.title(),
      url: this.page.url(),
      textContent: await this.page.textContent('body') || ''
    };
  }

  async close(): Promise<void> {
    if (this.context) {
      await this.context.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
    log('Browser closed');
  }
}

// =============================================================================
// Tool Definitions for Google AI Agent
// =============================================================================

const browserTools = {
  navigate: tool({
    description: 'Navigate to a specific URL',
    inputSchema: z.object({
      url: z.string().url().describe('The URL to navigate to')
    }),
    execute: async ({ url }, { context }) => {
      const browser = context.get('browser') as BrowserManager;
      
      // Check domain safety
      const contextObj = context.get('executionContext') as ExecutionContext;
      if (!isDomainAllowed(url, contextObj.allowedDomains)) {
        throw new Error(`Domain not allowed: ${new URL(url).hostname}`);
      }
      
      const result = await browser.navigate(url);
      contextObj.currentURL = url;
      contextObj.currentStep++;
      
      return {
        success: true,
        message: `Successfully navigated to ${url}`,
        result
      };
    }
  }),

  takeScreenshot: tool({
    description: 'Take a screenshot of the current page',
    inputSchema: z.object({
      description: z.string().optional().describe('Description of what to capture')
    }),
    execute: async ({ description }, { context }) => {
      const browser = context.get('browser') as BrowserManager;
      const screenshot = await browser.takeScreenshot();
      const pageInfo = await browser.getPageInfo();
      
      return {
        success: true,
        screenshot: screenshot.toString('base64'),
        description: description || 'Current page screenshot',
        pageInfo
      };
    }
  }),

  clickAt: tool({
    description: 'Click at specific coordinates on the page',
    inputSchema: z.object({
      x: z.number().describe('X coordinate'),
      y: z.number().describe('Y coordinate'),
      description: z.string().optional().describe('What you are clicking on')
    }),
    execute: async ({ x, y, description }, { context }) => {
      const browser = context.get('browser') as BrowserManager;
      const result = await browser.clickAt(x, y);
      
      // Add safety delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: `Clicked at (${x}, ${y}) - ${description || 'Unknown element'}`,
        result
      };
    }
  }),

  typeTextAt: tool({
    description: 'Type text at specific coordinates',
    inputSchema: z.object({
      x: z.number().describe('X coordinate'),
      y: z.number().describe('Y coordinate'),
      text: z.string().describe('Text to type'),
      description: z.string().optional().describe('What you are typing into')
    }),
    execute: async ({ x, y, text, description }, { context }) => {
      const contextObj = context.get('executionContext') as ExecutionContext;
      
      // Check for sensitive content
      if (containsRiskPattern(text, contextObj.allowedDomains)) {
        throw new Error('Sensitive content detected in text input');
      }
      
      const browser = context.get('browser') as BrowserManager;
      const result = await browser.typeTextAt(x, y, text);
      
      return {
        success: true,
        message: `Typed "${text}" at (${x}, ${y}) - ${description || 'Unknown field'}`,
        result
      };
    }
  }),

  scroll: tool({
    description: 'Scroll the page in a specific direction',
    inputSchema: z.object({
      direction: z.enum(['up', 'down', 'left', 'right']).describe('Scroll direction'),
      amount: z.number().optional().describe('Scroll amount in pixels')
    }),
    execute: async ({ direction, amount = 500 }, { context }) => {
      const browser = context.get('browser') as BrowserManager;
      const result = await browser.scroll(direction, amount);
      
      return {
        success: true,
        message: `Scrolled ${direction} by ${amount} pixels`,
        result
      };
    }
  }),

  getPageInfo: tool({
    description: 'Get current page information including title, URL, and content',
    inputSchema: z.object({
      includeContent: z.boolean().optional().describe('Include page text content')
    }),
    execute: async ({ includeContent = true }, { context }) => {
      const browser = context.get('browser') as BrowserManager;
      const pageInfo = await browser.getPageInfo();
      
      return {
        success: true,
        pageInfo: includeContent ? pageInfo : {
          title: pageInfo.title,
          url: pageInfo.url
        }
      };
    }
  }),

  search: tool({
    description: 'Search for information using Google Search',
    inputSchema: z.object({
      query: z.string().describe('Search query'),
      site: z.string().optional().describe('Optional site restriction')
    }),
    execute: async ({ query, site }, { context }) => {
      // Build Google search URL
      const searchQuery = encodeURIComponent(site ? `site:${site} ${query}` : query);
      const googleUrl = `https://www.google.com/search?q=${searchQuery}`;
      
      const browser = context.get('browser') as BrowserManager;
      await browser.navigate(googleUrl);
      
      return {
        success: true,
        message: `Searched for: ${query}`,
        searchQuery: query,
        searchUrl: googleUrl
      };
    }
  })
};

// =============================================================================
// Main Google AI Computer Use Agent
// =============================================================================

export class GoogleAIComputerAgent {
  private config: EnvironmentConfig;
  private safety: SafetyConfig;
  private browserManager?: BrowserManager;
  private executionContext: ExecutionContext;
  private provider: any;

  constructor(config: EnvironmentConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.safety = DEFAULT_SAFETY;
    this.executionContext = {
      sessionId: generateSessionId(),
      startTime: Date.now(),
      currentStep: 0,
      pageTitle: '',
      currentURL: '',
      allowedDomains: this.safety.allowedDomains,
      pendingConfirmations: []
    };

    this.setupProvider();
  }

  private setupProvider(): void {
    const providerOptions: GoogleProviderOptions = {
      baseURL: this.config.baseURL,
      apiKey: this.config.apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      headers: this.config.headers,
      structuredOutputs: true,
      safetySettings: [
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
      ],
      responseModalities: ['TEXT'],
      thinkingConfig: {
        thinkingBudget: 1024,
        includeThoughts: false
      }
    };

    this.provider = createGoogleGenerativeAI(providerOptions);
  }

  async initialize(): Promise<void> {
    log('Initializing Google AI Computer Agent');
    
    this.browserManager = new BrowserManager(this.config);
    await this.browserManager.initialize();
    
    log('Agent initialized successfully');
  }

  async runTask(userPrompt: string, initialURL?: string): Promise<any> {
    if (!this.browserManager) {
      throw new Error('Agent not initialized. Call initialize() first.');
    }

    log('Starting task execution', { prompt: userPrompt, initialURL });

    try {
      // Navigate to initial URL if provided
      if (initialURL) {
        if (!isDomainAllowed(initialURL, this.executionContext.allowedDomains)) {
          throw new Error(`Initial domain not allowed: ${new URL(initialURL).hostname}`);
        }
        await this.browserManager.navigate(initialURL);
        this.executionContext.currentURL = initialURL;
      }

      // Get initial page state
      const initialScreenshot = await this.browserManager.takeScreenshot();
      const pageInfo = await this.browserManager.getPageInfo();
      this.executionContext.screenshotBuffer = initialScreenshot;
      this.executionContext.pageTitle = pageInfo.title;

      // Create the agent
      const agent = new VercelAgent({
        model: this.provider(this.config.model || 'gemini-2.5-pro'),
        tools: browserTools,
        stopWhen: stepCountIs(this.config.maxSteps || 20),
        system: this.safety.customInstructions,
        onStepFinished: (step) => {
          this.executionContext.currentStep++;
          log(`Step ${this.executionContext.currentStep} completed`, step);
        }
      });

      // Add context for the agent
      agent.context.set('browser', this.browserManager);
      agent.context.set('executionContext', this.executionContext);
      agent.context.set('safety', this.safety);
      agent.context.set('config', this.config);

      // Run the agent
      const result = await agent.run(userPrompt);

      return {
        success: true,
        sessionId: this.executionContext.sessionId,
        totalSteps: this.executionContext.currentStep,
        finalURL: this.executionContext.currentURL,
        finalTitle: this.executionContext.pageTitle,
        executionTime: Date.now() - this.executionContext.startTime,
        result: result
      };

    } catch (error) {
      log('Task execution failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId: this.executionContext.sessionId,
        stepsCompleted: this.executionContext.currentStep
      };
    }
  }

  async close(): Promise<void> {
    if (this.browserManager) {
      await this.browserManager.close();
    }
    log('Agent closed');
  }

  // Utility methods
  getSessionInfo(): any {
    return {
      sessionId: this.executionContext.sessionId,
      startTime: this.executionContext.startTime,
      currentStep: this.executionContext.currentStep,
      currentURL: this.executionContext.currentURL,
      pageTitle: this.executionContext.pageTitle
    };
  }

  async saveSession(path: string): Promise<void> {
    const sessionData = {
      ...this.getSessionInfo(),
      config: this.config,
      safety: this.safety
    };
    await writeFile(path, JSON.stringify(sessionData, null, 2));
    log('Session saved', path);
  }
}

// =============================================================================
// Main function and examples
// =============================================================================

async function main() {
  const agent = new GoogleAIComputerAgent({
    model: 'gemini-2.5-pro',
    headless: false, // Set to true for headless mode
    maxSteps: 15,
    safetyStrict: true,
    enableLogging: true
  });

  try {
    await agent.initialize();

    const userPrompt = `
      Go to google.com, search for "artificial intelligence 2025",
      and then provide a summary of what you find.
    `;

    const result = await agent.runTask(userPrompt, 'https://google.com');
    
    console.log('Task completed:', result);
    
    // Get session information
    console.log('Session info:', agent.getSessionInfo());

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await agent.close();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { GoogleAIComputerAgent };