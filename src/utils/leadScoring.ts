import type { Lead } from '../types';

const PRIME_LOCATIONS = ['jlt', 'palm jumeirah', 'downtown', 'dubai marina', 'city walk', 'business bay', 'difc', 'jumeirah', 'marina'];

export const calculateLeadScore = (lead: Lead): { score: number; grade: 'A' | 'B' | 'C'; label: string; color: string } => {
    let score = 0;

    // 1. Budget Score (Max 30)
    const budget = lead.budget || lead.maxBudget || 0;
    if (budget > 10000000) score += 30;      // > 10M
    else if (budget > 5000000) score += 25;  // > 5M
    else if (budget > 2000000) score += 20;  // > 2M
    else if (budget > 1000000) score += 12;  // > 1M
    else score += 5;

    // 2. Engagement Score (Max 10)
    score += (lead.email ? 5 : 0) + (lead.phone ? 5 : 0);

    // 3. Status Score (Max 25)
    switch (lead.status) {
        case 'Negotiation': score += 25; break;
        case 'Viewing': score += 20; break;
        case 'Qualified': score += 15; break;
        case 'Contacted': score += 10; break;
        case 'New': score += 5; break;
        default: break;
    }

    // 4. Source Score (Max 20)
    const highValueSources = ['Referral', 'Website', 'Direct'];
    score += (lead.source && highValueSources.includes(lead.source)) ? 20 : 10;

    // 5. Location Premium (Max 15)
    const location = (lead.targetLocation || '').toLowerCase();
    const isPrime = PRIME_LOCATIONS.some(loc => location.includes(loc));
    if (isPrime) score += 15;

    score = Math.min(score, 100);

    // A/B/C Grading
    let grade: 'A' | 'B' | 'C' = 'C';
    if (budget >= 2000000 && isPrime) grade = 'A';
    else if (budget >= 1000000) grade = 'B';

    // Visual Labels
    let label = '❄️ C';
    let color = 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';

    if (grade === 'A') {
        label = '🔥 A';
        color = 'text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    } else if (grade === 'B') {
        label = '🌡️ B';
        color = 'text-orange-500 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
    }

    return { score, grade, label, color };
};
