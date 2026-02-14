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
        <div style={{ padding: 40, color: 'white', background: '#000', minHeight: '100vh', fontFamily: 'sans-serif' }}>
            <h1 style={{ color: '#D4AF37', marginBottom: 20 }}>Social Studio V2 - EMERGENCY FIX</h1>

            <div style={{ marginBottom: 20 }}>
                <input
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="Enter topic (e.g., Dubai Penthouse for Sale)"
                    style={{
                        padding: 15,
                        width: '100%',
                        maxWidth: '500px',
                        marginBottom: 10,
                        background: '#111',
                        border: '1px solid #333',
                        color: 'white',
                        borderRadius: 8
                    }}
                />
            </div>

            <button
                onClick={generate}
                disabled={loading}
                style={{
                    padding: '15px 30px',
                    background: loading ? '#333' : '#D4AF37',
                    color: loading ? '#888' : 'black',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    borderRadius: 8,
                    fontSize: '16px'
                }}
            >
                {loading ? 'Generating...' : 'GENERATE POST'}
            </button>

            {result && (
                <div style={{ marginTop: 30, padding: 25, background: '#111', borderLeft: '4px solid #D4AF37', maxWidth: '600px' }}>
                    <h3 style={{ marginTop: 0, color: '#888' }}>Result:</h3>
                    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.6 }}>{result}</pre>
                </div>
            )}
        </div>
    );
}
