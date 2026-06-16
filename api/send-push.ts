import type { IncomingMessage, ServerResponse } from 'http';
import * as admin from 'firebase-admin';

// ─── Firebase Admin SDK init (singleton) ─────────────────────────────────────
// Credentials come from Vercel environment variables (set in Vercel dashboard):
//   FIREBASE_PROJECT_ID     → your project ID
//   FIREBASE_CLIENT_EMAIL   → service account email
//   FIREBASE_PRIVATE_KEY    → service account private key (with literal \n)
// ─────────────────────────────────────────────────────────────────────────────
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId:   process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // Vercel stores multi-line env vars with literal \n — convert back
                privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
        console.log('[send-push] Firebase Admin initialized');
    } catch (err) {
        console.error('[send-push] Firebase Admin initialization error:', err);
    }
}

export default async function handler(req: IncomingMessage & { body?: any }, res: ServerResponse & { status: (c: number) => any; json: (d: any) => any; setHeader: (k: string, v: string) => any; end: () => any }) {
    // ── CORS headers ──────────────────────────────────────────────────────
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Parse JSON body (Vercel auto-parses, but handle raw stream as fallback)
    let parsedBody: any = req.body;
    if (!parsedBody) {
        parsedBody = await new Promise((resolve, reject) => {
            let raw = '';
            req.on('data', chunk => { raw += chunk; });
            req.on('end', () => {
                try { resolve(JSON.parse(raw)); } catch { resolve({}); }
            });
            req.on('error', reject);
        });
    }

    const { token, title, body, type, notifId } = parsedBody ?? {};

    if (!token || !body) {
        return res.status(400).json({ error: 'Missing required fields: token, body' });
    }

    try {
        // ── Build FCM message ─────────────────────────────────────────────
        // - notification block: displayed by OS even when app is closed
        // - data block: passed to the service worker for custom handling
        const message: admin.messaging.Message = {
            token,
            notification: {
                title: title || 'D-Capital CRM',
                body,
            },
            data: {
                // Data fields must all be strings
                type:    type    || 'system',
                notifId: notifId || '',
                title:   title   || 'D-Capital CRM',
                body,
            },
            // Android config — high priority to wake screen
            android: {
                priority: 'high',
                notification: {
                    icon:        'ic_stat_notification',  // must exist in android/app/src/main/res
                    color:       '#D4AF37',               // D-Capital gold accent
                    channelId:   'dcapital_default',
                    clickAction: 'FLUTTER_NOTIFICATION_CLICK',
                },
            },
            // Apple config
            apns: {
                payload: {
                    aps: {
                        sound:            'default',
                        badge:            1,
                        contentAvailable: true,
                    },
                },
            },
            // Web push config
            webpush: {
                headers: {
                    Urgency: 'high',
                },
                notification: {
                    title:          title || 'D-Capital CRM',
                    body,
                    icon:           '/icon-192x192.png',
                    badge:          '/icon-192x192.png',
                    requireInteraction: false,
                    tag:            notifId || 'dcapital-notif',
                },
                fcmOptions: {
                    link: '/',
                },
            },
        };

        const messageId = await admin.messaging().send(message);
        console.log('[send-push] ✅ Message sent:', messageId);
        return res.status(200).json({ success: true, messageId });

    } catch (err: any) {
        console.error('[send-push] Error sending FCM message:', err);
        // Return 200 with error detail so client doesn't retry aggressively
        return res.status(200).json({ success: false, error: err?.message || 'FCM send failed' });
    }
}
