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

        const companyId = payload.companyId || 'default-company';

        let assignedTo = '';
        let strategyUsed = 'manual';

        // 1. Fetch Global Settings for the Specific Company
        // Path adjusted to look for settings scoped by company, e.g., companies/{companyId}/settings/global
        // But since we are pushing SaaS quickly, if settings is top level we do:
        // const settingsRef = db.collection('settings').doc('global');
        // Let's assume settings are inside a company doc, or just flat but we scope by query.
        // Actually, the easiest is an index inside the settings doc. We'll use a specific settings document per company.
        const settingsRef = db.collection('settings_by_company').doc(companyId);
        const settingsDoc = await settingsRef.get();
        let settings = { autoRouting: false, routingStrategy: 'manual', lastAssignedIndex: 0 };

        if (settingsDoc.exists) {
            settings = { ...settings, ...settingsDoc.data() };
        }

        // 2. Round-Robin Assignment Logic
        if (settings.autoRouting && settings.routingStrategy === 'round-robin') {
            const usersSnapshot = await db.collection('users')
                .where('companyId', '==', companyId)
                .where('role', '==', 'agent')
                .get(); // Note: Assumes 'status' is checked client-side, or we drop it from query if no composite index exists

            const agents = usersSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() as any }))
                .filter((a: any) => a.status !== 'Suspended' && a.status !== 'Inactive');

            if (agents.length > 0) {
                // Determine next agent
                const nextIndex = settings.lastAssignedIndex % agents.length;
                assignedTo = agents[nextIndex].id;
                strategyUsed = 'round-robin';

                // Increment index
                await settingsRef.set({
                    ...settings,
                    lastAssignedIndex: nextIndex + 1
                }, { merge: true });
            }
        }

        const newLead = {
            id: Math.random().toString(36).substr(2, 9),
            name: payload.name || 'Unknown Lead',
            email: payload.email || '',
            phone: payload.phone || '',
            campaign_name: payload.campaign_name || '',
            source: payload.source || 'Portal Webhook',
            budget: parseInt(payload.budget) || 0,
            targetLocation: payload.targetLocation || payload.location || '',
            status: 'New',
            assignedTo: assignedTo,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            lastContact: Date.now(),
            commission: 0,
            commissionPaid: false,
            companyId: companyId,
            notes: payload.notes || `Generated via ${payload.source || 'Portal Webhook'}. Routing: ${strategyUsed}`
        };

        // Inject into Firestore
        await db.collection('leads').doc(newLead.id).set({
            ...newLead,
            _webhookTimestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        // Log the webhook
        await db.collection('webhook_logs').add({
            receivedAt: admin.firestore.FieldValue.serverTimestamp(),
            payload: payload,
            companyId: companyId,
            assignedTo: assignedTo,
            strategyUsed: strategyUsed
        });

        return res.status(200).json({ success: true, message: 'Lead added successfully', leadId: newLead.id, assignedTo: assignedTo });

    } catch (error: any) {
        console.error('Webhook Error:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
