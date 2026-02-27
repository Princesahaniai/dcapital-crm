import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// ✅ Firebase config with unbreakable fallbacks — env vars first, hardcoded backup second
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBwHEULX6o5VjIQrz_Ud-HBT5QIZD0Bamps',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'dcapital-crm-prod.firebaseapp.com',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'dcapital-crm-prod',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'dcapital-crm-prod.firebasestorage.app',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1076500161530',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1076500161530:web:1df2319d7f1ee7d5437a43',
};

// Debug logging for production troubleshooting
console.log('🔥 Firebase Initializing...');
console.log('   Project ID:', firebaseConfig.projectId);
console.log('   Auth Domain:', firebaseConfig.authDomain);
console.log('   API Key:', firebaseConfig.apiKey ? '✅ Present' : '❌ Missing');

// Initialize Firebase Services
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

console.log('✅ Firebase initialized successfully');
