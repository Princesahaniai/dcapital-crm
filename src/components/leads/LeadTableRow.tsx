import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Phone, Clock, Trash2, CheckSquare, Square, MessageSquareShare,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { WhatsAppButton } from '../WhatsAppButton';
import { useStore } from '../../store';
import type { Lead } from '../../types';

interface Props {
    lead: Lead & { historyLog?: any[]; notes?: string; _remark?: string };
    idx: number;
    isSelected: boolean;
    isPrivileged: boolean;
    statusClass: string;
    agentName: string;
    agentInitial: string;
    showTrash: boolean;
    user: any;
    onRowClick: () => void;
    onToggleSelect: () => void;
    onHistory: () => void;
    onDelete: () => void;
}

export const LeadTableRow: React.FC<Props> = ({
    lead, idx, isSelected, isPrivileged, statusClass,
    agentName, agentInitial, showTrash, user,
    onRowClick, onToggleSelect, onHistory, onDelete,
}) => {
    const [noteOpen, setNoteOpen] = useState(false);
    const [noteText, setNoteText] = useState('');

    const submitNote = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        const trimmed = noteText.trim();
        if (!trimmed) return;
        const { addQuickNote } = useStore.getState();
        addQuickNote(lead.id, trimmed);
        toast.success(`Note saved for ${lead.name}`);
        setNoteText('');
        setNoteOpen(false);
    };

    const notePreview = (lead.notes || lead._remark || '').trim();

    return (
        <React.Fragment>
            {/* ── Main Row ─────────────────────────────────────────────── */}
            <motion.tr
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, delay: idx * 0.012 }}
                onClick={onRowClick}
                className={`group cursor-pointer transition-colors duration-100 ${
                    isSelected
                        ? 'bg-blue-50/80 dark:bg-blue-500/[0.07]'
                        : 'hover:bg-gray-50/80 dark:hover:bg-white/[0.025]'
                }`}
            >
                {/* Checkbox (CEO/Admin only) */}
                {(user?.role === 'ceo' || user?.role === 'admin') && (
                    <td className="px-3 py-2.5" onClick={e => { e.stopPropagation(); onToggleSelect(); }}>
                        {isSelected
                            ? <CheckSquare size={15} className="text-blue-500" />
                            : <Square size={15} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-400 transition-colors" />}
                    </td>
                )}

                {/* Name + avatar */}
                <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[11px] font-black shadow-sm">
                            {lead.name.charAt(0)}
                        </div>
                        <span className="text-[13px] font-semibold text-gray-900 dark:text-white truncate max-w-[160px] group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                            {lead.name}
                        </span>
                    </div>
                </td>

                {/* Phone + WhatsApp */}
                <td className="px-4 py-2.5 hidden sm:table-cell" onClick={e => e.stopPropagation()}>
                    {lead.phone ? (
                        <div className="flex items-center gap-2">
                            <a
                                href={`tel:${lead.phone}`}
                                className="flex items-center gap-1.5 text-[12px] font-mono text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                            >
                                <Phone size={11} className="shrink-0" />
                                {lead.phone}
                            </a>
                            {/* ── WhatsApp ── */}
                            <WhatsAppButton
                                phone={lead.phone}
                                name={lead.name}
                                leadId={lead.id}
                                compact
                            />
                        </div>
                    ) : (
                        <span className="text-[11px] text-gray-300 dark:text-gray-600 italic">—</span>
                    )}
                </td>

                {/* Budget */}
                <td className="px-4 py-2.5 hidden md:table-cell">
                    {lead.budget ? (
                        <span className="text-[12px] font-bold text-emerald-500">
                            AED {(lead.budget as number).toLocaleString()}
                        </span>
                    ) : (
                        <span className="text-[11px] text-gray-300 dark:text-gray-600 italic">—</span>
                    )}
                </td>

                {/* Status badge */}
                <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border ${statusClass}`}>
                        {lead.status}
                    </span>
                </td>

                {/* Agent */}
                <td className="px-4 py-2.5 hidden lg:table-cell">
                    {agentName ? (
                        <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-[9px] font-black shrink-0">
                                {agentInitial}
                            </div>
                            <span className="text-[12px] text-gray-600 dark:text-gray-400 truncate max-w-[120px]">{agentName}</span>
                        </div>
                    ) : (
                        <span className="text-[11px] text-gray-300 dark:text-gray-600 italic">Unassigned</span>
                    )}
                </td>

                {/* Note preview */}
                <td className="px-4 py-2.5 hidden xl:table-cell" onClick={e => e.stopPropagation()}>
                    {notePreview ? (
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 italic truncate max-w-[140px] block" title={notePreview}>
                            {notePreview.substring(0, 50)}{notePreview.length > 50 ? '…' : ''}
                        </span>
                    ) : (
                        <span className="text-[11px] text-gray-300 dark:text-gray-700 italic">No notes</span>
                    )}
                </td>

                {/* ── Actions: History | Quick Note | WhatsApp (mobile) | Trash ── */}
                <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">

                        {/* Tracking History — every role */}
                        <button
                            onClick={e => { e.stopPropagation(); onHistory(); }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                            title="View Tracking History"
                        >
                            <Clock size={13} />
                        </button>

                        {/* Quick Note toggle */}
                        <button
                            onClick={e => { e.stopPropagation(); setNoteOpen(v => !v); }}
                            className={`p-1.5 rounded-lg transition-colors ${
                                noteOpen
                                    ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600'
                                    : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-amber-500'
                            }`}
                            title="Add Quick Note"
                        >
                            <MessageSquareShare size={13} />
                        </button>

                        {/* WhatsApp — shown on mobile (sm:hidden) where phone cell is collapsed */}
                        <span className="sm:hidden" onClick={e => e.stopPropagation()}>
                            {lead.phone && (
                                <WhatsAppButton phone={lead.phone} name={lead.name} leadId={lead.id} compact />
                            )}
                        </span>

                        {!showTrash && (
                            <button
                                onClick={e => { e.stopPropagation(); onDelete(); }}
                                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors"
                                title="Move to Trash"
                            >
                                <Trash2 size={13} />
                            </button>
                        )}
                    </div>
                </td>
            </motion.tr>

            {/* ── Inline Quick Note + Audit Trail (expands below the row) ── */}
            {noteOpen && (
                <tr className="bg-amber-50/60 dark:bg-amber-500/[0.04] border-b border-amber-100 dark:border-amber-500/10">
                    <td
                        colSpan={8}
                        className="px-6 py-3"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Note input */}
                        <div className="flex items-center gap-2">
                            <MessageSquareShare size={14} className="text-amber-500 shrink-0" />
                            <input
                                autoFocus
                                type="text"
                                value={noteText}
                                onChange={e => setNoteText(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') submitNote(e);
                                    if (e.key === 'Escape') setNoteOpen(false);
                                }}
                                placeholder={`Quick note for ${lead.name}…`}
                                className="flex-1 bg-white dark:bg-white/5 border border-amber-200 dark:border-amber-500/20 rounded-lg px-3 py-1.5 text-[13px] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                            />
                            <button
                                onClick={submitNote}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[12px] font-bold rounded-lg transition-colors"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => setNoteOpen(false)}
                                className="px-3 py-1.5 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-600 dark:text-gray-300 text-[12px] font-bold rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>

                        {/* ── Tracking History (CEO / Admin / Manager only) ── */}
                        {isPrivileged && lead.historyLog && lead.historyLog.length > 0 && (
                            <div className="mt-3 space-y-1.5 max-h-52 overflow-y-auto pr-1 border-t border-amber-100 dark:border-amber-500/10 pt-3">
                                <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-2 flex items-center gap-1.5">
                                    <Clock size={10} />
                                    Audit Trail
                                </p>
                                {[...lead.historyLog].reverse().slice(0, 10).map((entry: any, i: number) => (
                                    <div key={i} className="flex items-start gap-2 text-[11px] py-1 border-b border-gray-100 dark:border-white/[0.04] last:border-0">
                                        <span className="shrink-0 w-1.5 h-1.5 mt-1.5 rounded-full bg-blue-400" />
                                        <span className="font-bold text-gray-700 dark:text-gray-300 shrink-0">{entry.action}</span>
                                        {entry.fromName && (
                                            <span className="text-gray-500 dark:text-gray-500 shrink-0">{entry.fromName}</span>
                                        )}
                                        {entry.toName && (
                                            <>
                                                <span className="text-gray-400">→</span>
                                                <span className="text-blue-500 font-semibold shrink-0">{entry.toName}</span>
                                            </>
                                        )}
                                        {entry.note && (
                                            <span className="text-amber-600 dark:text-amber-400 italic truncate max-w-[200px]">"{entry.note}"</span>
                                        )}
                                        <span className="ml-auto text-gray-400 dark:text-gray-600 shrink-0 tabular-nums">
                                            {new Date(entry.date).toLocaleString('en-US', {
                                                month: 'short', day: '2-digit',
                                                hour: '2-digit', minute: '2-digit', hour12: false,
                                            })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </td>
                </tr>
            )}
        </React.Fragment>
    );
};
