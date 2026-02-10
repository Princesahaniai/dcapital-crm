import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, LogOut, CheckSquare, Settings, Shield, ChevronRight } from 'lucide-react';
import { useStore } from '../store';
import { motion } from 'framer-motion';

export const Sidebar = () => {
    const location = useLocation();
    const { logout, user } = useStore();

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
        <div className="hidden md:flex w-72 sidebar-glass flex-col h-screen transition-all duration-300 z-50">
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
                    <div className="space-y-1">
                        <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
                        <NavItem to="/leads" icon={Users} label="Leads Engine" />
                        <NavItem to="/inventory" icon={Building2} label="Luxury Inventory" />
                        <NavItem to="/tasks" icon={CheckSquare} label="Mission Control" />
                    </div>
                </div>

                <div>
                    <p className="px-6 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Administration</p>
                    <div className="space-y-1">
                        {(user?.role === 'ceo' || user?.role === 'admin' || user?.role === 'manager') && (
                            <NavItem to="/team" icon={Shield} label="Access Control" />
                        )}
                        {(user?.role === 'ceo' || user?.role === 'admin') && (
                            <NavItem to="/settings" icon={Settings} label="System Settings" />
                        )}
                    </div>
                </div>
            </nav>

            {/* USER PROFILE - PREMIUM CARD */}
            <div className="p-4">
                <div className="bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:border-amber-500/30 transition-colors group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-black border border-white/20 flex items-center justify-center font-bold text-white shadow-lg">
                        {user?.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.name}</p>
                        <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">{user?.role}</p>
                    </div>
                    <button onClick={logout} className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors" title="Sign Out">
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};
