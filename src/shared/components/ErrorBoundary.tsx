import React, { Component, ErrorInfo, ReactNode } from 'react';
import { errorLogger } from '../services/errorLogger';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary Component
 * 
 * Catches React component errors and prevents app crashes.
 * Critical for PWA stability as there's no browser refresh safety net.
 * 
 * Features:
 * - Catches unhandled React errors
 * - Shows user-friendly fallback UI
 * - Logs errors to backend for monitoring
 * - Provides retry mechanism
 * - Supports custom fallback components
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Log error to backend
        errorLogger.log(error, {
            componentStack: errorInfo.componentStack || undefined,
            route: window.location.pathname,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
        }).catch(() => {
            // Silently ignore logging errors to prevent error loop
        });

        // Call custom error handler if provided
        this.props.onError?.(error, errorInfo);

        // Update state with error info
        this.setState({ errorInfo });
    }

    resetError = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render(): ReactNode {
        if (this.state.hasError && this.state.error) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                const FallbackComponent = this.props.fallback;
                return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
            }

            // Default fallback UI
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                    <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 mx-auto mb-4">
                            <svg
                                className="w-6 h-6 text-red-600 dark:text-red-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>

                        <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
                            Something went wrong
                        </h2>

                        <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                            We've encountered an unexpected error. Please try again or return to the home page.
                        </p>

                        {/* Show error details in development */}
                        {import.meta.env.DEV && this.state.error && (
                            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 rounded border border-red-200 dark:border-red-800">
                                <p className="text-sm font-mono text-red-800 dark:text-red-400 mb-2">
                                    {this.state.error.message}
                                </p>
                                {this.state.errorInfo && (
                                    <details className="mt-2">
                                        <summary className="text-xs text-red-600 dark:text-red-500 cursor-pointer">
                                            Component Stack
                                        </summary>
                                        <pre className="mt-2 text-xs text-red-700 dark:text-red-400 overflow-auto max-h-32">
                                            {this.state.errorInfo.componentStack}
                                        </pre>
                                    </details>
                                )}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={this.resetError}
                                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
                            >
                                Go Home
                            </button>
                        </div>

                        {/* Report Error Button (only in production) */}
                        {!import.meta.env.DEV && (
                            <button
                                onClick={() => {
                                    // Error already logged in componentDidCatch
                                    alert('Error has been reported. Thank you!');
                                }}
                                className="w-full mt-3 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                Report this error
                            </button>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
