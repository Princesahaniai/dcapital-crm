/**
 * PRODUCTION USER CREATOR
 * 
 * This script creates users directly in your Firebase project (dcapital-crm).
 * Run this locally to add team members to production.
 * 
 * Usage:
 *   npm install firebase-admin
 *   node scripts/create-production-user.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin with your project credentials
// You'll need to download service account key from Firebase Console
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://dcapital-crm.firebaseio.com"
});

const auth = admin.auth();
const db = admin.firestore();

// TEAM MEMBERS TO CREATE
const teamMembers = [
    {
        email: 'rashmi@dcapitalrealestate.com',
        name: 'Ms.Rashmi Tewatia',
        role: 'agent',
        department: 'Corporate Head',
        tempPassword: 'Rashmi@123!'
    },
    {
        email: 'ajay@dcapitalrealestate.com',
        name: 'Ajay Kumar',
        role: 'ceo',
        department: 'Executive',
        tempPassword: 'Ajay@123!'
    }
    // Add more team members here
];

async function createUser(userData) {
    try {
        console.log(`\n📋 Creating: ${userData.email}`);

        // 1. Create Firebase Auth user
        const userRecord = await auth.createUser({
            email: userData.email,
            password: userData.tempPassword,
            displayName: userData.name,
            emailVerified: false
        });

        console.log(`  ✓ Firebase Auth created (UID: ${userRecord.uid})`);

        // 2. Create Firestore profile
        await db.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            department: userData.department || '',
            status: 'Active', // Active so they can login immediately
            tempPassword: userData.tempPassword, // Store for reference
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            invitedAt: admin.firestore.FieldValue.serverTimestamp(),
            totalSales: 0,
            commissionEarned: 0
        });

        console.log(`  ✓ Firestore profile created`);
        console.log(`  📧 Email: ${userData.email}`);
        console.log(`  🔑 Password: ${userData.tempPassword}`);
        console.log(`  ✅ SUCCESS - User can now login!`);

        return { success: true, uid: userRecord.uid };

    } catch (error) {
        if (error.code === 'auth/email-already-exists') {
            console.log(`  ℹ️  User already exists, updating Firestore profile...`);

            try {
                // Get existing user
                const existingUser = await auth.getUserByEmail(userData.email);

                // Update Firestore profile
                await db.collection('users').doc(existingUser.uid).set({
                    uid: existingUser.uid,
                    email: userData.email,
                    name: userData.name,
                    role: userData.role,
                    department: userData.department || '',
                    status: 'Active',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });

                console.log(`  ✓ Firestore profile updated`);
                console.log(`  ℹ️  Password unchanged (use existing password or reset)`);

                return { success: true, uid: existingUser.uid, updated: true };
            } catch (updateError) {
                console.error(`  ✗ Failed to update: ${updateError.message}`);
                return { success: false, error: updateError };
            }
        } else {
            console.error(`  ✗ Failed: ${error.message}`);
            return { success: false, error };
        }
    }
}

async function createAllUsers() {
    console.log('🚀 D-CAPITAL CRM - Production User Creator');
    console.log('==========================================\n');
    console.log(`Creating ${teamMembers.length} users in Firebase project: dcapital-crm\n`);

    const results = {
        created: 0,
        updated: 0,
        failed: 0
    };

    for (const member of teamMembers) {
        const result = await createUser(member);
        if (result.success) {
            if (result.updated) {
                results.updated++;
            } else {
                results.created++;
            }
        } else {
            results.failed++;
        }
    }

    console.log('\n==========================================');
    console.log('📊 Summary:');
    console.log(`  ✅ Created: ${results.created}`);
    console.log(`  🔄 Updated: ${results.updated}`);
    console.log(`  ❌ Failed: ${results.failed}`);
    console.log('==========================================\n');

    if (results.created > 0 || results.updated > 0) {
        console.log('🎉 Users are ready! They can login at:');
        console.log('   https://dcapital-crm.vercel.app/login\n');
    }

    process.exit(0);
}

createAllUsers().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
