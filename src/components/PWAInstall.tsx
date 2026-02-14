import { useState, useEffect } from 'react';
import { X, Download, Share2 } from 'lucide-react';

export default function PWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showInstall, setShowInstall] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if iOS
        const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIosDevice);

        // Standard PWA Prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstall(true);
        });

        // Clean up
        return () => {
            window.removeEventListener('beforeinstallprompt', () => { });
        };
    }, []);

    const handleInstall = () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult: any) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                }
                setDeferredPrompt(null);
                setShowInstall(false);
            });
        }
    };

    if (!showInstall && !isIOS) return null;

    // Don't show if already installed (simplistic check, can be improved)
    if (window.matchMedia('(display-mode: standalone)').matches) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-[9999] md:hidden">
            {showInstall && (
                <div className="bg-gray-900/95 backdrop-blur-md border border-amber-500/30 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom-20 duration-500">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                                <span className="font-bold text-white text-xl">D</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Install App</h3>
                                <p className="text-xs text-gray-400">Add D-Capital CRM to home screen for fullscreen experience.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowInstall(false)}
                            className="text-gray-400 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <button
                        onClick={handleInstall}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                        <Download size={18} />
                        Install Application
                    </button>
                </div>
            )}

            {isIOS && (
                <div className="bg-gray-900/95 backdrop-blur-md border border-gray-800 rounded-2xl p-4 shadow-2xl mt-4 animate-in slide-in-from-bottom-20 duration-500 relative">
                    <button
                        onClick={() => setIsIOS(false)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-white"
                    >
                        <X size={16} />
                    </button>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                            <Share2 className="text-blue-400" size={20} />
                        </div>
                        <div className="text-sm text-gray-300">
                            To install on iOS: Tap <span className="font-bold text-blue-400">Share</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                            <span className="font-bold text-xl text-white">+</span>
                        </div>
                        <div className="text-sm text-gray-300">
                            Then select <span className="font-bold text-white">Add to Home Screen</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
