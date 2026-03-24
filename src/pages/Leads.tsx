import { useState, useMemo } from 'react';
import { useStore } from '../store';
import { usePagination } from '../hooks/usePagination';
import { Pagination } from '../components/Pagination';
import { Phone, Plus, Search, Trash2, FileDown, Upload, Download, LayoutGrid, List, Clock, FolderOpen, Users, AlertTriangle, CheckSquare, Square, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getVisibleLeads, canDeleteLead } from '../utils/permissions';
import { MessageSquareShare } from 'lucide-react';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { EmailModal } from '../components/EmailModal';
import { MeetingModal } from '../components/MeetingModal';
import { Modal } from '../components/Modal';
import { LeadCard } from '../components/leads/LeadCard';
import { LeadProfile } from '../components/leads/LeadProfile';
import { KanbanBoard } from '../components/leads/KanbanBoard';
import { doc, getDoc, updateDoc, arrayUnion, writeBatch } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { parseCSV, validateLead, transformRow } from '../utils/csvHelpers';
import * as XLSX from 'xlsx';
import type { Lead, GlobalSettings } from '../types';
import { sendWhatsAppMessage, randomDelay } from '../utils/whatsappAPI';

export const Leads = ({ isProspectVault = false }: { isProspectVault?: boolean }) => {
    const { isDataLoading, leads, team, addLead, addBulkLeads, addImportFile, updateLead, deleteLead, user, logAudit, importFiles, deleteBatch, bulkAssignFile } = useStore();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [viewMode, setViewMode] = useState<'list' | 'board' | 'batch'>('list');

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
    const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [importing, setImporting] = useState(false);
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [selectedLeadsForBroadcast, setSelectedLeadsForBroadcast] = useState<string[]>([]);
    const [showBroadcastModal, setShowBroadcastModal] = useState(false);
    const [broadcastTemplate, setBroadcastTemplate] = useState('new_project_launch');

    // Import Management
    const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
    const [importCategory, setImportCategory] = useState<'lead' | 'prospect'>(isProspectVault ? 'prospect' : 'lead');

    const statusTabs = ['All', 'New', 'Contacted', 'Qualified', 'Viewing', 'Negotiation', 'Closed', 'Lost'];

    const [showTrash, setShowTrash] = useState(false);
    const [showRecentOnly, setShowRecentOnly] = useState(false);
    const [selectedFileForAssign, setSelectedFileForAssign] = useState<string | null>(null);
    const [assignTarget, setAssignTarget] = useState('');
    const [isDeletingBatch, setIsDeletingBatch] = useState<string | null>(null);

    // Bulk selection state
    const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    const toggleLeadSelection = (id: string) => {
        setSelectedLeadIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const bulkDeleteLeads = async () => {
        if (selectedLeadIds.size === 0) return;
        if (!confirm(`⚠️ Permanently delete ${selectedLeadIds.size} selected leads? This CANNOT be undone.`)) return;
        setIsBulkDeleting(true);
        try {
            const batch = writeBatch(db);
            selectedLeadIds.forEach(id => batch.delete(doc(db, 'leads', id)));
            await batch.commit();
            // Remove from local state via the store setter
            const currentLeads = useStore.getState().leads;
            useStore.getState().setLeads(currentLeads.filter(l => !selectedLeadIds.has(l.id)));
            toast.success(`🗑️ ${selectedLeadIds.size} leads permanently deleted`);
            setSelectedLeadIds(new Set());
        } catch (err) {
            toast.error('Bulk delete failed. Please try again.');
        } finally {
            setIsBulkDeleting(false);
        }
    };

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
        if (isProspectVault) {
            if (lead.status === 'Trash' || lead.category !== 'prospect') return false; // Show only active prospects
        } else {
            if (lead.status === 'Trash' || lead.category === 'prospect') return false; // Hide trash and prospects by default
        }

        if (showRecentOnly) {
            const latestFileId = importFiles[0]?.id;
            if (!latestFileId || lead.fileId !== latestFileId) return false;
        }

        const matchesSearch = (lead.name || '').toLowerCase().includes((search || '').toLowerCase()) ||
            (lead.email || '').toLowerCase().includes((search || '').toLowerCase()) ||
            (lead.phone && lead.phone.includes(search));
        const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Paginate leads — 24 per page to prevent crashes on large datasets
    const {
        currentItems: paginatedLeads,
        currentPage, totalPages, totalItems, startIndex, endIndex,
        goToPage, nextPage, prevPage
    } = usePagination(filteredLeads, 24);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Strict Validation
        const errors: Record<string, boolean> = {};
        if (!form.name?.trim()) { errors.name = true; toast.error('Lead Name is strictly required'); }
        if (!form.phone?.trim() || form.phone.length < 8) { errors.phone = true; toast.error('A strictly valid Contact Phone is required'); }
        if (!form.budget || form.budget <= 0) { errors.budget = true; toast.error('Mission Budget must be greater than 0'); }
        if (!form.status) { errors.status = true; toast.error('Pipeline State is required'); }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }
        setFormErrors({});

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

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPendingImportFile(file);
        setImportCategory(isProspectVault ? 'prospect' : 'lead');
        e.target.value = ''; // Reset input
    };

    const processImport = async () => {
        if (!pendingImportFile) return;
        const file = pendingImportFile;

        setImporting(true);
        setPendingImportFile(null);
        try {
            let data: any[] = [];
            
            if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                const reader = new FileReader();
                const fileData = await new Promise<ArrayBuffer>((resolve, reject) => {
                    reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
                    reader.onerror = reject;
                    reader.readAsArrayBuffer(file);
                });
                const workbook = XLSX.read(fileData);
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const rawData = XLSX.utils.sheet_to_json(worksheet);
                data = (rawData as Record<string, any>[]).map(transformRow);
            } else {
                const { data: csvData, errors } = await parseCSV(file);
                if (errors.length > 0) {
                    toast.error(`CSV Error: ${errors[0].message}`);
                }
                data = csvData;
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
                        commissionPaid: false,
                        category: importCategory,
                        fileId: '', // placeholder, will be updated shortly
                        fileName: file.name
                    });
                } else {
                    validationErrors++;
                }
            });

            if (validLeads.length > 0) {
                const fileRecordId = Math.random().toString(36).substr(2, 9);
                
                // Track the file in the store
                await addImportFile({
                    id: fileRecordId,
                    name: file.name,
                    uploadDate: Date.now(),
                    leadCount: validLeads.length,
                    category: importCategory
                });

                // Attach fileId to all valid leads
                const stampedLeads = validLeads.map(l => ({ ...l, fileId: fileRecordId }));

                const result = await addBulkLeads(stampedLeads);
                if (result.success > 0) {
                    toast.success(`Imported ${result.success} leads successfully!`);
                }
                if (validationErrors > 0) {
                    toast.error(`${validationErrors} rows failed validation`);
                }
            } else {
                toast.error('No valid leads found in file');
            }

        } catch (error: any) {
            toast.error('Import Failed: ' + (error.message || JSON.stringify(error)));
            setImporting(false);
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

    const handleBulkWhatsApp = async () => {
        if (!user) return toast.error('Authentication Error');

        const companyId = user.companyId || 'default-company';

        setIsBroadcasting(true);
        const loadingToastId = toast.loading('Initializing WhatsApp Engine...');

        try {
            // First, fetch WhatsApp credentials from global settings
            const settingsDoc = await getDoc(doc(db, 'settings_by_company', companyId));
            const settingsData = settingsDoc.data() as GlobalSettings;

            const token = settingsData?.whatsappToken || process.env.VITE_WHATSAPP_TOKEN;
            const phoneId = settingsData?.whatsappPhoneId || process.env.VITE_WHATSAPP_PHONE_ID;

            if (!token || !phoneId) {
                toast.error('WhatsApp API keys missing. Configure in Settings.', { id: loadingToastId });
                setIsBroadcasting(false);
                return;
            }

            // Figure out which leads to message
            const targets = selectedLeadsForBroadcast.length > 0
                ? filteredLeads.filter(l => selectedLeadsForBroadcast.includes(l.id))
                : filteredLeads;

            const targetsWithPhones = targets.filter(l => l.phone && l.phone.length >= 8);

            if (targetsWithPhones.length === 0) {
                toast.error('No selected leads have valid phone numbers.', { id: loadingToastId });
                setIsBroadcasting(false);
                return;
            }

            const confirmMsg = `Broadcast template '${broadcastTemplate}' to ${targetsWithPhones.length} leads safely?\n\nThis uses the Official API with a RANDOM delay (5-12s) between each message to prevent number blocking. Expected time: ~${Math.round((targetsWithPhones.length * 8.5) / 60)} minutes.`;
            if (!confirm(confirmMsg)) {
                toast.dismiss(loadingToastId);
                setIsBroadcasting(false);
                return;
            }

            toast.loading(`Broadcasting to ${targetsWithPhones.length} leads...`, { id: loadingToastId });

            let successCount = 0;
            let failCount = 0;

            for (let i = 0; i < targetsWithPhones.length; i++) {
                const lead = targetsWithPhones[i];
                const phone = lead.phone!;

                // Construct variables - usually just the lead's first name for a default template
                const variables = [lead.name.split(' ')[0]];

                const result = await sendWhatsAppMessage(phone, broadcastTemplate, token, phoneId, 'en', variables);

                let systemNoteText = '';

                if (result.success) {
                    successCount++;
                    systemNoteText = `System: WhatsApp Template [${broadcastTemplate}] sent successfully.`;
                } else {
                    failCount++;
                    console.error(`Failed to send WA to ${phone}:`, result.error);
                    systemNoteText = `System: WhatsApp Failed - ${result.error}`;
                }

                try {
                    await updateDoc(doc(db, 'leads', lead.id), {
                        waStatus: result.success ? 'Sent' : 'Failed',
                        notes: arrayUnion({
                            text: systemNoteText,
                            author: 'System',
                            timestamp: Date.now()
                        })
                    });
                } catch (noteErr) {
                    console.error('Failed to update lead timeline:', noteErr);
                }

                // Mimic human behavior with random delay
                if (i < targetsWithPhones.length - 1) {
                    await randomDelay(5, 12);
                }
            }

            toast.success(`Broadcast Complete: ${successCount} Sent, ${failCount} Failed`, { id: loadingToastId, duration: 5000 });

        } catch (error) {
            console.error('Broadcast Error:', error);
            toast.error('An error occurred during the broadcast.', { id: loadingToastId });
        } finally {
            setIsBroadcasting(false);
            setShowBroadcastModal(false);
            setSelectedLeadsForBroadcast([]); // Clear selection
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
        <div className="p-4 md:p-8 pt-16 md:pt-8 bg-gray-50 dark:bg-black w-full overflow-x-hidden max-w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                        {isProspectVault ? 'PROSPECTS' : 'LEADS'} <span className={`text-sm font-medium tracking-widest uppercase ml-2 px-2 py-1 rounded-full ${isProspectVault ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>{isProspectVault ? 'Vault' : 'Pipeline'}</span>
                    </h1>
                </motion.div>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={downloadTemplate} title="Download Template" className="p-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors">
                        <FileDown size={20} />
                    </button>
                    {(user?.role === 'ceo' || user?.role === 'admin' || user?.email?.includes('admin')) && (
                        <button
                            onClick={() => setShowBroadcastModal(true)}
                            disabled={isBroadcasting}
                            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${isBroadcasting ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-[#E3FFEB] text-[#00A843] hover:bg-[#D1F7DB] border border-[#00A843]/30'}`}
                            title="Bulk WhatsApp via Meta API"
                        >
                            <MessageSquareShare size={18} /> {isBroadcasting ? 'Broadcasting...' : 'Bulk WhatsApp'}
                        </button>
                    )}
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
                        <Upload size={18} /> {importing ? 'Importing...' : 'Import Leads'}
                        <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} className="hidden" disabled={importing} title="Upload Spreadsheet" />
                    </label>
                    <button onClick={openNew} className="bg-blue-500 dark:bg-white text-white dark:text-black px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-600 dark:hover:bg-gray-200 transition-all shadow-lg shadow-blue-500/20">
                        <Plus size={18} /> Add Lead
                    </button>
                    {!isProspectVault && (
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
                            {(user?.role === 'ceo' || user?.role === 'admin') && (
                                <button
                                    onClick={() => setViewMode('batch')}
                                    className={`p-2.5 rounded-lg transition-all ${viewMode === 'batch' ? 'bg-blue-500 shadow-sm text-white' : 'text-gray-400 hover:text-gray-600'}`}
                                    title="Batch Control"
                                >
                                    <FolderOpen size={18} />
                                </button>
                            )}
                        </div>
                    )}
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
                    <button
                        onClick={() => setShowRecentOnly(!showRecentOnly)}
                        className={`px-5 py-2 rounded-full text-xs md:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${showRecentOnly ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-500/20'}`}
                        title="Show Recent Uploads"
                    >
                        <Clock size={16} /> Recently Uploaded
                        {showRecentOnly && importFiles[0] && (
                            <span className="ml-1 max-w-[120px] truncate text-[10px] font-bold opacity-80 border border-white/30 px-2 py-0.5 rounded-full">
                                {importFiles[0].name}
                            </span>
                        )}
                    </button>
                    {/* Select All – only for CEO/Admin */}
                    {(user?.role === 'ceo' || user?.role === 'admin') && viewMode === 'list' && !showTrash && (
                        <button
                            onClick={() => {
                                if (selectedLeadIds.size === paginatedLeads.length) {
                                    setSelectedLeadIds(new Set());
                                } else {
                                    setSelectedLeadIds(new Set(paginatedLeads.map(l => l.id)));
                                }
                            }}
                            className={`px-5 py-2 rounded-full text-xs md:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                                selectedLeadIds.size > 0
                                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                                    : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                            }`}
                            title="Select All Leads"
                        >
                            {selectedLeadIds.size > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
                            {selectedLeadIds.size > 0 ? `${selectedLeadIds.size} Selected` : 'Select'}
                        </button>
                    )}
                    <div className="w-px h-8 bg-gray-300 dark:bg-white/10 mx-2 self-center shrink-0"></div>
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

            {isDataLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20 mt-6 px-4 md:px-0">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                        <div key={n} className="bg-white dark:bg-[#1C1C1E] p-5 rounded-3xl border border-gray-100 dark:border-white/5 h-48 animate-pulse">
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-gray-200 dark:bg-white/10 h-6 w-1/2 rounded-xl"></div>
                                <div className="bg-gray-200 dark:bg-white/10 h-6 w-1/4 rounded-xl"></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-gray-100 dark:bg-black/20 h-10 rounded-2xl"></div>
                                <div className="bg-gray-100 dark:bg-black/20 h-10 rounded-2xl"></div>
                            </div>
                            <div className="bg-gray-200 dark:bg-white/10 h-10 w-full rounded-xl mt-auto"></div>
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    {/* BATCH CONTROL VIEW */}
                    {viewMode === 'batch' && (
                        <div className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
                            <div className="p-6 border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-black/20 text-gray-900 dark:text-white">
                                <h2 className="text-xl font-black flex items-center gap-2">
                                    <FolderOpen className="text-blue-500" /> Batch Control
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">Manage, assign, or delete entire uploaded files instantly.</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold">
                                            <th className="p-4 pl-6">File Name</th>
                                            <th className="p-4">Upload Date</th>
                                            <th className="p-4">Lead Count</th>
                                            <th className="p-4 pr-6 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {importFiles.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="p-8 text-center text-gray-500">
                                                    <AlertTriangle className="mx-auto mb-2 text-gray-400" size={32} />
                                                    <p className="font-bold">No file history found.</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            importFiles.map(file => (
                                                <tr key={file.id} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                                    <td className="p-4 pl-6">
                                                        <p className="font-bold text-gray-900 dark:text-white truncate max-w-[200px] md:max-w-xs">{file.name}</p>
                                                    </td>
                                                    <td className="p-4">
                                                        <p className="text-sm text-gray-500">{new Date(file.uploadDate).toLocaleString()}</p>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold px-3 py-1 rounded-full">
                                                            {file.leadCount} leads
                                                        </span>
                                                    </td>
                                                    <td className="p-4 pr-6">
                                                        {selectedFileForAssign === file.id ? (
                                                            <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-2 animate-fade-in">
                                                                <select
                                                                    title="Select Agent"
                                                                    className="w-full sm:w-auto bg-white dark:bg-black border border-blue-200 dark:border-blue-500/30 rounded-lg p-2 text-sm text-gray-900 dark:text-white outline-none"
                                                                    value={assignTarget}
                                                                    onChange={e => setAssignTarget(e.target.value)}
                                                                >
                                                                    <option value="">Choose Agent...</option>
                                                                    {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                                                </select>
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => {
                                                                            if (!assignTarget) return toast.error('Select an agent');
                                                                            const agentName = team.find(m => m.id === assignTarget)?.name || 'Unknown';
                                                                            bulkAssignFile(file.id, assignTarget, agentName);
                                                                            toast.success(`✅ ${file.leadCount} leads assigned to ${agentName}`);
                                                                            setSelectedFileForAssign(null);
                                                                            setAssignTarget('');
                                                                        }}
                                                                        className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-lg shadow-blue-500/25"
                                                                    >
                                                                        Confirm
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { setSelectedFileForAssign(null); setAssignTarget(''); }}
                                                                        className="bg-gray-200 hover:bg-gray-300 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-gray-300 text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={() => { setSelectedFileForAssign(file.id); setAssignTarget(''); }}
                                                                    className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                                                    disabled={file.leadCount === 0}
                                                                >
                                                                    <Users size={14} /> Assign File
                                                                </button>
                                                                <button
                                                                    disabled={isDeletingBatch === file.id || file.leadCount === 0}
                                                                    onClick={async () => {
                                                                        if (!confirm(`⚠️ CRITICAL WARNING\n\nPermanently delete ALL ${file.leadCount} leads from "${file.name}"?\n\nThis CANNOT be undone.`)) return;
                                                                        setIsDeletingBatch(file.id);
                                                                        try {
                                                                            await deleteBatch(file.id);
                                                                            toast.success(`🗑️ "${file.name}" and ${file.leadCount} leads permanently deleted.`);
                                                                        } catch {
                                                                            toast.error('Delete failed. Please try again.');
                                                                        } finally {
                                                                            setIsDeletingBatch(null);
                                                                        }
                                                                    }}
                                                                    className="bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                                                >
                                                                    <Trash2 size={14} />
                                                                    {isDeletingBatch === file.id ? 'Deleting...' : 'Delete File'}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

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
                        <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-4">
                            <AnimatePresence>
                                {paginatedLeads.map(lead => (
                                    <div key={lead.id}>
                                        {/* Mobile Optimized View */}
                                        <div className="md:hidden">
                                            <motion.div
                                                key={lead.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`bg-white dark:bg-[#1C1C1E] p-5 rounded-3xl shadow-sm border transition-all relative overflow-hidden ${
                                                    selectedLeadIds.has(lead.id)
                                                        ? 'border-red-400 dark:border-red-500 ring-2 ring-red-400/30'
                                                        : 'border-gray-100 dark:border-white/5'
                                                }`}
                                                onClick={() => { setSelectedLead(lead); openEdit(lead); }}
                                            >
                                                {/* Checkbox overlay for admins */}
                                                {(user?.role === 'ceo' || user?.role === 'admin') && (
                                                    <button
                                                        className="absolute top-3 right-3 z-10 p-1"
                                                        onClick={e => { e.stopPropagation(); toggleLeadSelection(lead.id); }}
                                                    >
                                                        {selectedLeadIds.has(lead.id)
                                                            ? <CheckSquare size={18} className="text-red-500" />
                                                            : <Square size={18} className="text-gray-300 dark:text-gray-600" />}
                                                    </button>
                                                )}
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
                                        <div className="hidden md:block relative">
                                            {(user?.role === 'ceo' || user?.role === 'admin') && (
                                                <button
                                                    className="absolute top-3 left-3 z-10 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={e => { e.stopPropagation(); toggleLeadSelection(lead.id); }}
                                                >
                                                    {selectedLeadIds.has(lead.id)
                                                        ? <CheckSquare size={18} className="text-red-500 opacity-100" />
                                                        : <Square size={18} className="text-gray-400" />}
                                                </button>
                                            )}
                                            <div className={selectedLeadIds.has(lead.id) ? 'ring-2 ring-red-400/50 rounded-3xl' : ''}>
                                                <LeadCard
                                                    lead={lead}
                                                    onClick={() => { setSelectedLead(lead); openEdit(lead); }}
                                                    onEdit={(e) => { e.stopPropagation(); openEdit(lead); }}
                                                    onDelete={(e) => { e.stopPropagation(); handleDelete(lead.id); }}
                                                    agentName={getAgentName(lead.assignedTo)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </AnimatePresence>
                        </div>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={totalItems}
                            startIndex={startIndex}
                            endIndex={endIndex}
                            onPageChange={goToPage}
                            onNext={nextPage}
                            onPrev={prevPage}
                        />
                        </>
                    )}
                </>
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
                            <input className={`w-full bg-gray-50 dark:bg-white/5 border ${formErrors.name ? 'border-red-500 shadow-sm shadow-red-500/20' : 'border-gray-200 dark:border-white/10 focus:border-blue-500'} p-4 rounded-2xl text-gray-900 dark:text-white outline-none`} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Mission Target Name" title="Name" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Contact Phone</label>
                            <input className={`w-full bg-gray-50 dark:bg-white/5 border ${formErrors.phone ? 'border-red-500 shadow-sm shadow-red-500/20' : 'border-gray-200 dark:border-white/10 focus:border-blue-500'} p-4 rounded-2xl text-gray-900 dark:text-white outline-none`} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+971..." title="Phone" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Current Value (AED)</label>
                            <input type="number" className={`w-full bg-gray-50 dark:bg-white/5 border ${formErrors.budget ? 'border-red-500 shadow-sm shadow-red-500/20' : 'border-gray-200 dark:border-white/10 focus:border-blue-500'} p-4 rounded-2xl text-gray-900 dark:text-white outline-none`} value={form.budget} onChange={e => setForm({ ...form, budget: Number(e.target.value) })} placeholder="Target Value" title="Budget" />
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
                            <select title="Status" className={`w-full bg-gray-50 dark:bg-white/5 border ${formErrors.status ? 'border-red-500 shadow-sm shadow-red-500/20' : 'border-gray-200 dark:border-white/10 focus:border-blue-500'} p-4 rounded-2xl text-gray-900 dark:text-white outline-none`} value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}>
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

            <Modal
                isOpen={showBroadcastModal}
                onClose={() => setShowBroadcastModal(false)}
                title="WhatsApp Broadcaster Engine (Official API)"
            >
                <div className="p-6 space-y-6">
                    <div className="bg-[#E3FFEB] dark:bg-[#00A843]/10 border border-[#00A843]/30 p-4 rounded-2xl">
                        <p className="text-sm text-[#00A843] dark:text-[#00A843] font-medium">
                            This uses Meta's Official WhatsApp Cloud API to send approved templates to {selectedLeadsForBroadcast.length > 0 ? selectedLeadsForBroadcast.length : filteredLeads.length} selected leads safely, respecting rate limits.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Meta Approved Template Name</label>
                        <input
                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-xl text-gray-900 dark:text-white outline-none focus:border-[#00A843]"
                            value={broadcastTemplate}
                            onChange={e => setBroadcastTemplate(e.target.value)}
                            placeholder="e.g. new_project_welcome"
                            title="Template Name"
                        />
                        <p className="text-xs text-gray-400 ml-1">Must precisely match the template name approved in Meta Developer Portal.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Target Audience</label>
                        <div className="bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-4">
                            {selectedLeadsForBroadcast.length > 0 ? (
                                <p className="text-gray-900 dark:text-white font-bold">{selectedLeadsForBroadcast.length} Specific Checkmarked Leads</p>
                            ) : (
                                <p className="text-gray-900 dark:text-white font-bold">ALL {filteredLeads.length} Leads visible in the current view</p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 mt-6">
                        <button type="button" onClick={() => setShowBroadcastModal(false)} className="px-6 py-4 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white font-bold rounded-2xl transition-all">Cancel</button>
                        <button
                            type="button"
                            className="flex-1 py-4 bg-[#00A843] hover:bg-[#008A37] text-white font-bold rounded-2xl shadow-lg shadow-[#00A843]/30 flex items-center justify-center gap-2 transition-all"
                            onClick={handleBulkWhatsApp}
                            disabled={isBroadcasting}
                        >
                            <MessageSquareShare size={20} />
                            {isBroadcasting ? 'Broadcasting...' : 'Launch WhatsApp Broadcast'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* IMPORT CONFIGURATION MODAL */}
            <Modal isOpen={!!pendingImportFile} onClose={() => setPendingImportFile(null)} title="Import Configuration">
                <div className="p-6 space-y-6">
                    <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-xl flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                            <Upload size={24} />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 dark:text-white truncate max-w-[200px] md:max-w-xs">{pendingImportFile?.name}</p>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">{(pendingImportFile?.size || 0) / 1024 > 1024 ? ((pendingImportFile?.size || 0) / 1024 / 1024).toFixed(2) + ' MB' : ((pendingImportFile?.size || 0) / 1024).toFixed(2) + ' KB'}</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Where should these contacts go?</p>
                        
                        <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${importCategory === 'lead' ? 'border-blue-500 bg-blue-500/5' : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'}`}>
                            <input type="radio" value="lead" checked={importCategory === 'lead'} onChange={() => setImportCategory('lead')} className="mt-1" />
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white">High Value Leads</p>
                                <p className="text-xs text-gray-500 mt-1">Add to the main Pipeline. Visible in the Dashboard. For incoming marketing leads, referrals, and active buyers.</p>
                            </div>
                        </label>

                        <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${importCategory === 'prospect' ? 'border-amber-500 bg-amber-500/5' : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'}`}>
                            <input type="radio" value="prospect" checked={importCategory === 'prospect'} onChange={() => setImportCategory('prospect')} className="mt-1" />
                            <div>
                                <p className="font-bold text-amber-600 dark:text-amber-500">Cold Prospects (Prospect Vault)</p>
                                <p className="text-xs text-gray-500 mt-1">Send to the isolated Prospect Vault. Keep the main pipeline clean. For cold calling data, purchased lists, and raw prospects.</p>
                            </div>
                        </label>
                    </div>

                    <div className="flex gap-4 pt-4 mt-6">
                        <button type="button" onClick={() => setPendingImportFile(null)} className="px-6 py-4 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white font-bold rounded-2xl transition-all">Cancel</button>
                        <button
                            type="button"
                            className={`flex-1 py-4 font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all text-white ${importCategory === 'lead' ? 'bg-blue-500 shadow-blue-500/30 hover:bg-blue-600' : 'bg-amber-500 shadow-amber-500/30 hover:bg-amber-600'}`}
                            onClick={processImport}
                        >
                            <Download size={20} />
                            Deploy to {importCategory === 'lead' ? 'Pipeline' : 'Vault'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* FLOATING ACTION BUTTON (MOBILE) */}
            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={openNew}
                className="md:hidden fixed bottom-24 right-4 bg-blue-500 text-white p-4 rounded-full shadow-2xl z-40 flex items-center justify-center"
            >
                <Plus size={28} />
            </motion.button>

            {/* BULK DELETE ACTION BAR */}
            <AnimatePresence>
                {selectedLeadIds.size > 0 && (
                    <motion.div
                        initial={{ y: 80, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 80, opacity: 0 }}
                        className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/10 dark:border-gray-200"
                    >
                        <div className="flex items-center gap-2">
                            <Zap size={16} className="text-red-400 dark:text-red-500" />
                            <span className="font-bold text-sm">{selectedLeadIds.size} lead{selectedLeadIds.size > 1 ? 's' : ''} selected</span>
                        </div>
                        <button
                            onClick={() => setSelectedLeadIds(new Set())}
                            className="text-xs font-bold text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-gray-900 transition-colors"
                        >
                            Clear
                        </button>
                        <button
                            onClick={bulkDeleteLeads}
                            disabled={isBulkDeleting}
                            className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-red-500/30 transition-all disabled:opacity-60"
                        >
                            <Trash2 size={16} />
                            {isBulkDeleting ? 'Deleting...' : 'Delete Selected'}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};
