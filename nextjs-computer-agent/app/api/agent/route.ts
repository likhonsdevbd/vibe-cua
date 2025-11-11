import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateAgent, closeAgent, WebRequest, AgentResponse } from '@/lib/agent';

// POST /api/agent - Main endpoint for processing web requests
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    if (!body.action) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Action is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Create agent instance
    const agent = await getOrCreateAgent();

    // Process the request
    const result: AgentResponse = await agent.processWebRequest(body as WebRequest);

    return NextResponse.json({
      success: result.success,
      data: result,
      error: result.error,
      message: result.message,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Agent API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// GET /api/agent - Health check and agent status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'health') {
      return NextResponse.json({
        success: true,
        message: 'AI Computer Use Agent is healthy and ready',
        timestamp: new Date().toISOString(),
        status: 'operational'
      });
    }

    if (action === 'close') {
      await closeAgent();
      return NextResponse.json({
        success: true,
        message: 'Agent closed successfully',
        timestamp: new Date().toISOString()
      });
    }

    // Default response with available endpoints
    return NextResponse.json({
      success: true,
      message: 'AI Computer Use Agent API',
      endpoints: {
        'POST /api/agent': 'Process web requests (navigate, chat, screenshot, etc.)',
        'GET /api/agent?action=health': 'Health check',
        'GET /api/agent?action=close': 'Close agent'
      },
      availableActions: [
        'chat - Simple AI chat response',
        'navigate - Navigate to a URL',
        'screenshot - Take a screenshot',
        'click - Click at specific coordinates',
        'type - Type text at specific coordinates',
        'scroll - Scroll the page',
        'pageInfo - Get current page information',
        'search - Perform a Google search'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Agent GET error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// DELETE /api/agent - Close the agent
export async function DELETE() {
  try {
    await closeAgent();
    
    return NextResponse.json({
      success: true,
      message: 'Agent closed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Agent close error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to close agent',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}