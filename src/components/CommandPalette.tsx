import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Search, Building2, LayoutDashboard, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CommandPalette = () => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const navigate = useNavigate();
    const { leads, properties } = useStore();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
            if (e.key === 'Escape') {
                setOpen(false);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const filteredLeads = leads.filter(l => (l.name || '').toLowerCase().includes((query || '').toLowerCase())).slice(0, 3);
    const filteredProps = properties.filter(p => (p.name || '').toLowerCase().includes((query || '').toLowerCase())).slice(0, 3);

    const actions = [
        { label: 'Go to Dashboard', icon: LayoutDashboard, action: () => navigate('/') },
        { label: 'Go to Leads', icon: User, action: () => navigate('/leads') },
        { label: 'Go to Inventory', icon: Building2, action: () => navigate('/inventory') },
    ].filter(a => (a.label || '').toLowerCase().includes((query || '').toLowerCase()));

    if (!open) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-start justify-center pt-[20vh]" onClick={() => setOpen(false)}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-2xl bg-[#1C1C1E] border border-gray-700 rounded-2xl shadow-2xl overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex items-center gap-3 p-4 border-b border-white/10">
                        <Search className="text-gray-400" size={20} />
                        <input
                            autoFocus
                            placeholder="Type a command or search..."
                            className="bg-transparent w-full text-lg text-white placeholder-gray-500 outline-none"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            title="Command search"
                        />
                        <div className="flex gap-1">
                            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">ESC</span>
                        </div>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto p-2 space-y-2">
                        {/* ACTIONS */}
                        {actions.length > 0 && (
                            <div className="px-2 py-1">
                                <p className="text-[10px] uppercase font-bold text-gray-500 mb-2 ml-2">Navigation</p>
                                {actions.map((action, i) => (
                                    <button key={i} onClick={() => { action.action(); setOpen(false); }} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-blue-500 hover:text-white text-gray-300 transition-colors group">
                                        <action.icon size={18} /> {action.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* LEADS */}
                        {filteredLeads.length > 0 && (
                            <div className="px-2 py-1 border-t border-white/5">
                                <p className="text-[10px] uppercase font-bold text-gray-500 mb-2 mt-2 ml-2">Leads</p>
                                {filteredLeads.map(lead => (
                                    <button key={lead.id} onClick={() => { navigate('/leads'); setOpen(false); }} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-amber-500/20 hover:text-amber-500 text-gray-300 transition-colors">
                                        <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs">{lead.name.charAt(0)}</div>
                                        <span className="flex-1 text-left">{lead.name}</span>
                                        <span className="text-xs text-gray-500">{lead.status}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* INVENTORY */}
                        {filteredProps.length > 0 && (
                            <div className="px-2 py-1 border-t border-white/5">
                                <p className="text-[10px] uppercase font-bold text-gray-500 mb-2 mt-2 ml-2">Inventory</p>
                                {filteredProps.map(prop => (
                                    <button key={prop.id} onClick={() => { navigate('/inventory'); setOpen(false); }} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-green-500/20 hover:text-green-500 text-gray-300 transition-colors">
                                        <Building2 size={18} />
                                        <span className="flex-1 text-left">{prop.name}</span>
                                        <span className="text-xs text-gray-500">AED {prop.price.toLocaleString()}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {query && filteredLeads.length === 0 && filteredProps.length === 0 && actions.length === 0 && (
                            <div className="p-8 text-center text-gray-500">
                                <p>No results found.</p>
                            </div>
                        )}
                    </div>

                    <div className="p-2 border-t border-white/5 bg-black/20 text-center">
                        <p className="text-[10px] text-gray-600">Press <kbd className="bg-gray-700 px-1 rounded">Ctrl+K</kbd> to toggle</p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
