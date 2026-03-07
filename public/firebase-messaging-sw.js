importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

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

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification?.title || 'D-Capital OS';
    const notificationOptions = {
        body: payload.notification?.body || 'You have a new notification.',
        icon: '/pwa-192x192.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
