# AI Computer Use Agent - Web Application

A modern web application that enables AI-powered computer use and web automation through natural language interactions. Built with Next.js, Vercel AI SDK, and Google Gemini.

![AI Computer Use Agent](https://img.shields.io/badge/AI-Computer%20Use-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Vercel AI SDK](https://img.shields.io/badge/Vercel%20AI%20SDK-6.8-green)

## Features

🤖 **AI-Powered Web Automation**
- Natural language to computer actions
- Intelligent web page analysis and interaction
- Real-time browser automation
- Multi-step task execution

🌐 **Professional Web Interface**
- Modern chat interface with AI SDK Elements
- Real-time conversation and action history
- Visual feedback and progress tracking
- Responsive design for all devices

🛡️ **Built-in Safety & Security**
- Domain filtering and validation
- Sensitive content detection
- Session management and isolation
- User confirmation for sensitive operations

⚡ **High Performance**
- Optimized for fast response times
- Efficient browser management
- Streaming responses and real-time updates
- Production-ready error handling

## Quick Start

### Prerequisites

- Node.js 18.17.0 or later
- npm or yarn
- Google Generative AI API key

### Installation

1. **Clone and setup the project:**
```bash
cd nextjs-computer-agent
npm install
```

2. **Install Playwright browsers:**
```bash
npx playwright install
```

3. **Configure environment variables:**
```bash
cp .env.local .env.local
# Edit .env.local and add your Google AI API key
```

4. **Set up Google AI API key:**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Generate a new API key
   - Add it to `.env.local`:
   ```
   GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
   ```

5. **Start the development server:**
```bash
npm run dev
```

6. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## API Usage

### Main Endpoint: `/api/agent`

#### Chat (Simple AI conversation)
```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{
    "action": "chat",
    "message": "Hello! How can you help me with web automation?"
  }'
```

#### Navigate to URL
```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{
    "action": "navigate",
    "url": "https://github.com"
  }'
```

#### Take Screenshot
```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{
    "action": "screenshot"
  }'
```

#### Click at Coordinates
```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{
    "action": "click",
    "x": 100,
    "y": 200
  }'
```

#### Type Text
```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{
    "action": "type",
    "x": 100,
    "y": 200,
    "text": "Hello World"
  }'
```

#### Scroll Page
```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{
    "action": "scroll",
    "direction": "down",
    "amount": 500
  }'
```

#### Get Page Information
```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{
    "action": "pageInfo"
  }'
```

#### Search
```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{
    "action": "search",
    "query": "AI computer use",
    "site": "wikipedia.org"
  }'
```

### Health Check
```bash
curl http://localhost:3000/api/agent?action=health
```

### Close Agent
```bash
curl -X DELETE http://localhost:3000/api/agent
```

## Web Interface

The web application provides a comprehensive chat interface for interacting with the AI computer use agent.

### Main Features:
- **Chat Interface**: Natural language conversation with AI
- **Real-time Actions**: Live browser automation with visual feedback
- **Control Panel**: Manual controls for navigation, screenshots, and actions
- **Session Management**: Persistent conversations and action history
- **Responsive Design**: Works on desktop, tablet, and mobile devices

### Usage:
1. Start a session with an optional initial URL
2. Chat naturally with the AI about what you want to do
3. The AI will perform web actions automatically
4. View results and continue the conversation
5. Use the control panel for manual interventions

## Architecture

### Backend Components
- **Next.js API Routes**: RESTful endpoints for agent interactions
- **Google AI Web Agent**: Core automation logic
- **Browser Manager**: Playwright-based browser automation
- **Safety & Validation**: Domain filtering and content validation

### Frontend Components
- **Chat Interface**: Real-time conversation UI
- **Control Panel**: Manual browser controls
- **Status Indicators**: Real-time feedback and progress
- **Responsive Design**: Mobile-first responsive layout

### Tech Stack
- **Framework**: Next.js 14 with App Router
- **AI SDK**: Vercel AI SDK 6.8.2
- **AI Provider**: Google Generative AI (Gemini 2.5 Pro)
- **Browser Automation**: Playwright
- **UI Framework**: shadcn/ui + Tailwind CSS
- **Language**: TypeScript throughout

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Your Google AI API key | Required |
| `AGENT_MODEL` | Gemini model to use | `gemini-2.5-pro` |
| `AGENT_MAX_STEPS` | Maximum automation steps | `20` |
| `AGENT_TIMEOUT_MS` | Request timeout in milliseconds | `30000` |
| `AGENT_HEADLESS` | Run browser in headless mode | `true` |
| `AGENT_SAFETY_STRICT` | Enable strict safety mode | `true` |
| `AGENT_ALLOWED_DOMAINS` | Comma-separated list of allowed domains | See `.env.local` |
| `ENABLE_VERBOSE_LOGGING` | Enable detailed logging | `false` |

### Customization

#### Adding New Tools
1. Add tool definition to `lib/agent.ts`
2. Update the `WebRequest` type in `types/index.ts`
3. Add UI controls if needed in the chat interface

#### Modifying Safety Rules
Edit the `DEFAULT_SAFETY` configuration in `lib/agent.ts`:
```typescript
const DEFAULT_SAFETY: SafetyConfig = {
  strict: true,
  requireConfirmation: true,
  allowedDomains: ['*.trusted-domain.com'],
  blockedActions: ['delete', 'install'],
  riskPatterns: ['password', 'credit card']
};
```

## Development

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# ESLint
npm run lint
```

### Project Structure

```
nextjs-computer-agent/
├── app/
│   ├── api/agent/route.ts    # Main API endpoint
│   ├── chat/page.tsx         # Chat interface
│   ├── page.tsx              # Landing page
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── components/
│   ├── ui/                   # shadcn/ui components
│   └── ...                   # Custom components
├── lib/
│   ├── agent.ts              # AI agent logic
│   └── utils.ts              # Utility functions
├── types/
│   └── index.ts              # TypeScript definitions
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── next.config.js
```

## Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Set environment variables in Vercel dashboard:**
   - `GOOGLE_GENERATIVE_AI_API_KEY`
   - `AGENT_MODEL`
   - Other configuration variables
3. **Deploy automatically on push**

### Docker

```dockerfile
# Build the application
npm run build

# Run with Playwright dependencies
docker run -p 3000:3000 \
  -e GOOGLE_GENERATIVE_AI_API_KEY=your_key \
  your-app-name
```

### Manual Deployment

1. Build the application: `npm run build`
2. Start the production server: `npm start`
3. Ensure Playwright browsers are installed on the server

## Troubleshooting

### Common Issues

**Browser not starting:**
- Ensure Playwright is installed: `npx playwright install`
- Check if running in headless mode: set `AGENT_HEADLESS=false` for debugging

**API key errors:**
- Verify your Google AI API key is correct
- Check if the API key has proper permissions
- Ensure you haven't exceeded API quotas

**Permission errors:**
- Make sure the application has proper file system permissions
- Check if running in a restricted environment (some hosting providers restrict Playwright)

**Timeout errors:**
- Increase `AGENT_TIMEOUT_MS` in environment variables
- Check network connectivity and API response times

### Debug Mode

Enable verbose logging for debugging:
```bash
ENABLE_VERBOSE_LOGGING=true npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Search existing GitHub issues
3. Create a new issue with detailed information

## Acknowledgments

- [Vercel AI SDK](https://ai-sdk.dev/) for the excellent AI framework
- [Google Generative AI](https://ai.google.dev/) for the powerful language models
- [Playwright](https://playwright.dev/) for reliable browser automation
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Next.js](https://nextjs.org/) for the robust web framework

---

Built by **MiniMax Agent** • Powered by Vercel AI SDK and Google Gemini