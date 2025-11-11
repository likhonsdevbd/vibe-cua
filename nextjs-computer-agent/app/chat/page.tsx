'use client'

import { useState, useEffect, useRef } from 'react'
import { generateText } from 'ai'
import { google } from '@ai-sdk/google'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Message, WebRequest, AgentResponse } from '@/types'
import { 
  Send, 
  Bot, 
  User, 
  Globe, 
  MousePointer, 
  Keyboard, 
  Camera, 
  Search, 
  RotateCcw, 
  Settings,
  Maximize2,
  Minimize2,
  ExternalLink,
  Loader2
} from 'lucide-react'
import { cn, formatRelativeTime } from '@/lib/utils'

interface ChatState {
  messages: Message[]
  isLoading: boolean
  currentURL: string
  pageTitle: string
  isFullscreen: boolean
  showControlPanel: boolean
}

export default function ChatPage() {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    currentURL: '',
    pageTitle: '',
    isFullscreen: false,
    showControlPanel: false
  })
  
  const [inputMessage, setInputMessage] = useState('')
  const [initialURL, setInitialURL] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [state.messages])

  const addMessage = (content: string, role: 'user' | 'assistant', metadata?: any) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      role,
      timestamp: new Date(),
      metadata
    }

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }))
  }

  const sendMessage = async (message: string, action: 'chat' | 'navigate' | 'screenshot' = 'chat') => {
    if (!message.trim()) return

    setState(prev => ({ ...prev, isLoading: true }))
    addMessage(message, 'user')

    try {
      let response: AgentResponse

      if (action === 'navigate' && initialURL) {
        // Navigate to URL first
        const navigateRequest: WebRequest = {
          action: 'navigate',
          url: initialURL
        }
        
        const navigateResponse = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(navigateRequest)
        })
        
        const navigateResult = await navigateResponse.json()
        
        if (navigateResult.success) {
          setState(prev => ({
            ...prev,
            currentURL: navigateResult.data.url,
            pageTitle: navigateResult.data.title
          }))
          addMessage(`Successfully navigated to ${navigateResult.data.title}`, 'assistant')
        }

        // Then send the chat message
        const chatRequest: WebRequest = {
          action: 'chat',
          message: message
        }

        const chatResponse = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(chatRequest)
        })

        const chatResult = await chatResponse.json()
        response = chatResult
      } else {
        // Send direct request
        const request: WebRequest = {
          action,
          message
        }

        const apiResponse = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request)
        })

        response = await apiResponse.json()
      }

      if (response.success) {
        addMessage(response.message, 'assistant', response)
      } else {
        addMessage(`Error: ${response.error}`, 'assistant')
      }
    } catch (error) {
      addMessage(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'assistant')
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
      setInputMessage('')
    }
  }

  const quickActions = [
    {
      icon: Globe,
      label: 'Navigate',
      action: () => {
        if (initialURL) {
          sendMessage(`Navigate to ${initialURL} and help me with the page content`, 'navigate')
        }
      },
      disabled: !initialURL
    },
    {
      icon: Camera,
      label: 'Screenshot',
      action: () => sendMessage('Take a screenshot of the current page', 'screenshot')
    },
    {
      icon: Search,
      label: 'Search',
      action: () => sendMessage('Search for relevant information on this page')
    },
    {
      icon: MousePointer,
      label: 'Click Test',
      action: () => sendMessage('Show me what clickable elements are available on this page')
    }
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputMessage.trim()) {
      sendMessage(inputMessage)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">AI Computer Use Agent</h1>
                <p className="text-sm text-muted-foreground">
                  Intelligent web automation and interaction
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {state.currentURL && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-muted/50 text-sm">
                  <Globe className="h-4 w-4" />
                  <span className="truncate max-w-48">{state.pageTitle || 'Loading...'}</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => window.open(state.currentURL, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setState(prev => ({ ...prev, showControlPanel: !prev.showControlPanel }))}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Initial URL Input */}
          {state.messages.length === 0 && (
            <div className="container mx-auto px-4 py-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Start a Computer Use Session</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Initial URL (Optional)
                    </label>
                    <Input
                      placeholder="https://example.com"
                      value={initialURL}
                      onChange={(e) => setInitialURL(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Start with a specific website to automate interactions
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => sendMessage('Hello! Help me interact with websites.', 'chat')}
                      disabled={state.isLoading}
                    >
                      Start Chat
                    </Button>
                    {initialURL && (
                      <Button 
                        variant="outline"
                        onClick={() => sendMessage('Navigate to the provided URL', 'navigate')}
                        disabled={state.isLoading}
                      >
                        Navigate & Start
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 py-4 space-y-4">
              {state.messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-4 py-2",
                      message.role === 'user'
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {message.metadata && (
                      <div className="mt-2 pt-2 border-t border-border/20">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatRelativeTime(message.timestamp)}</span>
                          {message.metadata.stepsCompleted && (
                            <span>• {message.metadata.stepsCompleted} steps</span>
                          )}
                          {message.metadata.executionTime && (
                            <span>• {message.metadata.executionTime}ms</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {message.role === 'user' && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              
              {state.isLoading && (
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Quick Actions */}
          {state.messages.length > 0 && (
            <div className="border-t bg-card/30">
              <div className="container mx-auto px-4 py-3">
                <div className="flex gap-2 overflow-x-auto">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={action.action}
                      disabled={action.disabled || state.isLoading}
                      className="whitespace-nowrap"
                    >
                      <action.icon className="h-4 w-4 mr-2" />
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t bg-background">
            <div className="container mx-auto px-4 py-4">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Textarea
                  placeholder="Type your message or describe what you want to do..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="min-h-[60px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit(e)
                    }
                  }}
                />
                <Button 
                  type="submit" 
                  disabled={!inputMessage.trim() || state.isLoading}
                  className="px-6"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Control Panel */}
        {state.showControlPanel && (
          <div className="w-80 border-l bg-card/50">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Control Panel</h3>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Current URL
                </label>
                <div className="text-sm text-muted-foreground break-all">
                  {state.currentURL || 'No page loaded'}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Page Title
                </label>
                <div className="text-sm text-muted-foreground">
                  {state.pageTitle || 'No title'}
                </div>
              </div>
              
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => sendMessage('Get current page information')}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Page Info
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => sendMessage('Take a screenshot')}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Screenshot
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => sendMessage('Scroll down the page')}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Scroll Down
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}