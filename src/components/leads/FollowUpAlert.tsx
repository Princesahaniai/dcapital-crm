import React from 'react';
import { Clock, Phone } from 'lucide-react';
import type { Lead } from '../../types';

interface FollowUpAlertProps {
    lead: Lead;
    compact?: boolean;
}

export const FollowUpAlert: React.FC<FollowUpAlertProps> = ({ lead, compact }) => {
    if (!lead.lastContact) return null;

    const now = Date.now();
    const hoursSince = Math.floor((now - lead.lastContact) / (1000 * 60 * 60));

    // Only show if > 48 hours for New/Contacted leads
    const urgentStatuses = ['New', 'Contacted', 'Negotiation'];
    if (!urgentStatuses.includes(lead.status)) return null;

    if (hoursSince < 48) return null;

    if (compact) {
        return (
            <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50" title={`No contact for ${hoursSince} hours`} />
        );
    }

    return (
        <div className="mt-3 flex items-center justify-between bg-red-50 dark:bg-red-900/10 p-2.5 rounded-xl border border-red-100 dark:border-red-900/20">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <Clock size={14} className="animate-pulse" />
                <span className="text-xs font-bold">No action for {hoursSince}h</span>
            </div>
            <button className="text-[10px] bg-white dark:bg-black/20 px-2 py-1 rounded-lg font-bold hover:bg-red-100 transition-colors uppercase tracking-wider text-red-500">
                Follow Up
            </button>
        </div>
    );
};
