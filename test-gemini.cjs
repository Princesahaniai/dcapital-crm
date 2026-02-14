const https = require('https');

const API_KEY = 'AIzaSyDElpqgjedde0IbEshvKqcERVW6_aE7pKU';
const data = JSON.stringify({
    contents: [{
        parts: [{ text: 'Say hello' }]
    }]
});

const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log('Testing Key:', API_KEY);
console.log('Model: gemini-pro');

const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(body);
            if (res.statusCode === 200) {
                console.log('WORKS:', JSON.stringify(json, null, 2));
            } else {
                console.log('FAILED:', JSON.stringify(json, null, 2));
            }
        } catch (e) {
            console.log('FAILED TO PARSE JSON:', body);
        }
    });
});

req.on('error', (e) => {
    console.error('REQUEST ERROR:', e);
});

req.write(data);
req.end();
