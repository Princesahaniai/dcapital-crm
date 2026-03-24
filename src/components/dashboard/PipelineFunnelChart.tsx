import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useStore } from '../../store';
import { getVisibleLeads } from '../../utils/permissions';

const STAGE_COLORS: Record<string, string> = {
    'New': '#3B82F6',
    'Contacted': '#6366F1',
    'Qualified': '#8B5CF6',
    'Viewing': '#EC4899',
    'Negotiation': '#F59E0B',
    'Closed': '#10B981',
    'Lost': '#6B7280'
};

const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    return (
        <div className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
            <p className="text-white font-bold text-sm">{data.stage}</p>
            <p className="text-amber-400 text-xs font-bold mt-1">
                {data.count} Lead{data.count !== 1 ? 's' : ''} • AED {data.value.toLocaleString()}
            </p>
        </div>
    );
};

export const PipelineFunnelChart: React.FC = () => {
    const { leads, team, user } = useStore();

    const chartData = useMemo(() => {
        const accessibleLeads = getVisibleLeads(user, leads, team);
        const stages = ['New', 'Contacted', 'Qualified', 'Viewing', 'Negotiation', 'Closed'];

        return stages.map(stage => {
            const stageLeads = accessibleLeads.filter(l => l.status === stage);
            return {
                stage,
                count: stageLeads.length,
                value: stageLeads.reduce((sum, l) => sum + (l.budget || 0), 0)
            };
        });
    }, [leads, team, user]);

    const totalPipeline = chartData.reduce((sum, s) => sum + s.value, 0);

    return (
        <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 md:p-8 border border-gray-100 dark:border-white/5 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 blur-[80px] -mr-20 -mt-20 group-hover:bg-amber-500/10 transition-colors duration-500" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 relative z-10">
                <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
                        Pipeline Funnel
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">Lead distribution across deal stages</p>
                </div>
                <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full self-start">
                    AED {(totalPipeline / 1000000).toFixed(1)}M Total
                </span>
            </div>

            {/* Chart */}
            <div className="h-64 w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barSize={32} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                        <XAxis
                            dataKey="stage"
                            tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 600 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fill: '#6B7280', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                            {chartData.map((entry) => (
                                <Cell key={entry.stage} fill={STAGE_COLORS[entry.stage] || '#6B7280'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4 relative z-10">
                {chartData.filter(d => d.count > 0).map(d => (
                    <div key={d.stage} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STAGE_COLORS[d.stage] }} />
                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {d.stage} ({d.count})
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
