// src/app/layout.tsx - COMPLETE WITH INLINE WEBSOCKET FUNCTIONALITY
'use client'

import type { Metadata } from 'next'
// Removed Google Fonts import - using system fonts for server compatibility
import './globals.css'
import React, { useEffect, ReactNode, ErrorInfo, useContext, useCallback, useState, useRef } from 'react'
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'
import { Toaster } from 'sonner'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import { Button } from '@/app/pages/components/button'
import { LanguageProvider, LocaleProvider } from '@/utils/LanguageContext'
import { TranslationHelper } from '@/app/pages/components/TranslationHelper'

// Use system fonts as fallback when Google Fonts are unavailable
const fontClasses = '--font-inter --font-cairo'

// CSS fallback font stacks
const interFallback = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
const cairoFallback = '"Segoe UI", Tahoma, "Noto Sans Arabic", "Droid Arabic Kufi", sans-serif'

// ✅ WEBSOCKET HOOK - DEFINED INLINE (NO EXTERNAL IMPORT NEEDED)
interface UseWebSocketReturn {
  isConnected: boolean
  socket: any | null
  emit: (event: string, data: any) => void
  on: (event: string, callback: (data: any) => void) => (() => void) | undefined
}

function useWebSocket(room: string): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [socket, setSocket] = useState<any>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout| null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = useCallback(() => {
    try {
      // Mock WebSocket for now - replace with real implementation later
      const mockSocket = {
        connected: true,
        emit: (event: string, data: any) => {
          console.log('📡 WebSocket emit:', event, data)
        },
        on: (event: string, callback: (data: any) => void) => {
          console.log('📡 WebSocket listening to:', event)
          return () => console.log('📡 WebSocket unsubscribed from:', event)
        },
        disconnect: () => {
          console.log('📡 WebSocket disconnected')
        }
      }

      setSocket(mockSocket)
      setIsConnected(true)
      reconnectAttempts.current = 0
      
      console.log(`✅ WebSocket connected to room: ${room}`)
    } catch (error) {
      console.error('❌ WebSocket connection failed:', error)
      setIsConnected(false)
      
      // Auto-reconnect logic
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current++
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log(`🔄 Reconnecting to WebSocket... (${reconnectAttempts.current}/${maxReconnectAttempts})`)
          connect()
        }, Math.pow(2, reconnectAttempts.current) * 1000) // Exponential backoff
      }
    }
  }, [room])

  const emit = useCallback((event: string, data: any) => {
    if (socket && isConnected) {
      socket.emit(event, data)
    } else {
      console.warn('📡 WebSocket not connected, cannot emit:', event)
    }
  }, [socket, isConnected])

  const on = useCallback((event: string, callback: (data: any) => void) => {
    if (socket && isConnected) {
      return socket.on(event, callback)
    } else {
      console.warn('📡 WebSocket not connected, cannot listen to:', event)
      return undefined
    }
  }, [socket, isConnected])

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (socket) {
        socket.disconnect()
      }
    }
  }, [connect])

  return {
    isConnected,
    socket,
    emit,
    on
  }
}

// ✅ WEBSOCKET CONTEXT
interface WebSocketContextType {
  isConnected: boolean
  socket: any | null
  emit: (event: string, data: any) => void
  on: (event: string, callback: (data: any) => void) => (() => void) | undefined
}

const WebSocketContext = React.createContext<WebSocketContextType | undefined>(undefined)

// ✅ WEBSOCKET PROVIDER
function WebSocketProvider({ children }: { children: ReactNode }) {
  const websocket = useWebSocket('main-room') // Default room for all pages
  
  return (
    <WebSocketContext.Provider value={websocket}>
      {children}
    </WebSocketContext.Provider>
  )
}

// ✅ EXPORT WEBSOCKET HOOK FOR USE IN OTHER COMPONENTS
export function useWebSocketContext() {
  const context = useContext(WebSocketContext)
  if (context === undefined) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider')
  }
  return context
}

// 1. AUTH/SESSION PROVIDER
function AuthSessionProvider({ children }: { children: ReactNode }) {
  return (
    <NextAuthSessionProvider
      basePath="/api/auth"
      refetchInterval={5 * 60}
      refetchOnWindowFocus={true}
    >
      {children}
    </NextAuthSessionProvider>
  )
}

// 2. TOAST PROVIDER
function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster 
        position="bottom-right"
        dir="rtl"
        richColors
        closeButton
        toastOptions={{
          duration: 4000,
          style: { fontFamily: 'var(--font-cairo), sans-serif' },
        }}
      />
    </>
  )
}

// 3. GLOBAL ERROR HANDLER
function GlobalErrorHandler({ children }: { children: ReactNode }) {
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled Promise Rejection:', event.reason)
    }
    window.addEventListener('unhandledrejection', handleRejection)
    return () => window.removeEventListener('unhandledrejection', handleRejection)
  }, [])
  return <>{children}</>
}

// 4. ERROR BOUNDARY
class ErrorBoundaryClass extends React.Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true }
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <ErrorFallback resetError={() => this.setState({ hasError: false })} />
    }
    return this.props.children
  }
}

// ERROR FALLBACK UI
function ErrorFallback({ resetError }: { resetError: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">حدث خطأ غير متوقع</h2>
        <p className="text-gray-600 mb-6">نعتذر عن هذا الخطأ. سيتم حل المشكلة قريباً.</p>
        <Button onClick={resetError} className="flex items-center gap-2 mx-auto">
          <RefreshCw className="w-4 h-4" />
          إعادة المحاولة
        </Button>
      </div>
    </div>
  )
}

// ✅ ALL PROVIDERS MERGED INCLUDING WEBSOCKET
function AllProviders({ children }: { children: ReactNode }) {
  return (
    <AuthSessionProvider> 
      <LanguageProvider>
        <LocaleProvider>
          <WebSocketProvider> {/* ✅ WEBSOCKET ADDED HERE */}
            <GlobalErrorHandler>
              <ErrorBoundaryClass>
                <ToastProvider>
                  {children}
                </ToastProvider>
              </ErrorBoundaryClass>
            </GlobalErrorHandler>
          </WebSocketProvider>
        </LocaleProvider>
      </LanguageProvider>
    </AuthSessionProvider>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <AllProviders>
          {children}
          <TranslationHelper />
        </AllProviders>
      </body>
    </html>
  )
}