import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, CheckSquare, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

export const MobileNav = () => {
    const location = useLocation();

    const NavItem = ({ to, icon: Icon }: any) => {
        const active = location.pathname === to;
        return (
            <Link to={to} className="relative flex flex-col items-center justify-center py-2">
                {active && (
                    <motion.div layoutId="mobileTab" className="absolute -top-3 w-8 h-1 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                )}
                <Icon size={24} className={`transition-colors ${active ? 'text-white' : 'text-gray-500'}`} />
            </Link>
        );
    };

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-[#1C1C1E]/90 backdrop-blur-xl border-t border-white/10 flex items-center justify-around px-6 z-50 pb-4">
            <NavItem to="/" icon={LayoutDashboard} />
            <NavItem to="/leads" icon={Users} />
            <div className="w-12" /> {/* Spacer for Floating Action Button if needed later */}
            <NavItem to="/inventory" icon={Building2} />
            <NavItem to="/settings" icon={Settings} />
        </div>
    );
};
