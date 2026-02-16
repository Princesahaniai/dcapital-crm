import { useMemo } from 'react';
import type { Lead } from '../types';
import { useStore } from '../store';

export const useLeadScore = (lead: Lead) => {
    const { activities } = useStore();

    const score = useMemo(() => {
        let points = 0;

        // 1. Status Weight (Max 30)
        switch (lead.status) {
            case 'Closed': return 100; // Automatic win
            case 'Lost': return 0; // Automatic loss
            case 'Negotiation': points += 30; break;
            case 'Viewing': points += 25; break;
            case 'Qualified': points += 20; break;
            case 'Contacted': points += 10; break;
            case 'New': points += 5; break;
            default: break;
        }

        // 2. Profile Completeness (Max 30)
        if (lead.email) points += 10;
        if (lead.phone) points += 10;
        if (lead.budget && lead.budget > 0) points += 10;

        // 3. Engagement / Activity (Max 40)
        const leadActivities = activities.filter(a => a.leadId === lead.id);
        const activityCount = leadActivities.length;

        // Cap activity points at 40 (e.g., 4 points per activity)
        points += Math.min(activityCount * 4, 40);

        // 4. Source Bonus (Max 10 - Optional, can push over 100 but grounded at 100)
        if (lead.source === 'Referral' || lead.source === 'Partner') points += 10;
        if (lead.source === 'Website') points += 5;

        return Math.min(points, 100);
    }, [lead, activities]);

    const getScoreColor = (s: number) => {
        if (s >= 80) return 'text-green-500';
        if (s >= 50) return 'text-amber-500';
        return 'text-red-500';
    };

    const getScoreGradient = (s: number) => {
        if (s >= 80) return 'from-green-500 to-emerald-600';
        if (s >= 50) return 'from-amber-500 to-orange-600';
        return 'from-red-500 to-pink-600';
    };

    return { score, getScoreColor, getScoreGradient };
};
