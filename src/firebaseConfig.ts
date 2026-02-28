import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

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
export const auth = getAuth(app);
export const storage = getStorage(app);

// 🛡️ FIX 1: Set persistence at app init level — survives page refreshes
setPersistence(auth, browserLocalPersistence)
    .then(() => console.log('✅ Firebase Auth persistence set to LOCAL'))
    .catch((err) => console.error('❌ Failed to set persistence:', err));

// 🛡️ FIX 2: Secondary app instance for creating users WITHOUT hijacking admin session
const secondaryApp = initializeApp(firebaseConfig, 'SecondaryApp');
export const secondaryAuth = getAuth(secondaryApp);

console.log('🔥 Firebase initialized — Primary + Secondary apps ready');
