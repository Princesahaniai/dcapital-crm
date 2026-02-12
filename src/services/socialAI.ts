import { GoogleGenerativeAI } from '@google/generative-ai';

// CRITICAL: Hardcoding Key as per user request for immediate working demo.
const API_KEY = 'AIzaSyDElpqgjedde0IbEshvKqcERVW6_aE7pKU';

const genAI = new GoogleGenerativeAI(API_KEY);

interface GenerateOptions {
    topic: string;
    bullets?: string;
    tone?: string;
    platform: 'instagram' | 'tiktok' | 'facebook' | 'linkedin' | 'twitter' | 'youtube';
}

export const generateSocialContent = async ({ topic, bullets, tone, platform }: GenerateOptions) => {
    try {
        // FIXED: Use correct model name or fallback
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-pro',
            generationConfig: {
                temperature: 0.8,
                maxOutputTokens: 2048,
            }
        });

        const platformSpecs = {
            instagram: { style: "Visual, emojis, short paragraphs", length: "125-150 words", cta: "Link in bio" },
            tiktok: { style: "Hook in 3 seconds, trending, casual", length: "50-80 words", cta: "Follow for more" },
            facebook: { style: "Conversational, detailed", length: "150-200 words", cta: "Share with friends" },
            linkedin: { style: "Professional, data-driven", length: "200-300 words", cta: "Connect with us" },
            twitter: { style: "Punchy, thread format", length: "280 chars x 5-7 tweets", cta: "Retweet" },
            youtube: { style: "SEO-optimized, educational", length: "100-150 words", cta: "Subscribe" }
        };

        const specs = platformSpecs[platform];

        const prompt = `You are CMO of D-Capital luxury Dubai real estate. Create viral ${platform} content.

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
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();

        try {
            return JSON.parse(cleanText);
        } catch (e) {
            // Try to extract JSON if it's wrapped in text
            const match = cleanText.match(/\{[\s\S]*\}/);
            if (match) return JSON.parse(match[0]);
            throw new Error('Invalid JSON response');
        }

    } catch (error: any) {
        console.error('Gemini Error:', error);

        // FALLBACK: Return template content so UI never breaks
        return {
            hook: "🏡 Discover Luxury Living in Dubai",
            caption: `Experience the extraordinary at ${topic}. ${bullets || 'Exclusive property details available.'}\n\nLimited availability. Exclusive viewing by appointment only.`,
            hashtags: "#DubaiRealEstate #LuxuryLiving #DCapital #Investment",
            cta: "DM 'VIP' for private tour",
            bestTime: "Tuesday 6:00 PM GST",
            visualDirection: "Modern architecture, golden hour lighting, luxury interior",
            engagementPrediction: "High engagement expected - luxury properties perform 3x better",
            followUpIdea: "Post client testimonial from previous buyer",
            _fallback: true
        };
    }
};
