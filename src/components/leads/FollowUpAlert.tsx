import React from 'react';
import type { Lead } from '../../types';

interface FollowUpAlertProps {
    lead: Lead;
    compact?: boolean;
}

export const FollowUpAlert: React.FC<FollowUpAlertProps> = ({ lead, compact }) => {
    const now = Date.now();
    // Check lastContact OR updatedAt — whichever is more recent
    const lastActivity = Math.max(lead.lastContact || 0, lead.updatedAt || 0, lead.createdAt || 0);
    const hoursSince = Math.floor((now - lastActivity) / (1000 * 60 * 60));

    // Only show for active pipeline stages (not terminal states)
    const urgentStatuses = ['New', 'Contacted', 'Viewing', 'Negotiation', 'Qualified'];
    if (!urgentStatuses.includes(lead.status)) return null;

    // Only warn after 48 hours of inactivity
    if (hoursSince < 48) return null;

    if (compact) {
        // Tiny pulse dot on the avatar (used in LeadCard)
        return (
            <div
                className="absolute top-2 right-2 w-3 h-3 bg-amber-500 rounded-full animate-pulse shadow-lg shadow-amber-500/50"
                title={`⚠️ No activity for ${hoursSince}h`}
            />
        );
    }

    // Non-compact: just the ⚠️ icon inline — no bulky block
    return (
        <span
            title={`⚠️ No activity for ${hoursSince}h — follow up needed`}
            className="inline-flex items-center text-amber-500 text-[13px] ml-1 cursor-help"
        >
            ⚠️
        </span>
    );
};
