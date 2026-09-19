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

        // Construct the text to embed, including all new CRM schema fields
        const textToEmbed = `
            Property Name: ${property.name || 'N/A'}
            Developer: ${property.developer || 'N/A'}
            Type: ${property.type || 'N/A'}
            Status: ${property.status || 'N/A'}
            Project Status: ${property.projectStatus || 'N/A'}
            Location: ${property.location || 'N/A'}
            Community: ${property.community || 'N/A'}
            Emirate: ${property.emirate || 'N/A'}
            Bedrooms: ${property.bedrooms || 0}
            Bathrooms: ${property.bathrooms || 0}
            Maids Room: ${property.maidsRoom ? 'Yes' : 'No'}
            Study Room: ${property.studyRoom ? 'Yes' : 'No'}
            Square Feet: ${property.sqft || 0}
            Built-Up Area: ${property.bua || 'N/A'}
            Plot Size: ${property.plotSize || 'N/A'}
            Price: AED ${property.price || 0}
            Original Price: AED ${property.originalPrice || 'N/A'}
            Payment Plan: ${property.paymentPlan || 'N/A'}
            Post Handover Plan: ${property.postHandoverPlan || 'N/A'}
            Description: ${property.description || 'N/A'}
            View: ${property.view || 'N/A'}
            Furnishing: ${property.furnishing || 'N/A'}
            Condition: ${property.condition || 'N/A'}
            Handover Date: ${property.handoverDate || 'N/A'}
            Occupancy Status: ${property.occupancyStatus || 'N/A'}
            Current Rent: AED ${property.currentRent || 'N/A'}
            Features: ${(property.features || []).join(', ')}
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
                    community: property.community || '',
                    bedrooms: property.bedrooms || 0,
                    price: property.price || 0,
                    sqft: property.sqft || 0,
                    projectStatus: property.projectStatus || '',
                    occupancyStatus: property.occupancyStatus || '',
                }
            }
        ]);

        return res.status(200).json({ success: true, message: 'Property embedded and stored successfully' });

    } catch (error: any) {
        console.error('Embed API Error:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
