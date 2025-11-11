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
import { cn } from '@/lib/utils'

const features = [
  {
    icon: Globe,
    title: 'Smart Navigation',
    description: 'Navigate to any website and analyze page content intelligently',
  },
  {
    icon: MousePointer,
    title: 'Precise Interactions',
    description: 'Click, type, and interact with web elements with human-like precision',
  },
  {
    icon: Camera,
    title: 'Visual Understanding',
    description: 'Take screenshots and analyze page layouts and visual content',
  },
  {
    icon: Search,
    title: 'Intelligent Search',
    description: 'Search within pages and across the web with contextual understanding',
  },
  {
    icon: Keyboard,
    title: 'Form Automation',
    description: 'Fill forms, input data, and automate repetitive web tasks',
  },
  {
    icon: Zap,
    title: 'Fast & Efficient',
    description: 'Powered by Google\'s Gemini 2.5 Pro for lightning-fast responses',
  },
]

const capabilities = [
  'Natural language commands to computer actions',
  'Real-time browser automation',
  'Screenshot analysis and visual understanding',
  'Multi-step task execution',
  'Safe domain filtering and content validation',
  'Session management and history',
]

const stats = [
  { label: 'Active Sessions', value: '1,000+', icon: Users },
  { label: 'Tasks Completed', value: '10,000+', icon: CheckCircle },
  { label: 'Average Response Time', value: '< 2s', icon: Clock },
]

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
      alert('Failed to connect to the AI Agent service. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">AI Computer Use Agent</h1>
                <p className="text-sm text-muted-foreground">Web Interface</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={handleStartDemo}
                disabled={isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Start Demo
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
              AI-Powered{' '}
              <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Web Automation
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Control websites and automate computer tasks using natural language. 
              Built with Vercel AI SDK and Google Gemini for intelligent, safe, and efficient web interactions.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={handleStartDemo}
                disabled={isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Zap className="h-5 w-5" />
                )}
                Try It Now
                <ArrowRight className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  const featuresSection = document.getElementById('features')
                  featuresSection?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                Learn More
              </Button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center mb-2">
                    <stat.icon className="h-6 w-6 text-primary mr-2" />
                    <div className="text-3xl font-bold">{stat.value}</div>
                  </div>
                  <p className="text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Experience the future of web automation with AI that understands context, 
              follows instructions, and adapts to any website.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Capabilities */}
        <section className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">What Can It Do?</h2>
              <div className="space-y-4">
                {capabilities.map((capability, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>{capability}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      Safe & Secure
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Built-in safety measures ensure secure interactions with trusted domains 
                      and protection against sensitive data exposure.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-muted-foreground ml-4">
                      ai-computer-agent.com
                    </span>
                  </div>
                  
                  <div className="bg-muted rounded-lg p-4 min-h-[200px]">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="bg-primary/10 rounded-lg p-3 mb-2">
                          <p className="text-sm">
                            "Navigate to GitHub and help me find trending repositories about AI"
                          </p>
                        </div>
                        <div className="bg-muted rounded-lg p-3">
                          <p className="text-sm">
                            I'll navigate to GitHub and search for trending AI repositories. 
                            Let me get started by going to the website and analyzing the current trending section.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Technology Stack */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4">Built With Modern Technology</h2>
            <p className="text-muted-foreground">
              Powered by the latest AI and web technologies
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            {[
              'Vercel AI SDK',
              'Google Gemini 2.5 Pro',
              'Next.js 14',
              'TypeScript',
              'Playwright',
              'Tailwind CSS',
              'shadcn/ui',
            ].map((tech, index) => (
              <div
                key={index}
                className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium"
              >
                {tech}
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to Get Started?</CardTitle>
              <CardDescription className="text-base">
                Experience the power of AI-driven web automation. 
                No setup required - just start chatting with your computer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                size="lg"
                onClick={handleStartDemo}
                disabled={isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Smartphone className="h-5 w-5" />
                )}
                Start Your First Session
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/50 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">
            <p>
              Built by{' '}
              <span className="font-semibold">MiniMax Agent</span>
              {' '}• Powered by Vercel AI SDK and Google Gemini
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}