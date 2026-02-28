import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught React Error:', error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="h-screen w-screen bg-black flex flex-col items-center justify-center p-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md w-full bg-[#1C1C1E] border border-red-500/20 rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col items-center"
                    >
                        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
                            <AlertOctagon size={40} className="text-red-500" />
                        </div>

                        <h1 className="text-3xl font-black text-white mb-2">System Error</h1>
                        <p className="text-gray-400 text-sm mb-8">
                            The D-Capital OS encountered an unexpected fault. Your data is safe in the cloud, but the interface needs to be reloaded.
                        </p>

                        <div className="bg-black/50 p-4 rounded-xl border border-white/5 w-full mb-8 overflow-hidden text-left">
                            <p className="text-red-400 font-mono text-xs truncate">
                                {this.state.error?.message || "Unknown rendering error occurred"}
                            </p>
                        </div>

                        <button
                            onClick={this.handleReload}
                            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg active:scale-95 touch-target"
                        >
                            <RefreshCw size={20} /> Reload OS
                        </button>
                    </motion.div>
                </div>
            );
        }

        return this.props.children;
    }
}
