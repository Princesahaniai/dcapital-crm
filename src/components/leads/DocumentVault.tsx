import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, FileImage, Download, Trash2, Shield, AlertCircle } from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { storage, db } from '../../firebaseConfig';
import { useStore } from '../../store';
import toast from 'react-hot-toast';
import type { Lead, LeadDocument } from '../../types';

interface DocumentVaultProps {
    lead: Lead;
}

export const DocumentVault: React.FC<DocumentVaultProps> = ({ lead }) => {
    const { user, updateLead, logAudit } = useStore();
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const documents = lead.documents || [];
    const kyc = lead.kyc || { passport: false, emiratesId: false, formB: false };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        // Validation
        const isPdf = file.type === 'application/pdf';
        const isImage = file.type.startsWith('image/');

        if (!isPdf && !isImage) {
            toast.error('Only PDFs and Images are allowed.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB.');
            return;
        }

        setUploading(true);
        setProgress(0);

        const fileExtension = file.name.split('.').pop();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${Date.now()}_${safeName}`;
        const storageRef = ref(storage, `lead_files/${lead.id}/${fileName}`);

        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed',
            (snapshot) => {
                const currentProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setProgress(Math.round(currentProgress));
            },
            (error) => {
                console.error('Upload Failed', error);
                toast.error('Upload failed');
                setUploading(false);
            },
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                    const newDoc: LeadDocument = {
                        id: Math.random().toString(36).substr(2, 9),
                        name: file.name,
                        url: downloadURL,
                        type: isPdf ? 'pdf' : 'image',
                        uploadedAt: Date.now(),
                        uploadedBy: user.name
                    };

                    const updatedDocuments = [...documents, newDoc];

                    await updateDoc(doc(db, 'leads', lead.id), {
                        documents: updatedDocuments
                    });

                    updateLead(lead.id, { documents: updatedDocuments });
                    logAudit?.('Uploaded Document', `Uploaded ${file.name} to Lead: ${lead.name}`);
                    toast.success('Document saved to Vault');
                } catch (err) {
                    console.error('Error saving document reference', err);
                    toast.error('Failed to save document link');
                } finally {
                    setUploading(false);
                    setProgress(0);
                }
            }
        );
    };

    const handleDelete = async (documentId: string, url: string) => {
        if (!window.confirm('Are you sure you want to permanently delete this document?')) return;

        try {
            // Create a reference to the file to delete
            const fileRef = ref(storage, url);
            await deleteObject(fileRef);

            const updatedDocuments = documents.filter(d => d.id !== documentId);

            await updateDoc(doc(db, 'leads', lead.id), {
                documents: updatedDocuments
            });

            updateLead(lead.id, { documents: updatedDocuments });
            logAudit?.('Deleted Document', `Deleted document from Lead: ${lead.name}`);
            toast.success('Document permanently deleted');
        } catch (error) {
            console.error('Error deleting document', error);
            toast.error('Failed to delete document from storage');
        }
    };

    const toggleKYC = async (key: keyof typeof kyc) => {
        const updatedKyc = { ...kyc, [key]: !kyc[key] };

        try {
            await updateDoc(doc(db, 'leads', lead.id), {
                kyc: updatedKyc
            });
            updateLead(lead.id, { kyc: updatedKyc });
            logAudit?.('Updated KYC', `Updated ${key.toUpperCase()} for Lead: ${lead.name}`);
            toast.success('KYC Status Updated');
        } catch (err) {
            console.error("KYC update error", err);
            toast.error("Failed to update KYC status");
        }
    };

    const kycProgress = Math.round(((Number(kyc.passport) + Number(kyc.emiratesId) + Number(kyc.formB)) / 3) * 100);

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* COMPLIANCE CHECKLIST */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                        <Shield className="text-blue-500" size={18} /> KYC & Compliance
                    </h3>
                    <div className="text-xs font-bold text-gray-500 flex items-center gap-2 bg-gray-50 dark:bg-white/5 py-1 px-3 rounded-full">
                        Completion: <span className={kycProgress === 100 ? 'text-green-500' : 'text-blue-500'}>{kycProgress}%</span>
                    </div>
                </div>

                <div className={`p-5 rounded-2xl border ${kycProgress === 100 ? 'bg-green-500/5 border-green-500/20' : 'bg-blue-500/5 border-blue-500/20'} grid grid-cols-1 md:grid-cols-3 gap-4 transition-colors`}>
                    {[
                        { key: 'passport', label: 'Passport Copy' },
                        { key: 'emiratesId', label: 'Emirates ID' },
                        { key: 'formB', label: 'Signed Form B' }
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => toggleKYC(key as keyof typeof kyc)}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${kyc[key as keyof typeof kyc] ? 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400' : 'bg-white dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-blue-500/50'}`}
                        >
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 ${kyc[key as keyof typeof kyc] ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                {kyc[key as keyof typeof kyc] && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <span className="font-bold text-sm tracking-tight">{label}</span>
                        </button>
                    ))}
                </div>

                {kycProgress < 100 && (
                    <p className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-500 mt-3 ml-1 font-medium">
                        <AlertCircle size={14} /> Compliance incomplete. Lead cannot be moved to "Closed" status.
                    </p>
                )}
            </section>

            {/* DOCUMENT VAULT */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                        <FileText className="text-purple-500" size={18} /> Secure Vault
                    </h3>
                </div>

                {/* Uploader Box */}
                <div className="relative overflow-hidden mb-6">
                    <input
                        type="file"
                        id="vault-upload"
                        className="hidden"
                        accept=".pdf,image/*"
                        onChange={handleFileUpload}
                        disabled={uploading}
                    />
                    <label
                        htmlFor="vault-upload"
                        className={`block w-full border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${(uploading) ? 'border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-white/5 opacity-70 pointer-events-none' : 'border-gray-300 dark:border-white/10 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-500/5 dark:hover:bg-purple-500/5'}`}
                    >
                        {uploading ? (
                            <div className="space-y-4">
                                <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto" />
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">Encrypting & Uploading...</p>
                                    <p className="text-xs text-purple-500 font-bold mt-1">{progress}% Complete</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="w-14 h-14 bg-white dark:bg-[#1C1C1E] shadow-sm rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Upload className="text-gray-400" size={24} />
                                </div>
                                <h4 className="text-base font-bold text-gray-900 dark:text-white">Upload Legal Documents</h4>
                                <p className="text-xs text-gray-500">Supported: PDF, JPG, PNG (Max 5MB)</p>
                            </div>
                        )}
                    </label>
                </div>

                {/* Document Grid */}
                {documents.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                        <p className="text-gray-500 text-sm font-medium">No documents uploaded yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {documents.map((docItem) => (
                            <div key={docItem.id} className="flex items-center justify-between p-4 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl group hover:border-purple-500/30 transition-colors">
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <div className={`min-w-[40px] h-10 rounded-xl flex items-center justify-center ${docItem.type === 'pdf' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                        {docItem.type === 'pdf' ? <FileText size={20} /> : <FileImage size={20} />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate" title={docItem.name}>{docItem.name}</p>
                                        <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">
                                            <span>{new Date(docItem.uploadedAt).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span className="truncate">{docItem.uploadedBy}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                    <a
                                        href={docItem.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-gray-400 hover:text-blue-500 bg-gray-50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 rounded-lg transition-all"
                                        title="Download"
                                    >
                                        <Download size={16} />
                                    </a>
                                    <button
                                        onClick={() => handleDelete(docItem.id, docItem.url)}
                                        className="p-2 text-gray-400 hover:text-red-500 bg-gray-50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 rounded-lg transition-all"
                                        title="Delete Permanently"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};
