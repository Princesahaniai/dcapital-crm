import React, { useState, useEffect, useRef } from 'react';
import { Bell, Sun, Moon, X } from 'lucide-react';
import { useStore } from '../store';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Global TopBar — always visible on every page (rendered inside ProtectedRoute).
 * Contains: Theme toggle + Notification Bell with badge & dropdown.
 * Hidden on desktop where the Header component handles it per-page;
 * Always visible on mobile where the Header may not be present.
 */
export const GlobalTopBar: React.FC = () => {
    const { notifications, markNotificationRead, clearNotifications } = useStore();
    const unreadCount = notifications.filter(n => !n.read).length;
    const [showNotifs, setShowNotifs] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);

    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved ? saved === 'dark' : true;
    });

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setShowNotifs(false);
            }
        };
        if (showNotifs) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showNotifs]);

    return (
        <div className="fixed top-0 right-0 z-[90] flex items-center gap-2 p-3 md:p-4">
            {/* Theme Toggle */}
            <button
                onClick={() => setIsDark(!isDark)}
                className="p-2.5 rounded-xl bg-white/80 dark:bg-white/10 backdrop-blur-lg border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/20 transition-all shadow-lg touch-target"
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
                {isDark ? <Sun className="text-amber-500" size={18} /> : <Moon className="text-gray-700" size={18} />}
            </button>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
                <button
                    onClick={() => setShowNotifs(!showNotifs)}
                    className="p-2.5 rounded-xl bg-white/80 dark:bg-white/10 backdrop-blur-lg border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/20 transition-all relative shadow-lg touch-target"
                    aria-label="Notifications"
                >
                    <Bell className="text-gray-700 dark:text-gray-200" size={18} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center text-[10px] font-bold text-white animate-pulse shadow-lg shadow-red-500/40">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </button>

                {/* Notification Dropdown */}
                <AnimatePresence>
                    {showNotifs && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden z-50"
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-white/5">
                                <div className="flex items-center gap-2">
                                    <Bell size={14} className="text-amber-500" />
                                    <span className="text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wider">
                                        Notifications
                                    </span>
                                    {unreadCount > 0 && (
                                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                            {unreadCount}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => { clearNotifications(); setShowNotifs(false); }}
                                        className="text-[10px] text-gray-500 hover:text-red-500 font-bold uppercase tracking-wider transition-colors"
                                    >
                                        Clear All
                                    </button>
                                    <button
                                        title="Close Notifications"
                                        onClick={() => setShowNotifs(false)}
                                        className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                                    >
                                        <X size={14} className="text-gray-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Notification List */}
                            <div className="max-h-80 overflow-y-auto scrollbar-hide">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <Bell size={28} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                                        <p className="text-sm text-gray-500 font-medium">All caught up! 🎉</p>
                                        <p className="text-xs text-gray-400 mt-1">No new notifications</p>
                                    </div>
                                ) : notifications.slice(0, 25).map(n => (
                                    <div
                                        key={n.id}
                                        className={`p-4 border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors ${!n.read ? 'bg-blue-50/60 dark:bg-blue-500/10' : ''}`}
                                        onClick={() => markNotificationRead(n.id)}
                                    >
                                        <div className="flex gap-3">
                                            {!n.read && <div className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 shrink-0 animate-pulse" />}
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-xs leading-relaxed ${!n.read ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-600 dark:text-gray-400'}`}>
                                                    {n.text}
                                                </p>
                                                <p className="text-[10px] text-gray-400 mt-1.5">
                                                    {new Date(n.date).toLocaleDateString()} • {new Date(n.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
