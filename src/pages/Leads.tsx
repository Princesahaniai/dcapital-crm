import { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Phone, Plus, Search, Trash2, Edit, FileDown, Upload, Download, Mail, Calendar, LayoutGrid, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getVisibleLeads, canDeleteLead } from '../utils/permissions';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { EmailModal } from '../components/EmailModal';
import { MeetingModal } from '../components/MeetingModal';
import { Modal } from '../components/Modal';
import { LeadCard } from '../components/leads/LeadCard';
import { LeadProfile } from '../components/leads/LeadProfile';
import { KanbanBoard } from '../components/leads/KanbanBoard';
import type { Lead } from '../types';

export const Leads = () => {
    const { leads, team, addLead, addBulkLeads, updateLead, deleteLead, user, logAudit } = useStore();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [viewMode, setViewMode] = useState<'list' | 'board'>('list');

    // Initial Form State
    const initialForm: Partial<Lead> = {
        name: '',
        email: '',
        phone: '',
        budget: 0,
        maxBudget: 0,
        targetLocation: '',
        status: 'New',
        source: 'Instagram',
        assignedTo: user?.id || '',
        notes: ''
    };
    const [form, setForm] = useState(initialForm);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [importing, setImporting] = useState(false);

    const statusTabs = ['All', 'New', 'Contacted', 'Qualified', 'Viewing', 'Negotiation', 'Closed', 'Lost'];

    const [showTrash, setShowTrash] = useState(false);

    const accessibleLeads = useMemo(() => getVisibleLeads(user, leads, team), [user, leads, team]);

    // Team ID -> Name map for KanbanBoard
    const teamMap = useMemo(() => {
        const map: Record<string, string> = {};
        team.forEach(m => { map[m.id] = m.name; });
        if (user) map[user.id] = user.name;
        return map;
    }, [team, user]);

    const filteredLeads = accessibleLeads.filter(lead => {
        // Trash Logic
        if (showTrash) {
            return lead.status === 'Trash';
        }
        if (lead.status === 'Trash') return false; // Hide trash by default

        const matchesSearch = (lead.name || '').toLowerCase().includes((search || '').toLowerCase()) ||
            (lead.email || '').toLowerCase().includes((search || '').toLowerCase()) ||
            (lead.phone && lead.phone.includes(search));
        const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Strict Validation
        if (!form.name?.trim()) return toast.error('Lead Name is strictly required');
        if (!form.phone?.trim() || form.phone.length < 8) return toast.error('A strictly valid Contact Phone is required');
        if (!form.budget || form.budget <= 0) return toast.error('Mission Budget must be greater than 0');
        if (!form.status) return toast.error('Pipeline State is required');

        if (isEditing && form.id) {
            updateLead(form.id, form);
            toast.success('Lead Updated');
        } else {
            addLead({
                ...form,
                id: Math.random().toString(36).substr(2, 9),
                createdAt: Date.now(),
                updatedAt: Date.now(),
                lastContact: Date.now(),
                commission: 0,
                commissionPaid: false,
                status: form.status || 'New'
            } as Lead);
            toast.success('Lead Added');
        }
        setShowModal(false);
    };

    const handleDelete = (id: string) => {
        if (!canDeleteLead(user)) return toast.error('Unauthorized');
        if (confirm('Delete this lead?')) {
            deleteLead(id);
            toast.success('Lead Deleted');
        }
    };

    const openEdit = (lead: Lead) => {
        setForm(lead);
        setIsEditing(true);
        setShowModal(true);
    };

    const openNew = () => {
        setForm({
            ...initialForm,
            assignedTo: user?.id || ''
        });
        setIsEditing(false);
        setShowModal(true);
    };

    const getAgentName = (id?: string) => {
        if (!id) return 'Unassigned';
        const agent = team.find(m => m.id === id);
        return agent ? agent.name : 'Unknown';
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        try {
            const { parseCSV, validateLead } = await import('../utils/csvHelpers');
            const { data, errors } = await parseCSV(file);

            if (errors.length > 0) {
                toast.error(`CSV Error: ${errors[0].message}`);
            }

            const validLeads: Lead[] = [];
            let validationErrors = 0;

            data.forEach((row: any) => {
                const validation = validateLead(row);
                if (validation.isValid) {
                    validLeads.push({
                        id: Math.random().toString(36).substr(2, 9),
                        name: row.Name,
                        email: row.Email,
                        phone: String(row.Phone),
                        source: row.Source || 'Import',
                        budget: parseInt(row.Budget) || 0,
                        maxBudget: parseInt(row.MaxBudget) || 0,
                        targetLocation: row.TargetLocation || '',
                        status: (row.Status as Lead['status']) || 'New',
                        assignedTo: user?.id || '',
                        notes: row.Notes || '',
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                        lastContact: Date.now(),
                        commission: 0,
                        commissionPaid: false
                    });
                } else {
                    validationErrors++;
                }
            });

            if (validLeads.length > 0) {
                addBulkLeads(validLeads);
                toast.success(`Imported ${validLeads.length} leads successfully!`);
                if (validationErrors > 0) {
                    toast.error(`${validationErrors} rows failed validation`);
                }
            } else {
                toast.error('No valid leads found in file');
            }

        } catch (error) {
            toast.error('Failed to import CSV');
        } finally {
            setImporting(false);
            e.target.value = '';
        }
    };

    const handleExport = async () => {
        const { exportToCSV } = await import('../utils/csvHelpers');
        const csv = exportToCSV(filteredLeads);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
        logAudit('EXPORT_LEADS', undefined, { count: filteredLeads.length });
    };

    const downloadTemplate = async () => {
        const { generateTemplate } = await import('../utils/csvHelpers');
        const csv = generateTemplate();
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'leads_template.csv';
        link.click();
    };

    return (
        <div className="p-4 md:p-8 pt-16 md:pt-8 bg-gray-50 dark:bg-black w-full overflow-x-hidden max-w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                        LEADS <span className="text-blue-500 text-sm font-medium tracking-widest uppercase ml-2 px-2 py-1 bg-blue-500/10 rounded-full">Pipeline</span>
                    </h1>
                </motion.div>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={downloadTemplate} title="Download Template" className="p-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors">
                        <FileDown size={20} />
                    </button>
                    <button
                        onClick={() => setShowTrash(!showTrash)}
                        className={`p-3 rounded-xl transition-colors ${showTrash ? 'bg-red-50 text-red-500 dark:bg-red-900/20' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white'}`}
                        title={showTrash ? "Show Active Leads" : "Show Trash"}
                    >
                        <Trash2 size={20} />
                    </button>
                    <button onClick={handleExport} className="border border-gray-300 dark:border-white/20 text-gray-700 dark:text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-white/10 transition-all">
                        <Download size={18} /> Export
                    </button>
                    <label className="bg-white dark:bg-[#1C1C1E] border border-gray-300 dark:border-white/20 text-gray-700 dark:text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-white/10 transition-all cursor-pointer">
                        <Upload size={18} /> {importing ? 'Importing...' : 'Import CSV'}
                        <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" disabled={importing} title="Upload CSV" />
                    </label>
                    <button onClick={openNew} className="bg-blue-500 dark:bg-white text-white dark:text-black px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-600 dark:hover:bg-gray-200 transition-all shadow-lg shadow-blue-500/20">
                        <Plus size={18} /> Add Lead
                    </button>
                    <div className="flex bg-gray-100 dark:bg-white/5 rounded-xl p-1">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-white/20 shadow-sm text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                            title="List View"
                        >
                            <List size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('board')}
                            className={`p-2.5 rounded-lg transition-all ${viewMode === 'board' ? 'bg-white dark:bg-white/20 shadow-sm text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Board View"
                        >
                            <LayoutGrid size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-4 sticky top-0 z-30 bg-gray-50 dark:bg-black pt-2 pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:relative md:top-auto md:bg-transparent md:py-0">
                <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-[#1C1C1E] p-3 md:p-4 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-4 text-gray-400 dark:text-gray-500" size={24} />
                        <input
                            type="text"
                            placeholder="Search by Name, Email, or Phone..."
                            className="w-full bg-gray-50 dark:bg-black/50 text-gray-900 dark:text-white pl-12 p-4 text-lg font-medium rounded-2xl border-2 border-gray-200 dark:border-white/10 focus:border-blue-500 dark:focus:border-white/30 outline-none shadow-sm transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            title="Search leads"
                        />
                    </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {statusTabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setStatusFilter(tab)}
                            className={`px-5 py-2 rounded-full text-xs md:text-sm font-bold whitespace-nowrap transition-all ${statusFilter === tab
                                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                                : 'bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                                } `}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* KANBAN BOARD VIEW */}
            {viewMode === 'board' && !showTrash && (
                <KanbanBoard
                    leads={filteredLeads}
                    teamMap={teamMap}
                    onSelectLead={(lead) => setSelectedLead(lead)}
                    onMoveStage={(leadId, newStatus) => {
                        updateLead(leadId, { status: newStatus });
                        toast.success(`Lead moved to ${newStatus}`);
                    }}
                />
            )}

            {/* RESPONSIVE GRID VIEW (List Mode) */}
            {(viewMode === 'list' || showTrash) && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                    <AnimatePresence>
                        {filteredLeads.map(lead => (
                            <div key={lead.id}>
                                {/* Mobile Optimized View */}
                                <div className="md:hidden">
                                    <motion.div
                                        key={lead.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white dark:bg-[#1C1C1E] p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 relative overflow-hidden"
                                        onClick={() => { setSelectedLead(lead); openEdit(lead); }}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{lead.name}</h3>
                                                <p className="text-xs text-gray-500 uppercase tracking-wider">{lead.source}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-bold border ${lead.status === 'New' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                                                lead.status === 'Closed' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                                                    lead.status === 'Lost' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                                                        'bg-gray-100 dark:bg-white/10 border-transparent text-gray-500 dark:text-gray-400'
                                                }`}>
                                                {lead.status}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="bg-gray-50 dark:bg-black/20 p-3 rounded-2xl">
                                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Budget</p>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">AED {lead.budget?.toLocaleString()}</p>
                                            </div>
                                            <div className="bg-gray-50 dark:bg-black/20 p-3 rounded-2xl">
                                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Assigned</p>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold">
                                                        {getAgentName(lead.assignedTo).charAt(0)}
                                                    </div>
                                                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{getAgentName(lead.assignedTo)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 mt-4" onClick={(e) => e.stopPropagation()}>
                                            <WhatsAppButton phone={lead.phone || ''} name={lead.name} leadId={lead.id} />
                                            <a href={`tel:${lead.phone}`} className="flex-1 bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                                                <Phone size={16} /> Call
                                            </a>
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Desktop Card View */}
                                <div className="hidden md:block">
                                    <LeadCard
                                        lead={lead}
                                        onClick={() => { setSelectedLead(lead); openEdit(lead); }}
                                        onEdit={(e) => { e.stopPropagation(); openEdit(lead); }}
                                        onDelete={(e) => { e.stopPropagation(); handleDelete(lead.id); }}
                                        agentName={getAgentName(lead.assignedTo)}
                                    />
                                </div>
                            </div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
            <AnimatePresence>
                {selectedLead && !isEditing && !isMeetingModalOpen && !isEmailModalOpen && (
                    <LeadProfile
                        lead={selectedLead}
                        onClose={() => setSelectedLead(null)}
                        onEdit={() => { setIsEditing(true); setShowModal(true); }} // Assumes LeadProfile is closed or handled by logic
                    />
                )}
            </AnimatePresence>

            <MeetingModal
                isOpen={isMeetingModalOpen}
                onClose={() => setIsMeetingModalOpen(false)}
                leadId={selectedLead?.id}
            />

            <EmailModal
                isOpen={isEmailModalOpen}
                onClose={() => setIsEmailModalOpen(false)}
                lead={selectedLead || { id: '', name: '', email: '' }}
            />

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={isEditing ? 'Lead Protocol Update' : 'Initialize New Lead'}
            >
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Full Name</label>
                            <input className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-2xl text-gray-900 dark:text-white outline-none focus:border-blue-500" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Mission Target Name" title="Name" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Contact Phone</label>
                            <input className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-2xl text-gray-900 dark:text-white outline-none focus:border-blue-500" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+971..." title="Phone" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Current Value (AED)</label>
                            <input type="number" className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-2xl text-gray-900 dark:text-white outline-none focus:border-blue-500" value={form.budget} onChange={e => setForm({ ...form, budget: Number(e.target.value) })} placeholder="Target Value" title="Budget" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Max Budget (AED)</label>
                            <input type="number" className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-2xl text-gray-900 dark:text-white outline-none focus:border-blue-500" value={form.maxBudget || ''} onChange={e => setForm({ ...form, maxBudget: Number(e.target.value) })} placeholder="Maximum Match Budget" title="Max Budget" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Target Location</label>
                            <select title="Target Location" className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-2xl text-gray-900 dark:text-white outline-none focus:border-blue-500" value={form.targetLocation || ''} onChange={e => setForm({ ...form, targetLocation: e.target.value })}>
                                <option value="">Select Location</option>
                                <option value="Downtown Dubai">Downtown Dubai</option>
                                <option value="Dubai Marina">Dubai Marina</option>
                                <option value="Palm Jumeirah">Palm Jumeirah</option>
                                <option value="Jumeirah Village Circle (JVC)">Jumeirah Village Circle (JVC)</option>
                                <option value="Business Bay">Business Bay</option>
                                <option value="Dubai Creek Harbour">Dubai Creek Harbour</option>
                                <option value="Dubai Hills Estate">Dubai Hills Estate</option>
                                <option value="Emaar Beachfront">Emaar Beachfront</option>
                                <option value="Bluewaters Island">Bluewaters Island</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Pipeline State</label>
                            <select title="Status" className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-2xl text-gray-900 dark:text-white outline-none focus:border-blue-500" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}>
                                {statusTabs.filter(s => s !== 'All').map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1 md:col-span-2">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Assigned Agent</label>
                            <select title="Assignee" className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-2xl text-gray-900 dark:text-white outline-none focus:border-blue-500" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
                                <option value={user?.id}>Me ({user?.name})</option>
                                {team.filter(t => t.id !== user?.id).map(m => <option key={m.id} value={m.id}>{m.name} ({m.role})</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Operational Intel</label>
                        <textarea className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-2xl text-gray-900 dark:text-white outline-none focus:border-blue-500 min-h-[100px]" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Target notes and details..." title="Notes" />
                    </div>
                    <div className="flex gap-4 pt-4 sticky bottom-0 bg-white dark:bg-[#1C1C1E] border-t border-gray-100 dark:border-white/5">
                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white font-bold rounded-2xl transition-all">Abort</button>
                        <button type="submit" className="flex-1 py-4 bg-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 transition-all">Deploy Lead</button>
                    </div>
                </form>
            </Modal>

            {/* FLOATING ACTION BUTTON (MOBILE) */}
            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={openNew}
                className="md:hidden fixed bottom-24 right-4 bg-blue-500 text-white p-4 rounded-full shadow-2xl z-40 flex items-center justify-center"
            >
                <Plus size={28} />
            </motion.button>
        </div >
    );
};
