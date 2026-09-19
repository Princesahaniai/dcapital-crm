import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if (serviceAccountRaw) {
            admin.initializeApp({
                credential: admin.credential.cert(JSON.parse(serviceAccountRaw))
            });
        } else {
            console.warn('FIREBASE_SERVICE_ACCOUNT_KEY not found. Defaulting to standard credentials.');
            admin.initializeApp();
        }
    } catch (error) {
        console.error('Firebase Admin Initialization Error:', error);
    }
}

const db = admin.firestore();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy_key_to_prevent_crash_on_init',
});

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY || 'dummy_key_to_prevent_crash_on_init',
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

    // Safety check for production environment
    if (!process.env.OPENAI_API_KEY || !process.env.PINECONE_API_KEY) {
        return res.status(200).json({ 
            success: false, 
            reply: "AI Co-Pilot is currently offline because the required API keys are not configured in this environment." 
        });
    }

    try {
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({ error: 'Invalid payload: Query string is required' });
        }

        // 1. Generate Embedding for the query
        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: query,
            encoding_format: "float",
        });

        const vector = embeddingResponse.data[0].embedding;

        // 2. Query Pinecone for top matches
        const indexName = process.env.PINECONE_INDEX || 'dcapital-inventory';
        const index = pinecone.Index(indexName);

        const searchResults = await index.query({
            topK: 3,
            vector: vector,
            includeMetadata: true,
        });

        const matchedPropertyIds = searchResults.matches?.map(match => match.id) || [];
        
        if (matchedPropertyIds.length === 0) {
            return res.status(200).json({ 
                success: true, 
                reply: "I couldn't find any properties matching your exact requirements in the active inventory." 
            });
        }

        // 3. Fetch full property details from Firestore
        const propertiesRef = db.collection('properties');
        // Note: Firestore 'in' query supports up to 10 items
        const propertiesSnapshot = await propertiesRef.where('id', 'in', matchedPropertyIds).where('status', 'in', ['Available', 'Off-Plan']).get();
        // Fallback if 'id' field is not indexed as 'id', we check doc names:
        // const propertiesSnapshot = await db.getAll(...matchedPropertyIds.map(id => propertiesRef.doc(id)));
        
        let properties = propertiesSnapshot.docs.map(doc => doc.data());
        
        // If properties are deleted, they shouldn't be matched, but double check
        properties = properties.filter((p: any) => p.isDeleted !== true);

        if (properties.length === 0) {
            return res.status(200).json({ 
                success: true, 
                reply: "I found some matches, but they are no longer available in the inventory." 
            });
        }

        // 4. Call LLM to format the response
        const systemPrompt = `You are an expert AI Real Estate Co-Pilot for D Capital Real Estate. 
You will be provided with a user's natural language query and a list of matched properties from our database.
Your task is to analyze the properties and format the output EXACTLY in the following WhatsApp-ready layout for the agent to copy/paste.

STRICT FORMATTING RULES:
1. For each property, use EXACTLY this markdown layout:

📌 **[Project Name] | [Location]**
* **Type:** [Bedrooms] Bedroom [Type]
* **Size:** [BUA/Plot] Sq. Ft.
* **Status:** [Ready / Off-Plan + Handover Date]
* **Price:** AED [Price formatted with commas]
💡 **Remark:** [1-sentence selling point]

2. Do NOT add any conversational intro like "Here are the properties". Just output the property blocks separated by a blank line.
3. If the user's query asks a question, you may add a brief 1-sentence answer before the property list.
4. Maintain a professional, premium tone.`;

        const userPrompt = `User Query: "${query}"\n\nMatched Properties (JSON):\n${JSON.stringify(properties, null, 2)}`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.3,
        });

        const reply = completion.choices[0].message.content;

        return res.status(200).json({ success: true, reply, matchedProperties: properties });

    } catch (error: any) {
        console.error('Match API Error:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
