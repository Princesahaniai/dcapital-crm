import React from 'react';
import { Modal } from '../Modal';
import { Clock, User, ArrowRight, Info } from 'lucide-react';

interface HistoryEntry {
    date: string;
    action: string;
    fromName?: string;
    toName?: string;
    note?: string;
}

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    leadName: string;
    historyLog: HistoryEntry[];
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, leadName, historyLog }) => {
    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Lead Tracking: ${leadName}`} maxWidth="max-w-3xl">
            <div className="p-1 md:p-6">
                {historyLog && historyLog.length > 0 ? (
                    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:ml-[2.25rem] md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 dark:before:via-zinc-700 before:to-transparent">
                        {[...historyLog].reverse().map((entry, index) => (
                            <div key={index} className="relative flex items-start gap-4 md:gap-8 group">
                                {/* Timeline Circle */}
                                <div className="absolute left-0 mt-1 md:mt-2 w-10 h-10 md:w-11 md:h-11 rounded-full border-4 border-white dark:border-zinc-900 bg-slate-100 dark:bg-zinc-800 flex items-center justify-center z-10 group-hover:scale-110 transition-transform shadow-sm">
                                    <Clock size={16} className="text-blue-500" />
                                </div>

                                <div className="ml-12 md:ml-16 bg-slate-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-slate-200/50 dark:border-zinc-700/50 flex-1 shadow-sm group-hover:border-blue-500/30 transition-colors">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                                                entry.action === 'SYSTEM ACTION' 
                                                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                                                    : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                            }`}>
                                                {entry.action}
                                            </span>
                                            <span className="text-xs font-bold text-slate-400 dark:text-zinc-500">
                                                {formatDate(entry.date)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center flex-wrap gap-2 text-sm text-slate-700 dark:text-zinc-300 font-medium">
                                        {entry.fromName && (
                                            <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 px-2 py-1 rounded-lg border border-slate-100 dark:border-zinc-800">
                                                <User size={12} className="text-slate-400" />
                                                <span>{entry.fromName}</span>
                                            </div>
                                        )}
                                        {(entry.fromName && entry.toName) && <ArrowRight size={14} className="text-slate-300" />}
                                        {entry.toName && (
                                            <div className="flex items-center gap-1.5 bg-blue-500/5 dark:bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/10 text-blue-600 dark:text-blue-400">
                                                <User size={12} />
                                                <span>{entry.toName}</span>
                                            </div>
                                        )}
                                    </div>

                                    {entry.note && (
                                        <div className="mt-3 p-3 bg-white dark:bg-zinc-900/50 rounded-xl border border-slate-100 dark:border-zinc-800 flex gap-2 items-start italic text-sm text-slate-600 dark:text-zinc-400">
                                            <Info size={14} className="mt-0.5 shrink-0 text-blue-400" />
                                            {entry.note}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock size={32} className="text-slate-300" />
                        </div>
                        <p className="text-slate-400 dark:text-zinc-500 font-bold">No history records found for this lead.</p>
                    </div>
                )}
            </div>
        </Modal>
    );
};
