// MOCK SERVICE - In production, this hits https://api.antigravity.co/v1/schedule

const DELAY = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface SchedulePayload {
    content: Record<string, any>;
    platforms: string[];
    scheduledTime: string; // ISO String
    imageUrl?: string;
}

export const schedulePost = async (payload: SchedulePayload) => {
    console.log("🚀 [AntiGravity] Scheduling Post...", payload);
    await DELAY(1500); // Simulate network latency

    // Simulate Success
    return {
        success: true,
        batch_id: `batch_${Math.random().toString(36).substr(2, 9)}`,
        status: 'scheduled',
        scheduled_at: payload.scheduledTime,
        platform_ids: payload.platforms.map(p => `${p}_${Math.random().toString(36).substr(2, 5)}`)
    };
};
