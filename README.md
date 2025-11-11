# Google AI Computer Use Agent

**A production-ready computer use agent built with Vercel AI SDK and Google Generative AI**

> ⚠️ **Note**: This implementation uses the official Google Generative AI provider for Vercel AI SDK (`@ai-sdk/google`). Ensure you have a valid Google API key and proper model access.

This production computer use agent implements industry best practices for AI-powered automation while maintaining strict safety standards. Built using the Vercel AI SDK with the official Google Generative AI provider, it provides enterprise-grade reliability, comprehensive monitoring, and security-first design.

## ✨ Key Features

### Core Capabilities
- 🤖 **Intelligent Task Execution** using Google Gemini models (2.5 Pro, 2.5 Flash, etc.)
- 🛡️ **Built-in Safety Controls** with human-in-the-loop confirmation
- 🏗️ **Production-Ready Architecture** following Vercel AI SDK patterns
- 📊 **Comprehensive Monitoring** and detailed execution logs
- 🔒 **Security-First Design** with domain allowlists and risk pattern detection
- 🔗 **Official Google Integration** using `@ai-sdk/google` provider

### Technical Stack
- **Vercel AI SDK** - Enterprise-grade agent framework
- **@ai-sdk/google** - Official Google Generative AI provider
- **Google Gemini Models** - 2.5 Pro, 2.5 Flash, and other available models
- **Playwright** - Browser automation engine
- **TypeScript** - Full type safety
- **Zod Schema Validation** - Input validation

## Supported Actions

The agent can perform the following actions:

- **Navigation**: `navigate(url)`, `go_back()`, `go_forward()`, `search()`
- **Mouse Interaction**: `click_at(x, y)`, `hover_at(x, y)`, `drag_and_drop(x, y, destination_x, destination_y)`
- **Keyboard Input**: `type_text_at(x, y, text)`, `key_combination(keys)`
- **Scrolling**: `scroll_document(direction)`, `scroll_at(x, y, direction)`
- **Wait Operations**: `wait_5_seconds()`

## Quick Start

### Prerequisites

1. **Google API Key**: Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. **Node.js 18+** (for TypeScript) or **Python 3.8+** (for Python version)
3. **Internet connection** for web automation

### Installation

1. **Clone or download the agent files**
2. **Run the setup script**:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

3. **Set your API key**:
   ```bash
   export GOOGLE_API_KEY=your_api_key_here
   ```

### Basic Usage

#### Python Version

```python
import asyncio
import os
from computer_use_agent import ComputerUseAgent, AgentConfig

async def main():
    # Configure the agent
    config = AgentConfig(
        api_key=os.getenv("GOOGLE_API_KEY"),
        headless=False,  # Set to True for headless mode
        max_turns=10,
        safety_strict=True
    )
    
    # Create and run the agent
    async with ComputerUseAgent(config) as agent:
        # Define your task
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
        print(f"Execution time: {results['execution_time']:.2f} seconds")
        if 'final_response' in results:
            print(f"Final response: {results['final_response']}")

if __name__ == "__main__":
    asyncio.run(main())
```

#### TypeScript Version

```typescript
import { ComputerUseAgent } from './computer_use_agent';

async function main() {
  const agent = new ComputerUseAgent({
    headless: false,
    maxTurns: 10,
    safetyStrict: true
  });

  await agent.start();

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
}

main().catch(console.error);
```

## Configuration

### AgentConfig (Python)

```python
from computer_use_agent import AgentConfig

config = AgentConfig(
    model_name="gemini-2.5-computer-use-preview-10-2025",
    screen_width=1440,
    screen_height=900,
    max_turns=20,
    headless=False,
    timeout=30000,
    safety_strict=True,
    api_key=os.getenv("GOOGLE_API_KEY")
)
```

### AgentConfig (TypeScript)

```typescript
const config = {
  modelName: 'gemini-2.5-computer-use-preview-10-2025',
  screenWidth: 1440,
  screenHeight: 900,
  maxTurns: 20,
  headless: false,
  timeout: 30000,
  safetyStrict: true,
  apiKey: process.env.GOOGLE_API_KEY
};
```

### Configuration Options

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `model_name` | string | `"gemini-2.5-computer-use-preview-10-2025"` | Gemini model to use |
| `screen_width` | int | 1440 | Browser width in pixels |
| `screen_height` | int | 900 | Browser height in pixels |
| `max_turns` | int | 20 | Maximum agent turns per task |
| `headless` | bool | false | Run browser in headless mode |
| `timeout` | int | 30000 | Browser timeout in milliseconds |
| `safety_strict` | bool | true | Enable strict safety checks |
| `api_key` | string | None | Gemini API key |

## Safety Features

### Human-in-the-Loop Confirmation

The agent automatically requests user confirmation for:
- Financial transactions
- Password or sensitive data entry
- Legal agreements (ToS, Privacy Policy)
- CAPTCHAs or security challenges
- Account logins
- File downloads or system modifications

### Safety Rules

1. **Always ask for confirmation** before high-risk actions
2. **Never auto-accept** terms of service or legal agreements
3. **Bypass security measures** is prohibited
4. **Transparent operation** - clear feedback on all actions

### Custom Safety Rules

You can add custom safety rules by modifying the `highRiskPatterns` list:

```python
# Python
agent.high_risk_patterns.extend([
    "delete", "remove", "install", "download"
])

// TypeScript
agent.highRiskPatterns.push(
  'delete', 'remove', 'install', 'download'
);
```

## Advanced Usage

### Custom Function Execution

The agent supports custom function definitions for specialized tasks:

```python
# Python example
def open_app(app_name: str) -> dict:
    """Opens an application by name."""
    return {"status": "requested_open", "app_name": app_name}

# Add to agent configuration
custom_functions = [
    types.FunctionDeclaration.from_callable(client=client, callable=open_app)
]
```

### Domain Restrictions

Limit the agent to specific domains:

```python
agent.allowed_domains = {
    "*.google.com",
    "*.github.com", 
    "*.stackoverflow.com"
}
```

### Parallel Function Execution

The agent can execute multiple actions in parallel for efficiency:

```python
# The agent automatically handles parallel function calls
# when multiple actions are returned in a single turn
```

## Examples

### 1. Web Research Task

```python
user_prompt = """
Search for the latest AI news on TechCrunch, 
find articles about machine learning from 2025, 
and create a summary of the top 3 trends.
"""
```

### 2. Form Automation

```python
user_prompt = """
Go to a job application website, 
fill out the contact form with:
- Name: John Doe  
- Email: john@example.com
- Position: Software Engineer
"""
```

### 3. Data Extraction

```python
user_prompt = """
Go to a product comparison site,
compare 3 different laptops,
and extract their specifications and prices.
"""
```

## Error Handling

The agent includes comprehensive error handling:

- **Network timeouts**: Automatic retry with exponential backoff
- **Browser errors**: Graceful degradation and user notification
- **API errors**: Rate limiting and error recovery
- **Safety violations**: Immediate halt and user confirmation

## Performance Optimization

### Best Practices

1. **Set appropriate timeouts** for your use case
2. **Use headless mode** for production deployments
3. **Limit max_turns** to prevent infinite loops
4. **Enable safety_strict** for production use
5. **Monitor execution logs** for optimization opportunities

### Monitoring

Access detailed execution logs:

```python
# Python
results = await agent.run_agent_loop(user_prompt)
print(f"Turns executed: {len(results['turns'])}")
for turn in results['turns']:
    print(f"Turn {turn['turn']}: {turn['function_calls']}")
```

## Troubleshooting

### Common Issues

1. **API Key Error**:
   ```bash
   export GOOGLE_API_KEY=your_api_key_here
   ```

2. **Browser Installation**:
   ```bash
   # Python
   playwright install chromium
   
   # TypeScript
   npx playwright install chromium
   ```

3. **Permission Errors**:
   ```bash
   chmod +x setup.sh
   ```

4. **Network Issues**:
   - Check internet connection
   - Verify firewall settings
   - Ensure ports are not blocked

### Debug Mode

Enable detailed logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## API Reference

### ComputerUseAgent Class

#### Python Methods

- `start()`: Initialize browser and agent
- `stop()`: Cleanup and close browser
- `run_agent_loop(user_prompt, initial_url, safety_confirmation)`: Execute task
- `take_screenshot()`: Capture current page state
- `execute_function_call(function_call)`: Execute individual function

#### TypeScript Methods

- `start(): Promise<void>`: Initialize browser and agent
- `stop(): Promise<void>`: Cleanup and close browser
- `runAgentLoop(userPrompt, initialURL, safetyConfirmation): Promise<AgentResults>`: Execute task
- `takeScreenshot(): Promise<Buffer>`: Capture current page state
- `executeFunctionCall(functionCall): Promise<Record<string, any>>`: Execute individual function

## Limitations

- **Preview Model**: Gemini 2.5 Computer Use is still in preview
- **Browser Only**: Currently optimized for web browser automation
- **Rate Limits**: Subject to API rate limits
- **Context Window**: Limited by Gemini's token limits
- **Visual Understanding**: Performance depends on screenshot quality

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the examples directory
3. Open an issue on the repository
4. Contact the development team

---

**Author**: MiniMax Agent  
**Version**: 1.0.0  
**Last Updated**: 2025-11-11  
**Model**: Gemini 2.5 Computer Use Preview
