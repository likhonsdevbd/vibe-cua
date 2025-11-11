#!/usr/bin/env python3
"""
Gemini 2.5 Computer Use Agent
A comprehensive computer-using agent that can perform tasks on your behalf.
Built using Google's Gemini 2.5 Computer Use model and Playwright for browser control.

Author: MiniMax Agent
Date: 2025-11-11
"""

import asyncio
import base64
import json
import time
import logging
from typing import Any, Dict, List, Optional, Tuple, Union
from dataclasses import dataclass
from pathlib import Path
import os

# Core dependencies
from playwright.async_api import async_playwright, Browser, Page, BrowserContext
from google import genai
from google.genai import types
from google.genai.types import Content, Part, FunctionResponse, FunctionResponsePart, FunctionResponseBlob

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class AgentConfig:
    """Configuration for the computer-use agent."""
    model_name: str = "gemini-2.5-computer-use-preview-10-2025"
    screen_width: int = 1440
    screen_height: int = 900
    max_turns: int = 20
    headless: bool = False
    timeout: int = 30000
    safety_strict: bool = True
    
    # API Configuration
    api_key: Optional[str] = None
    base_url: Optional[str] = None


class ComputerUseAgent:
    """
    A computer-using agent powered by Gemini 2.5 Computer Use model.
    
    This agent can autonomously interact with computer interfaces, perform tasks
    like web browsing, form filling, and data extraction while maintaining safety.
    """
    
    def __init__(self, config: AgentConfig = None):
        """Initialize the computer-use agent."""
        self.config = config or AgentConfig()
        self.client = None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self.playwright = None
        self.conversation_history: List[Content] = []
        self.current_url = ""
        
        # Safety and security settings
        self.allowed_domains = set()
        self.blocked_actions = set()
        self.high_risk_patterns = [
            "password", "credit card", "bank", "financial", "money",
            "delete", "remove", "install", "download", "file"
        ]
        
        # Initialize API client
        if self.config.api_key:
            os.environ["GOOGLE_API_KEY"] = self.config.api_key
        
        try:
            self.client = genai.Client()
        except Exception as e:
            logger.error(f"Failed to initialize Gemini client: {e}")
            raise
    
    async def __aenter__(self):
        """Async context manager entry."""
        await self.start()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.stop()
    
    async def start(self):
        """Start the browser and initialize the agent."""
        logger.info("Starting computer-use agent...")
        
        # Initialize Playwright
        self.playwright = await async_playwright().start()
        
        # Launch browser
        self.browser = await self.playwright.chromium.launch(
            headless=self.config.headless,
            args=[
                '--no-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        )
        
        # Create browser context
        self.context = await self.browser.new_context(
            viewport={"width": self.config.screen_width, "height": self.config.screen_height},
            java_script_enabled=True,
            ignore_https_errors=True
        )
        
        # Create new page
        self.page = await self.context.new_page()
        
        # Set up event listeners
        await self.page.set_default_timeout(self.config.timeout)
        
        logger.info("Browser initialized successfully")
    
    async def stop(self):
        """Stop the browser and cleanup resources."""
        logger.info("Stopping computer-use agent...")
        
        if self.browser:
            await self.browser.close()
        
        if self.playwright:
            await self.playwright.stop()
        
        logger.info("Computer-use agent stopped")
    
    def get_safety_config(self) -> types.ThinkingConfig:
        """Get thinking configuration for safety."""
        return types.ThinkingConfig(include_thoughts=True)
    
    def get_computer_use_config(self, 
                               allowed_domains: List[str] = None,
                               excluded_functions: List[str] = None,
                               custom_functions: List[types.FunctionDeclaration] = None) -> types.Tool:
        """Get computer use tool configuration."""
        return types.Tool(
            computer_use=types.ComputerUse(
                environment=types.Environment.ENVIRONMENT_BROWSER,
                # Exclude high-risk functions if safety is strict
                excluded_predefined_functions=excluded_functions or self._get_excluded_functions(),
            )
        )
    
    def _get_excluded_functions(self) -> List[str]:
        """Get list of functions to exclude based on safety settings."""
        excluded = []
        if self.config.safety_strict:
            # Exclude functions that could be dangerous in strict mode
            excluded = [
                "key_combination",  # Prevent arbitrary key combinations
                "drag_and_drop",    # Prevent complex drag operations
            ]
        return excluded
    
    async def take_screenshot(self) -> bytes:
        """Take a screenshot of the current page state."""
        if not self.page:
            raise RuntimeError("Browser not initialized")
        
        screenshot = await self.page.screenshot(type="png", full_page=True)
        self.current_url = self.page.url
        return screenshot
    
    def denormalize_coordinates(self, x: int, y: int) -> Tuple[int, int]:
        """
        Convert normalized coordinates (0-999) to actual pixel coordinates.
        
        Args:
            x: Normalized x coordinate (0-999)
            y: Normalized y coordinate (0-999)
        
        Returns:
            Tuple of actual pixel coordinates
        """
        actual_x = int(x * self.config.screen_width / 1000)
        actual_y = int(y * self.config.screen_height / 1000)
        return actual_x, actual_y
    
    def check_safety_decision(self, function_call: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Check if an action requires user confirmation based on safety analysis.
        
        Args:
            function_call: The function call to analyze
        
        Returns:
            Tuple of (requires_confirmation: bool, reason: str)
        """
        # Check for safety_decision in the function call
        if 'safety_decision' in function_call:
            safety_decision = function_call['safety_decision']
            if safety_decision.get('type') == 'require_confirmation':
                return True, safety_decision.get('explanation', 'Action requires confirmation')
        
        # Check function name for high-risk actions
        function_name = function_call.get('name', '')
        if any(pattern in function_name.lower() for pattern in self.high_risk_patterns):
            return True, f"Action '{function_name}' involves high-risk operations"
        
        # Check arguments for sensitive data
        args = function_call.get('args', {})
        args_str = str(args).lower()
        if any(pattern in args_str for pattern in self.high_risk_patterns):
            return True, "Action involves sensitive data or operations"
        
        return False, ""
    
    async def execute_function_call(self, function_call: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a function call on the browser.
        
        Args:
            function_call: The function call to execute
        
        Returns:
            Result of the function execution
        """
        function_name = function_call.get('name')
        args = function_call.get('args', {})
        
        logger.info(f"Executing function: {function_name} with args: {args}")
        
        try:
            if function_name == "navigate":
                url = args.get('url')
                if not url:
                    raise ValueError("Navigate requires 'url' argument")
                
                await self.page.goto(url)
                await self.page.wait_for_load_state('networkidle')
                
                return {
                    "status": "success",
                    "url": self.page.url,
                    "title": await self.page.title()
                }
            
            elif function_name == "click_at":
                x, y = self.denormalize_coordinates(args.get('x', 0), args.get('y', 0))
                await self.page.click(f"xpath=//*[@x='{x}' and @y='{y}']", position={'x': x, 'y': y})
                
                return {"status": "success", "position": {"x": x, "x": y}}
            
            elif function_name == "type_text_at":
                x, y = self.denormalize_coordinates(args.get('x', 0), args.get('y', 0))
                text = args.get('text', '')
                clear_before = args.get('clear_before_typing', True)
                press_enter = args.get('press_enter', True)
                
                # Try to focus the element at coordinates
                try:
                    await self.page.click(f"xpath=//*[@x='{x}' and @y='{y}']", position={'x': x, 'y': y})
                except:
                    # Fallback: click at coordinates
                    await self.page.mouse.click(x, y)
                
                if clear_before:
                    await self.page.keyboard.press('Control+a')
                
                await self.page.keyboard.type(text)
                
                if press_enter:
                    await self.page.keyboard.press('Enter')
                
                return {"status": "success", "text": text, "position": {"x": x, "y": y}}
            
            elif function_name == "scroll_document":
                direction = args.get('direction', 'down')
                if direction == 'down':
                    await self.page.keyboard.press('PageDown')
                elif direction == 'up':
                    await self.page.keyboard.press('PageUp')
                elif direction == 'left':
                    await self.page.keyboard.press('Control+PageUp')
                elif direction == 'right':
                    await self.page.keyboard.press('Control+PageDown')
                
                return {"status": "success", "direction": direction}
            
            elif function_name == "scroll_at":
                x, y = self.denormalize_coordinates(args.get('x', 0), args.get('y', 0))
                direction = args.get('direction', 'down')
                magnitude = args.get('magnitude', 800)
                
                # Calculate scroll amount based on magnitude
                scroll_amount = int(magnitude / 10)
                
                if direction == 'down':
                    await self.page.evaluate(f"window.scrollBy(0, {scroll_amount})")
                elif direction == 'up':
                    await self.page.evaluate(f"window.scrollBy(0, -{scroll_amount})")
                elif direction == 'left':
                    await self.page.evaluate(f"window.scrollBy({-scroll_amount}, 0)")
                elif direction == 'right':
                    await self.page.evaluate(f"window.scrollBy({scroll_amount}, 0)")
                
                return {"status": "success", "position": {"x": x, "y": y}, "direction": direction}
            
            elif function_name == "wait_5_seconds":
                await asyncio.sleep(5)
                return {"status": "success", "waited": 5}
            
            elif function_name == "go_back":
                await self.page.go_back()
                await self.page.wait_for_load_state('networkidle')
                return {"status": "success", "url": self.page.url}
            
            elif function_name == "go_forward":
                await self.page.go_forward()
                await self.page.wait_for_load_state('networkidle')
                return {"status": "success", "url": self.page.url}
            
            elif function_name == "search":
                await self.page.goto("https://www.google.com")
                await self.page.wait_for_load_state('networkidle')
                return {"status": "success", "url": self.page.url}
            
            elif function_name == "key_combination":
                keys = args.get('keys', '')
                await self.page.keyboard.press(keys)
                return {"status": "success", "keys": keys}
            
            else:
                logger.warning(f"Unknown function: {function_name}")
                return {"status": "error", "message": f"Unknown function: {function_name}"}
        
        except Exception as e:
            logger.error(f"Error executing function {function_name}: {e}")
            return {"status": "error", "error": str(e)}
    
    async def ask_user_confirmation(self, function_call: Dict[str, Any], reason: str) -> bool:
        """
        Ask the user for confirmation before executing a potentially risky action.
        
        Args:
            function_call: The function call that requires confirmation
            reason: Reason why confirmation is needed
        
        Returns:
            True if user confirms, False otherwise
        """
        print(f"\n⚠️  SAFETY WARNING ⚠️")
        print(f"Function: {function_call.get('name')}")
        print(f"Arguments: {function_call.get('args', {})}")
        print(f"Reason: {reason}")
        print("\nThis action may have significant consequences. Do you want to proceed?")
        
        while True:
            response = input("Enter 'Y' to proceed, 'N' to cancel: ").strip().lower()
            if response in ['y', 'yes']:
                return True
            elif response in ['n', 'no']:
                return False
            else:
                print("Please enter 'Y' or 'N'")
    
    def create_function_responses(self, function_results: List[Dict[str, Any]]) -> List[Content]:
        """
        Create function response content for the next API call.
        
        Args:
            function_results: List of function execution results
        
        Returns:
            List of Content objects with function responses
        """
        content_parts = []
        
        for result in function_results:
            function_name = result.get('function_name', 'unknown')
            
            # Create function response with metadata
            response_data = {
                "status": result.get('status', 'unknown'),
                "url": self.current_url,
                "timestamp": time.time()
            }
            
            # Add specific result data
            if result.get('status') == 'success':
                response_data.update(result.get('result', {}))
            
            function_response = FunctionResponse(
                name=function_name,
                response=response_data
            )
            
            # Take a screenshot and add it to the response
            try:
                screenshot = asyncio.create_task(self.take_screenshot())
                screenshot_data = await screenshot
                
                function_response_part = FunctionResponsePart(
                    inline_data=FunctionResponseBlob(
                        mime_type="image/png",
                        data=screenshot_data
                    )
                )
                function_response.parts = [function_response_part]
            except Exception as e:
                logger.error(f"Failed to take screenshot: {e}")
            
            content_parts.append(Part(function_response=function_response))
        
        return [Content(role="user", parts=content_parts)]
    
    async def run_agent_loop(self, 
                           user_prompt: str,
                           initial_url: str = None,
                           safety_confirmation: bool = True) -> Dict[str, Any]:
        """
        Run the main agent loop to complete a task.
        
        Args:
            user_prompt: The task description for the agent
            initial_url: Optional starting URL
            safety_confirmation: Whether to ask for user confirmation for risky actions
        
        Returns:
            Dictionary containing execution results and final status
        """
        logger.info(f"Starting agent loop for task: {user_prompt}")
        
        # Navigate to initial URL if provided
        if initial_url:
            await self.page.goto(initial_url)
            await self.page.wait_for_load_state('networkidle')
        
        # Take initial screenshot
        initial_screenshot = await self.take_screenshot()
        
        # Create initial content
        user_content = Content(
            role="user", 
            parts=[
                Part(text=user_prompt),
                Part.from_bytes(data=initial_screenshot, mime_type='image/png')
            ]
        )
        
        self.conversation_history = [user_content]
        
        # Configure the model
        config = types.GenerateContentConfig(
            tools=[self.get_computer_use_config()],
            thinking_config=self.get_safety_config(),
        )
        
        # Agent execution loop
        results = {
            "task": user_prompt,
            "initial_url": initial_url or self.current_url,
            "turns": [],
            "success": False,
            "final_url": self.current_url,
            "execution_time": time.time()
        }
        
        for turn in range(self.config.max_turns):
            logger.info(f"--- Turn {turn + 1} ---")
            
            try:
                # Make API call
                response = self.client.models.generate_content(
                    model=self.config.model_name,
                    contents=self.conversation_history,
                    config=config
                )
                
                candidate = response.candidates[0]
                self.conversation_history.append(candidate.content)
                
                # Check if agent has finished the task
                if not any(part.function_call for part in candidate.content.parts):
                    # Agent has provided a final response
                    text_response = " ".join([part.text for part in candidate.content.parts if part.text])
                    results["success"] = True
                    results["final_response"] = text_response
                    logger.info(f"Agent completed task: {text_response}")
                    break
                
                # Process function calls
                function_calls = [part.function_call for part in candidate.content.parts if part.function_call]
                function_results = []
                
                for function_call in function_calls:
                    function_dict = {
                        'name': function_call.name,
                        'args': dict(function_call.args) if function_call.args else {}
                    }
                    
                    # Check if action requires confirmation
                    if safety_confirmation:
                        requires_confirmation, reason = self.check_safety_decision(function_dict)
                        if requires_confirmation:
                            confirmed = await self.ask_user_confirmation(function_dict, reason)
                            if not confirmed:
                                logger.info("User cancelled action")
                                function_dict['status'] = 'cancelled'
                                function_dict['reason'] = reason
                                function_results.append({
                                    'function_name': function_dict['name'],
                                    'result': function_dict,
                                    'status': 'cancelled'
                                })
                                continue
                            else:
                                function_dict['args']['safety_acknowledged'] = 'true'
                    
                    # Execute the function
                    try:
                        execution_result = await self.execute_function_call(function_dict)
                        function_results.append({
                            'function_name': function_dict['name'],
                            'result': execution_result,
                            'status': execution_result.get('status', 'unknown')
                        })
                    except Exception as e:
                        logger.error(f"Error executing function: {e}")
                        function_results.append({
                            'function_name': function_dict['name'],
                            'result': {'error': str(e)},
                            'status': 'error'
                        })
                
                # Add function responses to conversation
                function_response_content = self.create_function_responses(function_results)
                self.conversation_history.extend(function_response_content)
                
                # Record this turn
                results["turns"].append({
                    "turn": turn + 1,
                    "function_calls": [fc.name for fc in function_calls],
                    "results": function_results,
                    "timestamp": time.time()
                })
                
                # Check if all function calls failed
                if all(result['status'] in ['error', 'cancelled'] for result in function_results):
                    logger.warning("All function calls failed or were cancelled")
                    break
                
            except Exception as e:
                logger.error(f"Error in turn {turn + 1}: {e}")
                results["turns"].append({
                    "turn": turn + 1,
                    "error": str(e),
                    "timestamp": time.time()
                })
                break
        
        results["execution_time"] = time.time() - results["execution_time"]
        results["final_url"] = self.current_url
        
        logger.info(f"Agent loop completed in {len(results['turns'])} turns")
        return results


# Example usage and utility functions
async def main():
    """Example usage of the ComputerUseAgent."""
    # Configuration
    config = AgentConfig(
        api_key=os.getenv("GOOGLE_API_KEY"),  # Set your API key
        headless=False,  # Set to True for headless mode
        max_turns=10,    # Maximum number of agent turns
        safety_strict=True
    )
    
    # Create and run the agent
    async with ComputerUseAgent(config) as agent:
        # Example task: Search for information and navigate
        user_prompt = """
        Go to google.com, search for "latest AI developments 2025", 
        click on the first result, and summarize what you find.
        """
        
        results = await agent.run_agent_loop(
            user_prompt=user_prompt,
            initial_url="https://google.com",
            safety_confirmation=True
        )
        
        print(f"\n=== AGENT RESULTS ===")
        print(f"Task: {results['task']}")
        print(f"Success: {results['success']}")
        print(f"Turns: {len(results['turns'])}")
        print(f"Final URL: {results['final_url']}")
        print(f"Execution time: {results['execution_time']:.2f} seconds")
        
        if "final_response" in results:
            print(f"Final Response: {results['final_response']}")


if __name__ == "__main__":
    # Run the example
    asyncio.run(main())