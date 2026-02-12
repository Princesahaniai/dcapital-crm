import React from 'react';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';

interface PlatformPreviewProps {
    platform: string;
    content: any;
}

export const PlatformPreview = ({ platform, content }: PlatformPreviewProps) => {
    if (!content) return null;

    const renderInstagram = () => (
        <div className="bg-white text-black border border-gray-200 rounded-3xl overflow-hidden max-w-[320px] mx-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 p-[2px]">
                        <div className="w-full h-full rounded-full bg-gray-200 overflow-hidden">
                            <img src="https://ui-avatars.com/api/?name=D+Capital&background=000&color=fff" alt="Profile" className="w-full h-full object-cover" />
                        </div>
                    </div>
                    <span className="text-xs font-bold">dcapital_realestate</span>
                </div>
                <div className="text-xl">...</div>
            </div>

            {/* Image Placeholder */}
            <div className="aspect-square bg-gray-100 flex items-center justify-center relative group">
                {content.visualDirection ? (
                    <p className="text-center text-xs text-gray-400 px-8">{content.visualDirection}</p>
                ) : (
                    <div className="text-gray-300">Image Placeholder</div>
                )}
                <div className="absolute bottom-4 right-4 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-md">
                    1/5
                </div>
            </div>

            {/* Actions */}
            <div className="p-3">
                <div className="flex justify-between mb-2">
                    <div className="flex gap-4">
                        <Heart size={20} />
                        <MessageCircle size={20} />
                        <Share2 size={20} />
                    </div>
                    <Bookmark size={20} />
                </div>
                <p className="text-sm font-bold mb-1">1,245 likes</p>
                <div className="text-sm">
                    <span className="font-bold mr-2">dcapital_realestate</span>
                    {content.caption && (
                        <span>
                            {content.caption.substring(0, 100)}... <span className="text-gray-400">more</span>
                        </span>
                    )}
                </div>
                <div className="text-blue-500 text-xs mt-2">{content.hashtags}</div>
            </div>
        </div>
    );

    const renderTikTok = () => (
        <div className="bg-black text-white border border-gray-800 rounded-3xl overflow-hidden max-w-[300px] mx-auto shadow-2xl h-[550px] relative">
            {/* Overlay UI */}
            <div className="absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-b from-black/20 to-black/60 z-10">
                <div className="flex justify-center pt-2">
                    <span className="text-xs font-bold opacity-80">Following | For You</span>
                </div>
                <div className="flex items-end justify-between">
                    <div className="flex-1 pr-12 pb-4">
                        <p className="font-bold text-shadow mb-2">@dcapital_dubai</p>
                        <p className="text-sm text-shadow leading-tight mb-2">{content.hook}</p>
                        <p className="text-xs opacity-80 mb-2">{content.hashtags}</p>
                        <div className="flex items-center gap-2 text-xs">
                            <div className="w-4 h-4 rounded-full bg-gray-200/20 animate-spin" />
                            <span>Original Sound - D-Capital</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 items-center pb-4">
                        <div className="w-10 h-10 rounded-full bg-white border border-white p-[1px] mb-2">
                            <img src="https://ui-avatars.com/api/?name=D+C&background=000&color=fff" className="w-full h-full rounded-full" />
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <Heart size={24} className="fill-white" />
                            <span className="text-xs font-bold">12.5k</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <MessageCircle size={24} />
                            <span className="text-xs font-bold">482</span>
                        </div>
                        <Share2 size={24} />
                        <div className="w-8 h-8 rounded-full bg-gray-800/80 p-2 animate-spin-slow mt-4">
                            <div className="w-full h-full bg-black rounded-full" />
                        </div>
                    </div>
                </div>
            </div>
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <p className="text-center text-xs text-gray-500 px-8 w-2/3">{content.visualDirection}</p>
            </div>
        </div>
    );

    const renderCommon = () => (
        <div className="bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-white/10 rounded-xl p-4 max-w-md mx-auto shadow-lg">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                    <img src="https://ui-avatars.com/api/?name=D+Capital" className="w-full h-full" />
                </div>
                <div>
                    <p className="font-bold text-sm text-gray-900 dark:text-white">D-Capital Real Estate</p>
                    <p className="text-xs text-text-gray-500">Just now</p>
                </div>
            </div>
            <p className="text-sm text-gray-800 dark:text-gray-200 mb-3 whitespace-pre-wrap">{content.caption || content.hook}</p>
            {content.visualDirection && (
                <div className="bg-gray-100 dark:bg-black/20 rounded-lg aspect-video flex items-center justify-center text-xs text-gray-400 mb-3">
                    {content.visualDirection}
                </div>
            )}
            <div className="flex items-center justify-between text-gray-500 gap-4 pt-2 border-t border-gray-100 dark:border-white/5">
                <span className="flex items-center gap-1 text-xs"><Heart size={16} /> Like</span>
                <span className="flex items-center gap-1 text-xs"><MessageCircle size={16} /> Comment</span>
                <span className="flex items-center gap-1 text-xs"><Share2 size={16} /> Share</span>
            </div>
        </div>
    );

    switch (platform) {
        case 'instagram': return renderInstagram();
        case 'tiktok': return renderTikTok();
        default: return renderCommon();
    }
};
