const API_KEY = 'AIzaSyB4bacCZ8h-nxm45RLio_6Dpewk-n6olqw';

const checkModel = async (model) => {
    console.log(`Checking ${model}...`);
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: 'Say "System Operational" in 2 words' }] }]
            })
        });
        const data = await response.json();
        if (data.candidates) {
            console.log(`SUCCESS [${model}]:`, data.candidates[0].content.parts[0].text);
            return true;
        } else {
            console.log(`FAILED [${model}]:`, JSON.stringify(data));
            return false;
        }
    } catch (e) {
        console.log(`ERROR [${model}]:`, e.message);
        return false;
    }
}

// Check both
(async () => {
    await checkModel('gemini-1.5-pro');
    await checkModel('gemini-pro');
    await checkModel('gemini-1.5-flash');
})();
