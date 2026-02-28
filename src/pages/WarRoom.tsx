import React, { useMemo } from 'react';
import { useStore } from '../store';
import { Trophy, TrendingUp, Target, Users, AlertCircle, Swords, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

interface AgentStats {
    id: string;
    name: string;
    avatar?: string;
    closedCommission: number;
    activePipeline: number;
    totalLeads: number;
    closedLeads: number;
    conversionRate: number;
}

export const WarRoom = () => {
    const { leads, team, user } = useStore();

    // The Math Engine: Aggregate Agent Stats
    const agentStats = useMemo(() => {
        const statsMap = new Map<string, AgentStats>();

        // Initialize everyone in the team
        team.forEach(member => {
            if (member.role === 'agent' || member.role === 'manager') {
                statsMap.set(member.id, {
                    id: member.id,
                    name: member.name,
                    avatar: member.avatar,
                    closedCommission: 0,
                    activePipeline: 0,
                    totalLeads: 0,
                    closedLeads: 0,
                    conversionRate: 0
                });
            }
        });

        // Loop leads
        leads.forEach(lead => {
            if (lead.status === 'Trash' || !lead.assignedTo) return;

            const agent = statsMap.get(lead.assignedTo);
            if (!agent) return;

            agent.totalLeads += 1;

            if (lead.status === 'Closed') {
                agent.closedLeads += 1;
                agent.closedCommission += lead.commission || (lead.budget ? lead.budget * 0.02 : 0);
            } else if (lead.status !== 'Lost') {
                agent.activePipeline += lead.budget || 0;
            }

            // Calculate Conversion %
            if (agent.totalLeads > 0) {
                agent.conversionRate = (agent.closedLeads / agent.totalLeads) * 100;
            }
        });

        // Sort by Closed Commission (Descending) -> The Leaderboard Standard
        return Array.from(statsMap.values()).sort((a, b) => b.closedCommission - a.closedCommission);
    }, [leads, team]);

    // The Math Engine: Funnel Data (Company Wide) - CEO/Manager Only
    const funnelData = useMemo(() => {
        const counts = { New: 0, Contacted: 0, Qualified: 0, Viewing: 0, Negotiation: 0, Closed: 0 };
        leads.forEach(l => {
            if (counts[l.status as keyof typeof counts] !== undefined) counts[l.status as keyof typeof counts]++;
        });
        return [
            { name: 'New Request', value: counts.New },
            { name: 'Contacted', value: counts.Contacted },
            { name: 'Qualified', value: counts.Qualified },
            { name: 'Viewing/Meeting', value: counts.Viewing },
            { name: 'Negotiation', value: counts.Negotiation },
            { name: 'Closed Deal', value: counts.Closed },
        ];
    }, [leads]);

    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];
    const barColors = ['#9ca3af', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#10b981'];

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="p-4 md:p-8 space-y-8 pb-32 max-w-7xl mx-auto h-screen overflow-y-auto w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
                        <Swords className="text-amber-500" size={32} /> The War Room
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Live Pipeline & Agent Performance Tracking</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* 🏆 GAMIFIED LEADERBOARD (Available to Everyone) */}
                <motion.div variants={item} className="xl:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Trophy className="text-yellow-500" size={24} /> Top Performers This Month
                    </h2>

                    <div className="bg-white dark:bg-[#1C1C1E] dark:apple-glass border border-gray-100 dark:border-white/10 rounded-3xl p-2 shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden">
                        {agentStats.map((agent, index) => (
                            <div
                                key={agent.id}
                                className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${index === 0 ? 'bg-gradient-to-r from-amber-500/10 to-transparent border-l-4 border-amber-500' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                            >
                                {/* Rank Icon */}
                                <div className="w-12 flex justify-center shrink-0">
                                    {index === 0 ? <span className="text-3xl drop-shadow-md">👑</span> :
                                        index === 1 ? <span className="text-3xl drop-shadow-md">🥈</span> :
                                            index === 2 ? <span className="text-3xl drop-shadow-md">🥉</span> :
                                                <span className="text-xl font-bold text-gray-400">#{index + 1}</span>}
                                </div>

                                {/* Agent Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-black border border-white/20 flex items-center justify-center font-bold text-white shadow-lg shrink-0">
                                            {agent.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className={`font-bold text-sm md:text-base truncate ${index === 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>{agent.name}</h3>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <span>{agent.closedLeads} Deal{agent.closedLeads !== 1 && 's'}</span>
                                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                <span>{agent.conversionRate.toFixed(1)}% Conversion</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Money */}
                                <div className="text-right shrink-0">
                                    <p className={`font-black text-lg md:text-xl tracking-tight ${index === 0 ? 'text-amber-500' : 'text-gray-900 dark:text-white'}`}>
                                        <span className="text-xs mr-1 opacity-50 font-normal">AED</span>
                                        {agent.closedCommission.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1 flex items-center justify-end gap-1">
                                        Pipeline: {agent.activePipeline > 0 ? (agent.activePipeline / 1000000).toFixed(1) + 'M' : '0'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* 📊 CEO FUNNEL (Available to Admins/Managers only) */}
                <motion.div variants={item} className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Target className="text-blue-500" size={24} /> Pipeline Funnel
                    </h2>

                    {(user?.role === 'ceo' || user?.role === 'admin' || user?.role === 'manager') ? (
                        <div className="bg-white dark:bg-[#1C1C1E] dark:apple-glass border border-gray-100 dark:border-white/10 rounded-3xl p-6 shadow-xl shadow-gray-200/50 dark:shadow-none h-full flex flex-col">
                            <div className="mb-6">
                                <p className="text-sm text-gray-500 mb-2">Company-wide Drop-off Analysis</p>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-3xl font-black text-gray-900 dark:text-white">{funnelData.reduce((acc, curr) => acc + curr.value, 0)}</h3>
                                    <span className="text-sm text-amber-500 font-bold">Total Enquiries</span>
                                </div>
                            </div>

                            <div className="flex-1 w-full min-h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        layout="vertical"
                                        data={funnelData}
                                        margin={{ top: 0, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#374151" fillOpacity={0.2} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} width={110} />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{ backgroundColor: '#1C1C1E', border: '1px solid #333', borderRadius: '12px', color: '#fff' }}
                                        />
                                        <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24} background={{ fill: 'transparent' }}>
                                            {funnelData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 shadow-2xl h-full flex flex-col items-center justify-center text-center border top-t border-white/10">
                            <Lock className="text-gray-500 mb-4" size={48} />
                            <h3 className="text-xl font-bold text-white mb-2">Executive Access Required</h3>
                            <p className="text-gray-400 text-sm">The global funnel view is restricted to Management.</p>
                        </div>
                    )}
                </motion.div>

            </div>
        </motion.div>
    );
};
