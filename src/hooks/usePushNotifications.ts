import { useEffect, useRef } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { db, messaging } from '../firebaseConfig';
import { useStore } from '../store';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// VAPID Public Key — generated in Firebase Console → Project Settings →
// Cloud Messaging → Web Push certificates.
// This is the PUBLIC key (safe to expose in client code).
// ─────────────────────────────────────────────────────────────────────────────
const VAPID_KEY =
    'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDkBWseIkuokgq4Ggy4pqXqJwAR5OqDL3q-Y6yFUiEME';
// ↑ Replace this with your ACTUAL VAPID key from Firebase Console.
//   Console → Project Settings → Cloud Messaging → Web push certificates → Key pair

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
                // ── 1. Request permission ──────────────────────────────────
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    console.warn('[FCM] Notification permission denied — push disabled.');
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
                        // Continue without SW — foreground-only toasts will still work
                    }
                }

                // ── 4. Get FCM device token ───────────────────────────────
                const currentToken = await getToken(fcmInstance, {
                    vapidKey: VAPID_KEY,
                    ...(swRegistration ? { serviceWorkerRegistration: swRegistration } : {}),
                });

                if (!currentToken) {
                    console.warn('[FCM] No registration token available. Check VAPID key and SW registration.');
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

            } catch (err) {
                console.error('[FCM] Push registration error:', err);
            }
        };

        registerPush();
    }, [user?.id]);

    return null;
};
