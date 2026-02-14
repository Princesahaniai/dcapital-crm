// CRITICAL: Hardcoding Key as per user request for immediate working demo.
// NOTE: Verify this key is enabled for Gemini API in Google Cloud Console.
const API_KEY = 'AIzaSyDElpqgjedde0IbEshvKqcERVW6_aE7pKU';

interface GenerateOptions {
    topic: string;
    bullets?: string;
    tone?: string;
    platform: 'instagram' | 'tiktok' | 'facebook' | 'linkedin' | 'twitter' | 'youtube';
}

export const generateSocialContent = async ({ topic, bullets, tone, platform }: GenerateOptions) => {
    // DIRECT FETCH WITHOUT SDK - NO FALLBACKS
    const platformSpecs = {
        instagram: { style: "Visual, emojis, short paragraphs", length: "125-150 words" },
        tiktok: { style: "Hook in 3 seconds, trending, casual", length: "50-80 words" },
        facebook: { style: "Conversational, detailed", length: "150-200 words" },
        linkedin: { style: "Professional, data-driven", length: "200-300 words" },
        twitter: { style: "Punchy, thread format", length: "280 chars" },
        youtube: { style: "SEO-optimized, educational", length: "100-150 words" }
    };

    const specs = platformSpecs[platform] || platformSpecs.instagram;

    // Use direct model URL
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${API_KEY}`;

    const prompt = {
        contents: [{
            parts: [{
                text: `You are CMO of D-Capital luxury Dubai real estate. Create viral ${platform} content.
TOPIC: ${topic}
POINTS: ${bullets || 'N/A'}
TONE: ${tone || 'luxury'}
STYLE: ${specs.style}
LENGTH: ${specs.length}

OUTPUT STRICT JSON:
{
  "hook": "Stop scroll hook",
  "caption": "Body with emojis",
  "hashtags": "5-8 relevant hashtags",
  "cta": "Strong call-to-action",
  "bestTime": "Best posting time",
  "visualDirection": "Image/video description",
  "engagementPrediction": "Why this works",
  "followUpIdea": "Next post suggestion"
}`
            }]
        }]
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(prompt)
        });

        const data = await response.json();

        // CHECK FOR API ERROR
        if (!response.ok || data.error) {
            console.error('Gemini API Error:', data);
            throw new Error(data.error?.message || `API Error: ${response.status} ${response.statusText}`);
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
            throw new Error("No content generated");
        }

        const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();

        try {
            return JSON.parse(cleanText);
        } catch (e) {
            const match = cleanText.match(/\{[\s\S]*\}/);
            if (match) return JSON.parse(match[0]);
            throw new Error('Invalid JSON response from AI');
        }

    } catch (error: any) {
        console.error('Gemini Request Failed:', error);
        // CRITICAL: THROW ERROR TO UI - DO NOT FALLBACK
        throw error;
    }
};
