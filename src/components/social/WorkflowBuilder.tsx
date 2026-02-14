import React, { useState } from 'react';
import { Zap, Clock, TrendingUp, Users, Play, Pause, ChevronRight } from 'lucide-react';

const WORKFLOWS = [
    {
        id: 'new_listing',
        title: 'New Property Launch',
        description: 'Auto-posts to all platforms when inventory is added.',
        icon: Zap,
        steps: ['Draft Gemini content', 'Post to IG/TikTok', 'Schedule follow-up (Day 3)'],
        active: true,
        stats: '24 runs this month'
    },
    {
        id: 'sold_story',
        title: 'Sold Story Automation',
        description: 'Triggers when status changes to "Sold".',
        icon: TrendingUp,
        steps: ['Request testimonial', 'Create "Just Sold" graphic', 'Post to LinkedIn'],
        active: false,
        stats: 'Paused'
    },
    {
        id: 'market_update',
        title: 'Weekly Market Report',
        description: 'Every Monday 9AM market analysis.',
        icon: Clock,
        steps: ['Fetch Dubai Land Dept data', 'Generate chart', 'Post to Twitter/LinkedIn'],
        active: true,
        stats: 'Next run: Mon 9am'
    },
    {
        id: 'lead_nurture',
        title: 'Social Lead Nurture',
        description: 'DM sequence for new followers.',
        icon: Users,
        steps: ['Welcome DM', 'Value share (Day 2)', 'Call to Action (Day 5)'],
        active: false,
        stats: 'Experimental'
    }
];

export const WorkflowBuilder = () => {
    return (
        <div className="space-y-4">
            {WORKFLOWS.map(wf => (
                <div key={wf.id} className="bg-white dark:bg-[#1C1C1E] p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm group hover:border-blue-500/30 transition-all cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${wf.active ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'bg-gray-100 dark:bg-white/5 text-gray-400'
                                }`}>
                                <wf.icon size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{wf.title}</h3>
                                <p className="text-sm text-gray-500">{wf.description}</p>
                            </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 ${wf.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                            {wf.active ? 'Active' : 'Paused'}
                        </div>
                    </div>

                    <div className="pl-16 space-y-2">
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                            {wf.steps.map((step, i) => (
                                <React.Fragment key={i}>
                                    <span className="bg-gray-50 dark:bg-white/5 px-2 py-1 rounded border border-gray-200 dark:border-white/5">
                                        {step}
                                    </span>
                                    {i < wf.steps.length - 1 && <ChevronRight size={12} />}
                                </React.Fragment>
                            ))}
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
                            <span className="text-xs font-bold text-gray-400">{wf.stats}</span>
                            <button className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${wf.active
                                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                    : 'bg-green-50 text-green-600 hover:bg-green-100'
                                }`}>
                                {wf.active ? <Pause size={14} /> : <Play size={14} />}
                                {wf.active ? 'Pause Workflow' : 'Activate Workflow'}
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
