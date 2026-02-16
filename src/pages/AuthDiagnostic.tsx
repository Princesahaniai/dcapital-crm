import React, { useState } from 'react';
import { useStore } from '../store';
import { auth, db } from '../firebaseConfig';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDocs, collection, setDoc, deleteDoc } from 'firebase/firestore';
import { Users, AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface DiagnosticResult {
    email: string;
    name: string;
    status: string;
    hasFirestoreProfile: boolean;
    hasFirebaseAuth: boolean | 'unknown';
    issue?: string;
    recommendation?: string;
}

export const AuthDiagnostic = () => {
    const { user, team } = useStore();
    const [results, setResults] = useState<DiagnosticResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [fixing, setFixing] = useState<string | null>(null);

    // Only allow CEO/Admin access
    if (!user || (user.role !== 'ceo' && user.role !== 'admin')) {
        return (
            <div className="p-8 text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white">Access Denied</h2>
                <p className="text-zinc-400">This diagnostic tool is only available to CEO and Admin users.</p>
            </div>
        );
    }

    const runDiagnostics = async () => {
        setLoading(true);
        setResults([]);
        try {
            // Fetch all users from Firestore
            const querySnapshot = await getDocs(collection(db, 'users'));
            const diagnostics: DiagnosticResult[] = [];

            for (const docSnap of querySnapshot.docs) {
                const userData = docSnap.data();
                const result: DiagnosticResult = {
                    email: userData.email || 'unknown',
                    name: userData.name || 'Unknown',
                    status: userData.status || 'unknown',
                    hasFirestoreProfile: true,
                    hasFirebaseAuth: 'unknown'
                };

                // Check if doc ID matches typical Firebase Auth UID format (28 chars)
                if (docSnap.id.length === 28) {
                    result.hasFirebaseAuth = true;
                } else {
                    result.hasFirebaseAuth = false;
                    result.issue = 'Firestore user created without Firebase Auth account';
                    result.recommendation = 'User needs to complete invitation flow or admin needs to create Firebase Auth account';
                }

                // Check status
                if (result.status === 'Pending') {
                    result.issue = 'User invited but has not set password yet';
                    result.recommendation = 'Resend invitation link or use "Fix User" button';
                }

                diagnostics.push(result);
            }

            setResults(diagnostics);
            toast.success(`Diagnostics complete: ${diagnostics.length} users scanned`);
        } catch (error) {
            console.error('[DIAGNOSTIC] Error:', error);
            toast.error('Diagnostic scan failed: ' + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const fixUser = async (userEmail: string) => {
        setFixing(userEmail);
        try {
            // Strategy: Send password reset email so user can set their own password
            await sendPasswordResetEmail(auth, userEmail);
            toast.success(`Password reset email sent to ${userEmail}. They can now complete setup.`);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                toast.error(`No Firebase Auth account for ${userEmail}. User must complete invitation link first.`);
            } else {
                toast.error('Fix failed: ' + error.message);
            }
        } finally {
            setFixing(null);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="w-8 h-8 text-amber-500" />
                        <h1 className="text-3xl font-bold">Firebase Auth Diagnostic Tool</h1>
                    </div>
                    <p className="text-zinc-400">Scan all users to identify authentication issues and provide fixes.</p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
                    <h2 className="text-lg font-bold mb-4">How Firebase Auth Works in This System</h2>
                    <div className="space-y-3 text-sm text-zinc-300">
                        <div className="flex gap-3">
                            <div className="text-amber-500 font-bold">1.</div>
                            <div>
                                <strong>Admin invites user:</strong> Creates Firestore record with <code className="bg-black/50 px-2 py-1 rounded">status: "Pending"</code> and
                                generates invitation token.
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="text-amber-500 font-bold">2.</div>
                            <div>
                                <strong>User clicks invitation link:</strong> Navigates to <code className="bg-black/50 px-2 py-1 rounded">/set-password?token=...</code>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="text-amber-500 font-bold">3.</div>
                            <div>
                                <strong>User sets password:</strong> <code className="bg-black/50 px-2 py-1 rounded">createUserWithEmailAndPassword()</code> creates Firebase Auth account.
                                Firestore doc is updated with <code className="bg-black/50 px-2 py-1 rounded">status: "Active"</code> and UID as document ID.
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="text-amber-500 font-bold">4.</div>
                            <div>
                                <strong>User can now login:</strong> Uses <code className="bg-black/50 px-2 py-1 rounded">signInWithEmailAndPassword()</code> across any browser.
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={runDiagnostics}
                    disabled={loading}
                    className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-6 py-3 rounded-xl flex items-center gap-2 mb-6 disabled:opacity-50"
                >
                    <RefreshCw className={loading ? 'animate-spin' : ''} size={18} />
                    {loading ? 'Scanning...' : 'Run Diagnostics'}
                </button>

                {results.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold mb-4">Diagnostic Results ({results.length} users)</h2>
                        {results.map((result, idx) => (
                            <div
                                key={idx}
                                className={`bg-zinc-900 border rounded-xl p-6 ${result.issue ? 'border-red-500/30' : 'border-green-500/30'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            {result.issue ? (
                                                <XCircle className="w-5 h-5 text-red-500" />
                                            ) : (
                                                <CheckCircle className="w-5 h-5 text-green-500" />
                                            )}
                                            <div>
                                                <h3 className="font-bold text-white">{result.name}</h3>
                                                <p className="text-sm text-zinc-400">{result.email}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                                            <div>
                                                <span className="text-zinc-500">Status:</span>{' '}
                                                <span className={result.status === 'Active' ? 'text-green-400' : result.status === 'Pending' ? 'text-yellow-400' : 'text-red-400'}>
                                                    {result.status}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-zinc-500">Firestore Profile:</span>{' '}
                                                <span className="text-green-400">✓ Yes</span>
                                            </div>
                                            <div>
                                                <span className="text-zinc-500">Firebase Auth Account:</span>{' '}
                                                <span className={
                                                    result.hasFirebaseAuth === true ? 'text-green-400' :
                                                        result.hasFirebaseAuth === false ? 'text-red-400' :
                                                            'text-yellow-400'
                                                }>
                                                    {result.hasFirebaseAuth === true ? '✓ Yes' :
                                                        result.hasFirebaseAuth === false ? '✗ No' :
                                                            '? Unknown'}
                                                </span>
                                            </div>
                                        </div>

                                        {result.issue && (
                                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-2">
                                                <p className="text-red-400 font-semibold text-sm mb-1">⚠️ Issue:</p>
                                                <p className="text-red-300 text-xs">{result.issue}</p>
                                            </div>
                                        )}

                                        {result.recommendation && (
                                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                                                <p className="text-amber-400 font-semibold text-sm mb-1">💡 Recommendation:</p>
                                                <p className="text-amber-200 text-xs">{result.recommendation}</p>
                                            </div>
                                        )}
                                    </div>

                                    {result.issue && (
                                        <button
                                            onClick={() => fixUser(result.email)}
                                            disabled={fixing === result.email}
                                            className="ml-4 bg-amber-500 hover:bg-amber-600 text-black font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                                        >
                                            {fixing === result.email ? 'Fixing...' : 'Send Reset'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
