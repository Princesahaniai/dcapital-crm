import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Mail, Calendar, FileText, Clock, Paperclip, CheckSquare, Edit3, User, MapPin, Sparkles, Send, ChevronDown } from 'lucide-react';
import { StageIndicator } from './StageIndicator';
import { ActivityTimeline } from './ActivityTimeline';
import { DocumentVault } from './DocumentVault';
import type { Lead, Task, Activity } from '../../types';
import { useStore } from '../../store';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

interface LeadProfileProps {
    lead: Lead;
    onClose: () => void;
    onEdit: () => void;
}

type Tab = 'overview' | 'history' | 'documents' | 'tasks' | 'notes';

import { useLeadScore } from '../../hooks/useLeadScore';
import { generateLeadBrief } from '../../utils/pdfGenerator';
import toast from 'react-hot-toast';

const QuickNotes: React.FC<{ lead: Lead }> = ({ lead }) => {
    const [newNote, setNewNote] = useState('');
    const addQuickNote = useStore(s => s.addQuickNote);

    const handleSaveNote = () => {
        if (!newNote.trim()) return;
        addQuickNote(lead.id, newNote.trim());
        toast.success('Note saved');
        setNewNote('');
    };

    // Parse existing notes
    let parsedNotes: any[] = [];
    if (Array.isArray(lead.notes)) {
        parsedNotes = [...lead.notes];
    } else if (typeof lead.notes === 'string' && lead.notes.trim()) {
        parsedNotes = lead.notes.split('\n').filter(Boolean).map(text => ({
            text,
            author: 'Legacy Note',
            timestamp: lead.createdAt || Date.now()
        }));
    }

    // Sort chronologically (newest at the top)
    const existingNotes = parsedNotes.sort((a, b) => b.timestamp - a.timestamp);

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Type a quick note... (e.g. 'Client prefers 2BR in Marina under 2M')"
                    rows={3}
                    className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white resize-none focus:outline-none focus:border-amber-500 placeholder:text-gray-400"
                />
            </div>
            <button
                onClick={handleSaveNote}
                disabled={!newNote.trim()}
                className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
            >
                Save Note
            </button>

            {existingNotes.length > 0 && (
                <div className="space-y-2 mt-4 border-t border-gray-100 dark:border-white/5 pt-4">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Previous Notes</p>
                    {existingNotes.map((note, i) => (
                        <div key={i} className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm flex flex-col gap-1">
                            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
                                <span className="font-bold text-gray-600 dark:text-gray-300">{note.author}</span>
                                <span>{new Date(note.timestamp).toLocaleString()}</span>
                            </div>
                            <span className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{note.text}</span>
                        </div>
                    ))}
                </div>
            )}

            {existingNotes.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-8">No notes yet. Add your first note above.</p>
            )}
        </div>
    );
};

export const LeadProfile: React.FC<LeadProfileProps> = ({ lead, onClose, onEdit }) => {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const { team, tasks, activities, getMatchedProperties, updateLead, properties } = useStore();
    const { score, getScoreColor, getScoreGradient } = useLeadScore(lead);

    const matches = getMatchedProperties(lead);

    // Mock Data Helpers (Replace with real data later)
    const assignedAgent = team.find(m => m.id === lead.assignedTo);
    const leadTasks = tasks.filter(t => t.leadId === lead.id);
    const leadActivities = activities.filter(a => a.leadId === lead.id);

    const tabs: { id: Tab; label: string; icon: any }[] = [
        { id: 'overview', label: 'Overview', icon: User },
        { id: 'history', label: 'History', icon: Clock },
        { id: 'documents', label: 'Documents', icon: Paperclip },
        { id: 'tasks', label: 'Tasks', icon: CheckSquare },
        { id: 'notes', label: 'Notes', icon: FileText },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white dark:bg-[#1C1C1E] w-full max-w-5xl h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-gray-200 dark:border-white/10"
            >
                {/* HEADER */}
                <div className="p-6 md:p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-start bg-gray-50/50 dark:bg-white/5">
                    <div className="flex gap-5">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                            {lead.name.charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{lead.name}</h2>
                                <div className="relative">
                                    <select
                                        value={lead.status}
                                        onChange={async (e) => {
                                            const newStatus = e.target.value as any;
                                            const previousStatus = lead.status;
                                            updateLead(lead.id, { status: newStatus });

                                            try {
                                                await updateDoc(doc(db, 'leads', lead.id), { status: newStatus });
                                                toast.success(`Status updated to ${newStatus}`);
                                            } catch (error) {
                                                console.error('Failed to update status:', error);
                                                updateLead(lead.id, { status: previousStatus });
                                                toast.error('Failed to update status');
                                            }
                                        }}
                                        className={`appearance-none pr-8 pl-3 py-1 rounded-full text-xs font-bold border outline-none cursor-pointer transition-colors ${lead.status === 'New' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                            lead.status === 'Closed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/20'
                                            }`}
                                    >
                                        <option value="New">New</option>
                                        <option value="Contacted">Contacted</option>
                                        <option value="Qualified">Qualified</option>
                                        <option value="Viewing">Viewing</option>
                                        <option value="Negotiation">Negotiation</option>
                                        <option value="Closed">Closed</option>
                                        <option value="Lost">Lost</option>
                                        <option value="Trash">Trash</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1.5"><Phone size={14} /> {lead.phone}</span>
                                <span className="flex items-center gap-1.5"><Mail size={14} /> {lead.email}</span>
                                <span className="flex items-center gap-1.5"><MapPin size={14} /> Dubai, UAE</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                toast.success('Generating Client Brief...');
                                generateLeadBrief(lead, assignedAgent?.name || 'Agent');
                            }}
                            className="p-3 bg-blue-500 hover:bg-blue-600 rounded-xl text-white transition-colors font-bold flex items-center gap-2 shadow-lg shadow-blue-500/30"
                        >
                            <FileText size={16} /> Generate Client Brief
                        </button>
                        <button onClick={onEdit} className="p-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors font-bold flex items-center gap-2">
                            <Edit3 size={16} /> Edit
                        </button>
                        <button onClick={onClose} className="p-3 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl text-gray-500 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* STAGE PROGRESS */}
                <div className="px-8 py-4 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-[#1C1C1E]">
                    <StageIndicator currentStage={lead.status} />
                </div>

                {/* CONTENT AREA */}
                <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                    {/* SIDEBAR TABS (Desktop) / TOP TABS (Mobile) */}
                    <div className="w-full md:w-64 bg-gray-50 dark:bg-black/20 border-b md:border-b-0 md:border-r border-gray-100 dark:border-white/5 p-2 md:p-4 flex md:flex-col overflow-x-auto md:overflow-visible gap-2 md:gap-2 flex-shrink-0 hide-scrollbar">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 ${activeTab === tab.id
                                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                                    }`}
                            >
                                <tab.icon size={16} className="md:w-[18px] md:h-[18px]" /> {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* MAIN CONTENT */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-white dark:bg-[#1C1C1E]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {activeTab === 'overview' && (
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <section>
                                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Financials</h3>
                                                <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-white/5">
                                                    <div className="mb-4">
                                                        <p className="text-sm text-gray-500 mb-1">Budget</p>
                                                        <p className="text-2xl font-black text-gray-900 dark:text-white">AED {lead.budget?.toLocaleString()}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500 mb-1">Source</p>
                                                        <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                            {lead.source}
                                                            <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full uppercase">Verified</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </section>

                                            <section>
                                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Assignment</h3>
                                                <div className="flex items-center gap-4 bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                                                    <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">
                                                        {assignedAgent?.name.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 dark:text-white">{assignedAgent?.name || 'Unassigned'}</p>
                                                        <p className="text-xs text-gray-500">{assignedAgent?.role || 'System'}</p>
                                                    </div>
                                                </div>
                                            </section>
                                        </div>

                                        <div className="space-y-6">
                                            <section>
                                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Lead Quality</h3>
                                                <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-white/5 relative overflow-hidden">
                                                    <div className="flex justify-between items-end mb-2 relative z-10">
                                                        <div>
                                                            <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                                                                {score}
                                                                <span className="text-lg text-gray-400 font-bold">/100</span>
                                                            </p>
                                                            <p className={`text-sm font-bold ${getScoreColor(score)}`}>
                                                                {score >= 80 ? 'Excellent Potential' : score >= 50 ? 'Good Potential' : 'Needs Nurturing'}
                                                            </p>
                                                        </div>
                                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg bg-gradient-to-br ${getScoreGradient(score)} shadow-lg`}>
                                                            {score}
                                                        </div>
                                                    </div>
                                                    <div className="w-full bg-gray-200 dark:bg-black/20 h-2 rounded-full overflow-hidden mt-4">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${score}%` }}
                                                            transition={{ duration: 1, type: "spring" }}
                                                            className={`h-full bg-gradient-to-r ${getScoreGradient(score)}`}
                                                        />
                                                    </div>
                                                </div>
                                            </section>
                                            <section>
                                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Notes</h3>
                                                <div className="bg-amber-50 dark:bg-yellow-900/10 p-6 rounded-2xl border border-amber-100 dark:border-yellow-500/10 min-h-[200px]">
                                                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                                        {lead.notes || 'No notes added yet.'}
                                                    </p>
                                                </div>
                                            </section>
                                        </div>

                                        {/* INVENTORY LINKING */}
                                        <div className="col-span-2 mt-4 border-t border-gray-100 dark:border-white/5 pt-8">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                                    <CheckSquare className="text-blue-500" size={18} /> Linked Inventory
                                                </h3>
                                                {lead.propertyId && (
                                                    <span className="text-xs font-bold text-green-500 bg-green-500/10 px-3 py-1 rounded-full">
                                                        Match Secured
                                                    </span>
                                                )}
                                            </div>

                                            <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-2xl border border-gray-100 dark:border-white/5">
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-xs font-bold text-gray-500 uppercase">Select Target Property</label>
                                                    <select
                                                        value={lead.propertyId || ''}
                                                        onChange={async (e) => {
                                                            const newPropId = e.target.value;
                                                            try {
                                                                await updateDoc(doc(db, 'leads', lead.id), { propertyId: newPropId || null });
                                                                updateLead(lead.id, { propertyId: newPropId || undefined });
                                                                toast.success(newPropId ? 'Property linked' : 'Property unlinked');
                                                            } catch (err) {
                                                                toast.error('Failed to link property');
                                                            }
                                                        }}
                                                        className="w-full bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 dark:text-white appearance-none"
                                                    >
                                                        <option value="">-- No Property Linked --</option>
                                                        {properties?.filter(p => p.status === 'Available').map(p => (
                                                            <option key={p.id} value={p.id}>{p.name} - AED {p.price.toLocaleString()} ({p.location})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* SMART MATCHES WIDGET */}
                                        <div className="col-span-2 mt-4 border-t border-gray-100 dark:border-white/5 pt-8">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                                    <Sparkles className="text-amber-500" size={18} /> Smart Matches
                                                </h3>
                                                <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full">
                                                    Target: {lead.targetLocation || 'Any'} (Max: AED {lead.maxBudget?.toLocaleString() || 'Any'})
                                                </span>
                                            </div>

                                            {(!lead.targetLocation || !lead.maxBudget) ? (
                                                <div className="text-center py-10 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                                                    <p className="text-gray-500 text-sm font-medium">Please edit this lead and set a Target Location & Max Budget to compute matches.</p>
                                                </div>
                                            ) : matches.length === 0 ? (
                                                <div className="text-center py-10 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                                                    <p className="text-amber-600 dark:text-amber-500 text-sm font-medium">No active inventory matches these specific requirements.</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    {matches.map(property => (
                                                        <div key={property.id} className="bg-white dark:bg-black/20 rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                                            <div className="h-32 bg-gray-200 relative">
                                                                <img src={property.imageUrl || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9'} alt={property.name} className="w-full h-full object-cover" />
                                                                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full">
                                                                    AED {property.price.toLocaleString()}
                                                                </div>
                                                            </div>
                                                            <div className="p-4">
                                                                <h4 className="font-bold text-gray-900 dark:text-white truncate">{property.name}</h4>
                                                                <p className="text-xs text-gray-500 truncate mb-4">{property.location}</p>
                                                                <div className="flex flex-col gap-2">
                                                                    <a
                                                                        href={`https://wa.me/${lead.phone}?text=${encodeURIComponent(`Hello ${lead.name}, I found a property matching your criteria in ${property.location}. It's a gorgeous ${property.bedrooms}BR ${property.type} at ${property.name} for AED ${property.price.toLocaleString()}. Would you like to view it?`)}`}
                                                                        target="_blank" rel="noopener noreferrer"
                                                                        className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
                                                                    >
                                                                        <Send size={14} /> Pitch via WhatsApp
                                                                    </a>
                                                                    <button
                                                                        onClick={async () => {
                                                                            try {
                                                                                await updateDoc(doc(db, 'leads', lead.id), { propertyId: property.id });
                                                                                updateLead(lead.id, { propertyId: property.id });
                                                                                toast.success('Property linked to lead');
                                                                            } catch (err) {
                                                                                toast.error('Failed to link property');
                                                                            }
                                                                        }}
                                                                        className="w-full bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
                                                                    >
                                                                        Link Property
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'history' && (
                                    <div className="py-2">
                                        <ActivityTimeline activities={leadActivities} />
                                    </div>
                                )}

                                {activeTab === 'documents' && (
                                    <DocumentVault lead={lead} />
                                )}

                                {activeTab === 'tasks' && (
                                    <div className="text-center py-20 text-gray-500">
                                        <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckSquare size={24} />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No tasks yet</h3>
                                        <p>This module is under construction.</p>
                                    </div>
                                )}

                                {activeTab === 'notes' && (
                                    <QuickNotes lead={lead} />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
