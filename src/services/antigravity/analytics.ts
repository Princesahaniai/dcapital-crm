// MOCK SERVICE - In production, this hits https://api.antigravity.co/v1/analytics

const DELAY = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface AnalyticsSummary {
    total_reach: number;
    engagement_rate: number;
    leads_generated: number;
    platform_breakdown: {
        platform: string;
        reach: number;
        engagement: number;
    }[];
    recent_posts: {
        id: string;
        date: string;
        platform: string;
        thumbnail: string;
        likes: number;
        comments: number;
        views: number;
    }[];
}

export const getAnalyticsSummary = async (): Promise<AnalyticsSummary> => {
    await DELAY(1200);
    return {
        total_reach: 145200,
        engagement_rate: 4.8,
        leads_generated: 342,
        platform_breakdown: [
            { platform: 'instagram', reach: 65000, engagement: 5.2 },
            { platform: 'tiktok', reach: 72000, engagement: 6.1 },
            { platform: 'linkedin', reach: 8200, engagement: 2.4 }
        ],
        recent_posts: [
            {
                id: 'p1', date: '2023-10-25', platform: 'instagram',
                thumbnail: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=150',
                likes: 1240, comments: 45, views: 15000
            },
            {
                id: 'p2', date: '2023-10-24', platform: 'tiktok',
                thumbnail: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=150',
                likes: 8500, comments: 340, views: 95000
            }
        ]
    };
};
