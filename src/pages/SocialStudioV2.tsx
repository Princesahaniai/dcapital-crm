import { useState } from 'react';

export default function SocialStudioV2() {
    const [topic, setTopic] = useState('');
    const [result, setResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // HARDCODED KEY AS REQUESTED FOR EMERGENCY FIX
    const API_KEY = 'AIzaSyB4bacCZ8h-nxm45RLio_6Dpewk-n6olqw';

    const generate = async () => {
        if (!topic) return;
        setLoading(true);
        setResult(null);

        try {
            console.log('Sending request to Gemini...');
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: `Write an engaging Instagram post about: ${topic}. Include hook, caption, and hashtags.` }] }]
                    })
                }
            );

            const data = await res.json();
            console.log('Gemini Response:', data);

            if (!res.ok) {
                throw new Error(data.error?.message || 'API Error');
            }

            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No content generated';
            setResult(text);
        } catch (e: any) {
            console.error('Generation Error:', e);
            setResult('Error: ' + e.message);
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-black text-white p-10 font-sans">
            <h1 className="text-[#D4AF37] text-4xl font-bold mb-5">Social Studio V2 - EMERGENCY FIX</h1>

            <div className="mb-5">
                <input
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="Enter topic (e.g., Dubai Penthouse for Sale)"
                    className="w-full max-w-[500px] p-4 bg-[#111] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition-colors"
                />
            </div>

            <button
                onClick={generate}
                disabled={loading}
                className={`px-8 py-4 rounded-lg font-bold text-lg transition-colors ${loading
                        ? 'bg-[#333] text-[#888] cursor-not-allowed'
                        : 'bg-[#D4AF37] text-black hover:bg-[#B8962F]'
                    }`}
            >
                {loading ? 'Generating...' : 'GENERATE POST'}
            </button>

            {result && (
                <div className="mt-8 p-6 bg-[#111] border-l-4 border-[#D4AF37] max-w-2xl rounded-r-lg">
                    <h3 className="text-gray-400 mb-2 font-bold">Result:</h3>
                    <pre className="whitespace-pre-wrap font-sans leading-relaxed text-gray-200">{result}</pre>
                </div>
            )}
        </div>
    );
}
