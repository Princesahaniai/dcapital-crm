import React from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Battery, Wifi, Signal } from 'lucide-react';

interface PlatformPreviewProps {
    platform: string;
    content: any;
}

export const PlatformPreview = ({ platform, content }: PlatformPreviewProps) => {
    if (!content) return null;

    const renderInstagram = () => (
        <div className="bg-white text-black border-[8px] border-black rounded-[2.5rem] overflow-hidden w-[320px] mx-auto shadow-2xl relative">
            {/* Status Bar */}
            <div className="flex justify-between items-center px-6 py-3 text-[10px] font-bold">
                <span>9:41</span>
                <div className="flex gap-1">
                    <Signal size={12} className="fill-black" />
                    <Wifi size={12} />
                    <Battery size={12} className="fill-black" />
                </div>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 p-[2px]">
                        <div className="w-full h-full rounded-full bg-gray-200 overflow-hidden">
                            <img src="https://ui-avatars.com/api/?name=D+Capital&background=000&color=fff" alt="Profile" className="w-full h-full object-cover" />
                        </div>
                    </div>
                    <span className="text-sm font-bold">dcapital_realestate</span>
                </div>
                <div className="text-xl font-bold">...</div>
            </div>

            {/* Image Placeholder */}
            <div className="aspect-[4/5] bg-gray-100 flex items-center justify-center relative group">
                {content.visualDirection ? (
                    <p className="text-center text-xs text-gray-500 px-8 leading-relaxed">
                        <span className="font-bold block mb-2 text-gray-400 uppercase tracking-wider">Visual Direction</span>
                        {content.visualDirection}
                    </p>
                ) : (
                    <div className="text-gray-300">Image Placeholder</div>
                )}
                <div className="absolute top-4 right-4 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-md">
                    1/5
                </div>
            </div>

            {/* Actions */}
            <div className="p-3">
                <div className="flex justify-between mb-2">
                    <div className="flex gap-4">
                        <Heart size={24} />
                        <MessageCircle size={24} />
                        <Share2 size={24} />
                    </div>
                    <Bookmark size={24} />
                </div>
                <p className="text-sm font-bold mb-1">1,245 likes</p>
                <div className="text-sm">
                    <span className="font-bold mr-2">dcapital</span>
                    <span className="whitespace-pre-wrap">{content.caption?.substring(0, 80)}... <span className="text-gray-400">more</span></span>
                </div>
            </div>
        </div>
    );

    const renderTikTok = () => (
        <div className="bg-black text-white border-[8px] border-gray-800 rounded-[2.5rem] overflow-hidden w-[300px] mx-auto shadow-2xl h-[580px] relative">
            {/* Status Bar */}
            <div className="flex justify-between items-center px-6 py-3 text-[10px] font-bold absolute top-0 w-full z-20">
                <span>9:41</span>
                <div className="flex gap-1">
                    <Signal size={12} />
                    <Wifi size={12} />
                    <Battery size={12} />
                </div>
            </div>

            {/* Overlay UI */}
            <div className="absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-b from-black/20 via-transparent to-black/80 z-10">
                <div className="flex justify-center pt-8">
                    <span className="text-sm font-bold opacity-80 border-b-2 border-white pb-1">For You</span>
                </div>

                <div className="flex items-end justify-between mb-4">
                    <div className="flex-1 pr-12">
                        <p className="font-bold text-shadow mb-2 text-sm">@dcapital_dubai</p>
                        <p className="text-sm text-shadow leading-tight mb-2 whitespace-pre-wrap">{content.hook}</p>
                        <p className="text-xs font-bold text-shadow mb-2">{content.hashtags}</p>
                        <div className="flex items-center gap-2 text-xs opacity-80 bg-white/20 px-2 py-1 rounded-full w-fit">
                            <div className="w-3 h-3 rounded-full bg-gray-200/20" />
                            <span>Original Sound - D-Capital Luxury</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-5 items-center">
                        <div className="w-10 h-10 rounded-full bg-white border border-white p-[1px] mb-2 relative">
                            <img src="https://ui-avatars.com/api/?name=D+C&background=000&color=fff" className="w-full h-full rounded-full" />
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold">+</div>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <Heart size={28} className="fill-white" />
                            <span className="text-xs font-bold">12.5k</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <MessageCircle size={28} className="fill-white/10" />
                            <span className="text-xs font-bold">482</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <Share2 size={28} className="fill-white/10" />
                            <span className="text-xs font-bold">Share</span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gray-800/80 p-2 animate-spin-slow mt-2 border-4 border-gray-800">
                            <div className="w-full h-full bg-black rounded-full" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Visual Direction Placeholder */}
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <p className="text-center text-xs text-gray-400 px-8 w-2/3 leading-relaxed">
                    <span className="block font-bold mb-2 text-white">Visual Concept</span>
                    {content.visualDirection}
                </p>
            </div>
        </div>
    );

    const renderCommon = () => (
        <div className="bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-white/10 rounded-xl p-6 max-w-sm mx-auto shadow-lg">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                    <img src="https://ui-avatars.com/api/?name=D+Capital" className="w-full h-full" />
                </div>
                <div>
                    <p className="font-bold text-sm text-gray-900 dark:text-white">D-Capital Real Estate</p>
                    <p className="text-xs text-gray-500">Just now</p>
                </div>
            </div>
            <p className="text-sm text-gray-800 dark:text-gray-200 mb-4 whitespace-pre-wrap leading-relaxed">{content.caption || content.hook}</p>
            {content.visualDirection && (
                <div className="bg-gray-100 dark:bg-black/20 rounded-lg aspect-video flex items-center justify-center text-xs text-gray-500 p-4 text-center mb-4">
                    {content.visualDirection}
                </div>
            )}
            <div className="flex items-center justify-between text-gray-500 gap-4 pt-4 border-t border-gray-100 dark:border-white/5">
                <span className="flex items-center gap-1 text-xs font-bold"><Heart size={16} /> Like</span>
                <span className="flex items-center gap-1 text-xs font-bold"><MessageCircle size={16} /> Comment</span>
                <span className="flex items-center gap-1 text-xs font-bold"><Share2 size={16} /> Share</span>
            </div>
        </div>
    );

    switch (platform) {
        case 'instagram': return renderInstagram();
        case 'tiktok': return renderTikTok();
        default: return renderCommon();
    }
};
