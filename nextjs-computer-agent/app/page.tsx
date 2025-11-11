'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Bot, 
  Globe, 
  MousePointer, 
  Keyboard, 
  Camera, 
  Search, 
  Zap, 
  Shield, 
  Smartphone,
  ArrowRight,
  Play,
  CheckCircle,
  Clock,
  Users
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleStartDemo = async () => {
    setIsLoading(true)
    
    // Check if API is available
    try {
      const response = await fetch('/api/agent?action=health')
      const result = await response.json()
      
      if (result.success) {
        router.push('/chat')
      } else {
        alert('AI Agent service is not available. Please ensure the API is running.')
      }
    } catch (error) {
      console.error('Error starting demo:', error)
      alert('Failed to start demo. Please check the console for details.')
    }
    setIsLoading(false)
  }

  const handleScrollToFeatures = () => {
    const featuresSection = document.getElementById('features')
    featuresSection?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div id="main-content">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10" />
          <div className="relative container mx-auto px-4 py-24 sm:py-32">
            <div className="text-center space-y-8">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 rounded-full bg-primary/10">
                    <Bot className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
                  AI Computer Use Agent
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Intelligent web automation and interaction using Vercel AI SDK with Google Generative AI
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  onClick={handleStartDemo}
                  disabled={isLoading}
                  size="lg"
                  className="gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                      Starting Demo...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Try Demo Now
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleScrollToFeatures}
                  className="gap-2"
                >
                  Learn More
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Powerful AI-Driven Web Automation
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Experience the future of web interaction with our intelligent computer use agent
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Globe,
                  title: 'Smart Navigation',
                  description: 'Navigate to any website and analyze page content intelligently'
                },
                {
                  icon: MousePointer,
                  title: 'Precise Interactions',
                  description: 'Click, type, and interact with web elements with human-like precision'
                },
                {
                  icon: Camera,
                  title: 'Visual Understanding',
                  description: 'Take screenshots and analyze page layouts and visual content'
                },
                {
                  icon: Search,
                  title: 'Intelligent Search',
                  description: 'Search within pages and across the web with contextual understanding'
                },
                {
                  icon: Keyboard,
                  title: 'Form Automation',
                  description: 'Fill forms, input data, and automate repetitive web tasks'
                },
                {
                  icon: Zap,
                  title: 'Lightning Fast',
                  description: 'Execute complex web tasks quickly and efficiently'
                }
              ].map((feature, index) => (
                <Card key={index} className="h-full">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <feature.icon className="h-5 w-5 text-primary" />
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Getting Started Section */}
        <section className="py-24 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center space-y-4 mb-12">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Get Started in Minutes
                </h2>
                <p className="text-xl text-muted-foreground">
                  Follow these simple steps to start using the AI Computer Use Agent
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    step: '01',
                    title: 'Set Up Your API Key',
                    description: 'Configure your Google Generative AI API key to enable AI capabilities',
                    icon: Shield
                  },
                  {
                    step: '02', 
                    title: 'Start the Chat Interface',
                    description: 'Click the demo button to open the interactive chat interface',
                    icon: Users
                  },
                  {
                    step: '03',
                    title: 'Begin Web Automation',
                    description: 'Tell the AI what web tasks you want to accomplish using natural language',
                    icon: Zap
                  }
                ].map((step, index) => (
                  <div key={index} className="text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="p-3 rounded-full bg-primary/10">
                        <step.icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-primary">
                        {step.step}
                      </div>
                      <h3 className="text-lg font-semibold">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="text-center mt-12">
                <Button
                  onClick={handleStartDemo}
                  disabled={isLoading}
                  size="lg"
                  className="gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                      Starting Demo...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Start Your First Automation
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}