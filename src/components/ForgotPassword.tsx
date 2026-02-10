import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateResetToken } from '../utils/password';

interface ForgotPasswordProps {
    onBack: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack }) => {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            toast.error('Please enter your email');
            return;
        }

        // Generate reset token (mock for now)
        const token = generateResetToken();
        // Reset token generated for email

        // In production, this would send an email with reset link
        toast.success('Password reset link sent to your email');
        setSent(true);
    };

    if (sent) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 w-full max-w-md p-10 bg-[#1C1C1E] border border-white/10 rounded-3xl shadow-2xl text-center"
            >
                <div className="mb-6">
                    <CheckCircle className="mx-auto text-green-500" size={64} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">Check Your Email</h2>
                <p className="text-gray-400 mb-8">
                    We've sent a password reset link to <span className="text-white font-semibold">{email}</span>
                </p>
                <button
                    onClick={onBack}
                    className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors"
                >
                    Back to Login
                </button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 w-full max-w-md p-10 bg-[#1C1C1E] border border-white/10 rounded-3xl shadow-2xl"
        >
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
            >
                <ArrowLeft size={18} /> Back to Login
            </button>

            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white tracking-tight">Forgot Password?</h1>
                <p className="text-gray-500 text-sm mt-2">Enter your email to receive a reset link</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-3.5 text-gray-500" size={18} />
                        <input
                            type="email"
                            placeholder="your.email@dcapitalrealestate.com"
                            className="w-full bg-black/50 border border-white/10 p-3 pl-12 rounded-xl text-white focus:border-white/30 outline-none transition-colors"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors mt-6"
                >
                    Send Reset Link
                </button>
            </form>
        </motion.div>
    );
};
