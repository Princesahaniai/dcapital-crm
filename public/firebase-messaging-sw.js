// ─────────────────────────────────────────────────────────────────────────────
// D-Capital CRM — Firebase Cloud Messaging Service Worker
// Handles BACKGROUND push notifications when the app tab is closed/minimised.
//
// This file MUST live at /public/firebase-messaging-sw.js so Firebase can
// auto-register it at the root scope (/firebase-messaging-sw.js).
//
// Uses the firebase compat SDK (importScripts) because ES modules are not
// supported in service workers in all browsers yet.
// ─────────────────────────────────────────────────────────────────────────────

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: 'AIzaSyAfEzLNrvSMWUiYc89vLSIO96w8_x22Jek',
    authDomain: 'dcapital-crm-prod.firebaseapp.com',
    projectId: 'dcapital-crm-prod',
    storageBucket: 'dcapital-crm-prod.firebasestorage.app',
    messagingSenderId: '1076500161530',
    appId: '1:1076500161530:web:1df2319d7f1ee7d5437a43',
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// ─── BACKGROUND MESSAGE HANDLER ──────────────────────────────────────────────
// Fires when the app is NOT in the foreground (tab hidden, minimised, closed).
// FCM delivers the payload here; we call showNotification to display the OS alert.
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Background FCM message received:', payload);

    // Support both notification payloads and data-only payloads
    const title  = payload.notification?.title  || payload.data?.title  || 'D-Capital CRM';
    const body   = payload.notification?.body   || payload.data?.body   || 'You have a new update.';
    const type   = payload.data?.type || 'system';
    const notifId = payload.data?.notifId || '';

    // Choose badge emoji based on type
    const iconMap = {
        assignment: '/icon-192x192.png',
        update:     '/icon-192x192.png',
        alert:      '/icon-192x192.png',
    };

    const options = {
        body,
        icon:    iconMap[type] || '/icon-192x192.png',
        badge:   '/icon-192x192.png',   // Small monochrome icon shown in status bar (Android)
        vibrate: [200, 100, 200],        // Vibration pattern: buzz–pause–buzz
        tag:     notifId || title,       // Collapse identical notifications (replaces previous)
        renotify: false,                 // Don't re-vibrate if tag matches an existing notification
        requireInteraction: false,       // Auto-dismiss after OS default timeout
        silent: false,
        data: {
            url: '/',                    // URL to open when user taps the notification
            type,
            notifId,
        },
    };

    self.registration.showNotification(title, options);
});

// ─── NOTIFICATION CLICK HANDLER ──────────────────────────────────────────────
// Fires when the user taps/clicks the OS notification.
// Opens (or focuses) the CRM tab and closes the notification.
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetUrl = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If a CRM tab is already open, focus it
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise open a new tab
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
