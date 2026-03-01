import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, User, Mail, Lock, ArrowRight, ShieldCheck, Zap, Globe, CheckCircle2 } from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const RegisterAgency = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        companyName: '',
        adminName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            // 1. Create Firebase Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            await updateProfile(user, {
                displayName: formData.adminName
            });

            // 2. Generate unique Company ID
            const generateCompanyId = (name: string) => {
                const base = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
                const suffix = Math.random().toString(36).substring(2, 6);
                return `${base}-${suffix}`;
            };

            const companyId = generateCompanyId(formData.companyName);

            // 3. Create Company Record
            await setDoc(doc(db, 'companies', companyId), {
                name: formData.companyName,
                createdAt: serverTimestamp(),
                status: 'active',
                plan: 'pro', // Default SaaS Plan
                adminUid: user.uid
            });

            // 4. Create CEO User Record mapped to Company
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: formData.email,
                name: formData.adminName,
                role: 'ceo',
                status: 'Active',
                companyId: companyId,
                companyName: formData.companyName,
                createdAt: new Date().toISOString(),
                joinedDate: new Date().toISOString().split('T')[0],
                loginCount: 0,
                totalSales: 0,
                commissionEarned: 0
            });

            // 5. Initialize base Settings for this Company
            await setDoc(doc(db, 'settings_by_company', companyId), {
                autoRouting: false,
                routingStrategy: 'manual',
                lastAssignedIndex: 0,
                companyId: companyId
            });

            toast.success('Agency Workspace Initialized Successfully!');

            // Allow state to settle then redirect
            setTimeout(() => {
                navigate('/');
            }, 1000);

        } catch (error: any) {
            console.error('Registration Error:', error);
            if (error.code === 'auth/email-already-in-use') {
                toast.error('This email is already registered.');
            } else if (error.code === 'auth/weak-password') {
                toast.error('Password is too weak. Please use at least 6 characters.');
            } else {
                toast.error('Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 selection:bg-purple-500/30">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-[20%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }} />
                <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] mix-blend-screen animate-pulse" style={{ animationDuration: '7s' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-[1000px] grid grid-cols-1 lg:grid-cols-2 bg-[#0D0D0D] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl shadow-purple-900/20 relative z-10"
            >
                {/* Left Panel - Branding & Value Prop */}
                <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-purple-900/50 via-[#0D0D0D] to-[#0D0D0D] border-r border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-12">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                                <Building2 size={24} className="text-white" />
                            </div>
                            <span className="text-2xl font-bold text-white tracking-tight">D-Capital <span className="text-purple-400">OS</span></span>
                        </div>

                        <h1 className="text-4xl font-bold text-white leading-tight mb-6">
                            Deploy your entire real estate brokerage in <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">seconds.</span>
                        </h1>
                        <p className="text-gray-400 text-lg mb-12 leading-relaxed">
                            A fully isolated, multi-tenant environment featuring an AI quoting engine, secure deal vaults, and automated lead routing.
                        </p>

                        <div className="space-y-6">
                            {[
                                { icon: ShieldCheck, text: "Cryptographic Data Isolation (Iron Wall)" },
                                { icon: Zap, text: "Instant Edge-Network Workspace Provisioning" },
                                { icon: Globe, text: "Universal Portal Lead Routing (Bayut/PropertyFinder)" }
                            ].map((feature, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + (idx * 0.1) }}
                                    key={idx}
                                    className="flex items-center gap-4"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                                        <feature.icon size={16} className="text-purple-400" />
                                    </div>
                                    <span className="text-gray-300 font-medium">{feature.text}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="relative z-10 mt-12 pt-8 border-t border-white/10 flex items-center gap-4">
                        <div className="flex -space-x-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className={`w-10 h-10 rounded-full border-2 border-[#0D0D0D] bg-zinc-800 flex items-center justify-center overflow-hidden`}>
                                    <User size={18} className="text-zinc-500" />
                                </div>
                            ))}
                        </div>
                        <div className="text-sm">
                            <p className="text-white font-semibold">Join 500+ Brokerages</p>
                            <p className="text-purple-400">Scaling with D-Capital</p>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Form */}
                <div className="p-8 lg:p-12 flex flex-col justify-center relative bg-[#0D0D0D]">
                    <div className="max-w-md w-full mx-auto">
                        <div className="text-center lg:text-left mb-10">
                            <h2 className="text-3xl font-bold text-white mb-3">Create Workspace</h2>
                            <p className="text-gray-400">Setup your administrator account and company profile.</p>
                        </div>

                        <form onSubmit={handleRegister} className="space-y-5">
                            {/* Step Indicators */}
                            <div className="flex items-center gap-2 mb-8">
                                <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-white/10'}`}></div>
                                <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-white/10'}`}></div>
                            </div>

                            {step === 1 ? (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-5"
                                >
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Company Name</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Building2 size={18} className="text-gray-500" />
                                            </div>
                                            <input
                                                type="text"
                                                required
                                                value={formData.companyName}
                                                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                                className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-medium"
                                                placeholder="e.g. Prestige Real Estate"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Admin Name</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <User size={18} className="text-gray-500" />
                                            </div>
                                            <input
                                                type="text"
                                                required
                                                value={formData.adminName}
                                                onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                                                className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-medium"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (formData.companyName && formData.adminName) setStep(2);
                                        }}
                                        disabled={!formData.companyName || !formData.adminName}
                                        className="w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-8"
                                    >
                                        Continue to Security <ArrowRight size={18} />
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-5"
                                >
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Admin Email</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Mail size={18} className="text-gray-500" />
                                            </div>
                                            <input
                                                type="email"
                                                required
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-medium"
                                                placeholder="admin@company.com"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Master Password</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Lock size={18} className="text-gray-500" />
                                            </div>
                                            <input
                                                type="password"
                                                required
                                                minLength={6}
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-medium"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <CheckCircle2 size={18} className="text-gray-500" />
                                            </div>
                                            <input
                                                type="password"
                                                required
                                                minLength={6}
                                                value={formData.confirmPassword}
                                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-medium"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 mt-8">
                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="px-6 py-4 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 transition-colors"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading || !formData.email || !formData.password}
                                            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? (
                                                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>Provision Workspace <Zap size={18} /></>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </form>

                        <p className="text-center text-gray-500 text-sm mt-8">
                            Already have a workspace? <button onClick={() => navigate('/login')} className="text-purple-400 hover:text-purple-300 font-medium transition-colors">Sign in here</button>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
