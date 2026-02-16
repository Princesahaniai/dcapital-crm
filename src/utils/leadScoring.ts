import type { Lead } from '../types';

export const calculateLeadScore = (lead: Lead): { score: number; label: string; color: string } => {
    let score = 0;

    // 1. Budget Score (Max 30)
    if (lead.budget) {
        if (lead.budget > 10000000) score += 30; // > 10M
        else if (lead.budget > 5000000) score += 20; // > 5M
        else if (lead.budget > 2000000) score += 10; // > 2M
        else score += 5;
    }

    // 2. Engagement Score (Max 25)
    // Assuming we track interactions using a heuristic if not explicit fields
    const hasEmail = lead.email ? 5 : 0;
    const hasPhone = lead.phone ? 5 : 0;
    score += hasEmail + hasPhone;

    // Status Score (Max 25)
    switch (lead.status) {
        case 'Negotiation': score += 25; break;
        case 'Viewing': score += 20; break;
        case 'Qualified': score += 15; break;
        case 'Contacted': score += 10; break;
        case 'New': score += 5; break;
        default: break;
    }

    // Source Score (Max 20)
    const highValueSources = ['Referral', 'Website', 'Direct'];
    if (lead.source && highValueSources.includes(lead.source)) {
        score += 20;
    } else {
        score += 10;
    }

    // Normalize
    score = Math.min(score, 100);

    let label = '❄️ COLD';
    let color = 'text-blue-500 bg-blue-50 border-blue-200';

    if (score >= 80) {
        label = '🔥 HOT';
        color = 'text-red-500 bg-red-50 border-red-200';
    } else if (score >= 50) {
        label = '🌡️ WARM';
        color = 'text-orange-500 bg-orange-50 border-orange-200';
    }

    return { score, label, color };
};
