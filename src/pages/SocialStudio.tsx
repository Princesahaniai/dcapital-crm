import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Instagram, Facebook, Linkedin, Youtube, Twitter, Video, Check, Copy, Wand2, Mic } from 'lucide-react';
import { generateSocialContent } from '../services/socialAI';
import { Header } from '../components/Header';

interface Platform {
    id: 'instagram' | 'tiktok' | 'facebook' | 'linkedin' | 'twitter' | 'youtube';
    name: string;
    icon: any;
    color: string;
}

const platforms: Platform[] = [
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500' },
    { id: 'tiktok', name: 'TikTok', icon: Video, color: 'bg-black' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-600' },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700' },
    { id: 'twitter', name: 'Twitter', icon: Twitter, color: 'bg-sky-500' },
    { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'bg-red-600' },
];

export const SocialStudio = () => {
    const [step, setStep] = useState(1);
    const [topic, setTopic] = useState('');
    const [bullets, setBullets] = useState('');
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram', 'tiktok', 'facebook']);
    const [isGenerating, setIsGenerating] = useState(false);
    const [results, setResults] = useState<any>({});
    const [activeResultTab, setActiveResultTab] = useState<string>('');

    const handleGenerate = async () => {
        if (!topic) return;
        setIsGenerating(true);
        setStep(3);
        setResults({});

        try {
            const newResults: any = {};
            // Generate for each platform sequentially (to avoid rate limits or UI freeze)
            // In a production app, could be parallelized with Promise.all
            for (const platformId of selectedPlatforms) {
                const content = await generateSocialContent({
                    topic,
                    bullets,
                    platform: platformId as any
                });
                newResults[platformId] = content;
            }
            setResults(newResults);
            setActiveResultTab(selectedPlatforms[0]);
        } catch (error) {
            console.error(error);
            // Handle error (maybe show a toast)
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Toast logic here if we had a toast component
    };

    return (
        <div className="p-4 md:p-10 min-h-screen space-y-8 pb-32">
            <Header title="Social Command Center" subtitle="AI-Powered Content Engine" />

            {/* PROGRESS STEPS */}
            <div className="flex justify-center mb-8">
                <div className="flex items-center gap-4 bg-white dark:bg-[#1C1C1E] p-2 rounded-full border border-gray-100 dark:border-white/5 shadow-sm">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${step === s ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : step > s ? 'bg-green-500/10 text-green-500' : 'text-gray-400'}`}>
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === s ? 'bg-white/20' : step > s ? 'bg-green-500' : 'bg-gray-200 dark:bg-white/10 text-gray-500'}`}>
                                {step > s ? <Check size={14} className="text-white" /> : s}
                            </span>
                            <span className="text-sm font-bold hidden md:inline">
                                {s === 1 ? 'Input' : s === 2 ? 'Platforms' : 'Results'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
                {/* LEFT COLUMN: INPUTS */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                >
                    {/* STEP 1: CONTENT INPUT */}
                    <div className={`bg-white dark:bg-[#1C1C1E] p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm transition-all ${step === 1 ? 'ring-2 ring-blue-500 ring-offset-4 dark:ring-offset-[#121212]' : 'opacity-60 grayscale'}`}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <span className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-sm font-black">1</span>
                                Topic & Details
                            </h2>
                            <button className="text-xs font-bold text-blue-500 uppercase tracking-widest bg-blue-500/10 px-3 py-1.5 rounded-lg hover:bg-blue-500/20 transition-colors flex items-center gap-2">
                                <Mic size={14} /> Voice Input
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">What are we posting about?</label>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="e.g. New 6-Bed Villa Launch on Palm Jumeirah"
                                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold"
                                    onClick={() => setStep(1)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Key Selling Points / Bullets</label>
                                <textarea
                                    value={bullets}
                                    onChange={(e) => setBullets(e.target.value)}
                                    placeholder="• AED 45 Million&#10;• Private Beach Access&#10;• Handover Q4 2024"
                                    className="w-full h-32 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                                    onClick={() => setStep(1)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* STEP 2: PLATFORMS */}
                    <div className={`bg-white dark:bg-[#1C1C1E] p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm transition-all ${step === 2 ? 'ring-2 ring-blue-500 ring-offset-4 dark:ring-offset-[#121212]' : step === 1 ? 'opacity-60' : ''}`}>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                            <span className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center text-sm font-black">2</span>
                            Select Platforms
                        </h2>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {platforms.map(platform => (
                                <button
                                    key={platform.id}
                                    onClick={() => {
                                        setStep(2);
                                        setSelectedPlatforms(prev =>
                                            prev.includes(platform.id)
                                                ? prev.filter(p => p !== platform.id)
                                                : [...prev, platform.id]
                                        );
                                    }}
                                    className={`relative p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${selectedPlatforms.includes(platform.id)
                                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent shadow-lg transform scale-105'
                                            : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-blue-500/50 text-gray-500'
                                        }`}
                                >
                                    <div className={`p-2 rounded-full ${selectedPlatforms.includes(platform.id) ? 'bg-white/20' : platform.color + '/10 ' + platform.color.replace('bg-', 'text-')}`}>
                                        <platform.icon size={20} />
                                    </div>
                                    <span className="text-xs font-bold">{platform.name}</span>
                                    {selectedPlatforms.includes(platform.id) && (
                                        <div className="absolute top-2 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                                            <Check size={8} className="text-white" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>

                        <button
                            disabled={!topic || selectedPlatforms.length === 0}
                            onClick={handleGenerate}
                            className="w-full mt-6 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <Wand2 className="animate-spin" /> Generating Magic...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="fill-white" /> Generate Content
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>

                {/* RIGHT COLUMN: RESULTS */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative"
                >
                    {step === 3 ? (
                        <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl border border-gray-100 dark:border-white/5 shadow-2xl overflow-hidden min-h-[600px] flex flex-col">
                            {/* Platform Tabs */}
                            <div className="flex overflow-x-auto p-4 gap-2 border-b border-gray-100 dark:border-white/5">
                                {selectedPlatforms.map(pid => {
                                    const p = platforms.find(pl => pl.id === pid);
                                    return (
                                        <button
                                            key={pid}
                                            onClick={() => setActiveResultTab(pid)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors ${activeResultTab === pid
                                                    ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white'
                                                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                                                }`}
                                        >
                                            {p?.icon && <p.icon size={16} />} {p?.name}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Content Display */}
                            <div className="flex-1 p-6 md:p-8 bg-gray-50/50 dark:bg-black/20">
                                {isGenerating && !results[activeResultTab] ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                                        <div className="w-16 h-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                                        <p className="animate-pulse font-medium">Crafting viral content for {platforms.find(p => p.id === activeResultTab)?.name}...</p>
                                    </div>
                                ) : results[activeResultTab] ? (
                                    <div className="space-y-6">
                                        {/* Result Card: HOOK */}
                                        <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest">Viral Hook</h3>
                                                <button onClick={() => copyToClipboard(results[activeResultTab].hook)} className="text-gray-400 hover:text-blue-500"><Copy size={14} /></button>
                                            </div>
                                            <p className="text-lg font-black text-gray-900 dark:text-white leading-tight">
                                                "{results[activeResultTab].hook}"
                                            </p>
                                        </div>

                                        {/* Result Card: CAPTION */}
                                        <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="text-xs font-bold text-purple-500 uppercase tracking-widest">Caption / Script</h3>
                                                <button onClick={() => copyToClipboard(results[activeResultTab].caption)} className="text-gray-400 hover:text-blue-500"><Copy size={14} /></button>
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                                {results[activeResultTab].caption}
                                            </p>
                                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
                                                <p className="text-blue-500 font-medium text-sm">{results[activeResultTab].hashtags}</p>
                                            </div>
                                        </div>

                                        {/* Strategy Grid */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white dark:bg-[#1C1C1E] p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Visual Direction</h4>
                                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{results[activeResultTab].visualDirection}</p>
                                            </div>
                                            <div className="bg-white dark:bg-[#1C1C1E] p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Best Time to Post</h4>
                                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{results[activeResultTab].bestTime}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                                        <Sparkles size={48} className="mb-4" />
                                        <p>Select a platform to view results</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        // Placeholder State interactions
                        <div className="h-full flex items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 dark:border-white/10 p-10 text-center opacity-50">
                            <div>
                                <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Wand2 size={32} className="text-gray-400" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Ready to Create?</h3>
                                <p className="text-gray-500 max-w-xs mx-auto">Fill in the topic and select platforms to let the AI magic happen.</p>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};
