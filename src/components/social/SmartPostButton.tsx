import React from 'react';
import { Send, Check, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

interface SmartPostButtonProps {
    platform: string;
    content: string;
    onPosted: () => void;
}

export const SmartPostButton = ({ platform, content, onPosted }: SmartPostButtonProps) => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    const handlePost = () => {
        // 1. Copy to clipboard
        navigator.clipboard.writeText(content);
        toast.success(`Caption copied! Opening ${platform}...`);

        // 2. Determine URL
        let url = '';
        switch (platform.toLowerCase()) {
            case 'instagram':
                url = isMobile ? 'instagram://camera' : 'https://www.instagram.com/create/select/';
                break;
            case 'tiktok':
                url = isMobile ? 'tiktok://capture' : 'https://www.tiktok.com/upload';
                break;
            case 'facebook':
                url = 'https://www.facebook.com/composer/';
                break;
            case 'linkedin':
                url = 'https://www.linkedin.com/post/new/';
                break;
            case 'twitter':
                url = 'https://twitter.com/compose/tweet';
                break;
            case 'youtube':
                url = 'https://studio.youtube.com/';
                break;
            default:
                url = '';
        }

        if (url) {
            window.open(url, '_blank');
        }

        // 3. Manual Confirmation Timeout
        setTimeout(() => {
            const confirmed = window.confirm(`Did you successfully post to ${platform}?`);
            if (confirmed) {
                onPosted();
                toast.success("Marked as posted!");
            }
        }, 60000); // Check after 60 seconds
    };

    return (
        <button
            onClick={handlePost}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
            <Send size={18} /> Post to {platform}
        </button>
    );
};
