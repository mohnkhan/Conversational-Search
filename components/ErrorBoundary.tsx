import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorIcon } from './Icons';

interface Props {
    children?: ReactNode;
    fallbackMessage?: string;
}

interface State {
    hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
    // FIX: Replaced constructor with direct state initialization to resolve
    // type inference issues with `this.state` and `this.props` from the base component.
    state: State = {
        hasError: false,
    };

    public static getDerivedStateFromError(_: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error in component:', error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 my-2 text-center text-red-300 animate-fade-in">
                    <div className="flex flex-col items-center justify-center space-y-3">
                        <ErrorIcon className="w-8 h-8 text-red-400" />
                        <h3 className="text-lg font-semibold">Something went wrong.</h3>
                        <p className="text-sm">
                            {this.props.fallbackMessage || 'A component has crashed. Reloading the page might fix the issue.'}
                        </p>
                        <button
                            onClick={this.handleReload}
                            className="px-4 py-2 mt-2 text-sm font-semibold text-white bg-red-600/80 hover:bg-red-500/80 rounded-md transition-colors"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;