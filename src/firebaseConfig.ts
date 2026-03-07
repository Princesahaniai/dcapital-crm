import { initializeApp } from 'firebase/app';
import { getFirestore, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';

// 🔥 Firebase config — hardcoded for unbreakable production
const firebaseConfig = {
    apiKey: 'AIzaSyAfEzLNrvSMWUiYc89vLSIO96w8_x22Jek',
    authDomain: 'dcapital-crm-prod.firebaseapp.com',
    projectId: 'dcapital-crm-prod',
    storageBucket: 'dcapital-crm-prod.firebasestorage.app',
    messagingSenderId: '1076500161530',
    appId: '1:1076500161530:web:1df2319d7f1ee7d5437a43',
};

// Initialize PRIMARY Firebase app (for login, data, storage)
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// 🛡️ Enable Offline Persistence setup
enableMultiTabIndexedDbPersistence(db)
    .then(() => console.log('✅ Firebase Cache persistence enabled'))
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('⚠️ Multiple tabs open, persistence can only be enabled in one tab at a a time.');
        } else if (err.code === 'unimplemented') {
            console.warn('⚠️ The current browser does not support all of the features required to enable persistence');
        }
    });
export const auth = getAuth(app);
export const storage = getStorage(app);
export let messaging: any = null;

isSupported().then((supported) => {
    if (supported) {
        messaging = getMessaging(app);
        console.log('✅ Firebase Messaging supported and initialized');
    } else {
        console.warn('⚠️ Firebase Messaging is NOT supported in this browser');
    }
});

// 🛡️ FIX 1: Set persistence at app init level — survives page refreshes
setPersistence(auth, browserLocalPersistence)
    .then(() => console.log('✅ Firebase Auth persistence set to LOCAL'))
    .catch((err) => console.error('❌ Failed to set persistence:', err));

// 🛡️ FIX 2: Secondary app instance for creating users WITHOUT hijacking admin session
const secondaryApp = initializeApp(firebaseConfig, 'SecondaryApp');
export const secondaryAuth = getAuth(secondaryApp);

console.log('🔥 Firebase initialized — Primary + Secondary apps ready');
