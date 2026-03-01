import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Building2, Phone } from 'lucide-react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';

export const Paywall = () => {
    const logout = useStore(state => state.logout);
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 selection:bg-red-500/30">
            {/* Dark Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-[20%] w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }} />
                <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-orange-600/5 rounded-full blur-[150px] mix-blend-screen animate-pulse" style={{ animationDuration: '7s' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-lg bg-[#0D0D0D] border border-red-500/20 p-8 md:p-12 rounded-[2rem] shadow-2xl relative z-10 text-center"
            >
                <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-8 relative">
                    <ShieldAlert size={40} className="text-red-500 relative z-10" />
                    {/* Ripple effect */}
                    <div className="absolute inset-0 bg-red-500/20 rounded-2xl animate-ping" style={{ animationDuration: '3s' }} />
                </div>

                <h1 className="text-3xl font-bold text-white mb-4">Subscription Suspended</h1>

                <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                    Your agency's access to D-Capital OS has been temporarily restricted due to an inactive subscription.
                </p>

                <div className="bg-[#1A1A1A] border border-white/5 rounded-xl p-6 mb-8 text-left">
                    <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                        <Building2 size={16} className="text-gray-400" />
                        Next Steps
                    </h3>
                    <p className="text-sm text-gray-500">
                        Please contact the master administrator at <strong className="text-gray-300">D Capital Real Estate L.L.C.</strong> to renew your license and instantly restore access to your entire pipeline, clients, and assets.
                    </p>

                    <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <ShieldAlert size={14} className="text-amber-500" />
                            <span>Your data is frozen but strictly preserved.</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-100 transition-colors"
                >
                    Return to Login
                </button>
            </motion.div>
        </div>
    );
};
