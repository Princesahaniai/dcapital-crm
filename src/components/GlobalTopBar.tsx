import React, { useState, useEffect, useRef } from 'react';
import { Bell, Sun, Moon, X, CheckCheck } from 'lucide-react';
import { useStore } from '../store';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Global TopBar — always visible on every page (rendered inside ProtectedRoute).
 * Contains: Theme toggle + Notification Bell with badge & dropdown.
 * 
 * Visible on mobile (top-right corner) AND on desktop (top-right, inside the sidebar layout).
 * The sidebar handles navigation; this bar handles global utilities.
 */

const TYPE_ICON: Record<string, string> = {
    assignment: '📋',
    update: '📝',
    alert: '⚠️',
    system: '🔔',
};

export const GlobalTopBar: React.FC = () => {
    const { notifications, markNotificationRead, markAllNotificationsRead, clearNotifications } = useStore();
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
        /* ── Positioned top-right, visible on ALL screen sizes ── */
        <div className="fixed top-0 right-0 z-[90] flex items-center gap-2 p-3">
            {/* Theme Toggle */}
            <button
                onClick={() => setIsDark(!isDark)}
                className="p-2.5 rounded-xl bg-white/80 dark:bg-white/10 backdrop-blur-lg border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/20 transition-all shadow-lg touch-target"
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
                {isDark ? <Sun className="text-amber-500" size={18} /> : <Moon className="text-gray-700" size={18} />}
            </button>

            {/* ── Notification Bell ── */}
            <div className="relative" ref={notifRef}>
                <button
                    onClick={() => setShowNotifs(!showNotifs)}
                    className="p-2.5 rounded-xl bg-white/80 dark:bg-white/10 backdrop-blur-lg border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/20 transition-all relative shadow-lg touch-target"
                    aria-label="Notifications"
                    id="notification-bell-btn"
                >
                    <Bell className="text-gray-700 dark:text-gray-200" size={18} />
                    <AnimatePresence>
                        {unreadCount > 0 && (
                            <motion.span
                                key="badge"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-red-500 rounded-full border-2 border-white dark:border-[#111] flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-red-500/40"
                            >
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>

                {/* ── Notification Dropdown ── */}
                <AnimatePresence>
                    {showNotifs && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                            className="absolute right-0 mt-2 w-[340px] max-w-[calc(100vw-1.5rem)] bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                        >
                            {/* Header */}
                            <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/80 dark:bg-white/[0.03]">
                                <div className="flex items-center gap-2">
                                    <Bell size={13} className="text-amber-500" />
                                    <span className="text-[11px] font-extrabold text-gray-700 dark:text-white uppercase tracking-widest">
                                        Notifications
                                    </span>
                                    {unreadCount > 0 && (
                                        <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">
                                            {unreadCount} new
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {/* Mark all as read */}
                                    {unreadCount > 0 && (
                                        <button
                                            id="mark-all-read-btn"
                                            onClick={() => markAllNotificationsRead()}
                                            title="Mark all as read"
                                            className="flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-600 font-bold transition-colors px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10"
                                        >
                                            <CheckCheck size={12} />
                                            <span className="hidden sm:inline">Mark all read</span>
                                        </button>
                                    )}
                                    {/* Clear all */}
                                    {notifications.length > 0 && (
                                        <button
                                            onClick={() => { clearNotifications(); setShowNotifs(false); }}
                                            className="text-[10px] text-gray-400 hover:text-red-500 font-bold uppercase tracking-wider transition-colors px-1"
                                        >
                                            Clear
                                        </button>
                                    )}
                                    <button
                                        title="Close"
                                        onClick={() => setShowNotifs(false)}
                                        className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                                    >
                                        <X size={13} className="text-gray-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Notification List */}
                            <div className="max-h-[380px] overflow-y-auto scrollbar-hide divide-y divide-gray-100 dark:divide-white/5">
                                {notifications.length === 0 ? (
                                    <div className="py-10 text-center">
                                        <Bell size={26} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">All caught up! 🎉</p>
                                        <p className="text-xs text-gray-400 mt-1">No notifications yet</p>
                                    </div>
                                ) : (
                                    notifications.slice(0, 30).map(n => {
                                        const typeIcon = TYPE_ICON[n.type || 'system'] || '🔔';
                                        const displayText = n.message || n.text;
                                        const timeStr = (() => {
                                            const ms = n.timestamp || new Date(n.date).getTime();
                                            const diff = Date.now() - ms;
                                            if (diff < 60_000) return 'Just now';
                                            if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
                                            if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
                                            return new Date(n.date).toLocaleDateString();
                                        })();

                                        return (
                                            <motion.div
                                                key={n.id}
                                                layout
                                                className={`px-4 py-3 cursor-pointer transition-colors ${
                                                    !n.read
                                                        ? 'bg-blue-50/60 dark:bg-blue-500/5 hover:bg-blue-50 dark:hover:bg-blue-500/10'
                                                        : 'hover:bg-gray-50 dark:hover:bg-white/[0.03]'
                                                }`}
                                                onClick={() => markNotificationRead(n.id)}
                                            >
                                                <div className="flex gap-3 items-start">
                                                    {/* Type icon */}
                                                    <span className="text-base leading-none mt-0.5 shrink-0">{typeIcon}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-[12px] leading-snug break-words ${
                                                            !n.read ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-500 dark:text-gray-400'
                                                        }`}>
                                                            {displayText}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{timeStr}</p>
                                                    </div>
                                                    {/* Unread dot */}
                                                    {!n.read && (
                                                        <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5 animate-pulse" />
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Footer: count */}
                            {notifications.length > 30 && (
                                <div className="px-4 py-2 text-center border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                                    <span className="text-[10px] text-gray-400 font-medium">
                                        Showing 30 of {notifications.length} — clear to see older ones
                                    </span>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
