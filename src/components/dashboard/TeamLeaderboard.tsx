import React, { useMemo } from 'react';
import { Trophy, TrendingUp, Crown, Medal } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '../../store';
import { getVisibleLeads } from '../../utils/permissions';

interface AgentPerformance {
    id: string;
    name: string;
    role: string;
    closedDeals: number;
    closedRevenue: number;
    estimatedCommission: number;
    pipelineValue: number;
    totalLeads: number;
}

export const TeamLeaderboard: React.FC = () => {
    const { leads, team, user, properties } = useStore();

    const leaderboard = useMemo(() => {
        const accessibleLeads = getVisibleLeads(user, leads, team);

        // Calculate per-agent performance
        const agentMap = new Map<string, AgentPerformance>();

        // Initialize all team members
        team.forEach(member => {
            agentMap.set(member.id, {
                id: member.id,
                name: member.name || member.email,
                role: member.role,
                closedDeals: 0,
                closedRevenue: 0,
                estimatedCommission: 0,
                pipelineValue: 0,
                totalLeads: 0
            });
        });

        // Aggregate lead data
        accessibleLeads.forEach(lead => {
            const agentId = lead.assignedTo;
            if (!agentId) return;

            let agent = agentMap.get(agentId);
            if (!agent) {
                // Agent not in team list, create entry
                agent = {
                    id: agentId,
                    name: lead.assignedName || 'Unknown Agent',
                    role: 'agent',
                    closedDeals: 0,
                    closedRevenue: 0,
                    estimatedCommission: 0,
                    pipelineValue: 0,
                    totalLeads: 0
                };
                agentMap.set(agentId, agent);
            }

            agent.totalLeads++;
            const budget = lead.budget || 0;

            if (lead.status === 'Closed') {
                agent.closedDeals++;
                agent.closedRevenue += budget;
                // Use pre-calculated commission if available, otherwise default 2%
                const commission = (lead as any).commission || budget * 0.02;
                agent.estimatedCommission += commission;
            } else if (lead.status !== 'Lost' && lead.status !== 'Trash') {
                agent.pipelineValue += budget;
            }
        });

        // Also add property sale commissions
        properties.forEach(prop => {
            if (prop.status === 'Sold' && prop.agentId) {
                const agent = agentMap.get(prop.agentId);
                if (agent) {
                    const commRate = prop.commissionRate || 2;
                    agent.closedRevenue += prop.price || 0;
                    agent.estimatedCommission += (prop.price || 0) * (commRate / 100);
                }
            }
        });

        return Array.from(agentMap.values())
            .filter(a => a.totalLeads > 0 || a.closedDeals > 0)
            .sort((a, b) => b.closedRevenue - a.closedRevenue);
    }, [leads, team, user, properties]);

    const topRevenue = leaderboard.length > 0 ? leaderboard[0].closedRevenue : 1;

    const getRankIcon = (index: number) => {
        if (index === 0) return <Crown size={16} className="text-amber-400" />;
        if (index === 1) return <Medal size={16} className="text-gray-300" />;
        if (index === 2) return <Medal size={16} className="text-amber-700" />;
        return <span className="text-[10px] font-black text-gray-500 w-4 text-center">{index + 1}</span>;
    };

    return (
        <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 md:p-8 border border-gray-100 dark:border-white/5 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-green-500/5 blur-[80px] -mr-20 -mt-20 group-hover:bg-green-500/10 transition-colors duration-500" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6 relative z-10">
                <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Trophy size={20} className="text-amber-500" />
                        Team Performance
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">Revenue & commission leaderboard</p>
                </div>
                <div className="flex items-center gap-1 text-green-500 bg-green-500/10 px-3 py-1.5 rounded-full">
                    <TrendingUp size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Live</span>
                </div>
            </div>

            {/* Leaderboard */}
            <div className="space-y-3 relative z-10">
                {leaderboard.length === 0 ? (
                    <div className="py-12 text-center">
                        <Trophy size={36} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                        <p className="text-sm text-gray-500 font-medium">No agent activity yet</p>
                        <p className="text-xs text-gray-400 mt-1">Assign leads to agents to see performance</p>
                    </div>
                ) : leaderboard.slice(0, 6).map((agent, index) => (
                    <motion.div
                        key={agent.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.08 }}
                        className={`relative p-4 rounded-2xl border transition-all ${
                            index === 0
                                ? 'bg-gradient-to-r from-amber-500/10 to-transparent border-amber-500/20'
                                : 'bg-gray-50 dark:bg-white/5 border-transparent hover:border-gray-200 dark:hover:border-white/10'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            {/* Rank */}
                            <div className="w-8 h-8 rounded-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 flex items-center justify-center shrink-0">
                                {getRankIcon(index)}
                            </div>

                            {/* Avatar */}
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                                index === 0
                                    ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/20'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-white'
                            }`}>
                                {agent.name.charAt(0)}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{agent.name}</p>
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded shrink-0">
                                        {agent.role}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-[10px] text-gray-500">
                                        {agent.closedDeals} Closed • {agent.totalLeads} Total
                                    </span>
                                </div>
                            </div>

                            {/* Revenue & Commission */}
                            <div className="text-right shrink-0">
                                <p className="font-black text-sm text-gray-900 dark:text-white">
                                    AED {agent.closedRevenue >= 1000000
                                        ? (agent.closedRevenue / 1000000).toFixed(1) + 'M'
                                        : agent.closedRevenue.toLocaleString()}
                                </p>
                                <p className="text-[10px] font-bold text-green-500 mt-0.5">
                                    +{agent.estimatedCommission >= 1000
                                        ? (agent.estimatedCommission / 1000).toFixed(1) + 'K'
                                        : agent.estimatedCommission.toLocaleString()} com.
                                </p>
                            </div>
                        </div>

                        {/* Revenue Bar */}
                        <div className="mt-2.5 h-1 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((agent.closedRevenue / topRevenue) * 100, 100)}%` }}
                                transition={{ duration: 1, delay: index * 0.1 }}
                                className={`h-full rounded-full ${
                                    index === 0 ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
                                    index === 1 ? 'bg-blue-500' :
                                    index === 2 ? 'bg-purple-500' : 'bg-gray-400'
                                }`}
                            />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Total Commission Footer */}
            {leaderboard.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 relative z-10">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Team Revenue</p>
                        <p className="text-xl font-black text-gray-900 dark:text-white mt-0.5">
                            AED {leaderboard.reduce((s, a) => s + a.closedRevenue, 0).toLocaleString()}
                        </p>
                    </div>
                    <div className="text-left sm:text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Commission Owed</p>
                        <p className="text-xl font-black text-green-500 mt-0.5">
                            AED {leaderboard.reduce((s, a) => s + a.estimatedCommission, 0).toLocaleString()}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
