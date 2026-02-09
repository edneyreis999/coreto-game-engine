import { Component, ErrorInfo, ReactNode } from 'react'
import { createLogEntry, logBuffer } from '@/hooks/useLogger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary Component
 *
 * Catches React errors in child components and displays fallback UI.
 * Prevents the entire app from crashing due to unhandled component errors.
 * Logs all errors to the log buffer for debugging and analysis.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console for immediate debugging
    console.error('ErrorBoundary caught:', error, errorInfo)

    // Log error to the log buffer with full details
    const logEntry = createLogEntry('error', `React Error: ${error.message}`, {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      componentStack: errorInfo.componentStack,
      errorBoundary: 'ErrorBoundary',
    })

    logBuffer.push(logEntry)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="p-4 text-red-500">
            <h2>Something went wrong</h2>
            <pre>{this.state.error?.message}</pre>
          </div>
        )
      )
    }
    return this.props.children
  }
}
