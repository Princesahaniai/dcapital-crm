import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useStore } from '../store';
import { FileUp, Database, Search, FileText, Check, X, ShieldAlert, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Property } from '../types';

export const Vault = () => {
    const [activeTab, setActiveTab] = useState<'uploads' | 'active' | 'sold' | 'search'>('uploads');
    const [isUploading, setIsUploading] = useState(false);
    const [extractedData, setExtractedData] = useState<any[]>([]);
    const properties = useStore(s => s.properties);
    const user = useStore(s => s.user);
    const addProperty = useStore(s => s.addProperty);
    const updateProperty = useStore(s => s.updateProperty);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        setIsUploading(true);
        try {
            for (const file of acceptedFiles) {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const base64 = (e.target?.result as string).split(',')[1];
                    const response = await fetch('/api/vault-ingest', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            fileBase64: base64,
                            fileType: file.type,
                            fileName: file.name
                        })
                    });
                    
                    const data = await response.json();
                    if (data.success) {
                        setExtractedData(prev => [...prev, ...data.properties]);
                        toast.success(`Extracted ${data.properties.length} properties from ${file.name}`);
                    } else {
                        toast.error(`Failed to process ${file.name}`);
                    }
                };
                reader.readAsDataURL(file);
            }
        } catch (error) {
            console.error(error);
            toast.error("Upload failed");
        } finally {
            setIsUploading(false);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    const handleSaveExtracted = (index: number) => {
        const item = extractedData[index];
        const newProperty: Omit<Property, 'id' | 'createdAt'> = {
            name: item.projectName || 'Unknown Project',
            developer: 'Vault Extracted',
            type: item.type || 'Apartment',
            price: item.price || 0,
            status: item.status === 'Active' ? 'Available' : item.status || 'Available',
            commissionRate: 5,
            location: item.location || 'Unknown',
            imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80',
            bedrooms: 1,
            bathrooms: 1,
            sqft: item.size || 0,
            projectStatus: 'Ready',
            ownerName: item.ownerName || '',
            ownerPhone: item.ownerPhone || '',
            ownerEmail: item.ownerEmail || '',
            description: `Extracted Details:\nSpecs: ${item.specs || ''}`
        };
        addProperty(newProperty);
        setExtractedData(prev => prev.filter((_, i) => i !== index));
        toast.success("Saved to Inventory");
    };

    const updateExtractedField = (index: number, field: string, value: string) => {
        setExtractedData(prev => {
            const copy = [...prev];
            copy[index][field] = value;
            return copy;
        });
    };

    return (
        <div className="h-full flex flex-col bg-slate-950 text-slate-200">
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-800 bg-slate-900/50">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <ShieldAlert className="text-emerald-500" size={32} />
                    AI Document Vault & Presentation Builder
                </h1>
                <p className="text-slate-400 mt-2">Secure document ingestion, strict inventory management, and branded PDF generation.</p>
            </div>

            {/* Tabs */}
            <div className="flex px-8 border-b border-slate-800 bg-slate-900/30">
                {[
                    { id: 'uploads', label: 'Vault & Uploads', icon: FileUp },
                    { id: 'active', label: 'Active Inventory', icon: Database },
                    { id: 'sold', label: 'Sold Archive', icon: FileText },
                    { id: 'search', label: 'AI Search & PDF Builder', icon: Search },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 ${
                            activeTab === tab.id 
                            ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10' 
                            : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8">
                
                {/* UPLOADS TAB */}
                {activeTab === 'uploads' && (
                    <div className="max-w-5xl mx-auto space-y-8">
                        <div 
                            {...getRootProps()} 
                            className={`border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-all duration-300 ${
                                isDragActive ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'
                            }`}
                        >
                            <input {...getInputProps()} />
                            <FileUp size={48} className={`mx-auto mb-4 ${isDragActive ? 'text-emerald-500' : 'text-slate-500'}`} />
                            <h3 className="text-xl font-bold text-white mb-2">Drag & Drop Documents Here</h3>
                            <p className="text-slate-400">Upload PDFs, Excel, CSVs, or Images for instant AI extraction.</p>
                            {isUploading && <p className="text-emerald-400 mt-4 animate-pulse font-medium">Extracting properties with AI...</p>}
                        </div>

                        {extractedData.length > 0 && (
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                                <div className="p-6 border-b border-slate-800 bg-slate-800/50">
                                    <h3 className="text-xl font-bold text-white">Extracted Properties Verification</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase font-semibold">
                                            <tr>
                                                <th className="px-6 py-4">Project / Location</th>
                                                <th className="px-6 py-4">Type & Price</th>
                                                <th className="px-6 py-4">Owner Name</th>
                                                <th className="px-6 py-4">Contact Info</th>
                                                <th className="px-6 py-4 text-center">Status</th>
                                                <th className="px-6 py-4 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/50">
                                            {extractedData.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-white">{item.projectName}</div>
                                                        <div className="text-xs text-slate-400">{item.location}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-slate-200">{item.type}</div>
                                                        <div className="text-emerald-400 text-sm">AED {item.price?.toLocaleString()}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <input 
                                                            type="text" 
                                                            value={item.ownerName}
                                                            onChange={(e) => updateExtractedField(idx, 'ownerName', e.target.value)}
                                                            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm w-full text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <input 
                                                            type="text" 
                                                            value={item.contactInfo}
                                                            onChange={(e) => updateExtractedField(idx, 'contactInfo', e.target.value)}
                                                            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm w-full text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <select 
                                                            value={item.status}
                                                            onChange={(e) => updateExtractedField(idx, 'status', e.target.value)}
                                                            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm w-full text-white focus:border-emerald-500 outline-none"
                                                        >
                                                            <option value="Active">Active</option>
                                                            <option value="Sold">Sold</option>
                                                            <option value="Off-Market">Off-Market</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button 
                                                            onClick={() => handleSaveExtracted(idx)}
                                                            className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-xl transition-colors"
                                                            title="Save to Inventory"
                                                        >
                                                            <Check size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ACTIVE INVENTORY TAB */}
                {activeTab === 'active' && (
                    <div className="max-w-7xl mx-auto">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Property</th>
                                        <th className="px-6 py-4">Price</th>
                                        <th className="px-6 py-4">Owner Details</th>
                                        <th className="px-6 py-4 text-center">Strict Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {properties.filter(p => p.status === 'Available' || p.status === 'Active' as any).map(p => (
                                        <tr key={p.id} className="hover:bg-slate-800/30">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-white">{p.name}</div>
                                                <div className="text-xs text-slate-400">{p.location}</div>
                                            </td>
                                            <td className="px-6 py-4 text-emerald-400 font-medium">AED {p.price?.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-sm text-slate-300">
                                                {(user?.role === 'ceo' || user?.role === 'admin') ? (
                                                    <div>
                                                        {p.ownerName && <div><span className="font-bold">Name:</span> {p.ownerName}</div>}
                                                        {p.ownerPhone && <div><span className="font-bold">Phone:</span> {p.ownerPhone}</div>}
                                                        {p.ownerEmail && <div><span className="font-bold">Email:</span> {p.ownerEmail}</div>}
                                                        {!p.ownerName && !p.ownerPhone && !p.ownerEmail && 'No Owner Data'}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-500 italic">Hidden (Admin Only)</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => updateProperty(p.id, { status: 'Available' })} className={`px-3 py-1 text-xs rounded-full font-bold border ${p.status === 'Available' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'}`}>Active</button>
                                                    <button onClick={() => updateProperty(p.id, { status: 'Sold' })} className={`px-3 py-1 text-xs rounded-full font-bold border ${p.status === 'Sold' ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'}`}>Sold</button>
                                                    <button onClick={() => updateProperty(p.id, { status: 'Off-Market' as any })} className={`px-3 py-1 text-xs rounded-full font-bold border ${p.status === 'Off-Market' as any ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'}`}>Off-Market</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* SOLD ARCHIVE TAB */}
                {activeTab === 'sold' && (
                    <div className="max-w-7xl mx-auto">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden opacity-75">
                            <div className="p-4 bg-red-500/10 border-b border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-2 justify-center">
                                <X size={16} /> These properties are physically excluded from the AI Vector Search.
                            </div>
                            <table className="w-full text-left">
                                <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Property</th>
                                        <th className="px-6 py-4">Price</th>
                                        <th className="px-6 py-4 text-center">Strict Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {properties.filter(p => p.status === 'Sold' || p.status === 'Off-Market' as any).map(p => (
                                        <tr key={p.id}>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-white line-through decoration-red-500/50">{p.name}</div>
                                                <div className="text-xs text-slate-500">{p.location}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 font-medium">AED {p.price?.toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => updateProperty(p.id, { status: 'Available' })} className={`px-3 py-1 text-xs rounded-full font-bold border ${p.status === 'Available' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'}`}>Active</button>
                                                    <button onClick={() => updateProperty(p.id, { status: 'Sold' })} className={`px-3 py-1 text-xs rounded-full font-bold border ${p.status === 'Sold' ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'}`}>Sold</button>
                                                    <button onClick={() => updateProperty(p.id, { status: 'Off-Market' as any })} className={`px-3 py-1 text-xs rounded-full font-bold border ${p.status === 'Off-Market' as any ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'}`}>Off-Market</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                
                {/* AI SEARCH & PDF BUILDER */}
                {activeTab === 'search' && (
                    <div className="max-w-5xl mx-auto text-center space-y-8">
                        <div className="p-16 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/50">
                            <Search size={48} className="mx-auto text-slate-600 mb-4" />
                            <h2 className="text-2xl font-bold text-slate-300 mb-2">Vault Search Interface</h2>
                            <p className="text-slate-500 mb-6">Type "Find me a 4-bed villa under 4M" to query only Active units.</p>
                            <p className="text-sm text-emerald-500">(The PDF builder will be integrated in the next step)</p>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
