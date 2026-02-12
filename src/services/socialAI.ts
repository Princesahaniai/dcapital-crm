import { GoogleGenerativeAI } from '@google/generative-ai';

// CRITICAL: Hardcoding Key as per user request for immediate working demo.
// In a real production environment, this should be moved to a backend proxy.
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
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash', // Using Flash for speed
            generationConfig: {
                temperature: 0.8,
                maxOutputTokens: 2048,
            }
        });

        const platformSpecs = {
            instagram: { style: "Visual-first, emoji-heavy, short paragraphs", length: "125-150 words", cta: "Link in bio, Save this post" },
            tiktok: { style: "Hook in first 3 seconds, trending audio, casual", length: "50-80 words", cta: "Follow for more, Comment below" },
            facebook: { style: "Conversational, detailed, community-focused", length: "150-200 words", cta: "Message us, Share with friends" },
            linkedin: { style: "Professional, data-driven, thought leadership", length: "200-300 words", cta: "Connect with us, Comment insights" },
            twitter: { style: "Punchy, controversial hook, thread format", length: "280 chars per tweet, 5-7 thread", cta: "Retweet, Follow thread" },
            youtube: { style: "SEO-optimized, educational, storytelling", length: "100-150 words", cta: "Subscribe, Hit bell" }
        };

        const specs = platformSpecs[platform];

        const prompt = `You are CMO of D-Capital, luxury Dubai real estate. Create viral ${platform} content.

TOPIC: ${topic}
KEY POINTS: ${bullets || 'N/A'}
TONE: ${tone || 'luxury'}

PLATFORM REQUIREMENTS:
- Style: ${specs.style}
- Length: ${specs.length}
- CTA: ${specs.cta}

VIRAL HOOK OPTIONS: "POV: You just..." / "3 things nobody tells you..." / "The secret to..." / "Stop doing X, start doing Y"

OUTPUT STRICT JSON (No markdown code blocks, just raw JSON):
{
  "hook": "Scroll-stopping first line",
  "caption": "Main body with emojis and line breaks",
  "hashtags": "#DubaiRealEstate #LuxuryLiving #DCapital #[relevant tags]",
  "cta": "Specific call-to-action",
  "bestTime": "Tuesday 6:00 PM GST",
  "visualDirection": "Detailed image/video description",
  "engagementPrediction": "Why this will go viral",
  "followUpIdea": "Next post suggestion"
}

RULES: Luxury tone, FOMO, scarcity, social proof, exclusive feel. No generic "contact us" — use "DM 'LUXURY' for private viewing".`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Clean up markdown code blocks if Gemini includes them
        const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();

        try {
            return JSON.parse(cleanText);
        } catch (e) {
            console.error("JSON Parse Error", e);
            return {
                hook: "Could not parse AI response",
                caption: cleanText,
                hashtags: "#Error #TryAgain",
                cta: "Please retry generation",
                bestTime: "N/A",
                visualDirection: "N/A",
                engagementPrediction: "Low",
                followUpIdea: "Retry"
            };
        }

    } catch (error: any) {
        console.error('Gemini Error:', error);
        throw new Error(error.message || "Failed to generate content");
    }
};
