import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Phone, ArrowRight } from 'lucide-react';
import type { Lead } from '../../types';
import toast from 'react-hot-toast';

// ── Pipeline columns including Closed/Lost as a combined terminal column ──
const PIPELINE_STAGES: Array<{ key: Lead['status'] | 'Closed/Lost'; label: string; statuses: Lead['status'][] }> = [
    { key: 'New',         label: 'New',         statuses: ['New'] },
    { key: 'Contacted',   label: 'Contacted',   statuses: ['Contacted'] },
    { key: 'Viewing',     label: 'Viewing',     statuses: ['Viewing'] },
    { key: 'Negotiation', label: 'Negotiation', statuses: ['Negotiation'] },
    { key: 'Closed/Lost', label: 'Closed / Lost', statuses: ['Closed', 'Lost'] },
];

// Stage progression for move-forward arrow (only the pipeline stages, not terminal)
const MOVE_STAGES: Lead['status'][] = ['New', 'Contacted', 'Viewing', 'Negotiation', 'Closed'];

const STAGE_CONFIG: Record<string, {
    gradient: string;
    dot: string;
    badgeBg: string;
    badgeText: string;
    ring: string;
    emptyIcon: string;
    moveBtnClass: string;
}> = {
    New: {
        gradient: 'from-blue-600 to-blue-400',
        dot: 'bg-blue-400',
        badgeBg: 'bg-blue-500/15',
        badgeText: 'text-blue-400',
        ring: 'ring-blue-500/20',
        emptyIcon: '🆕',
        moveBtnClass: 'text-blue-400 hover:bg-blue-500/10 border-blue-500/20',
    },
    Contacted: {
        gradient: 'from-amber-500 to-yellow-400',
        dot: 'bg-amber-400',
        badgeBg: 'bg-amber-500/15',
        badgeText: 'text-amber-400',
        ring: 'ring-amber-500/20',
        emptyIcon: '📞',
        moveBtnClass: 'text-amber-400 hover:bg-amber-500/10 border-amber-500/20',
    },
    Viewing: {
        gradient: 'from-cyan-600 to-teal-400',
        dot: 'bg-cyan-400',
        badgeBg: 'bg-cyan-500/15',
        badgeText: 'text-cyan-400',
        ring: 'ring-cyan-500/20',
        emptyIcon: '🏠',
        moveBtnClass: 'text-cyan-400 hover:bg-cyan-500/10 border-cyan-500/20',
    },
    Negotiation: {
        gradient: 'from-orange-500 to-amber-400',
        dot: 'bg-orange-400',
        badgeBg: 'bg-orange-500/15',
        badgeText: 'text-orange-400',
        ring: 'ring-orange-500/20',
        emptyIcon: '🤝',
        moveBtnClass: 'text-orange-400 hover:bg-orange-500/10 border-orange-500/20',
    },
    'Closed/Lost': {
        gradient: 'from-slate-600 to-slate-500',
        dot: 'bg-slate-400',
        badgeBg: 'bg-slate-500/15',
        badgeText: 'text-slate-400',
        ring: 'ring-slate-500/20',
        emptyIcon: '📁',
        moveBtnClass: 'text-slate-400 hover:bg-slate-500/10 border-slate-500/20',
    },
};

interface KanbanBoardProps {
    leads: Lead[];
    onMoveStage: (leadId: string, newStatus: Lead['status']) => void;
    onSelectLead: (lead: Lead) => void;
    teamMap: Record<string, string>;
}

const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ leads, onMoveStage, onSelectLead, teamMap }) => {
    const getNextStage = (current: Lead['status']): Lead['status'] | null => {
        const idx = MOVE_STAGES.indexOf(current);
        return idx >= 0 && idx < MOVE_STAGES.length - 1 ? MOVE_STAGES[idx + 1] : null;
    };

    const isStale = (lead: Lead): boolean => {
        const lastActivity = Math.max(lead.lastContact || 0, lead.updatedAt || 0, lead.createdAt || 0);
        return (Date.now() - lastActivity) > FORTY_EIGHT_HOURS;
    };

    const totalPipeline = leads.reduce((sum, l) => sum + (l.budget || 0), 0);

    return (
        <div className="w-full mt-2">
            {/* ── Pipeline Summary Bar ── */}
            <div className="mb-5 flex items-center gap-3 px-1">
                <div className="flex items-center gap-2 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/5 rounded-2xl px-4 py-2.5 shadow-sm">
                    <DollarSign size={14} className="text-emerald-500 shrink-0" />
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pipeline</span>
                    <span className="text-sm font-black text-gray-900 dark:text-white ml-1">
                        AED {(totalPipeline / 1_000_000).toFixed(1)}M
                    </span>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/5 rounded-2xl px-4 py-2.5 shadow-sm">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {leads.length} Leads
                    </span>
                </div>
            </div>

            {/* ── Horizontal Kanban Board ── */}
            <div className="w-full overflow-x-auto scrollbar-hide pb-6">
                <div className="flex gap-3 min-w-[900px]">
                    {PIPELINE_STAGES.map(col => {
                        const cfg = STAGE_CONFIG[col.key];
                        const colLeads = leads.filter(l => col.statuses.includes(l.status as Lead['status']));
                        const colValue = colLeads.reduce((s, l) => s + (l.budget || 0), 0);

                        return (
                            <div
                                key={col.key}
                                className={`flex-1 min-w-[175px] flex flex-col rounded-2xl bg-white dark:bg-[#141414] border border-gray-200/60 dark:border-white/5 shadow-sm overflow-hidden ring-1 ${cfg.ring}`}
                            >
                                {/* ── Column Header ── */}
                                <div className={`bg-gradient-to-r ${cfg.gradient} p-3.5`}>
                                    <div className="flex items-center justify-between mb-0.5">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`w-2 h-2 rounded-full ${cfg.dot} shadow-sm`} />
                                            <h3 className="text-xs font-extrabold text-white tracking-wide">{col.label}</h3>
                                        </div>
                                        <span className="text-[10px] font-bold bg-black/20 text-white px-2 py-0.5 rounded-full">
                                            {colLeads.length}
                                        </span>
                                    </div>
                                    <p className="text-[9px] font-bold text-white/65 uppercase tracking-widest mt-0.5">
                                        AED {(colValue / 1_000_000).toFixed(1)}M
                                    </p>
                                </div>

                                {/* ── Cards ── */}
                                <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[68vh] scrollbar-hide">
                                    <AnimatePresence>
                                        {colLeads.map(lead => {
                                            const stale = isStale(lead);
                                            const nextStage = getNextStage(lead.status);
                                            const agentName = lead.assignedTo && teamMap[lead.assignedTo]
                                                ? teamMap[lead.assignedTo]
                                                : null;
                                            const agentInitial = agentName ? agentName.charAt(0).toUpperCase() : '?';

                                            // Status-specific badge for Closed/Lost column
                                            const isClosedOrLost = col.key === 'Closed/Lost';
                                            const statusBadge = lead.status === 'Closed'
                                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                                : lead.status === 'Lost'
                                                    ? 'bg-red-500/15 text-red-400 border-red-500/30'
                                                    : '';

                                            return (
                                                <motion.div
                                                    key={lead.id}
                                                    layout
                                                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                                                    onClick={() => onSelectLead(lead)}
                                                    className={`group bg-white dark:bg-[#1C1C1E] rounded-xl border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 overflow-hidden ${
                                                        stale
                                                            ? 'border-amber-400/50 shadow-sm shadow-amber-500/10'
                                                            : 'border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md'
                                                    }`}
                                                >
                                                    {/* Stale top accent line */}
                                                    {stale && (
                                                        <div className="h-0.5 bg-gradient-to-r from-amber-400 to-orange-400 w-full" />
                                                    )}

                                                    <div className="p-2.5">
                                                        {/* ── Row 1: Avatar initial + Name + stale icon ── */}
                                                        <div className="flex items-center gap-2 mb-2">
                                                            {/* Lead avatar */}
                                                            <div className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[11px] font-black shadow-sm">
                                                                {lead.name.charAt(0)}
                                                            </div>

                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-1">
                                                                    <h4 className="text-[12px] font-bold text-gray-900 dark:text-white truncate leading-tight group-hover:text-blue-500 transition-colors">
                                                                        {lead.name}
                                                                    </h4>
                                                                    {/* Stale warning — just the ⚠️ icon */}
                                                                    {stale && (
                                                                        <span
                                                                            title="⚠️ No activity in 48h"
                                                                            className="text-[11px] shrink-0"
                                                                        >
                                                                            ⚠️
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Agent avatar */}
                                                            <div
                                                                title={agentName || 'Unassigned'}
                                                                className="w-5 h-5 shrink-0 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-[9px] font-black shadow-sm"
                                                            >
                                                                {agentInitial}
                                                            </div>
                                                        </div>

                                                        {/* ── Row 2: Phone number ── */}
                                                        {lead.phone && (
                                                            <div
                                                                className="flex items-center gap-1 mb-2"
                                                                onClick={e => e.stopPropagation()}
                                                            >
                                                                <a
                                                                    href={`tel:${lead.phone}`}
                                                                    className="flex items-center gap-1 text-[10px] font-mono text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors"
                                                                    title={`Call ${lead.phone}`}
                                                                >
                                                                    <Phone size={9} className="shrink-0" />
                                                                    {lead.phone}
                                                                </a>
                                                            </div>
                                                        )}

                                                        {/* ── Row 3: Budget ── */}
                                                        {lead.budget ? (
                                                            <div className="text-[11px] font-black text-emerald-500 mb-2">
                                                                AED {lead.budget.toLocaleString()}
                                                            </div>
                                                        ) : (
                                                            <div className="text-[10px] text-gray-300 dark:text-gray-600 mb-2 italic">
                                                                No budget set
                                                            </div>
                                                        )}

                                                        {/* Closed/Lost sub-status badge */}
                                                        {isClosedOrLost && (
                                                            <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${statusBadge}`}>
                                                                {lead.status}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* ── Move to next stage button ── */}
                                                    {nextStage && !isClosedOrLost && (
                                                        <button
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                if (nextStage === 'Closed') {
                                                                    const kyc = lead.kyc;
                                                                    if (!kyc || !kyc.passport || !kyc.emiratesId || !kyc.formB) {
                                                                        toast.error('❌ 100% KYC required before closing.', { duration: 4000 });
                                                                        return;
                                                                    }
                                                                }
                                                                onMoveStage(lead.id, nextStage);
                                                                toast.success(`Moved to ${nextStage}`);
                                                            }}
                                                            className={`w-full flex items-center justify-center gap-1 py-1.5 border-t border-gray-100 dark:border-white/5 text-[10px] font-bold transition-all ${cfg.moveBtnClass}`}
                                                        >
                                                            → {nextStage} <ArrowRight size={10} />
                                                        </button>
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>

                                    {/* Empty state */}
                                    {colLeads.length === 0 && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="py-10 text-center"
                                        >
                                            <div className="text-3xl mb-2 opacity-25">{cfg.emptyIcon}</div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Empty</p>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
