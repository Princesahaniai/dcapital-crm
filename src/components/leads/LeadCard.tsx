import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Mail, MoreHorizontal, Trash2, Zap, MessageSquare, X, Send, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { StageIndicator } from './StageIndicator';
import { WhatsAppButton } from '../WhatsAppButton';
import type { Lead } from '../../types';
import { logCall, logEmail } from '../../services/activityLog';
import { useStore } from '../../store';
import { calculateLeadScore } from '../../utils/leadScoring';
import { FollowUpAlert } from './FollowUpAlert';

interface LeadCardProps {
    lead: Lead;
    onClick: () => void;
    onEdit: (e: React.MouseEvent) => void;
    onDelete: (e: React.MouseEvent) => void;
    onHistory: (e: React.MouseEvent) => void;
    agentName?: string;
}

export const LeadCard: React.FC<LeadCardProps> = ({ lead, onClick, onEdit, onDelete, onHistory, agentName = 'Unassigned' }) => {
    const { user, toggleSmartNurture, addQuickNote, updateLead } = useStore();
    const scoreData = calculateLeadScore(lead);
    const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
    const [quickNote, setQuickNote] = useState('');

    const handleQuickNoteSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!quickNote.trim()) return;
        addQuickNote(lead.id, quickNote.trim());
        setQuickNote('');
        setIsQuickLogOpen(false);
        toast.success('Quick note saved');
    };

    const stopProp = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
    };

    const handleCall = () => {
        logCall(lead.id, user?.id || 'unknown', user?.name || 'System');
        window.open(`tel:${lead.phone}`);
    };

    const handleEmail = () => {
        logEmail(lead.id, user?.id || 'unknown', user?.name || 'System');
        window.open(`mailto:${lead.email}`);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ 
                y: -6, 
                scale: 1.01,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(59, 130, 246, 0.2)" 
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`group bg-white dark:bg-[#1C1C1E] border ${
                lead.status === 'New' && (Date.now() - (lead.createdAt || Date.now())) > 86400000 
                    ? 'border-red-500 shadow-red-500/50 shadow-lg ring-1 ring-red-500/30' 
                    : 'border-gray-200 dark:border-white/5 shadow-sm'
            } rounded-3xl p-5 cursor-pointer relative overflow-hidden hover:border-blue-500/40 transition-all duration-300`}
            onClick={onClick}
        >
            {/* Top Row: User Info & Badge */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20 relative group-hover:scale-110 transition-transform duration-300">
                        {lead.name.charAt(0)}
                        <FollowUpAlert lead={lead} compact />
                    </div>
                    <div className="max-w-[120px]">
                        <h3 className="font-bold text-gray-900 dark:text-white truncate text-lg group-hover:text-blue-500 transition-colors">{lead.name}</h3>
                        <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${scoreData.color} font-bold`}>
                                {scoreData.label} {scoreData.score}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border shadow-sm ${lead.status === 'New' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                        lead.status === 'Closed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                            lead.status === 'Lost' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10'}`}>
                        {lead.status === 'Trash' ? 'DELETED' : lead.status}
                    </div>
                    {lead.waStatus && (
                        <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 shadow-sm ${lead.waStatus === 'Delivered' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                            lead.waStatus === 'Sent' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                            WA: {lead.waStatus}
                        </div>
                    )}
                </div>
            </div>

            {/* Middle Row: Stats */}
            <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-gray-50 dark:bg-black/20 p-3 rounded-2xl border border-gray-100 dark:border-white/5 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/10 transition-colors">
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Budget</p>
                    <p className="text-sm font-black text-gray-900 dark:text-white">AED {lead.budget?.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 dark:bg-black/20 p-3 rounded-2xl border border-gray-100 dark:border-white/5 group-hover:bg-purple-50 dark:group-hover:bg-purple-900/10 transition-colors">
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Assigned To</p>
                    <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-[10px] flex items-center justify-center font-bold">
                            {agentName.charAt(0)}
                        </div>
                        <p className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{agentName}</p>
                    </div>
                </div>
            </div>

            {/* Pipeline Indicator */}
            <div className="mb-4">
                <StageIndicator currentStage={lead.status} compact />
                <FollowUpAlert lead={lead} />
            </div>

            {/* Bottom: Quick Actions */}
            <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-white/5">
                <WhatsAppButton phone={lead.phone || ''} name={lead.name} leadId={lead.id} compact />

                <button
                    onClick={(e) => stopProp(e, () => setIsQuickLogOpen(true))}
                    title="Quick Note"
                    aria-label="Quick Note"
                    className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/10 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors shadow-sm"
                >
                    <MessageSquare size={16} />
                </button>

                <button
                    onClick={(e) => stopProp(e, () => toggleSmartNurture(lead.id))}
                    title={lead.smartNurture ? 'Disable Smart Nurture' : 'Enable Smart Nurture'}
                    aria-label="Toggle Smart Nurture"
                    className={`p-2.5 rounded-xl transition-colors ${lead.smartNurture ? 'bg-amber-500/20 text-amber-500 ring-1 ring-amber-500/30' : 'bg-gray-50 dark:bg-white/5 text-gray-400 hover:bg-amber-50 dark:hover:bg-amber-900/10 hover:text-amber-500'}`}
                >
                    <Zap size={16} />
                </button>

                <button
                    onClick={(e) => stopProp(e, handleCall)}
                    title="Call Lead"
                    aria-label="Call Lead"
                    className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    <Phone size={16} />
                </button>

                <button
                    onClick={(e) => stopProp(e, handleEmail)}
                    title="Email Lead"
                    aria-label="Email Lead"
                    className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    <Mail size={16} />
                </button>

                <div className="flex-1" />

                {lead.status === 'Trash' ? (
                    <button
                        onClick={onDelete}
                        className="p-2.5 rounded-xl bg-green-50 dark:bg-green-900/10 text-green-500 hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors"
                        title="Restore Lead"
                        aria-label="Restore Lead"
                    >
                        <Trash2 size={16} className="rotate-180" />
                    </button>
                ) : (
                    <button
                        onClick={onDelete}
                        title="Delete Lead"
                        aria-label="Delete Lead"
                        className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                    >
                        <Trash2 size={16} />
                    </button>
                )}

                <button
                    onClick={(e) => stopProp(e, () => onHistory(e))}
                    title="View Tracking History"
                    aria-label="History"
                    className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-500 transition-colors"
                >
                    <Clock size={16} />
                </button>

                <div className="flex-1"></div>
                <button
                    onClick={onEdit}
                    title="More Options"
                    aria-label="More Options"
                    className="p-2.5 rounded-xl text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    <MoreHorizontal size={18} />
                </button>
            </div>

            {lead.category === 'prospect' && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        updateLead(lead.id, { category: 'lead', status: 'New' });
                        toast.success('Promoted to real Lead!');
                    }}
                    className="w-full mt-3 bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 rounded-xl text-[11px] tracking-[0.2em] transition-colors shadow-lg shadow-green-500/20"
                >
                    P R O M O T E   T O   L E A D
                </button>
            )}

            {/* Quick Log Modal Overlay */}
            <AnimatePresence>
                {isQuickLogOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute inset-0 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-md z-20 flex flex-col p-5 rounded-3xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <MessageSquare size={16} className="text-blue-500" /> Quick Note
                            </h4>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsQuickLogOpen(false); }}
                                title="Close Quick Note"
                                aria-label="Close"
                                className="p-1.5 bg-gray-100 dark:bg-white/10 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                        <form onSubmit={handleQuickNoteSubmit} className="flex flex-col h-full flex-1">
                            <textarea
                                autoFocus
                                value={quickNote}
                                onChange={(e) => setQuickNote(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                placeholder="Log call outcome, agent follow-up..."
                                className="w-full flex-1 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none mb-3 transition-colors shadow-inner"
                            />
                            <div className="flex justify-end gap-2 mt-auto">
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setIsQuickLogOpen(false); }}
                                    className="px-4 py-2 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    onClick={(e) => e.stopPropagation()}
                                    disabled={!quickNote.trim()}
                                    className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
                                >
                                    <Send size={14} /> Save Log
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
