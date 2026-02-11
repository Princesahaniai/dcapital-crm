import { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Phone, Plus, Search, Trash2, Edit, FileDown, Upload, Download, Mail, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getVisibleLeads, canDeleteLead } from '../utils/permissions';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { EmailModal } from '../components/EmailModal';
import { MeetingModal } from '../components/MeetingModal';
import type { Lead } from '../types';

export const Leads = () => {
    const { leads, team, addLead, addBulkLeads, updateLead, deleteLead, user } = useStore();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    // Initial Form State
    const initialForm: Partial<Lead> = {
        name: '',
        email: '',
        phone: '',
        budget: 0,
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

    const accessibleLeads = useMemo(() => getVisibleLeads(user, leads, team), [user, leads, team]);

    const filteredLeads = accessibleLeads.filter(lead => {
        const matchesSearch = (lead.name || '').toLowerCase().includes((search || '').toLowerCase()) ||
            (lead.email || '').toLowerCase().includes((search || '').toLowerCase()) ||
            (lead.phone && lead.phone.includes(search));
        const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.phone) return toast.error('Name and Phone are required');

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
        <div className="p-4 md:p-8 pt-16 md:pt-8 bg-gray-50 dark:bg-black w-full overflow-x-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                        LEADS <span className="text-blue-500 text-sm font-medium tracking-widest uppercase ml-2 px-2 py-1 bg-blue-500/10 rounded-full">Pipeline</span>
                    </h1>
                </motion.div>
                <div className="flex gap-2">
                    <button onClick={downloadTemplate} title="Download Template" className="p-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors">
                        <FileDown size={20} />
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
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-[#1C1C1E] p-4 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-3.5 text-gray-400 dark:text-gray-500" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name, email, phone..."
                            className="w-full bg-gray-50 dark:bg-black/50 text-gray-900 dark:text-white pl-12 p-3 rounded-xl border border-gray-300 dark:border-white/10 focus:border-blue-500 dark:focus:border-white/30 outline-none"
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
                            className={`px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${statusFilter === tab
                                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                                : 'bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                                } `}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/5 rounded-3xl overflow-hidden min-h-[400px] shadow-sm mt-6">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-[10px] uppercase font-bold tracking-widest">
                        <tr>
                            <th className="p-6">Lead Name</th>
                            <th className="p-6">Contact Details</th>
                            <th className="p-6 text-center">Pipeline State</th>
                            <th className="p-6">Source</th>
                            <th className="p-6">Budget</th>
                            <th className="p-6">Assigned To</th>
                            <th className="p-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {filteredLeads.map(lead => (
                            <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                <td className="p-6">
                                    <p className="font-bold text-gray-900 dark:text-white">{lead.name}</p>
                                    <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tighter">ID: {lead.id.slice(0, 8)}</p>
                                </td>
                                <td className="p-6">
                                    <div className="flex flex-col gap-1 text-sm text-gray-500">
                                        <span className="flex items-center gap-2"><Phone size={12} className="text-blue-500" /> {lead.phone}</span>
                                        <span className="flex items-center gap-2"><Mail size={12} className="text-amber-500" /> {lead.email}</span>
                                    </div>
                                </td>
                                <td className="p-6 text-center">
                                    <span className={`px-4 py-1.5 rounded-xl text-xs font-bold inline-block border ${lead.status === 'New' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                                            lead.status === 'Closed' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                                                lead.status === 'Lost' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                                                    'bg-gray-100 dark:bg-white/10 border-transparent text-gray-500 dark:text-gray-400'
                                        }`}>
                                        {lead.status}
                                    </span>
                                </td>
                                <td className="p-6 text-gray-500 text-sm font-medium">{lead.source}</td>
                                <td className="p-6 text-gray-900 dark:text-white font-mono font-bold">AED {lead.budget?.toLocaleString()}</td>
                                <td className="p-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs border border-blue-500/20">
                                            {getAgentName(lead.assignedTo).charAt(0)}
                                        </div>
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{getAgentName(lead.assignedTo)}</span>
                                    </div>
                                </td>
                                <td className="p-6 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <WhatsAppButton phone={lead.phone || ''} name={lead.name} leadId={lead.id} />
                                        <button onClick={() => { setSelectedLead(lead); setIsMeetingModalOpen(true); }} className="p-2 hover:bg-amber-500/10 rounded-xl text-amber-500 transition-colors" title="Schedule Meeting"><Calendar size={18} /></button>
                                        <button onClick={() => { setSelectedLead(lead); setIsEmailModalOpen(true); }} className="p-2 hover:bg-blue-500/10 rounded-xl text-blue-500 transition-colors" title="Send Email"><Mail size={18} /></button>
                                        <button onClick={() => openEdit(lead)} className="p-2 hover:bg-green-500/10 rounded-xl text-green-500 transition-colors" title="Edit Lead"><Edit size={18} /></button>
                                        <button onClick={() => handleDelete(lead.id)} className="p-2 hover:bg-red-500/10 rounded-xl text-red-500 transition-colors" title="Delete Lead"><Trash2 size={18} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <MeetingModal
                onClose={() => setIsMeetingModalOpen(false)}
                leadId={selectedLead?.id}
            />

            <EmailModal
                isOpen={isEmailModalOpen}
                onClose={() => setIsEmailModalOpen(false)}
                lead={selectedLead || { id: '', name: '', email: '' }}
            />

            <AnimatePresence>
                {showModal && (
                    <div className="mobile-modal-container">
                        <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="mobile-modal-content max-w-2xl">
                            <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-white dark:bg-[#1C1C1E] sticky top-0 z-10">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{isEditing ? 'Lead Protocol Update' : 'Initialize New Lead'}</h2>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white p-2" title="Close">Close</button>
                            </div>
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
                                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Mission Budget (AED)</label>
                                        <input type="number" className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-2xl text-gray-900 dark:text-white outline-none focus:border-blue-500" value={form.budget} onChange={e => setForm({ ...form, budget: Number(e.target.value) })} placeholder="Target Value" title="Budget" />
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
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
