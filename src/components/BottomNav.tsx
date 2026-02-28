import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, CheckSquare, Sparkles, Swords, Activity } from 'lucide-react';

export const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { path: '/', label: 'Home', icon: LayoutDashboard },
        { path: '/market-intel', label: 'Intel', icon: Activity },
        { path: '/war-room', label: 'War Room', icon: Swords },
        { path: '/leads', label: 'Leads', icon: Users },
        { path: '/inventory', label: 'Stock', icon: Building2 },
        { path: '/tasks', label: 'Tasks', icon: CheckSquare },
        { path: '/social-studio', label: 'Studio', icon: Sparkles }
    ];

    const handleNavClick = (e: React.MouseEvent, path: string) => {
        e.stopPropagation();
        e.preventDefault();
        navigate(path);
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-black border-t border-gray-800 flex justify-around items-center pt-2 pb-[env(safe-area-inset-bottom)] h-[80px] md:hidden">
            {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                return (
                    <button
                        key={item.path}
                        onClick={(e) => handleNavClick(e, item.path)}
                        className={`flex flex-col items-center justify-center w-full h-full gap-1 ${isActive ? 'text-amber-500' : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </button>
                );
            })}
        </div>
    );
};
