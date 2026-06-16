import { useEffect, useRef } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { db, messaging } from '../firebaseConfig';
import { useStore } from '../store';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// VAPID Public Key — loaded from the Vite environment variable.
// Set VITE_FIREBASE_VAPID_KEY in:
//   • .env.local          (local dev)
//   • Vercel dashboard    (production) → Settings → Environment Variables
// Value: Firebase Console → Project Settings → Cloud Messaging →
//        Web push certificates → Key pair (the long base64url string)
// ─────────────────────────────────────────────────────────────────────────────
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

if (!VAPID_KEY) {
    console.error(
        '[FCM] ❌ VITE_FIREBASE_VAPID_KEY is not set.\n' +
        '  Push notifications will NOT work until this env variable is defined.\n' +
        '  → Add it to .env.local for dev, and to Vercel Environment Variables for prod.\n' +
        '  → Get the value from: Firebase Console → Project Settings → Cloud Messaging → Web push certificates'
    );
}

/**
 * usePushNotifications
 *
 * Responsibilities:
 *  1. Request browser Notification permission
 *  2. Register the Firebase Messaging service worker
 *  3. Obtain an FCM device token (using the VAPID key)
 *  4. Persist the token to the user's Firestore document (users/{uid}.fcmToken)
 *  5. Listen for FOREGROUND FCM messages and display them as toasts
 *  6. Refresh the token if Firebase rotates it
 *
 * Background messages (locked screen / tab closed) are handled entirely by
 * the service worker at public/firebase-messaging-sw.js.
 */
export const usePushNotifications = () => {
    const user = useStore(state => state.user);
    const registeredUid = useRef<string | null>(null);

    useEffect(() => {
        if (!user?.id) return;
        // Only register once per user session
        if (registeredUid.current === user.id) return;

        const registerPush = async () => {
            try {
                // ── 1. Request permission ─────────────────────────────────
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    // Visible on-screen error — user can see this without opening DevTools
                    toast.error(
                        `⛔ Push Notifications Blocked\nOpen browser Settings → Site Permissions → Notifications → Allow for this site.`,
                        { duration: 10000, style: { whiteSpace: 'pre-line', maxWidth: '420px' } }
                    );
                    console.warn('[FCM] Notification permission denied.');
                    return;
                }

                // ── 2. Wait for messaging to be initialized (it's async) ──
                // messaging is set via isSupported().then() in firebaseConfig.ts
                // Poll briefly to avoid a race condition on first load
                let fcmInstance = messaging;
                if (!fcmInstance) {
                    await new Promise<void>(resolve => setTimeout(resolve, 1500));
                    // Re-read the module-level export after init
                    const config = await import('../firebaseConfig');
                    fcmInstance = config.messaging;
                }
                if (!fcmInstance) {
                    toast.error('Push Error: Firebase Messaging is not supported in this browser. Use Chrome or Edge on desktop.');
                    console.warn('[FCM] Firebase Messaging not supported in this browser.');
                    return;
                }

                // ── 3. Register service worker explicitly ──────────────────
                // Ensures the SW is at the correct scope before getToken runs.
                let swRegistration: ServiceWorkerRegistration | undefined;
                if ('serviceWorker' in navigator) {
                    try {
                        swRegistration = await navigator.serviceWorker.register(
                            '/firebase-messaging-sw.js',
                            { scope: '/' }
                        );
                        await navigator.serviceWorker.ready;
                        console.log('[FCM] Service worker registered:', swRegistration.scope);
                    } catch (swErr) {
                        console.error('[FCM] Service worker registration failed:', swErr);
                        toast.error('Push Error: Service Worker failed to register. Try refreshing the page or clearing browser cache.');
                        // Continue without SW — foreground-only toasts will still work
                    }
                }

                // ── 4. Get FCM device token ───────────────────────────────
                if (!VAPID_KEY) {
                    toast.error('Push Error: VAPID Key Missing — contact your system administrator to set VITE_FIREBASE_VAPID_KEY in Vercel.');
                    console.error('[FCM] ❌ Cannot call getToken — VITE_FIREBASE_VAPID_KEY is undefined.');
                    return;
                }

                let currentToken: string | null = null;
                try {
                    currentToken = await getToken(fcmInstance, {
                        vapidKey: VAPID_KEY,
                        ...(swRegistration ? { serviceWorkerRegistration: swRegistration } : {}),
                    });
                } catch (tokenErr: any) {
                    // Map Firebase error codes to human-readable on-screen messages
                    const code: string = tokenErr?.code ?? '';
                    let friendlyMsg = 'Push Error: Failed to generate device token.';

                    if (code.includes('permission-blocked') || code.includes('permission-denied')) {
                        friendlyMsg = 'Push Error: Browser Blocked Notifications — enable them in Site Settings and refresh.';
                    } else if (code.includes('unsupported-browser')) {
                        friendlyMsg = 'Push Error: This browser does not support push notifications. Use Chrome or Edge.';
                    } else if (code.includes('installation-id') || code.includes('iid-token')) {
                        friendlyMsg = 'Push Error: Token fetch failed (IID) — try clearing browser data and refreshing.';
                    } else if (code.includes('sw-registration')) {
                        friendlyMsg = 'Push Error: Service Worker not ready — refresh the page and try again.';
                    } else if (tokenErr?.message) {
                        friendlyMsg = `Push Error: ${tokenErr.message}`;
                    }

                    toast.error(friendlyMsg, { duration: 12000, style: { maxWidth: '440px' } });
                    console.error('[FCM] ❌ getToken() failed:', code, tokenErr);
                    return;
                }

                if (!currentToken) {
                    toast.error('Push Error: Device token is empty — VAPID key may be invalid. Regenerate it in Firebase Console → Project Settings → Cloud Messaging.', { duration: 10000 });
                    console.error('[FCM] ❌ getToken() returned empty — no device token generated.');
                    return;
                }

                console.log('[FCM] ✅ Device token obtained:', currentToken.substring(0, 20) + '…');

                // ── 5. Persist token to Firestore ─────────────────────────
                // Stored under users/{uid} so the server-side notification sender
                // (Cloud Function / Vercel Edge Function) can look it up and call
                // admin.messaging().send({ token, notification: { title, body } })
                try {
                    const userRef = doc(db, 'users', user.id);
                    await updateDoc(userRef, {
                        fcmToken: currentToken,
                        fcmTokenUpdatedAt: Date.now(),
                        companyId: user.companyId || null,
                    });
                    console.log('[FCM] ✅ Token saved to Firestore for user:', user.id);
                } catch (firestoreErr) {
                    console.error('[FCM] Failed to save token to Firestore:', firestoreErr);
                }

                registeredUid.current = user.id;

                // ── 6. Foreground message listener ────────────────────────
                // When the app IS in the foreground, FCM bypasses the SW
                // and delivers here. We show a rich toast instead.
                const unsubForeground = onMessage(fcmInstance, (payload) => {
                    console.log('[FCM] Foreground message:', payload);

                    const title = payload.notification?.title || payload.data?.title || 'D-Capital CRM';
                    const body  = payload.notification?.body  || payload.data?.body  || 'New notification';
                    const type  = payload.data?.type || 'system';

                    const icon = type === 'assignment' ? '📋'
                               : type === 'update'     ? '📝'
                               : type === 'alert'      ? '⚠️'
                               : '🔔';

                    toast(`${icon} ${body}`, {
                        duration: 6000,
                        style: {
                            background: '#1C1C1E',
                            color: '#fff',
                            border: '1px solid #333',
                            fontSize: '13px',
                            maxWidth: '380px',
                        },
                    });
                });

                // Cleanup foreground listener when user changes / unmounts
                return () => unsubForeground();

            } catch (err: any) {
                const msg = err?.message ? `Push Setup Error: ${err.message}` : 'Push Setup Error: Unknown failure during notification registration.';
                toast.error(msg, { duration: 10000 });
                console.error('[FCM] Push registration error:', err);
            }
        };

        registerPush();
    }, [user?.id]);

    return null;
};
