import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Copy, Check, MessageSquare, MapPin, Building2, ChevronRight, FileText, Share2, Info } from 'lucide-react';
import { useStore } from '../store';
import toast from 'react-hot-toast';
import { Property } from '../types';

export const Requirements = () => {
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [matchedProperties, setMatchedProperties] = useState<Property[]>([]);
    const [aiReply, setAiReply] = useState('');
    const [copied, setCopied] = useState(false);
    const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
    const { user } = useStore();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);
        setMatchedProperties([]);
        setAiReply('');

        try {
            // Note: In Vercel, api/copilot-match.ts maps to /api/copilot-match
            const res = await fetch('/api/copilot-match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });

            if (!res.ok) {
                throw new Error('Failed to fetch from AI Co-Pilot');
            }

            const data = await res.json();
            
            if (data.success) {
                setAiReply(data.reply);
                if (data.matchedProperties) {
                    setMatchedProperties(data.matchedProperties);
                }
            } else {
                toast.error(data.error || 'No matches found');
            }
        } catch (error: any) {
            console.error('AI Match Error:', error);
            toast.error('AI Co-Pilot is currently offline or encountered an error.');
        } finally {
            setIsSearching(false);
        }
    };

    const copyToClipboard = () => {
        if (!aiReply) return;
        navigator.clipboard.writeText(aiReply);
        setCopied(true);
        toast.success('Copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    const togglePropertySelection = (id: string) => {
        setSelectedProperties(prev => 
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    return (
        <div className="min-h-full bg-gray-50 dark:bg-black p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <Sparkles className="text-amber-500" /> AI Co-Pilot Match
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Paste a client's natural language requirement to instantly search the Master Inventory using Vector AI.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Search Column */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-xl">
                            <form onSubmit={handleSearch} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                                        Client Requirement
                                    </label>
                                    <textarea
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="e.g. Client looking for 2BR in Dubai Marina, ready property, budget AED 4M, sea view."
                                        className="w-full h-40 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white outline-none focus:border-amber-500 transition-all resize-none text-sm leading-relaxed"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSearching || !query.trim()}
                                    className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-600 text-black rounded-xl font-bold hover:from-amber-400 hover:to-yellow-500 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 touch-target"
                                >
                                    {isSearching ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                            Analyzing Inventory...
                                        </>
                                    ) : (
                                        <>
                                            <Search size={18} /> Run AI Match
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Results Column */}
                    <div className="lg:col-span-2 space-y-4">
                        {aiReply && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border border-amber-500/20 rounded-2xl p-6"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider flex items-center gap-2">
                                        <MessageSquare size={16} /> WhatsApp Ready Reply
                                    </h3>
                                    <button
                                        onClick={copyToClipboard}
                                        className={`p-2 rounded-lg transition-colors ${copied ? 'bg-green-500/20 text-green-500' : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'}`}
                                    >
                                        {copied ? <Check size={18} /> : <Copy size={18} />}
                                    </button>
                                </div>
                                <div className="bg-black/40 rounded-xl p-4 font-mono text-sm text-gray-300 whitespace-pre-wrap border border-white/5">
                                    {aiReply}
                                </div>
                            </motion.div>
                        )}

                        <AnimatePresence>
                            {matchedProperties.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-4"
                                >
                                    <div className="flex items-center justify-between mt-8 mb-4">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <Building2 size={20} className="text-amber-500" /> 
                                            Matched Properties ({matchedProperties.length})
                                        </h3>
                                        {selectedProperties.length > 0 && (
                                            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:opacity-90 transition-all">
                                                <FileText size={16} /> Generate Presentation ({selectedProperties.length})
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {matchedProperties.map((prop, idx) => (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.1 }}
                                                key={prop.id}
                                                className={`relative bg-white dark:bg-[#1C1C1E] border ${selectedProperties.includes(prop.id) ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-gray-200 dark:border-white/10'} rounded-2xl overflow-hidden cursor-pointer transition-all hover:border-amber-500/50`}
                                                onClick={() => togglePropertySelection(prop.id)}
                                            >
                                                <div className="absolute top-3 right-3 z-10">
                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedProperties.includes(prop.id) ? 'bg-amber-500 border-amber-500 text-black' : 'border-gray-400/50 bg-black/50 text-transparent'}`}>
                                                        <Check size={14} className="stroke-[3]" />
                                                    </div>
                                                </div>
                                                
                                                {/* Property Image Placeholder */}
                                                <div className="h-32 bg-gray-100 dark:bg-black/50 relative">
                                                    {prop.media && prop.media.length > 0 ? (
                                                        <img src={prop.media[0]} alt={prop.project} className="w-full h-full object-cover opacity-80" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
                                                            <Building2 size={32} />
                                                        </div>
                                                    )}
                                                    <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-emerald-400">
                                                        AED {prop.price?.toLocaleString()}
                                                    </div>
                                                </div>
                                                
                                                <div className="p-4 space-y-2">
                                                    <h4 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1">{prop.project}</h4>
                                                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                        <MapPin size={12} /> {prop.location}
                                                    </div>
                                                    
                                                    <div className="flex flex-wrap gap-2 pt-2">
                                                        <span className="px-2 py-1 bg-gray-100 dark:bg-white/5 rounded text-[10px] font-medium text-gray-600 dark:text-gray-300">
                                                            {prop.bedrooms} Bed
                                                        </span>
                                                        {prop.sqft && (
                                                            <span className="px-2 py-1 bg-gray-100 dark:bg-white/5 rounded text-[10px] font-medium text-gray-600 dark:text-gray-300">
                                                                {prop.sqft.toLocaleString()} sqft
                                                            </span>
                                                        )}
                                                        <span className="px-2 py-1 bg-gray-100 dark:bg-white/5 rounded text-[10px] font-medium text-gray-600 dark:text-gray-300">
                                                            {prop.projectStatus || 'Ready'}
                                                        </span>
                                                    </div>

                                                    {(user?.role === 'ceo' || user?.role === 'admin') && prop.ownerName && (
                                                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5 flex flex-col gap-1">
                                                            <span className="text-[10px] font-bold text-amber-500 uppercase flex items-center gap-1">
                                                                <Info size={10} /> Owner Data (Admin)
                                                            </span>
                                                            <span className="text-xs text-gray-400">{prop.ownerName} - {prop.ownerPhone}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};
