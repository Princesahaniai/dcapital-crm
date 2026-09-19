import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

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
        return res.status(200).json({ success: false, message: 'AI Co-Pilot is currently disabled (missing configuration).' });
    }

    try {
        const { property } = req.body;

        if (!property || !property.id) {
            return res.status(400).json({ error: 'Invalid payload: Property object with ID is required' });
        }

        // Construct the text to embed
        const textToEmbed = `
            Property Name: ${property.name}
            Developer: ${property.developer}
            Type: ${property.type}
            Status: ${property.status}
            Location: ${property.location}
            Bedrooms: ${property.bedrooms}
            Bathrooms: ${property.bathrooms}
            Square Feet: ${property.sqft}
            Price: AED ${property.price}
            Description: ${property.description || 'N/A'}
            View: ${property.view || 'N/A'}
            Furnishing: ${property.furnishing || 'N/A'}
            Handover Date: ${property.handoverDate || 'N/A'}
            Project Status: ${property.projectStatus || 'N/A'}
            Payment Plan: ${property.paymentPlan || 'N/A'}
            RERA Permit: ${property.reraPermit || 'N/A'}
        `.trim();

        // 1. Generate Embedding
        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: textToEmbed,
            encoding_format: "float",
        });

        const vector = embeddingResponse.data[0].embedding;

        // 2. Store in Pinecone
        const indexName = process.env.PINECONE_INDEX || 'dcapital-inventory';
        const index = pinecone.Index(indexName);

        await index.upsert([
            {
                id: property.id,
                values: vector,
                metadata: {
                    name: property.name || '',
                    developer: property.developer || '',
                    type: property.type || '',
                    status: property.status || '',
                    location: property.location || '',
                    bedrooms: property.bedrooms || 0,
                    price: property.price || 0,
                    sqft: property.sqft || 0,
                }
            }
        ]);

        return res.status(200).json({ success: true, message: 'Property embedded and stored successfully' });

    } catch (error: any) {
        console.error('Embed API Error:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
