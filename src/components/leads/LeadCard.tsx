import React from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MoreHorizontal, Trash2, Zap } from 'lucide-react';
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
    agentName?: string;
}

export const LeadCard: React.FC<LeadCardProps> = ({ lead, onClick, onEdit, onDelete, agentName = 'Unassigned' }) => {
    const { user, toggleSmartNurture } = useStore();
    const scoreData = calculateLeadScore(lead);

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
            whileHover={{ y: -4, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
            className="group bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/5 rounded-3xl p-5 cursor-pointer relative overflow-hidden shadow-sm hover:border-blue-500/30 transition-all duration-300"
            onClick={onClick}
        >
            {/* Top Row: User Info & Badge */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20 relative">
                        {lead.name.charAt(0)}
                        <FollowUpAlert lead={lead} compact />
                    </div>
                    <div className="max-w-[120px]">
                        <h3 className="font-bold text-gray-900 dark:text-white truncate text-lg">{lead.name}</h3>
                        <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${scoreData.color} font-bold`}>
                                {scoreData.label} {scoreData.score}
                            </span>
                        </div>
                    </div>
                </div>
                <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${lead.status === 'New' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                    lead.status === 'Closed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                        lead.status === 'Lost' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                            'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10'}`}>
                    {lead.status === 'Trash' ? 'DELETED' : lead.status}
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
                        onClick={onDelete} // This will trigger restore if parent handles it, or updated logic in Leads.tsx
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
        </motion.div>
    );
};
