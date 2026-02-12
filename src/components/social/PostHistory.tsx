import React from 'react';
import { Eye, Heart, MessageCircle, MoreHorizontal } from 'lucide-react';

export const PostHistory = () => {
    const history = [
        { id: 1, topic: "Villa Launch", platform: "Instagram", date: "Oct 24", likes: 1245, comments: 45, status: "Posted" },
        { id: 2, topic: "Market Analysis", platform: "LinkedIn", date: "Oct 23", likes: 850, comments: 124, status: "Posted" },
        { id: 3, topic: "Team Event", platform: "TikTok", date: "Oct 22", likes: 12500, comments: 432, status: "Viral" },
    ];

    return (
        <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                <h2 className="text-lg font-bold">Recent Posts</h2>
                <button className="text-xs font-bold text-blue-500 bg-blue-500/10 px-3 py-1.5 rounded-lg">Export Report</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-black/20 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Topic</th>
                            <th className="px-6 py-4">Platform</th>
                            <th className="px-6 py-4">Stats</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {history.map(post => (
                            <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4">
                                    <p className="font-bold text-sm text-gray-900 dark:text-white">{post.topic}</p>
                                    <p className="text-xs text-gray-500">{post.date}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-bold px-2 py-1 rounded bg-gray-100 dark:bg-white/10">{post.platform}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span className="flex items-center gap-1"><Heart size={12} /> {post.likes}</span>
                                        <span className="flex items-center gap-1"><MessageCircle size={12} /> {post.comments}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-xs font-black uppercase px-2 py-1 rounded-full ${post.status === 'Viral' ? 'bg-purple-500/10 text-purple-500' : 'bg-green-500/10 text-green-500'
                                        }`}>{post.status}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-gray-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <MoreHorizontal size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
