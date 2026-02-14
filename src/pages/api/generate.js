export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const { topic, bullets, platform } = req.body;

    // NOTE: You should use process.env.GEMINI_API_KEY in production
    const API_KEY = 'AIzaSyDElpqgjedde0IbEshvKqcERVW6_aE7pKU';

    try {
        const platformSpecs = {
            instagram: { style: "Visual, emojis, short paragraphs", length: "125-150 words" },
            tiktok: { style: "Hook in 3 seconds, trending, casual", length: "50-80 words" },
            facebook: { style: "Conversational, detailed", length: "150-200 words" },
            linkedin: { style: "Professional, data-driven", length: "200-300 words" },
            twitter: { style: "Punchy, thread format", length: "280 chars" },
            youtube: { style: "SEO-optimized, educational", length: "100-150 words" }
        };

        const specs = platformSpecs[platform] || platformSpecs.instagram;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                    \n            parts: [{
                    \n              text: `You are CMO of D-Capital luxury Dubai real estate. Create viral ${platform} content.
TOPIC: ${topic}
POINTS: ${bullets || 'N/A'}
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
                    }]\n
                    }]
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return res.status(500).json({ error: data.error?.message || 'API failed' });
        }

        const text = data.candidates[0].content.parts[0].text;
        // Extract JSON
        const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        const json = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(cleanText);

        res.status(200).json(json);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
