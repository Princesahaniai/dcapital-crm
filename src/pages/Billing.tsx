import { useState } from 'react';
import { useStore } from '../store';
import { Shield, Zap, Building2, Check, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export const Billing = () => {
    const { user } = useStore();
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const handleSubscribe = async (tier: string, priceId: string) => {
        setIsLoading(tier);
        try {
            // Note: In a full production flow, this would call your backend endpoint
            // to create a Stripe Checkout Session, which then redirects the user.
            // e.g. await fetch('/api/create-checkout-session', { method: 'POST', body: JSON.stringify({ priceId, companyId: user?.companyId }) })
            
            // For now, simulate the API call and inform the user.
            await new Promise(resolve => setTimeout(resolve, 1500));
            toast.success(`Redirecting to Stripe secure checkout for ${tier} plan...`);
            
        } catch (error) {
            console.error('Stripe Checkout Error:', error);
            toast.error('Failed to initiate checkout. Please try again.');
        } finally {
            setIsLoading(null);
        }
    };

    const tiers = [
        {
            id: 'basic',
            name: 'Basic',
            price: '500',
            currency: 'AED',
            period: '/mo',
            description: 'Essential tools for independent brokers and small teams.',
            features: [
                'Up to 3 Users',
                'Basic Lead Management',
                'Standard Notifications',
                'CSV Bulk Import (100 max)'
            ],
            icon: Shield,
            priceId: 'price_basic_123', // Replace with actual Stripe Price ID
            color: 'from-blue-500 to-cyan-400'
        },
        {
            id: 'pro',
            name: 'Pro',
            price: '1,500',
            currency: 'AED',
            period: '/mo',
            description: 'Advanced analytics and scale for growing agencies.',
            features: [
                'Up to 10 Users',
                'Advanced Property Matching',
                'Automated Task Workflows',
                'Unlimited CSV Bulk Imports',
                'Priority Support'
            ],
            icon: Zap,
            priceId: 'price_pro_456', // Replace with actual Stripe Price ID
            color: 'from-amber-500 to-orange-400',
            popular: true
        },
        {
            id: 'enterprise',
            name: 'Enterprise',
            price: 'Custom',
            currency: '',
            period: '',
            description: 'Dedicated infrastructure for large-scale operations.',
            features: [
                'Unlimited Users',
                'Custom Integrations',
                'Dedicated Account Manager',
                'White-label Options',
                'SLA Guarantee'
            ],
            icon: Building2,
            priceId: 'contact_sales',
            color: 'from-zinc-500 to-stone-400'
        }
    ];

    if (!user || user.role !== 'ceo') {
        return (
            <div className="flex items-center justify-center p-8 h-full">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 max-w-md text-center">
                    <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
                    <p className="text-zinc-400">Only the Agency CEO can manage billing and subscriptions.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="text-center mb-12">
                <h1 className="text-3xl font-bold text-white mb-4">Plans & Billing</h1>
                <p className="text-zinc-400 max-w-2xl mx-auto">
                    Scale your real estate agency with D-Capital CRM Pro. Choose the infrastructure that fits your growth.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {tiers.map((tier) => {
                    const Icon = tier.icon;
                    return (
                        <motion.div
                            key={tier.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`relative bg-[#1A1A1A] border ${tier.popular ? 'border-amber-500/50' : 'border-[#333]'} rounded-xl p-8 flex flex-col`}
                        >
                            {tier.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-400 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                    Most Popular
                                </div>
                            )}

                            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${tier.color} p-0.5 mb-6`}>
                                <div className="w-full h-full bg-[#1A1A1A] rounded-[7px] flex items-center justify-center">
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
                            <div className="mb-4">
                                <span className="text-4xl font-bold text-white">{tier.currency} {tier.price}</span>
                                <span className="text-zinc-500">{tier.period}</span>
                            </div>
                            <p className="text-zinc-400 text-sm mb-8 flex-grow">{tier.description}</p>

                            <div className="space-y-4 mb-8">
                                {tier.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                            <Check className="w-3 h-3 text-green-500" />
                                        </div>
                                        <span className="text-sm text-zinc-300">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => handleSubscribe(tier.name, tier.priceId)}
                                disabled={isLoading === tier.name}
                                className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                                    tier.popular
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                                        : 'bg-white hover:bg-zinc-200 text-black'
                                }`}
                            >
                                {isLoading === tier.name ? (
                                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                ) : tier.priceId === 'contact_sales' ? (
                                    'Contact Sales'
                                ) : (
                                    <>
                                        Upgrade to {tier.name}
                                        <ExternalLink className="w-4 h-4 ml-1" />
                                    </>
                                )}
                            </button>
                        </motion.div>
                    );
                })}
            </div>

            <div className="mt-16 bg-[#1A1A1A] border border-[#333] rounded-xl p-8 max-w-3xl mx-auto flex items-start gap-6">
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-zinc-400" />
                </div>
                <div>
                    <h4 className="text-white font-medium mb-2">Enterprise-Grade Security</h4>
                    <p className="text-zinc-400 text-sm">
                        All payments are securely processed by Stripe. We do not store your credit card information. 
                        Your agency data is cryptographically isolated from all other tenants on the platform via unique Company IDs.
                    </p>
                </div>
            </div>
        </div>
    );
};
