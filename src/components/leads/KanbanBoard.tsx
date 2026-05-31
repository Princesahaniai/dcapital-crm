import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, DollarSign, MapPin, Phone, MessageCircle } from 'lucide-react';
import type { Lead } from '../../types';
import toast from 'react-hot-toast';

const PIPELINE_STAGES: Lead['status'][] = ['New', 'Contacted', 'Qualified', 'Viewing', 'Negotiation', 'Closed'];

// Premium column config — gradient headers, accent colours per stage
const STAGE_CONFIG: Record<string, {
    gradient: string;
    dot: string;
    badge: string;
    ring: string;
    emptyIcon: string;
    moveBtn: string;
}> = {
    New:         { gradient: 'from-blue-600 to-blue-400',     dot: 'bg-blue-400',    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',   ring: 'ring-blue-500/20',   emptyIcon: '🆕', moveBtn: 'text-blue-400 hover:bg-blue-500/10' },
    Contacted:   { gradient: 'from-amber-500 to-yellow-400',  dot: 'bg-amber-400',   badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30', ring: 'ring-amber-500/20',  emptyIcon: '📞', moveBtn: 'text-amber-400 hover:bg-amber-500/10' },
    Qualified:   { gradient: 'from-purple-600 to-violet-400', dot: 'bg-purple-400',  badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30', ring: 'ring-purple-500/20', emptyIcon: '✅', moveBtn: 'text-purple-400 hover:bg-purple-500/10' },
    Viewing:     { gradient: 'from-cyan-600 to-teal-400',     dot: 'bg-cyan-400',    badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',     ring: 'ring-cyan-500/20',   emptyIcon: '🏠', moveBtn: 'text-cyan-400 hover:bg-cyan-500/10' },
    Negotiation: { gradient: 'from-orange-500 to-amber-400',  dot: 'bg-orange-400',  badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30', ring: 'ring-orange-500/20', emptyIcon: '🤝', moveBtn: 'text-orange-400 hover:bg-orange-500/10' },
    Closed:      { gradient: 'from-emerald-600 to-green-400', dot: 'bg-emerald-400', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', ring: 'ring-emerald-500/20', emptyIcon: '🎉', moveBtn: 'text-emerald-400 hover:bg-emerald-500/10' },
};

interface KanbanBoardProps {
    leads: Lead[];
    onMoveStage: (leadId: string, newStatus: Lead['status']) => void;
    onSelectLead: (lead: Lead) => void;
    teamMap: Record<string, string>;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ leads, onMoveStage, onSelectLead, teamMap }) => {
    const getNextStage = (current: Lead['status']): Lead['status'] | null => {
        const idx = PIPELINE_STAGES.indexOf(current);
        return idx < PIPELINE_STAGES.length - 1 ? PIPELINE_STAGES[idx + 1] : null;
    };

    const handleWhatsApp = (e: React.MouseEvent, lead: Lead) => {
        e.stopPropagation();
        if (!lead.phone) { toast.error('No phone number for this lead'); return; }
        const clean = lead.phone.replace(/[^0-9]/g, '');
        const phone = (!clean.startsWith('971') && clean.length === 9) ? '971' + clean : clean;
        const text = encodeURIComponent(
            `Hi ${lead.name}, thank you for your inquiry with D Capital Real Estate. How can I assist you with your property search today?`
        );
        window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
    };

    const totalPipeline = leads.reduce((s, l) => s + (l.budget || 0), 0);

    return (
        <div className="w-full mt-2">
            {/* Pipeline summary bar */}
            <div className="mb-5 flex items-center gap-3 px-1">
                <div className="flex items-center gap-2 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/5 rounded-2xl px-4 py-2.5 shadow-sm">
                    <DollarSign size={15} className="text-emerald-500 shrink-0" />
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Pipeline</span>
                    <span className="text-sm font-black text-gray-900 dark:text-white ml-1">
                        AED {(totalPipeline / 1_000_000).toFixed(1)}M
                    </span>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/5 rounded-2xl px-4 py-2.5 shadow-sm">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{leads.length} Active Leads</span>
                </div>
            </div>

            {/* Columns */}
            <div className="w-full overflow-x-auto scrollbar-hide pb-6">
                <div className="flex gap-4 min-w-[1300px]">
                    {PIPELINE_STAGES.map(stage => {
                        const cfg = STAGE_CONFIG[stage];
                        const stageLeads = leads.filter(l => l.status === stage);
                        const stageValue = stageLeads.reduce((s, l) => s + (l.budget || 0), 0);

                        return (
                            <div
                                key={stage}
                                className={`flex-1 min-w-[200px] flex flex-col rounded-2xl bg-white dark:bg-[#141414] border border-gray-200/60 dark:border-white/5 shadow-sm overflow-hidden ring-1 ${cfg.ring}`}
                            >
                                {/* ── Column Header ── */}
                                <div className={`bg-gradient-to-r ${cfg.gradient} p-4`}>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot} shadow-sm`} />
                                            <h3 className="text-sm font-extrabold text-white tracking-wide">{stage}</h3>
                                        </div>
                                        <span className="text-[11px] font-bold bg-black/20 text-white px-2 py-0.5 rounded-full">
                                            {stageLeads.length}
                                        </span>
                                    </div>
                                    <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">
                                        AED {(stageValue / 1_000_000).toFixed(1)}M
                                    </p>
                                </div>

                                {/* ── Cards ── */}
                                <div className="flex-1 p-2.5 space-y-2.5 overflow-y-auto max-h-[65vh] scrollbar-hide">
                                    <AnimatePresence>
                                        {stageLeads.map(lead => {
                                            const nextStage = getNextStage(lead.status);
                                            const agentName = lead.assignedTo && teamMap[lead.assignedTo]
                                                ? teamMap[lead.assignedTo]
                                                : null;
                                            const isStale = stage === 'New' &&
                                                (Date.now() - (lead.createdAt || Date.now())) > 86400000;

                                            return (
                                                <motion.div
                                                    key={lead.id}
                                                    layout
                                                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                                                    onClick={() => onSelectLead(lead)}
                                                    className={`group bg-white dark:bg-[#1C1C1E] rounded-xl border ${
                                                        isStale
                                                            ? 'border-red-400/60 shadow-md shadow-red-500/10'
                                                            : 'border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md'
                                                    } cursor-pointer transition-all duration-200 hover:-translate-y-0.5 overflow-hidden`}
                                                >
                                                    {/* Stale indicator */}
                                                    {isStale && (
                                                        <div className="h-0.5 bg-red-400 w-full" />
                                                    )}

                                                    <div className="p-3">
                                                        {/* Avatar + Name */}
                                                        <div className="flex items-center gap-2.5 mb-2.5">
                                                            <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-black shadow-sm">
                                                                {lead.name.charAt(0)}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="text-[13px] font-bold text-gray-900 dark:text-white truncate leading-tight group-hover:text-blue-500 transition-colors">
                                                                    {lead.name}
                                                                </h4>
                                                                {agentName && (
                                                                    <p className="text-[10px] text-gray-400 truncate">{agentName}</p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Budget */}
                                                        {lead.budget ? (
                                                            <div className="flex items-center gap-1 mb-2">
                                                                <span className="text-[11px] font-black text-emerald-500">
                                                                    AED {lead.budget.toLocaleString()}
                                                                </span>
                                                            </div>
                                                        ) : null}

                                                        {/* Location */}
                                                        {lead.targetLocation && (
                                                            <div className="flex items-center gap-1 mb-2.5 text-[10px] text-gray-400">
                                                                <MapPin size={9} className="shrink-0" />
                                                                <span className="truncate">{lead.targetLocation}</span>
                                                            </div>
                                                        )}

                                                        {/* Phone + WA quick actions */}
                                                        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                                            {lead.phone && (
                                                                <a
                                                                    href={`tel:${lead.phone}`}
                                                                    title="Call"
                                                                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-500 transition-all text-[10px] font-bold"
                                                                >
                                                                    <Phone size={10} />
                                                                    <span className="font-mono">{lead.phone.slice(-4)}</span>
                                                                </a>
                                                            )}
                                                            <button
                                                                onClick={e => handleWhatsApp(e, lead)}
                                                                title="WhatsApp"
                                                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all text-[10px] font-bold"
                                                            >
                                                                <MessageCircle size={10} />
                                                                WA
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* ── Move to next stage ── */}
                                                    {nextStage && (
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
                                                            className={`w-full flex items-center justify-center gap-1.5 py-2 border-t border-gray-100 dark:border-white/5 text-[11px] font-bold transition-all ${cfg.moveBtn}`}
                                                        >
                                                            → {nextStage} <ArrowRight size={11} />
                                                        </button>
                                                    )}

                                                    {/* Closed state banner */}
                                                    {stage === 'Closed' && (
                                                        <div className="w-full flex items-center justify-center gap-1.5 py-2 border-t border-emerald-100 dark:border-emerald-500/10 text-[11px] font-bold text-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/5">
                                                            🎉 Deal Closed
                                                        </div>
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>

                                    {/* Empty state */}
                                    {stageLeads.length === 0 && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="py-10 text-center"
                                        >
                                            <div className="text-3xl mb-2 opacity-30">{cfg.emptyIcon}</div>
                                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">No leads</p>
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
