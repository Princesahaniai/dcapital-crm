import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// ✅ NEW UNRESTRICTED API KEY - Using Project Number
const firebaseConfig = {
    apiKey: "AIzaSyBwHEULX6o5VjIQrz_Ud-HBT5QIZD0Bamps",
    authDomain: "dcapital-crm-prod.firebaseapp.com",
    projectId: "dcapital-crm-prod",
    storageBucket: "dcapital-crm-prod.firebasestorage.app",
    messagingSenderId: "1076500161530",
    appId: "1:1076500161530:web:1df2319d7f1ee7d5437a43",
    measurementId: "G-9HKRJBQYSG"
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
console.log('   Current URL:', window.location.origin);
