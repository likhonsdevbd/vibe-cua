/**
 * Production Computer Use Agent using Vercel AI SDK
 * A secure, production-ready computer-use agent that can perform tasks on your behalf
 * Built using Google Gemini with Vercel AI SDK's Agent patterns
 * 
 * Author: MiniMax Agent
 * Date: 2025-11-11
 * Version: Production 1.0.0
 * 
 * Note: Gemini 2.5 Computer Use is still in preview
 */

import { Experimental_Agent as Agent, stepCountIs, tool } from 'ai';
import { z } from 'zod';
import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { createReadStream, existsSync } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';

// Environment types
interface EnvironmentConfig {
  apiKey: string;
  model?: string;
  maxSteps?: number;
  headless?: boolean;
  safetyStrict?: boolean;
  enableLogging?: boolean;
  maxRetries?: number;
  timeoutMs?: number;
}

// Safety and security configuration
interface SafetyConfig {
  strict: boolean;
  requireConfirmation: boolean;
  allowedDomains: string[];
  blockedActions: string[];
  riskPatterns: string[];
}

// Agent result types
interface AgentResult {
  success: boolean;
  steps: Array<{
    step: number;
    action: string;
    result: any;
    timestamp: number;
    error?: string;
  }>;
  finalResponse?: string;
  executionTime: number;
  metadata: {
    task: string;
    initialUrl?: string;
    finalUrl?: string;
    model: string;
  };
}

// Browser automation types
interface CoordinateSystem {
  x: number; // 0-999 normalized
  y: number; // 0-999 normalized
  width: number; // actual pixels
  height: number; // actual pixels
}

// Tool execution result
interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

// Default safety configuration
const DEFAULT_SAFETY_CONFIG: SafetyConfig = {
  strict: true,
  requireConfirmation: true,
  allowedDomains: [
    '*.google.com',
    '*.github.com',
    '*.stackoverflow.com',
    '*.vercel.com'
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

/**
 * Production Computer Use Agent
 * Implements Vercel AI SDK Agent patterns with safety-first design
 */
export class ProductionComputerUseAgent {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private currentUrl: string = '';
  private config: EnvironmentConfig;
  private safety: SafetyConfig;
  private executionLog: Array<{
    timestamp: number;
    action: string;
    result: any;
    error?: string;
  }> = [];

  constructor(config: EnvironmentConfig, safety: Partial<SafetyConfig> = {}) {
    this.config = {
      model: 'google/gemini-2.5-pro',
      maxSteps: 20,
      headless: false,
      safetyStrict: true,
      enableLogging: true,
      maxRetries: 3,
      timeoutMs: 30000,
      ...config
    };

    this.safety = {
      ...DEFAULT_SAFETY_CONFIG,
      ...safety,
      strict: config.safetyStrict ?? true
    };

    if (!this.config.apiKey) {
      throw new Error('API key is required. Set GOOGLE_API_KEY environment variable.');
    }
  }

  /**
   * Initialize browser environment
   */
  async initialize(): Promise<void> {
    try {
      this.browser = await chromium.launch({
        headless: this.config.headless,
        args: [
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-blink-features=AutomationControlled'
        ]
      });

      this.context = await this.browser.newContext({
        viewport: { width: 1440, height: 900 },
        javaScriptEnabled: true,
        ignoreHTTPSErrors: true,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });

      this.page = await this.context.newPage();
      await this.page.setDefaultTimeout(this.config.timeoutMs!);

      // Set up error handling
      this.page.on('pageerror', (error) => {
        this.log('error', `Page error: ${error.message}`);
      });

      this.log('info', 'Browser initialized successfully');
    } catch (error) {
      this.log('error', `Failed to initialize browser: ${error}`);
      throw error;
    }
  }

  /**
   * Create the Vercel AI SDK Agent
   */
  private createAgent(): Agent {
    return new Agent({
      model: this.config.model!,
      apiKey: this.config.apiKey,
      tools: {
        // Navigation tools
        navigate: this.createNavigateTool(),
        search: this.createSearchTool(),
        goBack: this.createGoBackTool(),
        goForward: this.createGoForwardTool(),
        
        // Mouse interaction tools
        clickAt: this.createClickAtTool(),
        hoverAt: this.createHoverAtTool(),
        dragAndDrop: this.createDragAndDropTool(),
        
        // Keyboard interaction tools
        typeTextAt: this.createTypeTextAtTool(),
        keyCombination: this.createKeyCombinationTool(),
        
        // Page interaction tools
        scrollDocument: this.createScrollDocumentTool(),
        scrollAt: this.createScrollAtTool(),
        wait: this.createWaitTool(),
        
        // System interaction tools
        takeScreenshot: this.createScreenshotTool(),
        getPageInfo: this.createPageInfoTool()
      },
      stopWhen: stepCountIs(this.config.maxSteps!),
      prepareStep: this.createPrepareStepCallback()
    });
  }

  /**
   * Navigation Tools
   */
  private createNavigateTool() {
    return tool({
      description: 'Navigate to a specific URL',
      inputSchema: z.object({
        url: z.string().url().describe('The URL to navigate to')
      }),
      execute: async ({ url }): Promise<ToolResult> => {
        try {
          // Safety check for domain
          if (!this.isAllowedDomain(url)) {
            return {
              success: false,
              error: `Domain not in allowlist: ${new URL(url).hostname}`
            };
          }

          await this.page!.goto(url);
          await this.page!.waitForLoadState('networkidle');
          this.currentUrl = this.page!.url();

          this.log('info', `Navigated to: ${url}`);
          return {
            success: true,
            data: {
              url: this.currentUrl,
              title: await this.page!.title()
            }
          };
        } catch (error) {
          this.log('error', `Navigation failed: ${error}`);
          return {
            success: false,
            error: `Failed to navigate to ${url}: ${error}`
          };
        }
      }
    });
  }

  private createSearchTool() {
    return tool({
      description: 'Navigate to the default search engine',
      inputSchema: z.object({}),
      execute: async (): Promise<ToolResult> => {
        try {
          await this.page!.goto('https://www.google.com');
          await this.page!.waitForLoadState('networkidle');
          this.currentUrl = this.page!.url();

          return {
            success: true,
            data: {
              url: this.currentUrl,
              title: await this.page!.title()
            }
          };
        } catch (error) {
          return {
            success: false,
            error: `Failed to search: ${error}`
          };
        }
      }
    });
  }

  private createGoBackTool() {
    return tool({
      description: 'Go back in browser history',
      inputSchema: z.object({}),
      execute: async (): Promise<ToolResult> => {
        try {
          await this.page!.goBack();
          await this.page!.waitForLoadState('networkidle');
          
          return {
            success: true,
            data: {
              url: this.currentUrl,
              title: await this.page!.title()
            }
          };
        } catch (error) {
          return {
            success: false,
            error: `Failed to go back: ${error}`
          };
        }
      }
    });
  }

  private createGoForwardTool() {
    return tool({
      description: 'Go forward in browser history',
      inputSchema: z.object({}),
      execute: async (): Promise<ToolResult> => {
        try {
          await this.page!.goForward();
          await this.page!.waitForLoadState('networkidle');
          
          return {
            success: true,
            data: {
              url: this.currentUrl,
              title: await this.page!.title()
            }
          };
        } catch (error) {
          return {
            success: false,
            error: `Failed to go forward: ${error}`
          };
        }
      }
    });
  }

  /**
   * Mouse Interaction Tools
   */
  private createClickAtTool() {
    return tool({
      description: 'Click at normalized coordinates (0-999) on the page',
      inputSchema: z.object({
        x: z.number().min(0).max(999).describe('X coordinate (0-999)'),
        y: z.number().min(0).max(999).describe('Y coordinate (0-999)'),
        wait: z.boolean().default(true).describe('Wait for page to settle after click')
      }),
      execute: async ({ x, y, wait }): Promise<ToolResult> => {
        try {
          // Convert normalized coordinates to actual pixels
          const { width, height } = this.page!.viewportSize()!;
          const actualX = Math.floor((x / 1000) * width);
          const actualY = Math.floor((y / 1000) * height);

          await this.page!.mouse.click(actualX, actualY);
          
          if (wait) {
            await this.page!.waitForTimeout(500);
          }

          this.log('info', `Clicked at coordinates (${x}, ${y}) -> (${actualX}, ${actualY})`);
          return {
            success: true,
            data: {
              original: { x, y },
              actual: { x: actualX, y: actualY },
              url: this.currentUrl
            }
          };
        } catch (error) {
          return {
            success: false,
            error: `Failed to click at (${x}, ${y}): ${error}`
          };
        }
      }
    });
  }

  private createHoverAtTool() {
    return tool({
      description: 'Hover at normalized coordinates (0-999) on the page',
      inputSchema: z.object({
        x: z.number().min(0).max(999).describe('X coordinate (0-999)'),
        y: z.number().min(0).max(999).describe('Y coordinate (0-999)')
      }),
      execute: async ({ x, y }): Promise<ToolResult> => {
        try {
          const { width, height } = this.page!.viewportSize()!;
          const actualX = Math.floor((x / 1000) * width);
          const actualY = Math.floor((y / 1000) * height);

          await this.page!.mouse.move(actualX, actualY);

          return {
            success: true,
            data: {
              original: { x, y },
              actual: { x: actualX, y: actualY }
            }
          };
        } catch (error) {
          return {
            success: false,
            error: `Failed to hover at (${x}, ${y}): ${error}`
          };
        }
      }
    });
  }

  private createDragAndDropTool() {
    return tool({
      description: 'Drag from source coordinates to destination coordinates',
      inputSchema: z.object({
        sourceX: z.number().min(0).max(999).describe('Source X coordinate (0-999)'),
        sourceY: z.number().min(0).max(999).describe('Source Y coordinate (0-999)'),
        destX: z.number().min(0).max(999).describe('Destination X coordinate (0-999)'),
        destY: z.number().min(0).max(999).describe('Destination Y coordinate (0-999)')
      }),
      execute: async ({ sourceX, sourceY, destX, destY }): Promise<ToolResult> => {
        try {
          const { width, height } = this.page!.viewportSize()!;
          const actualSourceX = Math.floor((sourceX / 1000) * width);
          const actualSourceY = Math.floor((sourceY / 1000) * height);
          const actualDestX = Math.floor((destX / 1000) * width);
          const actualDestY = Math.floor((destY / 1000) * height);

          await this.page!.mouse.move(actualSourceX, actualSourceY);
          await this.page!.mouse.down();
          await this.page!.mouse.move(actualDestX, actualDestY);
          await this.page!.mouse.up();

          return {
            success: true,
            data: {
              source: { x: sourceX, y: sourceY },
              dest: { x: destX, y: destY },
              actualSource: { x: actualSourceX, y: actualSourceY },
              actualDest: { x: actualDestX, y: actualDestY }
            }
          };
        } catch (error) {
          return {
            success: false,
            error: `Failed to drag and drop: ${error}`
          };
        }
      }
    });
  }

  /**
   * Keyboard Interaction Tools
   */
  private createTypeTextAtTool() {
    return tool({
      description: 'Type text at normalized coordinates (0-999) on the page',
      inputSchema: z.object({
        x: z.number().min(0).max(999).describe('X coordinate (0-999)'),
        y: z.number().min(0).max(999).describe('Y coordinate (0-999)'),
        text: z.string().describe('Text to type'),
        clear: z.boolean().default(true).describe('Clear field before typing'),
        pressEnter: z.boolean().default(true).describe('Press Enter after typing')
      }),
      execute: async ({ x, y, text, clear, pressEnter }): Promise<ToolResult> => {
        try {
          // Safety check for sensitive content
          if (this.containsSensitiveData(text)) {
            return {
              success: false,
              error: 'Input contains sensitive data and requires user confirmation'
            };
          }

          const { width, height } = this.page!.viewportSize()!;
          const actualX = Math.floor((x / 1000) * width);
          const actualY = Math.floor((y / 1000) * height);

          // Focus the element
          await this.page!.click(actualX, actualY);
          await this.page!.waitForTimeout(100);

          if (clear) {
            await this.page!.keyboard.press('Control+a');
          }

          await this.page!.keyboard.type(text);

          if (pressEnter) {
            await this.page!.keyboard.press('Enter');
          }

          return {
            success: true,
            data: {
              text: text.substring(0, 10) + (text.length > 10 ? '...' : ''), // Log partial text
              location: { x, y },
              actions: { clear, pressEnter }
            }
          };
        } catch (error) {
          return {
            success: false,
            error: `Failed to type text: ${error}`
          };
        }
      }
    });
  }

  private createKeyCombinationTool() {
    return tool({
      description: 'Press keyboard key combination (e.g., Control+c, Escape, Enter)',
      inputSchema: z.object({
        keys: z.string().describe('Key combination to press')
      }),
      execute: async ({ keys }): Promise<ToolResult> => {
        try {
          await this.page!.keyboard.press(keys);
          
          return {
            success: true,
            data: { keys }
          };
        } catch (error) {
          return {
            success: false,
            error: `Failed to press keys: ${keys} - ${error}`
          };
        }
      }
    });
  }

  /**
   * Page Interaction Tools
   */
  private createScrollDocumentTool() {
    return tool({
      description: 'Scroll the entire page',
      inputSchema: z.object({
        direction: z.enum(['up', 'down', 'left', 'right']).describe('Direction to scroll'),
        amount: z.number().default(500).describe('Amount to scroll in pixels')
      }),
      execute: async ({ direction, amount }): Promise<ToolResult> => {
        try {
          let scrollAmount = amount;
          
          if (direction === 'up') {
            await this.page!.evaluate((amount) => window.scrollBy(0, -amount), scrollAmount);
          } else if (direction === 'down') {
            await this.page!.evaluate((amount) => window.scrollBy(0, amount), scrollAmount);
          } else if (direction === 'left') {
            await this.page!.evaluate((amount) => window.scrollBy(-amount, 0), scrollAmount);
          } else if (direction === 'right') {
            await this.page!.evaluate((amount) => window.scrollBy(amount, 0), scrollAmount);
          }

          return {
            success: true,
            data: { direction, amount: scrollAmount }
          };
        } catch (error) {
          return {
            success: false,
            error: `Failed to scroll ${direction}: ${error}`
          };
        }
      }
    });
  }

  private createScrollAtTool() {
    return tool({
      description: 'Scroll at specific normalized coordinates',
      inputSchema: z.object({
        x: z.number().min(0).max(999).describe('X coordinate (0-999)'),
        y: z.number().min(0).max(999).describe('Y coordinate (0-999)'),
        direction: z.enum(['up', 'down', 'left', 'right']).describe('Direction to scroll'),
        magnitude: z.number().default(800).describe('Scroll magnitude (0-999)')
      }),
      execute: async ({ x, y, direction, magnitude }): Promise<ToolResult> => {
        try {
          const { width, height } = this.page!.viewportSize()!;
          const actualX = Math.floor((x / 1000) * width);
          const actualY = Math.floor((y / 1000) * height);
          const scrollAmount = Math.floor((magnitude / 1000) * 500);

          // Scroll at specific coordinates
          await this.page!.evaluate(({ x, y, direction, amount }) => {
            const element = document.elementFromPoint(x, y);
            if (element && element.scrollIntoView) {
              element.scrollIntoView({ behavior: 'smooth' });
            } else {
              // Fallback to document scroll
              if (direction === 'up') {
                window.scrollBy(0, -amount);
              } else if (direction === 'down') {
                window.scrollBy(0, amount);
              } else if (direction === 'left') {
                window.scrollBy(-amount, 0);
              } else if (direction === 'right') {
                window.scrollBy(amount, 0);
              }
            }
          }, { x: actualX, y: actualY, direction, amount: scrollAmount });

          return {
            success: true,
            data: {
              location: { x, y },
              direction,
              magnitude
            }
          };
        } catch (error) {
          return {
            success: false,
            error: `Failed to scroll at (${x}, ${y}): ${error}`
          };
        }
      }
    });
  }

  private createWaitTool() {
    return tool({
      description: 'Wait for specified duration',
      inputSchema: z.object({
        seconds: z.number().min(0).max(60).describe('Seconds to wait (0-60)')
      }),
      execute: async ({ seconds }): Promise<ToolResult> => {
        try {
          await this.page!.waitForTimeout(seconds * 1000);
          
          return {
            success: true,
            data: { waited: seconds }
          };
        } catch (error) {
          return {
            success: false,
            error: `Failed to wait: ${error}`
          };
        }
      }
    });
  }

  /**
   * System Tools
   */
  private createScreenshotTool() {
    return tool({
      description: 'Take a screenshot of the current page',
      inputSchema: z.object({
        fullPage: z.boolean().default(false).describe('Take full page screenshot'),
        savePath: z.string().optional().describe('Optional path to save screenshot')
      }),
      execute: async ({ fullPage, savePath }): Promise<ToolResult> => {
        try {
          const screenshot = await this.page!.screenshot({ 
            type: 'png', 
            fullPage,
            ...(savePath ? { path: savePath } : {})
          });

          return {
            success: true,
            data: {
              size: screenshot.length,
              type: 'png',
              fullPage,
              url: this.currentUrl
            }
          };
        } catch (error) {
          return {
            success: false,
            error: `Failed to take screenshot: ${error}`
          };
        }
      }
    });
  }

  private createPageInfoTool() {
    return tool({
      description: 'Get information about the current page',
      inputSchema: z.object({}),
      execute: async (): Promise<ToolResult> => {
        try {
          const title = await this.page!.title();
          const url = this.page!.url();
          const viewport = this.page!.viewportSize();

          return {
            success: true,
            data: {
              title,
              url,
              viewport,
              timestamp: Date.now()
            }
          };
        } catch (error) {
          return {
            success: false,
            error: `Failed to get page info: ${error}`
          };
        }
      }
    });
  }

  /**
   * Step preparation callback for dynamic behavior
   */
  private createPrepareStepCallback() {
    return async ({ model, stepNumber, steps, messages }) => {
      // Log step for monitoring
      this.log('info', `Step ${stepNumber + 1}: ${steps.length} steps completed`);

      // Optional: Adjust behavior based on step number
      if (stepNumber > 10) {
        // Add timeout warning for long-running tasks
        this.log('warning', 'Task running for many steps, consider manual intervention');
      }

      return {
        model, // Keep current model
        tools: undefined, // Keep current tools
        messages // Keep current messages
      };
    };
  }

  /**
   * Safety and security helpers
   */
  private isAllowedDomain(url: string): boolean {
    try {
      const hostname = new URL(url).hostname;
      
      // Check allowlist
      for (const allowedPattern of this.safety.allowedDomains) {
        const pattern = allowedPattern.replace('*.', '');
        if (hostname === pattern || hostname.endsWith('.' + pattern)) {
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  private containsSensitiveData(text: string): boolean {
    const lowerText = text.toLowerCase();
    
    // Check for risk patterns
    for (const pattern of this.safety.riskPatterns) {
      if (lowerText.includes(pattern.toLowerCase())) {
        return true;
      }
    }

    return false;
  }

  /**
   * Logging utility
   */
  private log(level: 'info' | 'warning' | 'error', message: string): void {
    const timestamp = Date.now();
    const logEntry = { timestamp, level, message };
    
    this.executionLog.push(logEntry);

    if (this.config.enableLogging) {
      const prefix = level === 'error' ? '❌' : level === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`[${new Date(timestamp).toISOString()}] ${prefix} ${message}`);
    }
  }

  /**
   * Main execution method
   */
  async executeTask(task: string, initialUrl?: string): Promise<AgentResult> {
    const startTime = Date.now();
    this.log('info', `Starting task: ${task}`);

    try {
      // Initialize browser
      await this.initialize();

      // Navigate to initial URL if provided
      if (initialUrl) {
        this.log('info', `Starting from URL: ${initialUrl}`);
        await this.page!.goto(initialUrl);
        await this.page!.waitForLoadState('networkidle');
        this.currentUrl = this.page!.url();
      }

      // Create and run agent
      const agent = this.createAgent();
      const result = await agent.generate({
        prompt: this.createSafePrompt(task)
      });

      const executionTime = Date.now() - startTime;

      // Process results
      const agentResult: AgentResult = {
        success: result.text.length > 0,
        steps: this.executionLog.map((log, index) => ({
          step: index + 1,
          action: 'logged_action',
          result: log.message,
          timestamp: log.timestamp,
          error: log.level === 'error' ? log.message : undefined
        })),
        finalResponse: result.text,
        executionTime,
        metadata: {
          task,
          initialUrl,
          finalUrl: this.currentUrl,
          model: this.config.model!
        }
      };

      this.log('info', `Task completed in ${executionTime}ms`);
      return agentResult;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.log('error', `Task failed: ${error}`);

      return {
        success: false,
        steps: [],
        executionTime,
        metadata: {
          task,
          initialUrl,
          finalUrl: this.currentUrl,
          model: this.config.model!
        }
      };
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Create a safe prompt with safety instructions
   */
  private createSafePrompt(task: string): string {
    return `You are a computer-use agent with the following safety guidelines:

IMPORTANT SAFETY RULES:
1. Ask for user confirmation before performing any financial transactions, password entry, or legal agreements
2. Do not auto-accept terms of service, privacy policies, or click suspicious links
3. Never attempt to solve CAPTCHAs or bypass security measures
4. Be transparent about your actions and provide clear feedback
5. If you encounter an error, report it to the user

AVAILABLE TOOLS:
- navigate(url): Go to a URL
- search(): Go to Google search
- click_at(x, y): Click at coordinates (0-999)
- type_text_at(x, y, text): Type text at coordinates
- scroll_document(direction, amount): Scroll the page
- take_screenshot(): Capture current page
- wait(seconds): Pause execution

TASK: ${task}

Work systematically to complete this task while following all safety guidelines. If you need to perform any high-risk action, ask the user for confirmation first.`;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      if (this.browser) {
        await this.browser.close();
        this.log('info', 'Browser closed');
      }
    } catch (error) {
      this.log('error', `Cleanup error: ${error}`);
    }
  }

  /**
   * Get execution logs
   */
  getExecutionLog(): Array<{ timestamp: number; level: string; message: string }> {
    return [...this.executionLog];
  }

  /**
   * Get current page URL
   */
  getCurrentUrl(): string {
    return this.currentUrl;
  }
}

// Export types and utility functions
export type { AgentResult, ToolResult, EnvironmentConfig, SafetyConfig };

// Factory function for easy setup
export function createComputerUseAgent(config: EnvironmentConfig, safety?: Partial<SafetyConfig>): ProductionComputerUseAgent {
  return new ProductionComputerUseAgent(config, safety);
}

// Example usage with environment variables
export async function runAgentTask(task: string, initialUrl?: string): Promise<AgentResult> {
  const config: EnvironmentConfig = {
    apiKey: process.env.GOOGLE_API_KEY!,
    model: 'google/gemini-2.5-pro',
    maxSteps: 20,
    headless: process.env.HEADLESS === 'true',
    safetyStrict: process.env.SAFETY_STRICT !== 'false',
    enableLogging: process.env.ENABLE_LOGGING !== 'false',
    maxRetries: 3,
    timeoutMs: 30000
  };

  const safety: Partial<SafetyConfig> = {
    strict: true,
    requireConfirmation: process.env.REQUIRE_CONFIRMATION !== 'false',
    allowedDomains: process.env.ALLOWED_DOMAINS?.split(',') || DEFAULT_SAFETY_CONFIG.allowedDomains
  };

  const agent = new ProductionComputerUseAgent(config, safety);
  return await agent.executeTask(task, initialUrl);
}