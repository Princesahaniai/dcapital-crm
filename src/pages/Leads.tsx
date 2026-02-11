import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Search, Plus, Trash2, Edit, Phone, Mail, User, Download, Upload, FileDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getVisibleLeads, canDeleteLead } from '../utils/permissions';

export const Leads = () => {
    const { leads, team, addLead, addBulkLeads, updateLead, deleteLead, user } = useStore();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    // Initial Form State
    const initialForm = {
        id: '',
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
    const [importing, setImporting] = useState(false);

    const statusTabs = ['All', 'New', 'Contacted', 'Qualified', 'Closed'];

    // RBAC: Filter leads based on user role
    const accessibleLeads = useMemo(() => getVisibleLeads(user, leads, team), [user, leads, team]);

    // Filter Logic (now applies to accessible leads only)
    const filteredLeads = accessibleLeads.filter(lead => {
        const matchesSearch = (lead.name || '').toLowerCase().includes((search || '').toLowerCase()) ||
            (lead.email || '').toLowerCase().includes((search || '').toLowerCase()) ||
            (lead.phone && lead.phone.includes(search));
        const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.phone) return toast.error('Name, Phone are required');

        if (isEditing) {
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
                commissionPaid: false
            });
            toast.success('Lead Added');
        }
        setShowModal(false);
    };

    const handleDelete = (id: string) => {
        if (confirm('Delete this lead?')) {
            deleteLead(id);
            toast.success('Lead Deleted');
        }
    };

    const openEdit = (lead: any) => {
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
            // Dynamic import to avoid SSR issues if any, although this is SPA
            const { parseCSV, validateLead } = await import('../utils/csvHelpers');

            const { data, errors } = await parseCSV(file);

            if (errors.length > 0) {
                console.warn('CSV Parse Errors:', errors);
                toast.error(`CSV Error: ${errors[0].message}`);
            }

            // Process and Validate
            const validLeads: any[] = [];
            let validationErrors = 0;

            data.forEach((row: any) => {
                const validation = validateLead(row);
                if (validation.isValid) {
                    validLeads.push({
                        id: Math.random().toString(36).substr(2, 9),
                        name: row.Name,
                        email: row.Email,
                        phone: row.Phone,
                        source: row.Source || 'Import',
                        budget: parseInt(row.Budget) || 0,
                        status: row.Status || 'New',
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
                const result = addBulkLeads(validLeads);
                toast.success(`Imported ${result.success} leads successfully!`);
                if (validationErrors > 0) {
                    toast.error(`${validationErrors} rows failed validation`);
                }
            } else {
                toast.error('No valid leads found in file');
            }

        } catch (error) {
            console.error('Import failed:', error);
            toast.error('Failed to import CSV');
        } finally {
            setImporting(false);
            // Reset input
            e.target.value = '';
        }
    };

    const handleExport = async () => {
        const { exportToCSV } = await import('../utils/csvHelpers');
        const csv = exportToCSV(filteredLeads);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
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
        <div className="p-6 md:p-10 min-h-screen pb-24 space-y-6 bg-gray-50 dark:bg-black">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leads Management</h1>
                    <p className="text-gray-600 dark:text-gray-500">Manage your pipeline effectively</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={downloadTemplate} className="p-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors" title="Download Template">
                        <FileDown size={20} />
                    </button>
                    <button onClick={handleExport} className="border border-gray-300 dark:border-white/20 text-gray-700 dark:text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-white/10 transition-all">
                        <Download size={18} /> Export
                    </button>
                    <label className="bg-white dark:bg-[#1C1C1E] border border-gray-300 dark:border-white/20 text-gray-700 dark:text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-white/10 transition-all cursor-pointer">
                        <Upload size={18} /> {importing ? 'Importing...' : 'Import CSV'}
                        <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" disabled={importing} />
                    </label>
                    <button onClick={openNew} className="bg-blue-500 dark:bg-white text-white dark:text-black px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-600 dark:hover:bg-gray-200 transition-all shadow-lg">
                        <Plus size={18} /> Add Lead
                    </button>
                </div>
            </div>

            {/* Controls */}
            <div className="space-y-4">
                {/* Search */}
                <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-[#1C1C1E] p-4 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-3.5 text-gray-400 dark:text-gray-500" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name, email, phone..."
                            className="w-full bg-gray-50 dark:bg-black/50 text-gray-900 dark:text-white pl-12 p-3 rounded-xl border border-gray-300 dark:border-white/10 focus:border-blue-500 dark:focus:border-white/30 outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Status Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {statusTabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setStatusFilter(tab)}
                            className={`px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${statusFilter === tab
                                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                                : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/5 rounded-3xl overflow-hidden min-h-[400px] shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 text-xs uppercase font-bold">
                        <tr>
                            <th className="p-6">Lead Name</th>
                            <th className="p-6">Contact</th>
                            <th className="p-6">Status</th>
                            <th className="p-6">Source</th>
                            <th className="p-6">Budget</th>
                            <th className="p-6">Assigned To</th>
                            <th className="p-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                        {filteredLeads.length > 0 ? filteredLeads.map(lead => (
                            <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                <td className="p-6">
                                    <p className="font-bold text-gray-900 dark:text-white">{lead.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500">Since {new Date(lead.createdAt).toLocaleDateString()}</p>
                                </td>
                                <td className="p-6">
                                    <div className="flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-400">
                                        <span className="flex items-center gap-2"><Phone size={12} /> {lead.phone}</span>
                                        <span className="flex items-center gap-2"><Mail size={12} /> {lead.email}</span>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${lead.status === 'New' ? 'bg-blue-500/20 text-blue-400' :
                                        lead.status === 'Closed' ? 'bg-amber-500/20 text-amber-400' :
                                            lead.status === 'Lost' ? 'bg-red-500/20 text-red-400' :
                                                'bg-gray-700 text-gray-300'
                                        }`}>
                                        {lead.status}
                                    </span>
                                </td>
                                <td className="p-6 text-gray-600 dark:text-gray-400 text-sm">{lead.source}</td>
                                <td className="p-6 text-gray-900 dark:text-white font-mono">AED {lead.budget?.toLocaleString() || '0'}</td>
                                <td className="p-6 text-gray-600 dark:text-gray-400 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-[10px] text-gray-700 dark:text-white">
                                            <User size={10} />
                                        </div>
                                        {getAgentName(lead.assignedTo)}
                                    </div>
                                </td>
                                <td className="p-6 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEdit(lead)} className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg text-gray-600 dark:text-gray-300" title="Edit"><Edit size={16} /></button>
                                        <button onClick={() => handleDelete(lead.id)} className="p-2 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg text-red-600 dark:text-red-400" title="Delete"><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={7} className="p-12 text-center text-gray-600 dark:text-gray-500">
                                    No leads found. Add one to get started!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-[#1C1C1E] border border-gray-300 dark:border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl"
                        >
                            <div className="p-6 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{isEditing ? 'Edit Lead' : 'New Lead'}</h2>
                                <button onClick={() => setShowModal(false)} className="text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white">Close</button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-600 dark:text-gray-500 uppercase">Name</label>
                                        <input className="w-full bg-gray-50 dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-xl p-3 text-gray-900 dark:text-white outline-none focus:border-blue-500 dark:focus:border-blue-500" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full Name" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-600 dark:text-gray-500 uppercase">Phone</label>
                                        <input className="w-full bg-gray-50 dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-xl p-3 text-gray-900 dark:text-white outline-none focus:border-blue-500 dark:focus:border-blue-500" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+971..." />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-600 dark:text-gray-500 uppercase">Email</label>
                                        <input className="w-full bg-gray-50 dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-xl p-3 text-gray-900 dark:text-white outline-none focus:border-blue-500 dark:focus:border-blue-500" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email Address" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-600 dark:text-gray-500 uppercase">Budget (AED)</label>
                                        <input type="number" className="w-full bg-gray-50 dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-xl p-3 text-gray-900 dark:text-white outline-none focus:border-blue-500 dark:focus:border-blue-500" value={form.budget} onChange={e => setForm({ ...form, budget: Number(e.target.value) })} placeholder="1000000" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-600 dark:text-gray-500 uppercase">Source</label>
                                        <select title="Source" className="w-full bg-gray-50 dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-xl p-3 text-gray-900 dark:text-white outline-none focus:border-blue-500 dark:focus:border-blue-500" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>
                                            <option>Instagram</option>
                                            <option>Facebook</option>
                                            <option>Referral</option>
                                            <option>Cold Call</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-600 dark:text-gray-500 uppercase">Status</label>
                                        <select title="Status" className="w-full bg-gray-50 dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-xl p-3 text-gray-900 dark:text-white outline-none focus:border-blue-500 dark:focus:border-blue-500" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}>
                                            <option>New</option>
                                            <option>Contacted</option>
                                            <option>Qualified</option>
                                            <option>Viewing</option>
                                            <option>Negotiation</option>
                                            <option>Closed</option>
                                            <option>Lost</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1 col-span-2">
                                        <label className="text-xs font-bold text-gray-600 dark:text-gray-500 uppercase">Assigned Agent</label>
                                        <select title="Agent" className="w-full bg-gray-50 dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-xl p-3 text-gray-900 dark:text-white outline-none focus:border-blue-500 dark:focus:border-blue-500" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
                                            <option value={user?.id}>Me ({user?.name || 'Current User'})</option>
                                            {team.filter(t => t.id !== user?.id).map(member => (
                                                <option key={member.id} value={member.id}>{member.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-600 dark:text-gray-500 uppercase">Notes</label>
                                    <textarea className="w-full bg-gray-50 dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-xl p-3 text-gray-900 dark:text-white outline-none focus:border-blue-500 dark:focus:border-blue-500 h-20 resize-none" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notes..." />
                                </div>
                                <div className="flex gap-4 pt-2">
                                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-200 dark:bg-white/5 hover:bg-gray-300 dark:hover:bg-white/10 rounded-xl text-gray-900 dark:text-white font-bold transition-colors">Cancel</button>
                                    <button type="submit" className="flex-1 py-3 bg-blue-500 dark:bg-white text-white dark:text-black rounded-xl font-bold hover:bg-blue-600 dark:hover:bg-gray-200 transition-colors shadow-lg">Save Lead</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
