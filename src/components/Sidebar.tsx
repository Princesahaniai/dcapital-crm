import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, LogOut, CheckSquare, Settings, Shield, ChevronRight, Menu, X, BarChart3, Calendar } from 'lucide-react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';

export const Sidebar = () => {
    const location = useLocation();
    const { logout, user } = useStore();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const NavItem = ({ to, icon: Icon, label }: any) => {
        const active = location.pathname === to;
        return (
            <Link to={to} className="relative group block mb-2">
                {active && (
                    <motion.div
                        layoutId="activeTab"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-600 rounded-r-full"
                    />
                )}
                <div className={`relative flex items-center gap-4 px-6 py-3 mx-2 rounded-xl transition-all duration-300 group-hover:translate-x-1 ${active ? 'bg-gradient-to-r from-amber-500/10 to-transparent text-amber-500 font-bold' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'}`}>
                    <Icon size={20} className={`transition-colors duration-300 ${active ? 'text-amber-500 drop-shadow-md' : 'group-hover:text-gray-900 dark:group-hover:text-white'}`} />
                    <span className="text-sm tracking-wide">{label}</span>
                    {active && <ChevronRight size={14} className="ml-auto opacity-50" />}
                </div>
            </Link>
        );
    };

    return (
        <>
            {/* Mobile Hamburger Button */}
            <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden fixed top-4 left-4 z-[100] p-4 bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 active:scale-95 touch-target"
                aria-label="Toggle Navigation Menu"
            >
                {mobileOpen ? <X size={24} className="text-amber-500" /> : <Menu size={24} className="text-gray-900 dark:text-white" />}
            </button>

            {/* Mobile Overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setMobileOpen(false)}
                        className="md:hidden fixed inset-0 bg-black/50 z-[90]"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            {/* Sidebar */}
            <motion.div
                initial={false}
                animate={{ x: mobileOpen ? 0 : '-100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                // HOTFIX: Override transform on desktop to ensure it's always visible
                style={{ x: undefined }}
                className={`fixed md:relative top-0 bottom-0 left-0 w-72 sidebar-glass flex flex-col h-screen z-[95] 
                    ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} 
                    md:!translate-x-0 md:flex md:shadow-none transition-transform duration-300 md:transition-none`}
            >
                {/* LOGO AREA */}
                <div className="p-8 pb-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/20">
                            <span className="font-bold text-white text-xl">D</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight leading-none">DCAPITAL</h1>
                            <p className="text-[10px] text-amber-500 font-bold uppercase tracking-[0.2em] mt-1">Pro CRM</p>
                        </div>
                    </div>
                </div>

                {/* NAVIGATION */}
                <nav className="flex-1 overflow-y-auto scrollbar-hide px-3 py-2 space-y-8">
                    <div>
                        <p className="px-6 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Main Menu</p>
                        <div className="space-y-1" onClick={() => setMobileOpen(false)}>
                            <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
                            <NavItem to="/leads" icon={Users} label="Leads Engine" />
                            <NavItem to="/inventory" icon={Building2} label="Luxury Inventory" />
                            <NavItem to="/tasks" icon={CheckSquare} label="Mission Control" />
                            <NavItem to="/calendar" icon={Calendar} label="Calendar" />
                        </div>
                    </div>

                    <div>
                        <p className="px-6 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Administration</p>
                        <div className="space-y-1" onClick={() => setMobileOpen(false)}>
                            {(user?.role === 'ceo' || user?.role === 'admin' || user?.role === 'manager') && (
                                <NavItem to="/team" icon={Shield} label="Access Control" />
                            )}
                            {(user?.role === 'ceo' || user?.role === 'admin') && (
                                <NavItem to="/reports" icon={BarChart3} label="Reports & Analytics" />
                            )}
                            {(user?.role === 'ceo' || user?.role === 'admin') && (
                                <NavItem to="/settings" icon={Settings} label="System Settings" />
                            )}
                        </div>
                    </div>
                </nav>

                {/* USER PROFILE - PREMIUM DROPDOWN */}
                <div className="p-4">
                    <div className="relative group">
                        <button
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:border-amber-500/30 transition-all group relative overflow-hidden"
                            title="User Menu"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-black border border-white/20 flex items-center justify-center font-bold text-white shadow-lg">
                                {user?.name.charAt(0)}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.name}</p>
                                <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">{user?.role}</p>
                            </div>
                            <ChevronRight size={14} className={`text-gray-400 transition-transform duration-300 ${showProfileMenu ? 'rotate-90' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {showProfileMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100]"
                                >
                                    <div className="p-2 space-y-1">
                                        <Link
                                            to="/settings"
                                            onClick={() => setShowProfileMenu(false)}
                                            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                                        >
                                            <Settings size={16} />
                                            <span>Account Settings</span>
                                        </Link>
                                        <button
                                            onClick={() => {
                                                logout();
                                                setShowProfileMenu(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                                        >
                                            <LogOut size={16} />
                                            <span>Sign Out Intelligence</span>
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div >
        </>
    );
};
