import React, { useState } from 'react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ForgotPassword } from '../components/ForgotPassword';

export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const { login } = useStore();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const success = await login(email.trim(), password.trim(), rememberMe);
        if (success) {
            toast.success('Welcome back');
            navigate('/');
        } else {
            setError('Invalid Credentials or Access Revoked');
            toast.error('Access Denied');
        }
    };

    if (showForgotPassword) {
        return (
            <div className="h-screen flex items-center justify-center bg-black">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-800/20 via-black to-black" />
                <ForgotPassword onBack={() => setShowForgotPassword(false)} />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-black p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-800/20 via-black to-black" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 w-full max-w-md p-8 md:p-10 bg-[#1C1C1E] border border-white/10 rounded-3xl shadow-2xl"
            >
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-white tracking-tight">D-CAPITAL</h1>
                    <p className="text-gray-500 text-xs font-semibold uppercase tracking-[0.2em] mt-2">Enterprise OS v1.0</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Corporate Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-4 text-gray-500" size={20} />
                            <input
                                type="email"
                                placeholder="agent@dcapitalrealestate.com"
                                className="w-full bg-black/50 border border-white/10 p-4 pl-12 rounded-xl text-white focus:border-white/30 outline-none transition-colors font-sans"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-4 text-gray-500" size={20} />
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="w-full bg-black/50 border border-white/10 p-4 pl-12 rounded-xl text-white focus:border-white/30 outline-none transition-colors font-sans"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <label className="flex items-center gap-3 cursor-pointer touch-target">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={e => setRememberMe(e.target.checked)}
                                className="w-5 h-5 rounded border-white/10 bg-black/50 text-white focus:ring-amber-500/30"
                            />
                            <span className="text-sm text-gray-400">Remember Me</span>
                        </label>
                        <button
                            type="button"
                            onClick={() => setShowForgotPassword(true)}
                            className="text-sm text-gray-400 hover:text-white transition-colors py-2 touch-target"
                        >
                            Forgot Password?
                        </button>
                    </div>

                    {error && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-4 rounded-xl">
                            <ShieldAlert size={18} /> {error}
                        </motion.div>
                    )}

                    <button type="submit" className="w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 active:scale-[0.98] transition-all mt-4 touch-target">
                        Access Terminal <ArrowRight size={18} />
                    </button>
                </form>
                <p className="text-center text-gray-600 text-[10px] mt-8 uppercase tracking-widest">Restricted to Authorized Personnel Only</p>
            </motion.div>
        </div>
    );
};
