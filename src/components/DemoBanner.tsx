import React from 'react';
import { useStore } from '../store';
import { Info, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DemoBanner = () => {
    const { leads, resetLeads, user } = useStore();

    // Check if we have demo data (simple heuristic: check for IDs 1, 2, or 3)
    // Or just check if there are leads and we are in "setup mode" (which we don't have).
    // Let's assume if leads < 5 and contains ID "1", it's likely demo data.
    const hasDemoData = leads.some(l => ['1', '2', '3'].includes(l.id));

    if (!hasDemoData) return null;

    // Only show to Admin/CEO
    if (user?.role !== 'ceo' && user?.role !== 'admin' && !user?.email?.includes('admin')) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center justify-between mb-6 shadow-lg shadow-blue-500/20"
            >
                <div className="flex items-center gap-3">
                    <Info size={20} className="text-blue-200" />
                    <div>
                        <p className="font-bold text-sm">Demo Mode Active</p>
                        <p className="text-xs text-blue-100">You are viewing sample data. Clear it when ready for production.</p>
                    </div>
                </div>
                <button
                    onClick={() => { if (confirm('Clear all demo leads?')) resetLeads(); }}
                    className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors"
                >
                    <Trash2 size={14} /> Clear Data
                </button>
            </motion.div>
        </AnimatePresence>
    );
};
