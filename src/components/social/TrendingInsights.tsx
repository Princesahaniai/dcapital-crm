import React from 'react';
import { TrendingUp, ArrowUpRight } from 'lucide-react';

export const TrendingInsights = () => {
    const trends = [
        { tag: "#DubaiRealEstate", growth: "+15%", volume: "2.4M" },
        { tag: "#LuxuryLiving", growth: "+8%", volume: "1.1M" },
        { tag: "#PalmJumeirah", growth: "+22%", volume: "850K" },
        { tag: "#Investment", growth: "+5%", volume: "5.6M" },
    ];

    return (
        <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />

            <div className="flex items-center justify-between mb-6 relative z-10">
                <h2 className="font-bold flex items-center gap-2">
                    <TrendingUp size={20} /> Trending Now
                </h2>
                <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-lg">Live</span>
            </div>

            <div className="space-y-4 relative z-10">
                {trends.map(t => (
                    <div key={t.tag} className="flex items-center justify-between group cursor-pointer">
                        <div>
                            <p className="font-bold text-sm group-hover:underline">{t.tag}</p>
                            <p className="text-[10px] opacity-70">{t.volume} posts</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold bg-green-400/20 text-green-300 px-2 py-1 rounded">
                            {t.growth} <ArrowUpRight size={12} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 relative z-10">
                <p className="text-xs opacity-70 italic">
                    "Video content featuring property tours is trending up 40% this week."
                </p>
            </div>
        </div>
    );
};
