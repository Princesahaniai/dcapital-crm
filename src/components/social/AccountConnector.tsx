import React, { useEffect, useState } from 'react';
import { Instagram, Facebook, Linkedin, Video, CheckCircle, XCircle, AlertCircle, RefreshCw, Plus } from 'lucide-react';
import { getConnectedAccounts, connectAccount, SocialAccount } from '../../services/antigravity/accounts';
import toast from 'react-hot-toast';

const platformIcons: Record<string, any> = {
    instagram: Instagram,
    facebook: Facebook,
    linkedin: Linkedin,
    tiktok: Video,
    twitter: () => <span className="font-bold text-lg">X</span>
};

export const AccountConnector = () => {
    const [accounts, setAccounts] = useState<SocialAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState<string | null>(null);

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        try {
            const data = await getConnectedAccounts();
            setAccounts(data);
        } catch (error) {
            toast.error("Failed to load accounts");
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async (platform: string) => {
        setConnecting(platform);
        try {
            const newAccount = await connectAccount(platform);
            setAccounts(prev => [...prev.filter(a => a.platform !== platform), newAccount]);
            toast.success(`Connected to ${platform}!`);
        } catch (error) {
            toast.error(`Connection failed for ${platform}`);
        } finally {
            setConnecting(null);
        }
    };

    // Helper to find account status
    const getAccountParams = (platform: string) => {
        const acc = accounts.find(a => a.platform === platform);
        return {
            connected: acc?.status === 'connected',
            username: acc?.username,
            followers: acc?.followers
        };
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['instagram', 'tiktok', 'facebook', 'linkedin', 'twitter'].map(platform => {
                const Icon = platformIcons[platform];
                const { connected, username, followers } = getAccountParams(platform);
                const isConnecting = connecting === platform;

                return (
                    <div key={platform} className={`p-4 rounded-xl border transition-all ${connected
                            ? 'bg-white dark:bg-[#1C1C1E] border-green-500/20 shadow-sm'
                            : 'bg-gray-50 dark:bg-white/5 border-dashed border-gray-300 dark:border-white/10 opacity-70 hover:opacity-100'
                        }`}>
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${connected ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'bg-gray-200 dark:bg-white/10'
                                    }`}>
                                    <Icon size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold capitalize">{platform}</h4>
                                    {connected ? (
                                        <p className="text-xs text-green-500 flex items-center gap-1 font-bold">
                                            <CheckCircle size={10} /> Connected as @{username}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-gray-400">Not connected</p>
                                    )}
                                </div>
                            </div>
                            {connected && (
                                <span className="text-xs font-bold bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-lg">
                                    {(followers || 0).toLocaleString()} followers
                                </span>
                            )}
                        </div>

                        {connected ? (
                            <button className="w-full py-2 bg-gray-100 dark:bg-white/5 text-gray-500 rounded-lg text-xs font-bold hover:bg-red-50 hover:text-red-500 transition-colors">
                                Disconnect
                            </button>
                        ) : (
                            <button
                                onClick={() => handleConnect(platform)}
                                disabled={isConnecting}
                                className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex justify-center items-center gap-2"
                            >
                                {isConnecting ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                                {isConnecting ? 'Connecting...' : 'Connect Account'}
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
