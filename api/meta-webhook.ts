import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

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
    // CORS Setup
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 1. Meta Webhook Verification (GET)
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        // Usually stored in env, but for CRM setup we can allow a default or check against VERCEL ENV
        const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'dcapital_meta_crm_secret_2024';

        if (mode && token) {
            if (mode === 'subscribe' && token === VERIFY_TOKEN) {
                console.log('WEBHOOK_VERIFIED');
                return res.status(200).send(challenge);
            } else {
                return res.status(403).end();
            }
        }
        return res.status(400).send('Missing verification parameters');
    }

    // 2. Meta Lead Ad Real-time Updates (POST)
    if (req.method === 'POST') {
        const body = req.body;
        const signature = req.headers['x-hub-signature-256'];

        if (!signature) {
            return res.status(401).json({ error: 'Missing X-Hub-Signature-256' });
        }

        let appSecret = process.env.META_APP_SECRET || '';
        try {
            const settingsDoc = await db.collection('settings_by_company').doc('default-company').get();
            if (settingsDoc.exists) {
                appSecret = settingsDoc.data()?.metaAppSecret || appSecret;
            }
        } catch (e) {
            console.error('Error fetching settings for signature:', e);
        }

        if (!appSecret) {
            console.error('Meta App Secret not configured');
            return res.status(500).json({ error: 'Server misconfiguration: App Secret Missing' });
        }

        // Validate Signature
        const payloadString = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        const expectedSignature = 'sha256=' + crypto.createHmac('sha256', appSecret).update(payloadString).digest('hex');

        if (signature !== expectedSignature) {
            console.error('Webhook signature mismatch');
            return res.status(401).json({ error: 'Invalid signature' });
        }

        try {
            if (body.object === 'page') {
                for (const entry of body.entry) {
                    for (const change of entry.changes) {
                        if (change.field === 'leadgen') {
                            const leadgen_id = change.value.leadgen_id;
                            const form_id = change.value.form_id;

                            // 2A. We need the Page Access Token to fetch the lead data.
                            // To be true multi-tenant we might look this up by page_id, but for now we look in env.
                            const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

                            if (!META_ACCESS_TOKEN) {
                                console.error('META_ACCESS_TOKEN not configured.');
                                return res.status(500).json({ error: 'Server misconfiguration: Token Missing' });
                            }

                            // 2B. Fetch the actual lead data from Graph API
                            const leadResponse = await fetch(`https://graph.facebook.com/v18.0/${leadgen_id}?access_token=${META_ACCESS_TOKEN}`);
                            const leadData = await leadResponse.json();

                            if (leadData.error) {
                                console.error('Error fetching lead data:', leadData.error);
                                continue;
                            }

                            // 2C. Parse Meta Lead Fields
                            // Meta sends an array of field_data: [{name: "full_name", values: ["John Doe"]}, ...]
                            let parsedName = 'Unknown Meta Lead';
                            let parsedPhone = '';
                            let parsedEmail = '';

                            if (leadData.field_data) {
                                leadData.field_data.forEach((field: any) => {
                                    if (field.name.includes('name')) parsedName = field.values[0];
                                    if (field.name.includes('phone')) parsedPhone = field.values[0];
                                    if (field.name.includes('email')) parsedEmail = field.values[0];
                                });
                            }

                            // 2D. Routing Logic (Same as catch-lead)
                            // Hardcoded for now, but in pro you'd read the webhook settings
                            const companyId = 'default-company';
                            let assignedTo = '';

                            const settingsRef = db.collection('settings_by_company').doc(companyId);
                            const settingsDoc = await settingsRef.get();
                            let settings = { autoRouting: false, routingStrategy: 'manual', lastAssignedIndex: 0 };

                            if (settingsDoc.exists) {
                                settings = { ...settings, ...settingsDoc.data() };
                            }

                            if (settings.autoRouting && settings.routingStrategy === 'round-robin') {
                                const usersSnapshot = await db.collection('users')
                                    .where('companyId', '==', companyId)
                                    .where('role', '==', 'agent')
                                    .get();

                                const agents = usersSnapshot.docs
                                    .map((doc: any) => ({ id: doc.id, ...doc.data() }))
                                    .filter((a: any) => a.status !== 'Suspended' && a.status !== 'Inactive');

                                if (agents.length > 0) {
                                    const nextIndex = settings.lastAssignedIndex % agents.length;
                                    assignedTo = agents[nextIndex].id;

                                    await settingsRef.set({
                                        ...settings,
                                        lastAssignedIndex: nextIndex + 1
                                    }, { merge: true });
                                }
                            }

                            // 2E. Create Lead Object
                            const newLead = {
                                id: `meta_${leadgen_id}`, // Prevent duplicates
                                name: parsedName,
                                email: parsedEmail,
                                phone: parsedPhone,
                                source: 'Meta Lead Ads',
                                budget: 0,
                                targetLocation: '',
                                status: 'New',
                                assignedTo: assignedTo,
                                createdAt: Date.now(),
                                updatedAt: Date.now(),
                                lastContact: Date.now(),
                                commission: 0,
                                commissionPaid: false,
                                companyId: companyId,
                                notes: `Lead imported directly from Meta Ads. Form ID: ${form_id}`,
                                campaign_name: leadData.campaign_name || '',
                                ad_name: leadData.ad_name || ''
                            };

                            // 2F. Inject to Firestore
                            await db.collection('leads').doc(newLead.id).set({
                                ...newLead,
                                _metaTimestamp: admin.firestore.FieldValue.serverTimestamp()
                            }, { merge: true }); // Merge just in case of duplicates

                            // Log webhook
                            await db.collection('webhook_logs').add({
                                receivedAt: admin.firestore.FieldValue.serverTimestamp(),
                                type: 'meta_leadgen',
                                payload: leadData,
                                assignedTo: assignedTo
                            });

                        }
                    }
                }

                return res.status(200).send('EVENT_RECEIVED');
            } else {
                return res.status(404).end();
            }
        } catch (error: any) {
            console.error('Meta Webhook Processing Error:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
}
