import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Phone, Mail, DollarSign, User } from 'lucide-react';
import type { Lead } from '../../types';

const PIPELINE_STAGES: Lead['status'][] = ['New', 'Contacted', 'Qualified', 'Viewing', 'Negotiation', 'Closed'];

const STAGE_COLORS: Record<string, { bg: string; border: string; badge: string; text: string }> = {
    New: { bg: 'bg-blue-500/5', border: 'border-blue-500/20', badge: 'bg-blue-500', text: 'text-blue-500' },
    Contacted: { bg: 'bg-amber-500/5', border: 'border-amber-500/20', badge: 'bg-amber-500', text: 'text-amber-500' },
    Qualified: { bg: 'bg-purple-500/5', border: 'border-purple-500/20', badge: 'bg-purple-500', text: 'text-purple-500' },
    Viewing: { bg: 'bg-cyan-500/5', border: 'border-cyan-500/20', badge: 'bg-cyan-500', text: 'text-cyan-500' },
    Negotiation: { bg: 'bg-orange-500/5', border: 'border-orange-500/20', badge: 'bg-orange-500', text: 'text-orange-500' },
    Closed: { bg: 'bg-green-500/5', border: 'border-green-500/20', badge: 'bg-green-500', text: 'text-green-500' },
};

interface KanbanBoardProps {
    leads: Lead[];
    onMoveStage: (leadId: string, newStatus: Lead['status']) => void;
    onSelectLead: (lead: Lead) => void;
    teamMap: Record<string, string>; // id -> name
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ leads, onMoveStage, onSelectLead, teamMap }) => {
    const getNextStage = (current: Lead['status']): Lead['status'] | null => {
        const idx = PIPELINE_STAGES.indexOf(current);
        return idx < PIPELINE_STAGES.length - 1 ? PIPELINE_STAGES[idx + 1] : null;
    };

    return (
        <div className="w-full overflow-x-auto scrollbar-hide pb-4">
            <div className="flex gap-4 min-w-[1200px] px-1">
                {PIPELINE_STAGES.map(stage => {
                    const stageLeads = leads.filter(l => l.status === stage);
                    const colors = STAGE_COLORS[stage];
                    const totalValue = stageLeads.reduce((sum, l) => sum + (l.budget || 0), 0);

                    return (
                        <div key={stage} className={`flex-1 min-w-[220px] rounded-2xl border ${colors.border} ${colors.bg} p-3`}>
                            {/* Column Header */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${colors.badge}`} />
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">{stage}</h3>
                                </div>
                                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-full">
                                    {stageLeads.length}
                                </span>
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-wider">
                                AED {(totalValue / 1000000).toFixed(1)}M Pipeline
                            </p>

                            {/* Cards */}
                            <div className="space-y-3 max-h-[60vh] overflow-y-auto scrollbar-hide">
                                {stageLeads.map(lead => {
                                    const nextStage = getNextStage(lead.status);
                                    return (
                                        <motion.div
                                            key={lead.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="bg-white dark:bg-[#1C1C1E] rounded-xl p-3 border border-gray-100 dark:border-white/5 shadow-sm cursor-pointer hover:shadow-md transition-all group"
                                            onClick={() => onSelectLead(lead)}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate flex-1">{lead.name}</h4>
                                            </div>

                                            {lead.budget ? (
                                                <div className="flex items-center gap-1 text-xs text-green-500 font-bold mb-2">
                                                    <DollarSign size={12} />
                                                    AED {lead.budget.toLocaleString()}
                                                </div>
                                            ) : null}

                                            <div className="flex items-center gap-3 text-[10px] text-gray-400 mb-3">
                                                {lead.phone && (
                                                    <span className="flex items-center gap-1"><Phone size={10} />{lead.phone.slice(-4)}</span>
                                                )}
                                                {lead.email && (
                                                    <span className="flex items-center gap-1"><Mail size={10} />{lead.email.split('@')[0]}</span>
                                                )}
                                            </div>

                                            {lead.assignedTo && teamMap[lead.assignedTo] && (
                                                <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-2">
                                                    <User size={10} />
                                                    <span>{teamMap[lead.assignedTo]}</span>
                                                </div>
                                            )}

                                            {/* Move to Next Stage */}
                                            {nextStage && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onMoveStage(lead.id, nextStage); }}
                                                    className={`w-full mt-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold ${colors.text} bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-all touch-target`}
                                                >
                                                    Move to {nextStage} <ArrowRight size={12} />
                                                </button>
                                            )}

                                            {stage === 'Closed' && (
                                                <div className="w-full mt-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold text-green-500 bg-green-500/10">
                                                    ✅ Deal Closed
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}

                                {stageLeads.length === 0 && (
                                    <div className="py-8 text-center">
                                        <p className="text-xs text-gray-400">No leads</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
