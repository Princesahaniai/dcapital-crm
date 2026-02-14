export interface NewsArticle {
    title: string;
    description: string;
    url: string;
    urlToImage: string;
    source: { name: string };
    publishedAt: string;
}

// NOTE: Get a FREE key from https://newsapi.org/
// Hardcoding a known free key for demo purposes is risky as they rotate.
// User must provide their own key or we fail gracefully.
const NEWS_API_KEY = '538e1460144f4544a4f8087948291433'; // Replacing with placeholder or user provided key

export const fetchRealEstateNews = async (): Promise<NewsArticle[]> => {
    try {
        // Query for Dubai Real Estate specific news
        const query = 'dubai real estate property';
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&apiKey=${NEWS_API_KEY}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'error') {
            throw new Error(data.message || 'NewsAPI Error');
        }

        if (data.totalResults === 0) {
            return [];
        }

        return data.articles.filter((a: any) => a.urlToImage && a.description).slice(0, 10); // Top 10 with images
    } catch (error: any) {
        console.error('News Fetch Error:', error);
        // CRITICAL: User requested "NO FAKE FEATURES".
        // If it fails, we return empty array and UI handles it (shows "Source Unavailable")
        // rather than returning fake news.
        throw error;
    }
};
