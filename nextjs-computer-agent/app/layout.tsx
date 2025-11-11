import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Computer Use Agent - Web Interface',
  description: 'Intelligent web automation and interaction using Vercel AI SDK with Google Generative AI',
  keywords: ['AI', 'Computer Use', 'Web Automation', 'Vercel AI SDK', 'Google AI'],
  authors: [{ name: 'MiniMax Agent' }],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  robots: {
    index: false, // This is an interactive application
    follow: false,
  },
  openGraph: {
    title: 'AI Computer Use Agent',
    description: 'Intelligent web automation using AI',
    type: 'website',
    locale: 'en_US',
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'AI Computer Agent',
    'mobile-web-app-capable': 'yes',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>
        <div id="root" className="min-h-screen">
          {children}
        </div>
        
        {/* Skip to content link for accessibility */}
        <a
          href="#main-content"
          className="skip-to-content"
          tabIndex={1}
        >
          Skip to main content
        </a>
        
        {/* Accessibility announcement region */}
        <div
          id="announcements"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />
        
        {/* Error boundary fallback */}
        <div
          id="error-boundary-fallback"
          className="hidden"
        >
          <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="max-w-md w-full text-center">
              <h1 className="text-2xl font-bold text-foreground mb-4">
                Something went wrong
              </h1>
              <p className="text-muted-foreground mb-6">
                We encountered an unexpected error. Please refresh the page to try again.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}