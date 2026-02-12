import React from 'react';
import { Calendar as CalendarIcon, MoreHorizontal } from 'lucide-react';

export const ContentCalendar = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const mockSchedule = [
        { day: 0, title: "New Launch Teaser", platform: "instagram", status: "scheduled" },
        { day: 2, title: "Market Update", platform: "linkedin", status: "posted" },
        { day: 4, title: "Open House", platform: "facebook", status: "draft" },
    ];

    return (
        <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-white/5 p-4 md:p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <CalendarIcon size={20} className="text-blue-500" /> Content Calendar
                </h2>
                <button className="text-xs font-bold text-gray-500 hover:text-blue-500">View Full Month</button>
            </div>

            <div className="grid grid-cols-7 gap-2">
                {days.map((d, i) => (
                    <div key={d} className="flex flex-col gap-2">
                        <div className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider">{d}</div>
                        <div className="h-32 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-100 dark:border-white/5 p-2 transition-colors hover:border-blue-500/30">
                            {mockSchedule.filter(s => s.day === i).map((item, idx) => (
                                <div key={idx} className={`p-2 rounded-lg text-[10px] font-bold mb-2 border-l-2 truncate cursor-pointer hover:opacity-80 ${item.status === 'posted' ? 'bg-green-500/10 text-green-500 border-green-500' :
                                        item.status === 'scheduled' ? 'bg-amber-500/10 text-amber-500 border-amber-500' :
                                            'bg-gray-200 dark:bg-white/10 text-gray-500 border-gray-400'
                                    }`}>
                                    {item.title}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
