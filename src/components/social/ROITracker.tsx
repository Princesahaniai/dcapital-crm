import React, { useEffect, useState } from 'react';
import { BarChart, Activity, Users, DollarSign, ArrowUpRight } from 'lucide-react';
import { getAnalyticsSummary, AnalyticsSummary } from '../../services/antigravity/analytics';

export const ROITracker = () => {
    const [data, setData] = useState<AnalyticsSummary | null>(null);

    useEffect(() => {
        getAnalyticsSummary().then(setData);
    }, []);

    if (!data) return <div className="p-8 text-center text-gray-400">Loading Analytics...</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total Reach"
                    value={data.total_reach.toLocaleString()}
                    trend="+12%"
                    icon={Activity}
                    color="blue"
                />
                <StatCard
                    label="Engagement Rate"
                    value={`${data.engagement_rate}%`}
                    trend="+0.8%"
                    icon={Users}
                    color="purple"
                />
                <StatCard
                    label="Leads Generated"
                    value={data.leads_generated.toString()}
                    trend="+5"
                    icon={Users}
                    color="green"
                />
                <StatCard
                    label="Estimated ROI"
                    value="$450k"
                    trend="High"
                    icon={DollarSign}
                    color="amber"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-xl border border-gray-100 dark:border-white/5">
                    <h3 className="font-bold text-gray-500 uppercase text-xs mb-6">Platform Performance</h3>
                    <div className="space-y-4">
                        {data.platform_breakdown.map((p: any) => (
                            <div key={p.platform}>
                                <div className="flex justify-between text-sm font-bold mb-1">
                                    <span className="capitalize">{p.platform}</span>
                                    <span>{(p.reach / 1000).toFixed(1)}k Reach</span>
                                </div>
                                <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full"
                                        style={{ width: `${(p.reach / data.total_reach) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-xl border border-gray-100 dark:border-white/5">
                    <h3 className="font-bold text-gray-500 uppercase text-xs mb-6">Recent Top Posts</h3>
                    <div className="space-y-4">
                        {data.recent_posts.map((post: any) => (
                            <div key={post.id} className="flex gap-4 items-center">
                                <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                                    <img src={post.thumbnail} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-sm capitalize">{post.platform} • {post.date}</p>
                                    <p className="text-xs text-gray-500">{post.views.toLocaleString()} views</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-green-500 text-sm">+{post.likes}</p>
                                    <p className="text-xs text-gray-400">Likes</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ label, value, trend, icon: Icon, color }: any) => {
    const colors: any = {
        blue: 'bg-blue-50 text-blue-600',
        purple: 'bg-purple-50 text-purple-600',
        green: 'bg-green-50 text-green-600',
        amber: 'bg-amber-50 text-amber-600',
    };

    return (
        <div className="bg-white dark:bg-[#1C1C1E] p-4 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
            <div className="flex items-start justify-between mb-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
                    <Icon size={20} />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold bg-green-50 text-green-600 px-2 py-1 rounded-full">
                    <ArrowUpRight size={10} /> {trend}
                </div>
            </div>
            <p className="text-2xl font-black">{value}</p>
            <p className="text-xs font-bold text-gray-400 uppercase">{label}</p>
        </div>
    );
};
