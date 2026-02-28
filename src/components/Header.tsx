import React, { useState, useEffect, useRef } from 'react';
import { Bell, Sun, Moon } from 'lucide-react';
import { useStore } from '../store';

interface HeaderProps {
    title: string;
    subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
    const { notifications, markNotificationRead, clearNotifications } = useStore();
    const unreadCount = notifications.filter(n => !n.read).length;
    const [showNotifs, setShowNotifs] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);

    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved ? saved === 'dark' : true; // Default to dark
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

    const toggleTheme = () => setIsDark(!isDark);

    return (
        <div className="flex items-center justify-between mb-8 pt-12 md:pt-0">
            <div className="min-w-0 flex-1">
                <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white truncate">{title}</h1>
                {subtitle && <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-2 md:gap-3 shrink-0 ml-4">
                <button
                    onClick={toggleTheme}
                    className="p-3 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors touch-target"
                    title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {isDark ? <Sun className="text-amber-500" size={20} /> : <Moon className="text-gray-700" size={20} />}
                </button>
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => setShowNotifs(!showNotifs)}
                        className="p-3 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors relative touch-target"
                        aria-label="Notifications"
                    >
                        <Bell className="text-gray-700 dark:text-gray-200" size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center text-[10px] font-bold text-white animate-pulse">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>
                    {/* Notification Dropdown — click-to-toggle (mobile-friendly) */}
                    {showNotifs && (
                        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden z-50">
                            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-white/5">
                                <span className="text-xs font-bold text-gray-700 dark:text-white uppercase">Notifications</span>
                                <button onClick={() => { clearNotifications(); setShowNotifs(false); }} className="text-[10px] text-gray-500 hover:text-blue-500 font-bold">Clear All</button>
                            </div>
                            <div className="max-h-72 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <p className="p-4 text-xs text-gray-500 text-center">All caught up! 🎉</p>
                                ) : notifications.slice(0, 20).map(n => (
                                    <div key={n.id} className={`p-4 border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors ${!n.read ? 'bg-blue-50/50 dark:bg-blue-500/10' : ''}`} onClick={() => markNotificationRead(n.id)}>
                                        <div className="flex gap-3">
                                            {!n.read && <div className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-xs ${!n.read ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-600 dark:text-gray-400'}`}>{n.text}</p>
                                                <p className="text-[10px] text-gray-400 mt-1">{new Date(n.date).toLocaleDateString()} • {new Date(n.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
