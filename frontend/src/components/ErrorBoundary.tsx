"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { BackgroundWrapper } from "@/components/BackgroundWrapper";
import { Sparkles, RefreshCcw } from "lucide-react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <BackgroundWrapper>
                    <div className="flex flex-col items-center justify-center min-h-[100dvh] w-full p-4">
                        <div className="cosmic-glass-panel rounded-3xl p-8 max-w-md w-full text-center
                     dark:bg-black/40 bg-white/40 border dark:border-white/10 border-black/10">
                            <div className="w-16 h-16 rounded-2xl mx-auto mb-6 cosmic-glass flex items-center justify-center bg-red-500/10 border-red-500/20 text-red-500">
                                <Sparkles className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight mb-3 dark:text-white text-slate-900">Oops! Something went wrong</h2>
                            <p className="text-sm dark:text-slate-400 text-slate-500 mb-8 max-w-sm mx-auto">
                                We encountered an unexpected error. Our team has been notified.
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl
                                 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500
                                 text-white font-medium transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)]
                                 hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]"
                            >
                                <RefreshCcw className="w-4 h-4" />
                                Reload Application
                            </button>
                            {process.env.NODE_ENV === "development" && this.state.error && (
                                <div className="mt-8 text-left p-4 rounded-lg bg-red-500/10 border border-red-500/20 overflow-x-auto">
                                    <p className="text-red-400 text-xs font-mono break-all font-semibold mb-2">Error Details:</p>
                                    <p className="text-red-400/80 text-xs font-mono break-all whitespace-pre-wrap">
                                        {this.state.error.message}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </BackgroundWrapper>
            );
        }

        return this.props.children;
    }
}
