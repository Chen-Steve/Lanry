'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Icon } from '@iconify/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log error details for debugging
    console.error('Component stack:', errorInfo.componentStack);
    console.error('Error boundary error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    this.props.onError?.(error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 max-w-md w-full">
            <Icon 
              icon="mdi:alert-circle" 
              className="text-4xl text-red-500 dark:text-red-400 mx-auto mb-4" 
            />
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-red-600 dark:text-red-300 mb-4">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Refresh Page
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className="w-full px-4 py-2 border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
              >
                Try Again
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-xs text-red-500 dark:text-red-400">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs bg-red-100 dark:bg-red-900/40 p-2 rounded overflow-auto max-h-32">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
