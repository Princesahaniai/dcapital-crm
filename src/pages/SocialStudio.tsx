import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Instagram, Facebook, Linkedin, Video, Wand2, Mic, Copy, Send, RefreshCw, LayoutTemplate, Clock, BarChart2 } from 'lucide-react';
import { generateSocialContent } from '../services/socialAI';
import { Header } from '../components/Header';
import { PlatformPreview } from '../components/social/PlatformPreview';
import { ContentCalendar } from '../components/social/ContentCalendar';
import { PostHistory } from '../components/social/PostHistory';
import { TrendingInsights } from '../components/social/TrendingInsights';
import { TemplateLibrary } from '../components/social/TemplateLibrary';

interface ContentResult {
    hook: string;
    caption: string;
    hashtags: string;
    cta: string;
    bestTime: string;
    visualDirection: string;
}

const platforms = [
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-600' },
    { id: 'tiktok', name: 'TikTok', icon: Video, color: 'text-black dark:text-white' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-600' },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' },
];

export const SocialStudio = () => {
    const [activeTab, setActiveTab] = useState<'create' | 'calendar' | 'history'>('create');
    const [topic, setTopic] = useState('');
    const [bullets, setBullets] = useState('');
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram']);
    const [isGenerating, setIsGenerating] = useState(false);
    const [results, setResults] = useState<Record<string, ContentResult>>({});
    const [activePreview, setActivePreview] = useState<string>('instagram');
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!topic) return;
        setIsGenerating(true);
        setError(null);
        setResults({});

        try {
            const newResults: any = {};
            for (const pid of selectedPlatforms) {
                const content = await generateSocialContent({
                    topic,
                    bullets,
                    platform: pid as any
                });
                newResults[pid] = content;
            }
            setResults(newResults);
            setActivePreview(selectedPlatforms[0]);
        } catch (err: any) {
            setError(err.message || 'Generation failed');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleFillExample = () => {
        setTopic("Luxury Penthouse in Downtown Dubai");
        setBullets("• Panoramic Burj Khalifa Views\n• 4 Bedrooms + Maid's Room\n• Private Pool\n• AED 15M Asking Price");
    };

    const handlePost = (platform: string) => {
        const content = results[platform];
        if (!content) return;

        const textToCopy = `${content.caption}\n\n${content.hashtags}`;
        navigator.clipboard.writeText(textToCopy);
        alert(`Content copied for ${platform}! Opening app...`);

        // Mock opening app
        if (platform === 'instagram') window.open('https://instagram.com');
        if (platform === 'tiktok') window.open('https://tiktok.com');
        if (platform === 'facebook') window.open('https://facebook.com');
        if (platform === 'linkedin') window.open('https://linkedin.com');
    };

    return (
        <div className="p-4 md:p-8 min-h-screen space-y-8 pb-32">
            <Header title="Social Command Center" subtitle="AI-Powered Content Engine" />

            {/* TAB NAVIGATION */}
            <div className="flex gap-4 border-b border-gray-200 dark:border-white/10 pb-1">
                {[
                    { id: 'create', label: 'Create', icon: Wand2 },
                    { id: 'calendar', label: 'Calendar', icon: Clock },
                    { id: 'history', label: 'History', icon: BarChart2 }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === tab.id
                                ? 'border-blue-500 text-blue-500'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        <tab.icon size={16} /> {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'create' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* LEFT COLUMN: INPUTS */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* TEMPLATES */}
                        <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <LayoutTemplate size={14} /> Quick Start Templates
                            </h3>
                            <TemplateLibrary onSelect={(t) => {
                                setTopic(t.topic);
                                setBullets(t.bullets);
                            }} />
                        </div>

                        {/* INPUT FORM */}
                        <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
                            <div className="flex justify-between items-center">
                                <h2 className="font-bold text-lg">Content Details</h2>
                                <button onClick={handleFillExample} className="text-xs font-bold text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded transition-colors">
                                    Try Example
                                </button>
                            </div>

                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="What are we posting about?"
                                className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                            />

                            <div className="relative">
                                <textarea
                                    value={bullets}
                                    onChange={(e) => setBullets(e.target.value)}
                                    placeholder="Key details (one per line)..."
                                    className="w-full h-32 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                />
                                <button className="absolute bottom-3 right-3 text-gray-400 hover:text-blue-500">
                                    <Mic size={18} />
                                </button>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase">Select Platforms</label>
                                <div className="flex flex-wrap gap-2">
                                    {platforms.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => setSelectedPlatforms(prev =>
                                                prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id]
                                            )}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold border transition-all ${selectedPlatforms.includes(p.id)
                                                    ? 'bg-gray-900 text-white border-transparent'
                                                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <p.icon size={14} /> {p.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm font-bold">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !topic || selectedPlatforms.length === 0}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {isGenerating ? <RefreshCw className="animate-spin" /> : <Sparkles className="fill-white" />}
                                {isGenerating ? 'Generating...' : 'Generate Content'}
                            </button>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: PREVIEW & EDIT */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* TRENDING INSIGHTS */}
                        <TrendingInsights />

                        {/* RESULTS AREA */}
                        <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl border border-gray-100 dark:border-white/5 shadow-xl overflow-hidden min-h-[600px] flex flex-col md:flex-row">
                            {/* PREVIEW SIDEBAR */}
                            <div className="w-full md:w-20 bg-gray-50 dark:bg-black/20 border-b md:border-b-0 md:border-r border-gray-100 dark:border-white/5 p-2 flex md:flex-col gap-2 overflow-x-auto md:overflow-visible">
                                {selectedPlatforms.map(pid => {
                                    const p = platforms.find(x => x.id === pid);
                                    if (!p) return null;
                                    return (
                                        <button
                                            key={pid}
                                            onClick={() => setActivePreview(pid)}
                                            className={`p-3 rounded-xl flex items-center justify-center transition-all ${activePreview === pid
                                                    ? 'bg-white shadow-md text-blue-500'
                                                    : 'text-gray-400 hover:bg-white/50'
                                                }`}
                                            title={p.name}
                                        >
                                            <p.icon size={20} />
                                        </button>
                                    );
                                })}
                            </div>

                            {/* MAIN PREVIEW AREA */}
                            <div className="flex-1 p-6 md:p-8 bg-gray-50/50 dark:bg-black/40">
                                {Object.keys(results).length > 0 ? (
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 h-full">
                                        {/* EDITOR */}
                                        <div className="space-y-4">
                                            <div className="bg-white dark:bg-[#1C1C1E] p-4 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
                                                <div className="flex justify-between mb-2">
                                                    <label className="text-xs font-bold text-gray-400 uppercase">Hook</label>
                                                    <span className="text-xs text-blue-500 cursor-pointer">Regenerate</span>
                                                </div>
                                                <textarea
                                                    className="w-full bg-transparent border-none focus:ring-0 p-0 font-bold text-lg resize-none"
                                                    rows={2}
                                                    value={results[activePreview]?.hook || ''}
                                                    onChange={(e) => setResults({
                                                        ...results,
                                                        [activePreview]: { ...results[activePreview], hook: e.target.value }
                                                    })}
                                                />
                                            </div>

                                            <div className="bg-white dark:bg-[#1C1C1E] p-4 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
                                                <div className="flex justify-between mb-2">
                                                    <label className="text-xs font-bold text-gray-400 uppercase">Caption</label>
                                                    <span className="text-xs text-gray-400">{results[activePreview]?.caption.length || 0} chars</span>
                                                </div>
                                                <textarea
                                                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm leading-relaxed resize-none h-48"
                                                    value={results[activePreview]?.caption || ''}
                                                    onChange={(e) => setResults({
                                                        ...results,
                                                        [activePreview]: { ...results[activePreview], caption: e.target.value }
                                                    })}
                                                />
                                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
                                                    <input
                                                        className="w-full bg-transparent border-none text-blue-500 text-sm font-medium"
                                                        value={results[activePreview]?.hashtags || ''}
                                                        onChange={(e) => setResults({
                                                            ...results,
                                                            [activePreview]: { ...results[activePreview], hashtags: e.target.value }
                                                        })}
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handlePost(activePreview)}
                                                className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                            >
                                                <Send size={16} /> Post to {platforms.find(p => p.id === activePreview)?.name}
                                            </button>
                                        </div>

                                        {/* PREVIEW */}
                                        <div className="flex items-center justify-center bg-gray-200 dark:bg-black/20 rounded-2xl p-4 border border-dashed border-gray-300 dark:border-white/10">
                                            <PlatformPreview platform={activePreview} content={results[activePreview]} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4 opacity-60">
                                        <Wand2 size={48} />
                                        <p className="text-sm font-bold">Generated content will appear here</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'calendar' && <ContentCalendar />}
            {activeTab === 'history' && <PostHistory />}
        </div>
    );
};
