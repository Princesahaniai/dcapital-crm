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

export default async function handler(req: any, res: any) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        res.setHeader('Access-Control-Allow-Origin', '*');

        const payload = req.body;

        if (!payload || !payload.name) {
            return res.status(400).json({ error: 'Invalid payload: Name is required' });
        }

        const newLead = {
            id: Math.random().toString(36).substr(2, 9),
            name: payload.name || 'Unknown Lead',
            email: payload.email || '',
            phone: payload.phone || '',
            campaign_name: payload.campaign_name || '',
            source: payload.source || 'Facebook/Meta Ads',
            budget: parseInt(payload.budget) || 0,
            status: 'New',
            assignedTo: '', // Unassigned initially
            createdAt: Date.now(),
            updatedAt: Date.now(),
            lastContact: Date.now(),
            commission: 0,
            commissionPaid: false,
            notes: payload.notes || 'Generated via Webhook'
        };

        // Inject into Firestore
        await db.collection('leads').doc(newLead.id).set({
            ...newLead,
            _webhookTimestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        // Log the webhook
        await db.collection('webhook_logs').add({
            receivedAt: admin.firestore.FieldValue.serverTimestamp(),
            payload: payload
        });

        return res.status(200).json({ success: true, message: 'Lead added successfully', leadId: newLead.id });

    } catch (error: any) {
        console.error('Webhook Error:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
