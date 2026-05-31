import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, CheckSquare, Sparkles, LogOut, UserCircle } from 'lucide-react';
import { useStore } from '../store';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useStore();
    const [showAccountSheet, setShowAccountSheet] = useState(false);

    const navItems = [
        { path: '/',          label: 'Home',    icon: LayoutDashboard },
        { path: '/leads',     label: 'Leads',   icon: Users },
        { path: '/inventory', label: 'Stock',   icon: Building2 },
        { path: '/tasks',     label: 'Tasks',   icon: CheckSquare },
        { path: '/social-studio', label: 'Studio', icon: Sparkles },
    ];

    const handleNavClick = (e: React.MouseEvent, path: string) => {
        e.stopPropagation();
        e.preventDefault();
        navigate(path);
    };

    return (
        <>
            {/* ── Account / Logout Bottom Sheet ─────────────────────────── */}
            <AnimatePresence>
                {showAccountSheet && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm md:hidden"
                            onClick={() => setShowAccountSheet(false)}
                        />
                        {/* Sheet */}
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 z-[9999] bg-[#1C1C1E] border-t border-white/10 rounded-t-3xl p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] md:hidden"
                        >
                            {/* Handle bar */}
                            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />

                            {/* User Info */}
                            <div className="flex items-center gap-4 mb-6 p-4 bg-white/5 rounded-2xl border border-white/10">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-amber-500/20">
                                    {user?.name?.charAt(0) ?? '?'}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-white truncate">{user?.name}</p>
                                    <p className="text-[11px] text-amber-500 font-bold uppercase tracking-wider">{user?.role}</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => { navigate('/settings'); setShowAccountSheet(false); }}
                                    className="w-full flex items-center gap-4 px-5 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-semibold transition-all active:scale-95 text-left"
                                >
                                    <UserCircle size={20} className="text-amber-400 shrink-0" />
                                    Account Settings
                                </button>
                                <button
                                    onClick={() => { logout(); setShowAccountSheet(false); }}
                                    className="w-full flex items-center gap-4 px-5 py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-2xl text-red-400 font-bold transition-all active:scale-95 text-left"
                                >
                                    <LogOut size={20} className="shrink-0" />
                                    Sign Out
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Bottom Navigation Bar ──────────────────────────────────── */}
            {/* 
                h-[80px] + pb-[env(safe-area-inset-bottom)] handles iPhone Safari.
                The parent page wrapper uses pb-[calc(80px+env(safe-area-inset-bottom))]
                to avoid content being hidden behind this bar.
            */}
            <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-black/95 backdrop-blur-xl border-t border-white/10 flex items-stretch md:hidden pb-[env(safe-area-inset-bottom)]">
                <div className="flex justify-around items-center w-full h-[60px] px-1">
                    {/* Nav items */}
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.path}
                                onClick={(e) => handleNavClick(e, item.path)}
                                className={`flex flex-col items-center justify-center flex-1 h-full gap-1 rounded-xl transition-all active:scale-90 ${
                                    isActive
                                        ? 'text-amber-500'
                                        : 'text-gray-500 hover:text-gray-300'
                                }`}
                            >
                                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-[9px] font-semibold tracking-wide">{item.label}</span>
                            </button>
                        );
                    })}

                    {/* Divider */}
                    <div className="w-px h-8 bg-white/10 mx-1 self-center shrink-0" />

                    {/* Profile / Logout button */}
                    <button
                        onClick={() => setShowAccountSheet(true)}
                        className="flex flex-col items-center justify-center flex-1 h-full gap-1 rounded-xl transition-all active:scale-90 text-gray-500 hover:text-amber-400"
                        aria-label="Account & Logout"
                    >
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-[10px] shadow-md shadow-amber-500/30">
                            {user?.name?.charAt(0) ?? '?'}
                        </div>
                        <span className="text-[9px] font-semibold tracking-wide">Account</span>
                    </button>
                </div>
            </div>
        </>
    );
};
