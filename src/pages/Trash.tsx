import React from 'react';
import { useStore } from '../store';
import { motion } from 'framer-motion';
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react';

export const Trash = () => {
    const { leads, restoreLead, permanentDeleteLead } = useStore();
    const deletedLeads = leads.filter(l => l.status === 'Trash');

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-red-500">
                    <Trash2 size={24} />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">Trash</h1>
                    <p className="text-gray-500 dark:text-gray-400">Restore or permanently delete items</p>
                </div>
            </div>

            {deletedLeads.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5">
                    <Trash2 size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 font-medium">Trash is empty</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {deletedLeads.map((lead) => (
                        <motion.div
                            key={lead.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="bg-white dark:bg-[#1C1C1E] p-4 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">{lead.name}</h3>
                                    <p className="text-xs text-gray-500 uppercase tracking-widest">{lead.source}</p>
                                </div>
                                <div className="px-2 py-1 bg-red-500/10 text-red-500 text-[10px] font-bold uppercase rounded-lg">
                                    Deleted
                                </div>
                            </div>

                            <div className="flex gap-2">
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
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};
