import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// ✅ ORIGINAL API KEY - dcapital-crm project
const firebaseConfig = {
    apiKey: "AIzaSyDWzGTOLsUuNi6ayarLMKPm2DcQ_bNl1OU",
    authDomain: "dcapital-crm.firebaseapp.com",
    projectId: "dcapital-crm",
    storageBucket: "dcapital-crm.firebasestorage.app",
    messagingSenderId: "1056099466561",
    appId: "1:1056099466561:web:7bed7009d614832ae975c0",
    measurementId: "G-2JNHHM6477"
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
