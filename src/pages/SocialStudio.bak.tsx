import { useState } from 'react';
import { Sparkles, Copy, Check, RefreshCw } from 'lucide-react';

const API_KEY = 'AIzaSyB4bacCZ8h-nxm45RLio_6Dpewk-n6olqw';

export default function SocialStudio() {
    const [topic, setTopic] = useState('');
    const [bullets, setBullets] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const generate = async () => {
        if (!topic) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ \n              parts: [{ \n                text: `Create viral Instagram post for Dubai real estate.\n                \nTopic: ${topic}\nDetails: ${bullets || 'Luxury property'}\n\nOutput EXACT JSON:\n{\n  "hook": "Attention-grabbing first line (5-7 words)",\n  "caption": "Main post text with emojis, 100-150 words",\n  "hashtags": "#DubaiRealEstate #LuxuryLiving #DCapital #[trending]",\n  "cta": "Strong call-to-action",\n  "bestTime": "Tuesday 6:00 PM GST",\n  "visualDirection": "Image description for designer"\n}`\n }]\n }]\n
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'API failed: ' + response.status);
            }

            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) throw new Error("No content generated");

            const jsonMatch = text.match(/\{[\s\S]*\}/);

            if (!jsonMatch) {
                throw new Error('Invalid response format from AI');
            }

            const parsed = JSON.parse(jsonMatch[0]);
            setResult(parsed);

        } catch (err: any) {
            console.error('Generation error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const copyAll = () => {
        if (!result) return;
        const text = `${result.hook}\n\n${result.caption}\n\n${result.cta}\n\n${result.hashtags}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-black text-white p-6">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                    <Sparkles className="w-8 h-8 text-yellow-500" />
                    Social Command Center
                </h1>
                <p className="text-gray-400 mb-8">AI-powered content generation</p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Input Section */}
                    <div className="space-y-6">
                        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                            <label className="block text-sm font-semibold text-yellow-500 mb-2">
                                Topic *
                            </label>
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g., New Villa Launch Palm Jumeirah"
                                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none"
                            />
                        </div>

                        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                            <label className="block text-sm font-semibold text-yellow-500 mb-2">
                                Key Details
                            </label>
                            <textarea
                                value={bullets}
                                onChange={(e) => setBullets(e.target.value)}
                                placeholder="6 Bedrooms&#10;AED 45 Million&#10;Private Beach"
                                rows={4}
                                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none resize-none"
                            />
                        </div>

                        <button
                            onClick={generate}
                            disabled={loading || !topic}
                            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:from-yellow-400 hover:to-yellow-500 transition-all"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    Generate Content
                                </>
                            )}
                        </button>

                        {error && (
                            <div className="bg-red-900/50 border border-red-800 rounded-lg p-4 text-red-200">
                                <strong>Error:</strong> {error}
                            </div>
                        )}
                    </div>

                    {/* Results Section */}
                    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                        {!result && !error && (
                            <div className="h-full flex items-center justify-center text-gray-500">
                                <div className="text-center">
                                    <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                    <p>Generated content will appear here</p>
                                </div>
                            </div>
                        )}

                        {result && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-yellow-500">Generated Content</h3>
                                    <button
                                        onClick={copyAll}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                                    >
                                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                        {copied ? 'Copied!' : 'Copy All'}
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-black rounded-lg p-4 border border-gray-800">
                                        <span className="text-xs font-semibold text-yellow-500 uppercase">Hook</span>
                                        <p className="text-lg font-medium mt-1">{result.hook}</p>
                                    </div>

                                    <div className="bg-black rounded-lg p-4 border border-gray-800">
                                        <span className="text-xs font-semibold text-yellow-500 uppercase">Caption</span>
                                        <p className="mt-1 whitespace-pre-line">{result.caption}</p>
                                    </div>

                                    <div className="bg-black rounded-lg p-4 border border-gray-800">
                                        <span className="text-xs font-semibold text-yellow-500 uppercase">Call to Action</span>
                                        <p className="mt-1">{result.cta}</p>
                                    </div>

                                    <div className="bg-black rounded-lg p-4 border border-gray-800">
                                        <span className="text-xs font-semibold text-yellow-500 uppercase">Hashtags</span>
                                        <p className="mt-1 text-blue-400">{result.hashtags}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-800 rounded-lg p-3">
                                            <span className="text-xs text-gray-400">Best Time</span>
                                            <p className="text-sm">{result.bestTime}</p>
                                        </div>
                                        <div className="bg-gray-800 rounded-lg p-3">
                                            <span className="text-xs text-gray-400">Visual</span>
                                            <p className="text-sm">{result.visualDirection}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
