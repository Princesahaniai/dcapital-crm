import React, { useEffect } from 'react';
import { useStore } from '../store';
import { motion } from 'framer-motion';
import { Trash2, RotateCcw, AlertTriangle, Clock, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export const Trash = () => {
    const { leads, restoreLead, permanentDeleteLead, user } = useStore();
    const deletedLeads = leads.filter(l => l.status === 'Trash');
    const isAdmin = user?.role === 'ceo' || user?.role === 'admin';

    // Smart Nurture: Check for leads sitting in 'New' > 4 hours with smartNurture enabled
    useEffect(() => {
        const check = () => {
            const now = Date.now();
            const fourHours = 4 * 60 * 60 * 1000;
            const staleLeads = useStore.getState().leads.filter(
                l => l.smartNurture && l.status === 'New' && (now - l.createdAt) > fourHours
            );
            staleLeads.forEach(lead => {
                const notifText = `⚠️ Smart Nurture Alert: ${lead.name} has been in 'New' for over 4 hours. Re-assign immediately.`;
                const existing = useStore.getState().notifications.some(n => n.text.includes(lead.name) && n.text.includes('Smart Nurture'));
                if (!existing) {
                    useStore.getState().addNotification(notifText);
                    toast(`🤖 ${lead.name} needs attention!`, { icon: '⚠️' });
                }
            });
        };
        check();
        const interval = setInterval(check, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    const getDaysRemaining = (deletedAt?: number) => {
        if (!deletedAt) return 30;
        const elapsed = Date.now() - deletedAt;
        const remaining = 30 - Math.floor(elapsed / (1000 * 60 * 60 * 24));
        return Math.max(remaining, 0);
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-red-500">
                    <Trash2 size={24} />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">Trash</h1>
                    <p className="text-gray-500 dark:text-gray-400">Items are automatically purged after 30 days</p>
                </div>
            </div>

            {deletedLeads.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5">
                    <Trash2 size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 font-medium">Trash is empty</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {deletedLeads.map((lead) => {
                        const daysLeft = getDaysRemaining(lead.deletedAt);
                        return (
                            <motion.div
                                key={lead.id}
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="bg-white dark:bg-[#1C1C1E] p-5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">{lead.name}</h3>
                                        <p className="text-xs text-gray-500 uppercase tracking-widest">{lead.source}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${daysLeft <= 7 ? 'bg-red-500/10 text-red-500' : daysLeft <= 14 ? 'bg-amber-500/10 text-amber-500' : 'bg-gray-100 dark:bg-white/10 text-gray-500'}`}>
                                            <Clock size={12} />
                                            {daysLeft}d left
                                        </div>
                                    </div>
                                </div>

                                {lead.budget && (
                                    <p className="text-xs text-gray-400 mb-4">Budget: AED {lead.budget?.toLocaleString()}</p>
                                )}

                                <div className="flex gap-2">
                                    {isAdmin ? (
                                        <>
                                            <button
                                                onClick={() => restoreLead(lead.id)}
                                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 font-bold text-xs rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors"
                                            >
                                                <RotateCcw size={14} />
                                                Restore
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Delete permanently? This cannot be undone.')) {
                                                        permanentDeleteLead(lead.id);
                                                    }
                                                }}
                                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 font-bold text-xs rounded-xl hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                                            >
                                                <AlertTriangle size={14} />
                                                Delete
                                            </button>
                                        </>
                                    ) : (
                                        <div className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-50 dark:bg-white/5 text-gray-400 font-bold text-xs rounded-xl">
                                            <Shield size={14} />
                                            Admin Only
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
