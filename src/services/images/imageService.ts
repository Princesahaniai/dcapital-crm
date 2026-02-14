import { createClient } from 'pexels';

// PEXELS API KEY (Free Tier)
// User needs to provide this. I will put a placeholder.
const PEXELS_KEY = 'YOUR_PEXELS_KEY_HERE';

export const searchStockImages = async (query: string): Promise<string[]> => {
    if (PEXELS_KEY === 'YOUR_PEXELS_KEY_HERE') {
        throw new Error("Pexels API Key missing. Please add key to src/services/images/imageService.ts");
    }

    try {
        const client = createClient(PEXELS_KEY);
        const photos: any = await client.photos.search({ query, per_page: 5 });

        if (photos.photos && photos.photos.length > 0) {
            return photos.photos.map((p: any) => p.src.large);
        }
        return [];
    } catch (error: any) {
        console.error('Pexels Error:', error);
        throw error;
    }
};
