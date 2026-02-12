import React from 'react';
import { useStore } from '../../store';
import { ActivityTimeline } from '../leads/ActivityTimeline'; // Reuse the component

export const RecentActivityWidget = () => {
    const { activities } = useStore();

    // Get latest 5 activities
    const latestActivities = [...activities]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5);

    return (
        <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 border border-gray-100 dark:border-white/5 h-full">
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6">LIVE INTEL</h3>
            <div className="-ml-2">
                <ActivityTimeline activities={latestActivities} />
            </div>
            <button className="w-full mt-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                VIEW ALL INTEL
            </button>
        </div>
    );
};
