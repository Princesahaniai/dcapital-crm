import OpenAI from 'openai';
import pdfParse from 'pdf-parse';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy_key',
});

export default async function handler(req: any, res: any) {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
        const { fileBase64, fileType, fileName } = req.body;

        if (!fileBase64 || !fileType) {
            return res.status(400).json({ error: 'Missing file data' });
        }

        let rawText = '';
        const buffer = Buffer.from(fileBase64, 'base64');

        if (fileType === 'application/pdf') {
            const pdfData = await pdfParse(buffer);
            rawText = pdfData.text;
        } else {
            // For Excel/CSV, we can either parse it on the frontend and send text, 
            // or just assume text is sent if it's not a PDF.
            // For now, if it's text/csv or something else, we decode to string.
            rawText = buffer.toString('utf-8');
        }

        // Use OpenAI to extract property details
        const systemPrompt = `You are a strict data extraction AI for D Capital Real Estate.
You will be provided with raw text extracted from a document (PDF, CSV, etc.).
Your task is to identify and extract all real estate properties mentioned in the text.
Return the result strictly as a JSON object containing an array of properties under the key "properties".
Each property object should have the following fields:
- "projectName": string
- "location": string
- "type": string (e.g., "4 Bedroom Villa")
- "size": number (numeric value in sq ft)
- "price": number (numeric value in AED)
- "status": string (must be "Active", "Sold", or "Off-Market")
- "ownerName": string (if available, otherwise "")
- "contactInfo": string (if available, otherwise "")
- "specs": string (any additional details, handover date, etc.)

If no properties are found, return { "properties": [] }. Do not include markdown formatting like \`\`\`json.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Filename: ${fileName}\n\nDocument Text:\n${rawText.substring(0, 50000)}` }
            ],
            response_format: { type: "json_object" },
            temperature: 0,
        });

        const extractedData = JSON.parse(completion.choices[0].message.content || '{"properties": []}');

        return res.status(200).json({ success: true, properties: extractedData.properties });

    } catch (error: any) {
        console.error('Vault Ingest Error:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
