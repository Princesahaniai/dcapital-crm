import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, CheckSquare, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

export const MobileNav = () => {
    const location = useLocation();

    const NavItem = ({ to, icon: Icon, label }: any) => {
        const active = location.pathname === to;
        return (
            <Link to={to} className="relative flex flex-col items-center justify-center py-2 w-full touch-target group">
                {active && (
                    <motion.div
                        layoutId="mobileTab"
                        className="absolute top-0 w-12 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-b-lg shadow-[0_2px_10px_rgba(217,119,6,0.5)]"
                    />
                )}
                <Icon
                    size={26}
                    strokeWidth={active ? 2.5 : 2}
                    className={`transition-all duration-300 mb-1 ${active ? 'text-amber-500 scale-110 drop-shadow-sm' : 'text-gray-500 group-active:scale-95'}`}
                />
                <span className={`text-[10px] font-bold tracking-wide transition-colors duration-300 ${active ? 'text-amber-500' : 'text-gray-500'}`}>
                    {label}
                </span>
            </Link>
        );
    };

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1C1C1E]/95 backdrop-blur-2xl border-t border-white/5 flex items-center justify-around px-2 pb-safe z-50 h-[84px] shadow-[0_-5px_20px_rgba(0,0,0,0.3)]">
            <NavItem to="/" icon={LayoutDashboard} label="Home" />
            <NavItem to="/leads" icon={Users} label="Leads" />
            <NavItem to="/inventory" icon={Building2} label="Stock" />
            <NavItem to="/tasks" icon={CheckSquare} label="Tasks" />
            <NavItem to="/settings" icon={Settings} label="More" />
        </div>
    );
};
