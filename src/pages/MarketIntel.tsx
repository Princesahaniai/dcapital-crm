import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Activity, DollarSign, Globe2, Building2, BarChart3, Share2 } from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

// Mocked Data Streams
const dubaiIndex = [
    { area: 'Palm Jumeirah', trend: '+12.4%', value: 'AE 4,200/sqft', status: 'up' },
    { area: 'Downtown Dubai', trend: '+8.1%', value: 'AED 3,100/sqft', status: 'up' },
    { area: 'Dubai Marina', trend: '+5.2%', value: 'AED 2,400/sqft', status: 'up' },
    { area: 'Jumeirah Village Circle', trend: '+15.6%', value: 'AED 1,200/sqft', status: 'up' },
    { area: 'Business Bay', trend: '+7.4%', value: 'AED 2,150/sqft', status: 'up' },
];

const commodities = [
    { name: 'XAU/USD (Gold)', price: '$2,384.50', change: '+12.40', percent: '+0.52%', status: 'up' },
    { name: 'XAG/USD (Silver)', price: '$28.45', change: '-0.15', percent: '-0.52%', status: 'down' },
    { name: 'Brent Crude', price: '$86.50', change: '+1.20', percent: '+1.40%', status: 'up' },
    { name: 'WTI Crude', price: '$82.30', change: '+1.05', percent: '+1.29%', status: 'up' },
];

const forexPairs = [
    { pair: 'EUR/USD', price: '1.0845', change: '+0.0012', percent: '+0.11%', status: 'up' },
    { pair: 'GBP/USD', price: '1.2630', change: '-0.0025', percent: '-0.19%', status: 'down' },
    { pair: 'USD/JPY', price: '151.80', change: '+0.45', percent: '+0.29%', status: 'up' },
    { pair: 'USD/AED', price: '3.6730', change: '0.0000', percent: '0.00%', status: 'neutral' },
    { pair: 'BTC/USD', price: '$68,450', change: '+1,200', percent: '+1.78%', status: 'up' },
];

export const MarketIntel = () => {
    // Simulate real-time ticking
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setTick((t) => t + 1), 3000); // 3-second ticks
        return () => clearInterval(timer);
    }, []);

    const handleShare = (title: string, data: any[], type: 'property' | 'market') => {
        let text = `📊 *${title}* \n\n`;
        data.forEach(row => {
            const name = type === 'property' ? row.area : (row.name || row.pair);
            const value = type === 'property' ? row.value : row.price;
            const trend = type === 'property' ? row.trend : row.percent;
            const icon = row.status === 'up' ? '🟢' : row.status === 'down' ? '🔴' : '⚪';
            text += `${icon} *${name}*: ${value} (${trend})\n`;
        });
        text += `\nShared via D-Capital Market Intelligence`;
        const encoded = encodeURIComponent(text);
        window.open(`https://wa.me/?text=${encoded}`, '_blank');
    };

    const renderWidget = (title: string, icon: React.ReactNode, data: any[], type: 'property' | 'market') => (
        <motion.div variants={item} className="bg-[#1C1C1E] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-amber-500/10"></div>

            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-amber-500/20 p-2.5 rounded-xl text-amber-500">
                        {icon}
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
                </div>
                {/* Right side actions */}
                <div className="flex items-center gap-3 relative z-10">
                    <button
                        onClick={() => handleShare(title, data, type)}
                        className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/10 hover:border-amber-500/50 text-amber-500"
                        title="Share via WhatsApp"
                    >
                        <Share2 size={16} />
                    </button>
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Live</span>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {data.map((row, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 hover:border-amber-500/30 transition-colors">
                        <div>
                            <p className="text-white font-semibold text-sm">{type === 'property' ? row.area : (row.name || row.pair)}</p>
                            <p className="text-zinc-500 text-xs mt-0.5">{type === 'property' ? 'Index Average' : 'Spot Price'}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-white font-bold text-sm tracking-wide">
                                {type === 'property' ? row.value : row.price}
                            </p>
                            <div className={`flex items-center justify-end gap-1 mt-0.5 text-xs font-bold ${row.status === 'up' ? 'text-green-500' : row.status === 'down' ? 'text-red-500' : 'text-zinc-400'}`}>
                                {row.status === 'up' ? '▲' : row.status === 'down' ? '▼' : '▬'}
                                <span>{type === 'property' ? row.trend : row.percent}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );

    return (
        <div className="p-6 md:p-10 w-full h-full overflow-y-auto pb-32 safe-area-pt">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                        <Activity className="text-amber-500 w-8 h-8" />
                        Market Intelligence
                    </h1>
                    <p className="text-zinc-400 mt-2 max-w-2xl">
                        Centralized command center for real-time asset tracking. Monitor D-Capital's real estate index alongside global commodities and forex pairs.
                    </p>
                </div>
            </div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
                {/* Column 1: Dubai Real Estate Index */}
                {renderWidget('Dubai Property Index', <Building2 size={24} />, dubaiIndex, 'property')}

                {/* Column 2: Commodities */}
                {renderWidget('Commodities Spot', <DollarSign size={24} />, commodities, 'market')}

                {/* Column 3: Forex Pairs & Crypto */}
                {renderWidget('Forex & Crypto', <Globe2 size={24} />, forexPairs, 'market')}
            </motion.div>

            {/* Market Overview Chart Placeholder */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6 bg-[#1C1C1E] border border-white/10 rounded-2xl p-6 lg:p-10 hidden md:block"
            >
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <BarChart3 className="text-amber-500" />
                            Macro Economic Outlook
                        </h3>
                        <p className="text-zinc-500 text-sm mt-1">Simulated aggregated performance over 30 days</p>
                    </div>
                </div>

                <div className="h-64 flex items-center justify-center border-2 border-dashed border-white/10 rounded-xl relative overflow-hidden bg-black/20 group">
                    {/* Decorative waves representing data */}
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-amber-500/10 to-transparent"></div>
                    <div className="absolute w-full h-full flex items-end justify-between px-10 pb-10">
                        {[10, 25, 40, 35, 60, 50, 75, 65, 90, 85].map((height, i) => (
                            <motion.div
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${height}%` }}
                                transition={{ duration: 1, delay: i * 0.1 }}
                                className="w-12 bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-sm opacity-50 group-hover:opacity-80 transition-opacity"
                            />
                        ))}
                    </div>
                    <div className="relative z-10 bg-black/50 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 text-amber-500 font-bold tracking-widest uppercase text-sm">
                        Live Data Link Disconnected
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
