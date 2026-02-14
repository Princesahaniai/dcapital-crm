fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=AIzaSyDElpqgjedde0IbEshvKqcERVW6_aE7pKU', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        contents: [{ parts: [{ text: 'Say hello in 3 words' }] }]
    })
}).then(r => r.json()).then(d => console.log('RESULT:', JSON.stringify(d, null, 2))).catch(e => console.log('ERROR:', e))
