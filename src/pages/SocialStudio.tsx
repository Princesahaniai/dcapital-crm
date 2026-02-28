import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Copy, Image as ImageIcon, AlignLeft, Target, Play, Plus, UploadCloud, X } from 'lucide-react';
import { Header } from '../components/Header';
import toast from 'react-hot-toast';
import { useStore } from '../store';
import { db } from '../firebaseConfig';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };

export const SocialStudio = () => {
    const [activeTab, setActiveTab] = useState<'vault' | 'captions' | 'campaigns'>('vault');

    // Caption Generator State
    const [propertyType, setPropertyType] = useState('');
    const [location, setLocation] = useState('');
    const [features, setFeatures] = useState('');
    const [generatedResults, setGeneratedResults] = useState<{ type: string, content: string }[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Caption copied to clipboard!');
    };



    const { user } = useStore();
    const isAdmin = user?.role === 'ceo' || user?.role === 'admin';

    // Firestore States
    const [assets, setAssets] = useState<any[]>([]);
    const [savedTemplates, setSavedTemplates] = useState<any[]>([]);
    const [showUploadPanel, setShowUploadPanel] = useState(false);
    const [newAsset, setNewAsset] = useState({ title: '', type: 'image', url: '' });

    // Stream Firestore Data
    React.useEffect(() => {
        const qAssets = query(collection(db, 'marketing_assets'), orderBy('createdAt', 'desc'));
        const unsubAssets = onSnapshot(qAssets, (snapshot) => {
            setAssets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const qTemplates = query(collection(db, 'social_templates'), orderBy('createdAt', 'desc'));
        const unsubTemplates = onSnapshot(qTemplates, (snapshot) => {
            setSavedTemplates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubAssets();
            unsubTemplates();
        };
    }, []);

    const handleUploadAsset = async () => {
        if (!newAsset.title || !newAsset.url) return toast.error('Title and URL are required');
        try {
            await addDoc(collection(db, 'marketing_assets'), {
                ...newAsset,
                createdAt: serverTimestamp(),
                uploadedBy: user?.name,
            });
            setShowUploadPanel(false);
            setNewAsset({ title: '', type: 'image', url: '' });
            toast.success('Asset uploaded to vault');
        } catch (error) {
            toast.error('Upload failed');
        }
    };

    const generateCaptions = async () => {
        if (!propertyType || !location) {
            toast.error("Please provide Property Type and Location.");
            return;
        }
        setIsGenerating(true);
        setTimeout(async () => {
            const results = [
                {
                    type: 'Instagram Short',
                    content: `Just listed: Exquisite ${propertyType} in the heart of ${location}. ${features ? features + '. ' : ''}Unmatched elegance awaits. ✨ DM for a private tour. #LuxuryRealEstate #${location.replace(/\s+/g, '')} #DubaiHomes`
                },
                {
                    type: 'Instagram Story/Reel',
                    content: `POV: You just found your dream ${propertyType} in ${location}. 🌴 Stunning views, premium finishes, and absolute luxury. ${features ? 'Featuring: ' + features + '. ' : ''}Ready to move in? 🔑 Link in bio. #${propertyType.replace(/\s+/g, '')} #DubaiLuxury`
                },
                {
                    type: 'LinkedIn Professional',
                    content: `Exceptional investment opportunity in ${location}. This premium ${propertyType} offers state-of-the-art amenities and world-class design. ${features ? 'Key highlights include: ' + features + '. ' : ''}Contact me directly for an exclusive portfolio review. 📈 #RealEstateInvestment #DubaiProperty #WealthManagement`
                },
                {
                    type: 'AI Image Prompt',
                    content: `Ultra-realistic architectural photography of a luxury ${propertyType} located in ${location}, Dubai. ${features ? 'Featuring ' + features + '. ' : ''}Sunset lighting, cinematic atmosphere, 8k resolution, shot on 35mm lens, highly detailed, premium interior design, photorealistic --v 5.2 --ar 16:9`
                }
            ];

            // Save to Firestore so the whole team can access
            try {
                await addDoc(collection(db, 'social_templates'), {
                    title: `${propertyType} in ${location}`,
                    captions: results,
                    createdAt: serverTimestamp(),
                    createdBy: user?.name
                });

                setGeneratedResults(results);
                setIsGenerating(false);
                toast.success("Marketing assets generated and saved to vault!");
            } catch (error) {
                console.error("Failed to save template to vault:", error);
                setGeneratedResults(results);
                setIsGenerating(false);
                toast.success("Generated (Local only)");
            }
        }, 1500);
    };

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4 md:space-y-6 p-4 md:p-10 pt-4 md:pt-8 h-screen w-full max-w-full overflow-y-auto overflow-x-hidden scrollbar-hide pb-24 md:pb-8">
            {/* HEADER */}
            <Header title="AI Social Studio" subtitle="Generate, manage, and deploy marketing assets" />

            {/* TABS Navigation */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-[#1C1C1E] rounded-2xl w-full md:w-auto overflow-x-auto scrollbar-hide mr-auto border border-gray-200 dark:border-white/5">
                <button
                    onClick={() => setActiveTab('vault')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'vault' ? 'bg-white dark:bg-zinc-800 text-amber-500 shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                        }`}
                >
                    <ImageIcon size={18} /> Media Vault
                </button>
                <button
                    onClick={() => setActiveTab('captions')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'captions' ? 'bg-white dark:bg-zinc-800 text-amber-500 shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                        }`}
                >
                    <AlignLeft size={18} /> Caption Generator
                </button>
                <button
                    onClick={() => setActiveTab('campaigns')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'campaigns' ? 'bg-white dark:bg-zinc-800 text-amber-500 shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                        }`}
                >
                    <Target size={18} /> Campaigns
                </button>
            </div>

            {/* TAB CONTENT */}
            <div className="mt-6">
                <AnimatePresence mode="wait">
                    {/* MEDIA VAULT */}
                    {activeTab === 'vault' && (
                        <motion.div
                            key="vault"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {/* Upload Panel (Admin Only) */}
                            {isAdmin && (
                                <div className="bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-white/5 rounded-3xl p-6 shadow-sm">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <UploadCloud size={20} className="text-amber-500" /> Asset Management
                                        </h3>
                                        <button
                                            onClick={() => setShowUploadPanel(!showUploadPanel)}
                                            className="px-4 py-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
                                        >
                                            {showUploadPanel ? <X size={16} /> : <Plus size={16} />}
                                            {showUploadPanel ? 'Close Panel' : 'Upload Asset'}
                                        </button>
                                    </div>

                                    <AnimatePresence>
                                        {showUploadPanel && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100 dark:border-white/5">
                                                    <input
                                                        type="text"
                                                        placeholder="Asset Title"
                                                        value={newAsset.title}
                                                        onChange={e => setNewAsset({ ...newAsset, title: e.target.value })}
                                                        className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-amber-500 text-gray-900 dark:text-white md:col-span-1"
                                                    />
                                                    <select
                                                        title="Asset Type"
                                                        value={newAsset.type}
                                                        onChange={e => setNewAsset({ ...newAsset, type: e.target.value })}
                                                        className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-amber-500 text-gray-900 dark:text-white md:col-span-1"
                                                    >
                                                        <option value="image">Image</option>
                                                        <option value="video">Video</option>
                                                    </select>
                                                    <input
                                                        type="url"
                                                        placeholder="Direct Image/Video URL"
                                                        value={newAsset.url}
                                                        onChange={e => setNewAsset({ ...newAsset, url: e.target.value })}
                                                        className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-amber-500 text-gray-900 dark:text-white md:col-span-1"
                                                    />
                                                    <button onClick={handleUploadAsset} className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-colors md:col-span-1">
                                                        Deploy to Vault
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

                            {/* Assets Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {assets.length === 0 && (
                                    <div className="col-span-full py-20 text-center text-zinc-500">
                                        No assets in the vault. {isAdmin ? 'Upload one above.' : 'Contact Admin to upload assets.'}
                                    </div>
                                )}
                                {assets.map((asset) => (
                                    <div key={asset.id} className="bg-zinc-900 rounded-3xl overflow-hidden border border-white/10 group flex flex-col relative">
                                        <div className="relative h-48 md:h-56 w-full overflow-hidden">
                                            {asset.type === 'video' ? (
                                                <div className="w-full h-full bg-zinc-800 flex flex-col items-center justify-center text-zinc-600">
                                                    <Play size={40} className="mb-2 opacity-50" />
                                                    <span className="text-xs font-bold uppercase tracking-widest">{asset.url.includes('youtube') ? 'YouTube' : 'Video'}</span>
                                                </div>
                                            ) : (
                                                <img
                                                    src={asset.url}
                                                    alt={asset.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                />
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-80" />
                                            {asset.type === 'video' && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 text-white shadow-lg">
                                                        <Play size={20} className="ml-1" />
                                                    </div>
                                                </div>
                                            )}
                                            <div className="absolute top-4 right-4 bg-zinc-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
                                                <Sparkles size={12} className="text-amber-500" />
                                                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Studio Pro</span>
                                            </div>
                                        </div>
                                        <div className="p-5 flex flex-col flex-1">
                                            <h3 className="text-white font-bold text-lg leading-tight mb-4 flex-1 truncate">{asset.title}</h3>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(asset.url);
                                                    toast.success('Asset URL Copied');
                                                }}
                                                className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border border-white/5 shadow-sm touch-target"
                                            >
                                                <Copy size={18} /> Copy Media URL
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* CAPTION GENERATOR */}
                    {activeTab === 'captions' && (
                        <motion.div
                            key="captions"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-3xl text-white shadow-lg shadow-amber-500/20 md:flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-black mb-1 flex items-center gap-2">
                                        <Sparkles size={24} /> Generate Magic
                                    </h2>
                                    <p className="text-white/80 text-sm font-medium max-w-md">Instantly create high-converting social media copy tailored to your property listings.</p>
                                </div>
                                <button
                                    onClick={() => setGeneratedResults([])}
                                    className="mt-4 md:mt-0 bg-white text-orange-600 px-6 py-3 rounded-xl font-bold hover:bg-orange-50 transition-all shadow-md active:scale-95 touch-target"
                                >
                                    New Prompt
                                </button>
                            </div>

                            {/* Generator Form */}
                            {generatedResults.length === 0 ? (
                                <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Property Type</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Luxury Villa, Penthouse"
                                            value={propertyType}
                                            onChange={(e) => setPropertyType(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Location</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Palm Jumeirah, Downtown Dubai"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Key Features</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Private pool, marina views, smart home"
                                            value={features}
                                            onChange={(e) => setFeatures(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                                        />
                                    </div>
                                    <button
                                        onClick={generateCaptions}
                                        disabled={isGenerating}
                                        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg active:scale-95 touch-target mt-4 disabled:opacity-50"
                                    >
                                        {isGenerating ? 'Generating...' : <><Sparkles size={20} /> Generate Assets</>}
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {generatedResults.map((result, idx) => (
                                        <div key={idx} className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm flex flex-col h-full">
                                            <span className="inline-block px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-xs font-bold w-fit mb-4">{result.type}</span>
                                            <p className="text-gray-700 dark:text-gray-300 mb-6 text-sm leading-relaxed flex-1">{result.content}</p>
                                            <button
                                                onClick={() => handleCopy(result.content)}
                                                className="w-full bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all mt-auto touch-target"
                                            >
                                                <Copy size={18} /> Copy to Clipboard
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Saved Templates Section */}
                            <div className="mt-8 pt-8 border-t border-gray-100 dark:border-white/10">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Global Caption Vault</h3>
                                {savedTemplates.length === 0 ? (
                                    <div className="text-center text-zinc-500 py-10">No templates saved to the vault yet.</div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {savedTemplates.map(template => (
                                            <div key={template.id} className="bg-gray-50 dark:bg-zinc-900 p-6 rounded-3xl border border-gray-200 dark:border-white/5 overflow-hidden">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 dark:text-white">{template.title}</h4>
                                                        <p className="text-xs text-amber-500 mt-1">By {template.createdBy || 'System'} • {template.createdAt?.toDate().toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    {template.captions?.map((cap: any, i: number) => (
                                                        <div key={i} className="bg-white dark:bg-[#1C1C1E] p-4 rounded-xl border border-gray-100 dark:border-white/5">
                                                            <div className="flex justify-between items-start gap-4">
                                                                <div>
                                                                    <span className="text-[10px] uppercase font-bold text-zinc-500 mb-1 block">{cap.type}</span>
                                                                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">{cap.content}</p>
                                                                </div>
                                                                <button onClick={() => handleCopy(cap.content)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors shrink-0">
                                                                    <Copy size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* CAMPAIGNS */}
                    {activeTab === 'campaigns' && (
                        <motion.div
                            key="campaigns"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-white dark:bg-[#1C1C1E] p-10 rounded-3xl border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center text-center space-y-4 min-h-[400px]"
                        >
                            <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center text-gray-400 dark:text-gray-500 mb-2">
                                <Target size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Active Campaigns</h3>
                            <p className="text-gray-500 max-w-sm text-sm">Campaign management features will be unlocked in the next AI update. Stay tuned!</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};
