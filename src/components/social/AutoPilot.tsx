import React, { useState } from 'react';
import { Newspaper, Wand2, Sparkles, Image as ImageIcon, Send, AlertTriangle, Play, RefreshCw, CheckCircle } from 'lucide-react';
import { fetchRealEstateNews, NewsArticle } from '../../services/news/newsService';
import { generateSocialContent } from '../../services/socialAI';
import { searchStockImages } from '../../services/images/imageService';
import { CanvasGenerator } from './CanvasGenerator';
import toast from 'react-hot-toast';

export const AutoPilot = () => {
    const [step, setStep] = useState<number>(0);
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [selectedNews, setSelectedNews] = useState<NewsArticle | null>(null);
    const [generatedContent, setGeneratedContent] = useState<any>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [finalDesign, setFinalDesign] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // STEP 1: FETCH NEWS
    const handleFetchNews = async () => {
        setLoading(true);
        setError(null);
        try {
            const articles = await fetchRealEstateNews();
            if (articles.length === 0) throw new Error("No recent news found.");
            setNews(articles);
            setStep(1);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    // STEP 2: SELECT TOPIC & GENERATE CONTENT
    const handleSelectNews = async (article: NewsArticle) => {
        setSelectedNews(article);
        setLoading(true);
        try {
            // Using existing Gemini Service
            const content = await generateSocialContent({
                topic: article.title,
                bullets: article.description,
                platform: 'instagram'
            });
            setGeneratedContent(content);
            setStep(2);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    // STEP 3: GENERATE IMAGE (MOCKED FOR DEMO IF KEY MISSING)
    const handleGenerateImage = async () => {
        setLoading(true);
        try {
            // Try Pexels first, fall back to News Image if available
            let imageUrl = selectedNews?.urlToImage;

            try {
                const images = await searchStockImages(generatedContent.visualDirection || 'luxury dubai real estate');
                if (images.length > 0) imageUrl = images[0];
            } catch (e) {
                console.warn("Pexels failed, using news image");
            }

            if (!imageUrl) throw new Error("No suitable image found.");

            // Bypass CORS for demo by using a proxy or just accepting it might fail on local canvas without proxy
            // For this demo, we use the news image or pexels directly.
            setGeneratedImage(imageUrl);
            setStep(3); // Triggers CanvasGenerator
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* PROGRESS BAR */}
            <div className="flex justify-between max-w-2xl mx-auto mb-8 relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 dark:bg-white/10 -z-10" />
                {['Fetch News', 'Select Topic', 'Generate Design', 'Publish'].map((label, i) => (
                    <div key={i} className={`flex flex-col items-center gap-2 bg-white dark:bg-[#1C1C1E] px-2 ${i <= step ? 'text-blue-500' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${i < step ? 'bg-blue-500 border-blue-500 text-white' :
                                i === step ? 'border-blue-500 text-blue-500' : 'border-gray-200 dark:border-white/10'
                            }`}>
                            {i < step ? <CheckCircle size={16} /> : i + 1}
                        </div>
                        <span className="text-xs font-bold uppercase">{label}</span>
                    </div>
                ))}
            </div>

            {error && (
                <div className="bg-red-50 text-red-500 p-4 rounded-xl flex items-center gap-3">
                    <AlertTriangle />
                    <p className="font-bold">{error}</p>
                    <button onClick={() => setError(null)} className="ml-auto text-sm underline">Dismiss</button>
                </div>
            )}

            {/* STEP 0: START */}
            {step === 0 && (
                <div className="text-center py-20 bg-white dark:bg-[#1C1C1E] rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
                    <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
                        <Newspaper size={40} />
                    </div>
                    <h2 className="text-3xl font-black mb-4">Daily News Auto-Pilot</h2>
                    <p className="text-gray-500 max-w-md mx-auto mb-8">
                        Automatically fetch the latest Dubai real estate news, identifying trending topics to generate viral social content.
                    </p>
                    <button
                        onClick={handleFetchNews}
                        disabled={loading}
                        className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2 mx-auto"
                    >
                        {loading ? <RefreshCw className="animate-spin" /> : <Play fill="currentColor" />}
                        {loading ? 'Scanning News...' : 'Start Auto-Pilot'}
                    </button>
                </div>
            )}

            {/* STEP 1: NEWS SELECTION */}
            {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {news.map((item, idx) => (
                        <div key={idx} className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden border border-gray-100 dark:border-white/5 hover:border-blue-500 transition-all cursor-pointer group" onClick={() => handleSelectNews(item)}>
                            <div className="h-48 overflow-hidden relative">
                                <img src={item.urlToImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute top-2 left-2 bg-black/50 backdrop-blur px-2 py-1 rounded text-xs font-bold text-white">
                                    {item.source.name}
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="font-bold text-lg mb-2 line-clamp-2">{item.title}</h3>
                                <p className="text-sm text-gray-500 line-clamp-3 mb-4">{item.description}</p>
                                <div className="flex items-center text-blue-500 font-bold text-sm gap-1 group-hover:gap-2 transition-all">
                                    Select Topic <Wand2 size={14} />
                                </div>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="fixed inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                            <Sparkles className="w-16 h-16 text-blue-500 mb-4 animate-pulse" />
                            <h3 className="text-2xl font-black">Analyzing Topic with Gemini...</h3>
                            <p className="text-gray-500">Generating hooks, captions, and visual direction.</p>
                        </div>
                    )}
                </div>
            )}

            {/* STEP 2: REVIEW & GENERATE IMAGE */}
            {step === 2 && generatedContent && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-[#1C1C1E] p-8 rounded-3xl border border-gray-100 dark:border-white/5">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Wand2 className="text-purple-500" /> Generated Strategy
                        </h3>
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase">Viral Hook</label>
                                <p className="text-2xl font-black">{generatedContent.hook}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase">Caption</label>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{generatedContent.caption}</p>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {generatedContent.hashtags.split(' ').map((tag: string, i: number) => (
                                    <span key={i} className="text-blue-500 text-sm font-bold">{tag}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-white/5 rounded-3xl p-8 flex flex-col items-center justify-center text-center">
                        <ImageIcon size={64} className="text-gray-300 mb-6" />
                        <h3 className="text-2xl font-bold mb-2">Create Visuals</h3>
                        <p className="text-gray-500 mb-8 max-w-sm">
                            Generate a high-converting social media post using the selected news image or stock photography.
                        </p>
                        <button
                            onClick={handleGenerateImage}
                            disabled={loading}
                            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg flex items-center gap-2"
                        >
                            {loading ? <RefreshCw className="animate-spin" /> : <Sparkles fill="white" />}
                            {loading ? 'Designing...' : 'Auto-Design Image'}
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 3: FINAL REVIEW */}
            {step === 3 && (
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white dark:bg-[#1C1C1E] p-2 rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10">
                        {finalDesign ? (
                            <img src={finalDesign} className="w-full rounded-2xl" />
                        ) : (
                            <div className="aspect-square bg-gray-100 flex items-center justify-center rounded-2xl">
                                <RefreshCw className="animate-spin text-gray-400" size={40} />
                            </div>
                        )}

                        {/* Hidden Canvas Generator */}
                        {generatedImage && generatedContent && (
                            <CanvasGenerator
                                baseImage={generatedImage}
                                headline={generatedContent.hook}
                                subtext="READ CAPTION"
                                onGenerated={(url) => setFinalDesign(url)}
                            />
                        )}
                    </div>

                    <div className="mt-8 flex justify-center gap-4">
                        <button
                            onClick={() => {
                                setStep(0);
                                setFinalDesign(null);
                            }}
                            className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl"
                        >
                            Start Over
                        </button>
                        <button
                            onClick={() => {
                                toast.success("Scheduled for Auto-Post!");
                                setStep(0);
                            }}
                            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-xl hover:scale-105 transition-transform flex items-center gap-2"
                        >
                            <Send size={18} /> Schedule Post
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
