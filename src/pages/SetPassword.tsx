import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { doc, getDocs, query, collection, where, setDoc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { Lock, ArrowRight, ShieldCheck, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export const SetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [validToken, setValidToken] = useState<boolean | null>(null);
    const [userData, setUserData] = useState<any>(null);

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setValidToken(false);
                return;
            }

            try {
                // Find user with this token
                const q = query(collection(db, 'users'), where('invitationToken', '==', token));
                const snapshot = await getDocs(q);

                if (snapshot.empty) {
                    setValidToken(false);
                    return;
                }

                const userDoc = snapshot.docs[0];
                const data = userDoc.data();

                // Check expiry
                if (data.invitationExpires && Date.now() > data.invitationExpires) {
                    toast.error('Invitation expired');
                    setValidToken(false);
                    return;
                }

                setUserData({ id: userDoc.id, ...data });
                setValidToken(true);
            } catch (error) {
                console.error('Token verification failed:', error);
                setValidToken(false);
            }
        };

        verifyToken();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userData || !token) return;

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        setLoading(true);
        try {
            // 1. Create Firebase Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, userData.email, password);

            // 2. Create NEW user doc with UID as ID
            const uid = userCredential.user.uid;
            await setDoc(doc(db, 'users', uid), {
                ...userData,
                id: uid, // Ensure ID matches Auth UID
                status: 'Active',
                invitationToken: null,
                invitationExpires: null,
                uid: uid,
                passwordSetAt: Date.now()
            });

            // 3. Delete OLD invitation doc (if it had a different ID)
            if (userData.id !== uid) {
                await deleteDoc(doc(db, 'users', userData.id));
            }

            toast.success('Account Activated! Redirecting...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (error: any) {
            console.error('Activation failed:', error);
            if (error.code === 'auth/email-already-in-use') {
                toast.error('Email already registered. Please login.');
                navigate('/login');
            } else {
                toast.error('Failed to set password: ' + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    if (validToken === null) {
        return <div className="min-h-screen bg-black flex items-center justify-center text-white">Verifying Invitation...</div>;
    }

    if (validToken === false) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <div className="bg-[#1C1C1E] p-8 rounded-3xl border border-red-500/30 text-center max-w-md w-full">
                    <ShieldCheck className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-white mb-2">Invalid or Expired Link</h1>
                    <p className="text-zinc-400 mb-6">This invitation link is invalid or has expired. Please ask your administrator for a new invitation.</p>
                    <button onClick={() => navigate('/login')} className="bg-white text-black px-6 py-3 rounded-xl font-bold w-full hover:bg-zinc-200 transition-colors">Go to Login</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-black p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#D4AF37]/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 w-full max-w-md p-8 bg-[#1C1C1E]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl"
            >
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#D4AF37] to-amber-700 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-amber-900/20">
                        <ShieldCheck className="text-white w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Welcome, {userData?.name}</h1>
                    <p className="text-zinc-400 text-sm mt-2">Set your password to activate your account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">New Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#D4AF37] transition-colors" size={18} />
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="w-full bg-black/50 border border-white/10 p-4 pl-12 rounded-xl text-white focus:border-[#D4AF37] outline-none transition-all placeholder:text-zinc-700"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                minLength={8}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Confirm Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#D4AF37] transition-colors" size={18} />
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="w-full bg-black/50 border border-white/10 p-4 pl-12 rounded-xl text-white focus:border-[#D4AF37] outline-none transition-all placeholder:text-zinc-700"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                required
                                minLength={8}
                            />
                            {confirmPassword && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    {password === confirmPassword ? (
                                        <Check className="text-green-500 w-5 h-5" />
                                    ) : (
                                        <X className="text-red-500 w-5 h-5" />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading || password !== confirmPassword || password.length < 8}
                            className="w-full bg-[#D4AF37] text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#B8962F] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {loading ? 'Activating Account...' : 'Set Password & Login'}
                            {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </div>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-xs text-zinc-500">
                        By activating your account, you agree to the <br />
                        <span className="text-zinc-400 hover:text-white cursor-pointer transition-colors">Terms of Service</span> & <span className="text-zinc-400 hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};
