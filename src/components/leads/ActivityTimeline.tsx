import React from 'react';
import { Clock, Phone, Mail, MessageCircle, FileText, ArrowRight, CheckCircle } from 'lucide-react';
import type { Activity } from '../../types';

interface ActivityTimelineProps {
    activities: Activity[];
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ activities }) => {
    if (!activities || activities.length === 0) {
        return (
            <div className="text-center py-10 text-gray-400">
                <Clock size={32} className="mx-auto mb-3 opacity-20" />
                <p>No activity recorded yet.</p>
            </div>
        );
    }

    // Sort by newest first
    const sortedActivities = [...activities].sort((a, b) => b.timestamp - a.timestamp);

    const getIcon = (details: string) => {
        if (details.includes('Call')) return <Phone size={14} className="text-blue-500" />;
        if (details.includes('Email')) return <Mail size={14} className="text-amber-500" />;
        if (details.includes('WhatsApp')) return <MessageCircle size={14} className="text-green-500" />;
        if (details.includes('Stage')) return <ArrowRight size={14} className="text-purple-500" />;
        if (details.includes('Task')) return <CheckCircle size={14} className="text-teal-500" />;
        return <FileText size={14} className="text-gray-500" />;
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6 relative ml-2">
            {/* Vertical Line */}
            <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-gray-100 dark:bg-white/5" />

            {sortedActivities.map(activity => (
                <div key={activity.id} className="relative flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 flex items-center justify-center z-10 shadow-sm">
                        {getIcon(activity.description)}
                    </div>
                    <div className="flex-1 bg-gray-50 dark:bg-white/5 p-3 rounded-2xl border border-gray-100 dark:border-white/5">
                        <div className="flex justify-between items-start mb-1">
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{activity.userName || 'System'}</p>
                            <span className="text-[10px] text-gray-400 font-mono">{formatDate(activity.timestamp)}</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300">{activity.description}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};
