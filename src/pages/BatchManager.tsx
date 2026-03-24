import { useState } from 'react';
import { useStore } from '../store';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ArrowRightLeft, UploadCloud, Users, Calendar, FolderArchive, Trash2 } from 'lucide-react';
import { Modal } from '../components/Modal';

export const BatchManager = () => {
    const { importFiles, team, user, bulkAssignFile, deleteBatch } = useStore();
    const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
    const [selectedAgentId, setSelectedAgentId] = useState<string>('');
    const [isAssigning, setIsAssigning] = useState(false);
    const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

    const handleDelete = async (file: typeof importFiles[0]) => {
        if (!confirm(`⚠️ CRITICAL WARNING\n\nThis will permanently delete ALL ${file.leadCount} leads from "${file.name}". This cannot be undone.\n\nProceed?`)) return;
        setIsDeletingId(file.id);
        try {
            await deleteBatch(file.id);
            toast.success(`🗑️ "${file.name}" and all ${file.leadCount} leads permanently deleted.`);
        } catch (err) {
            toast.error('Delete failed. Please try again.');
        } finally {
            setIsDeletingId(null);
        }
    };

    const handleAssign = async () => {
        if (!selectedFileId || !selectedAgentId) return;

        let targetName = 'Unknown';
        if (selectedAgentId === user?.id) {
            targetName = user?.name || 'Unknown';
        } else {
            const agent = team.find(m => m.id === selectedAgentId);
            if (agent) targetName = agent.name;
        }

        setIsAssigning(true);
        await bulkAssignFile(selectedFileId, selectedAgentId, targetName);
        setIsAssigning(false);
        setSelectedFileId(null);
        setSelectedAgentId('');
    };

    return (
        <div className="p-4 md:p-8 pt-16 md:pt-8 bg-gray-50 dark:bg-black w-full min-h-screen">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                    BATCH <span className="text-indigo-500 text-sm font-medium tracking-widest uppercase ml-2 px-2 py-1 bg-indigo-500/10 rounded-full">Manager</span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Manage massive datasets and re-route historical imports instantly.</p>
            </motion.div>

            <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-black/30 border-b border-gray-200 dark:border-white/10 uppercase text-[10px] tracking-widest text-gray-500">
                                <th className="p-6 font-bold">File Information</th>
                                <th className="p-6 font-bold">Category</th>
                                <th className="p-6 font-bold">Size</th>
                                <th className="p-6 font-bold">Upload Date</th>
                                <th className="p-6 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {importFiles.map(file => (
                                <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                                <UploadCloud size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white truncate max-w-[200px] md:max-w-md">{file.name}</p>
                                                <p className="text-[10px] text-gray-500 font-mono mt-1">ID: {file.id.toUpperCase()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${file.category === 'lead' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
                                            {file.category === 'lead' ? 'Pipeline' : 'Vault'}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold">
                                            <Users size={16} className="text-gray-400" />
                                            {file.leadCount}
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <Calendar size={16} />
                                            <span className="text-sm font-medium">{new Date(file.uploadDate).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setSelectedFileId(file.id)}
                                                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-40"
                                                disabled={file.leadCount === 0}
                                            >
                                                <ArrowRightLeft size={16} /> Bulk Assign
                                            </button>
                                            <button
                                                onClick={() => handleDelete(file)}
                                                disabled={isDeletingId === file.id}
                                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-red-500/20 transition-all disabled:opacity-40"
                                            >
                                                <Trash2 size={16} />
                                                {isDeletingId === file.id ? 'Deleting...' : 'Delete File'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {importFiles.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-16 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                                                <FolderArchive size={32} className="opacity-50" />
                                            </div>
                                            <p className="font-bold">No import files found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={!!selectedFileId} onClose={() => setSelectedFileId(null)} title="Mass Bulk Assignment">
                <div className="p-6 space-y-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        This action will immediately transfer ownership of every contact inside the selected file to the target agent.
                    </p>
                    
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Select Target Agent</label>
                        <select 
                            title="Select Target Agent"
                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-2xl text-gray-900 dark:text-white outline-none focus:border-indigo-500 font-medium"
                            value={selectedAgentId}
                            onChange={(e) => setSelectedAgentId(e.target.value)}
                        >
                            <option value="">-- Ensure you click an agent --</option>
                            <option value={user?.id}>Me ({user?.name})</option>
                            {team.filter(t => t.id !== user?.id).map(m => (
                                <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-4 pt-4 mt-6">
                        <button type="button" onClick={() => setSelectedFileId(null)} className="flex-1 py-4 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white font-bold rounded-2xl transition-all" disabled={isAssigning}>Cancel</button>
                        <button 
                            type="button" 
                            className="flex-1 py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2"
                            onClick={handleAssign}
                            disabled={!selectedAgentId || isAssigning}
                        >
                            <ArrowRightLeft size={18} /> {isAssigning ? 'Routing...' : 'Execute Routing'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
