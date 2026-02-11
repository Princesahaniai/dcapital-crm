import React, { useMemo, useState } from 'react';
import { useStore } from '../store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Download, TrendingUp, Users, DollarSign, Calendar, BarChart3, Shield, ListTodo } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import toast from 'react-hot-toast';

export const Reports = () => {
    const { leads, team, user, tasks } = useStore();
    const [dateRange, setDateRange] = useState('all');
    const [trendView, setTrendView] = useState<'monthly' | 'quarterly'>('monthly');

    // Protection
    if (user?.role !== 'ceo' && user?.role !== 'admin') {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
                    <p>You do not have permission to view this page.</p>
                </div>
            </div>
        );
    }

    // --- DATE FILTERING ---
    const filteredLeads = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).getTime();
        const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

        return leads.filter(lead => {
            const date = lead.createdAt || 0;
            switch (dateRange) {
                case 'this_month':
                    return date >= startOfMonth;
                case 'last_month':
                    return date >= startOfLastMonth && date <= endOfLastMonth;
                case 'this_year':
                    return date >= startOfYear;
                default:
                    return true;
            }
        });
    }, [leads, dateRange]);

    // --- DATA AGGREGATION ---

    const totalRevenue = useMemo(() => {
        return filteredLeads
            .filter(l => l.status === 'Closed')
            .reduce((sum, l) => sum + (l.budget || 0), 0);
    }, [filteredLeads]);

    const pipelineValue = useMemo(() => {
        return filteredLeads
            .filter(l => l.status !== 'Closed' && l.status !== 'Lost')
            .reduce((sum, l) => sum + (l.budget || 0), 0);
    }, [filteredLeads]);

    const closedDeals = filteredLeads.filter(l => l.status === 'Closed').length;
    const conversionRate = filteredLeads.length > 0 ? (closedDeals / filteredLeads.length) * 100 : 0;
    const avgDealSize = closedDeals > 0 ? totalRevenue / closedDeals : 0;

    // Revenue Trend (Monthly or Quarterly)
    const trendData = useMemo(() => {
        if (trendView === 'monthly') {
            const last6Months = Array.from({ length: 6 }, (_, i) => {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                return d.toLocaleString('default', { month: 'short' });
            }).reverse();

            return last6Months.map(month => {
                const revenue = filteredLeads
                    .filter(l => l.status === 'Closed' && new Date(l.updatedAt || 0).toLocaleString('default', { month: 'short' }) === month)
                    .reduce((sum, l) => sum + (l.budget || 0), 0);
                return { name: month, revenue };
            });
        } else {
            // Quarterly
            const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
            return quarters.map((q, idx) => {
                const startMonth = idx * 3;
                const endMonth = startMonth + 2;
                const revenue = filteredLeads
                    .filter(l => {
                        const m = new Date(l.updatedAt || 0).getMonth();
                        return l.status === 'Closed' && m >= startMonth && m <= endMonth;
                    })
                    .reduce((sum, l) => sum + (l.budget || 0), 0);
                return { name: q, revenue };
            });
        }
    }, [filteredLeads, trendView]);

    // Pipeline Value by Stage
    const stageValueData = useMemo(() => {
        const stages = ['New', 'Contacted', 'Qualified', 'Viewing', 'Negotiation'];
        return stages.map(stage => ({
            name: stage,
            value: filteredLeads
                .filter(l => l.status === stage)
                .reduce((sum, l) => sum + (l.budget || 0), 0)
        }));
    }, [filteredLeads]);

    // Lead Conversion Funnel (Counts)
    const funnelData = useMemo(() => {
        const stages = ['New', 'Contacted', 'Qualified', 'Viewing', 'Negotiation', 'Closed'];
        return stages.map(stage => ({
            name: stage,
            count: filteredLeads.filter(l => l.status === stage).length
        }));
    }, [filteredLeads]);

    // Agent Leaderboard
    const agentPerformance = useMemo(() => {
        return team
            .map(agent => ({
                name: agent.name,
                sales: filteredLeads
                    .filter(l => l.assignedTo === agent.id && l.status === 'Closed')
                    .reduce((sum, l) => sum + (l.budget || 0), 0),
                deals: filteredLeads.filter(l => l.assignedTo === agent.id && l.status === 'Closed').length
            }))
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 5); // Top 5
    }, [team, filteredLeads]);

    // --- TASK ANALYTICS ---
    const taskStats = useMemo(() => {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const completionRate = total > 0 ? (completed / total) * 100 : 0;
        const overdue = tasks.filter(t => !t.completed && (t.dueDate || 0) < Date.now()).length;

        // Tasks by category
        const catalog: Record<string, number> = {};
        tasks.forEach(t => {
            catalog[t.category] = (catalog[t.category] || 0) + 1;
        });
        const categoryData = Object.keys(catalog).map(name => ({ name, value: catalog[name] }));

        return { total, completed, completionRate, overdue, categoryData };
    }, [tasks]);

    // --- EXPORT PDF ---
    const handleExport = () => {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text("D-Capital Performance Insights", 20, 20);

        doc.setFontSize(12);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
        doc.text(`Date Range: ${dateRange.replace('_', ' ').toUpperCase()}`, 20, 38);
        doc.text(`Performance Score: ${conversionRate.toFixed(1)}% Conversion Rate`, 20, 48);
        doc.text(`Total Revenue: AED ${totalRevenue.toLocaleString()}`, 20, 56);
        doc.text(`Pipeline Value: AED ${pipelineValue.toLocaleString()}`, 20, 64);
        doc.text(`Average Deal Size: AED ${avgDealSize.toLocaleString()}`, 20, 72);

        doc.text("Agent Leaderboard:", 20, 90);
        agentPerformance.forEach((agent, i) => {
            doc.text(`${i + 1}. ${agent.name} - AED ${agent.sales.toLocaleString()} (${agent.deals} deals)`, 20, 100 + (i * 10));
        });

        doc.text("Task Management Protocol:", 20, 160);
        doc.text(`Total Tasks: ${taskStats.total}`, 20, 170);
        doc.text(`Completion Efficiency: ${taskStats.completionRate.toFixed(1)}%`, 20, 180);
        doc.text(`Overdue Targets: ${taskStats.overdue}`, 20, 190);

        doc.save(`dcapital-advanced-report.pdf`);
        toast.success("Executive PDF generated");
    };

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];

    return (
        <div className="p-6 md:p-10 min-h-screen pb-24 space-y-8 bg-gray-50 dark:bg-black no-scrollbar">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Performance Analytics</h1>
                    <p className="text-gray-600 dark:text-gray-500">Real-time business intelligence for executive decision making</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <select
                            title="Select Date Range"
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="appearance-none bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white py-2.5 pl-4 pr-10 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
                        >
                            <option value="all">All-Time Performance</option>
                            <option value="this_month">This Month</option>
                            <option value="last_month">Last Month</option>
                            <option value="this_year">YTD Performance</option>
                        </select>
                        <Calendar className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={16} />
                    </div>

                    <button onClick={handleExport} className="bg-gradient-to-r from-amber-500 to-yellow-600 text-black px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 active:scale-95">
                        <Download size={18} /> Export PDF
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm hover:border-amber-500/30 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest">Total Revenue</span>
                        <div className="p-2 bg-green-100 dark:bg-green-500/20 rounded-xl text-green-600 dark:text-green-400">
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">AED {totalRevenue.toLocaleString()}</h3>
                    <p className="text-xs text-green-500 mt-2 font-bold flex items-center gap-1">
                        <TrendingUp size={12} /> {closedDeals} Closed Deals
                    </p>
                </div>

                <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm hover:border-blue-500/30 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest">Pipeline Value</span>
                        <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400">
                            <BarChart3 size={20} />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">AED {pipelineValue.toLocaleString()}</h3>
                    <div className="flex gap-2 mt-2">
                        <span className="text-[10px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full font-bold">Active Funnel</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm hover:border-purple-500/30 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest">Conversion Rate</span>
                        <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-xl text-purple-600 dark:text-purple-400">
                            <Users size={20} />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{conversionRate.toFixed(1)}%</h3>
                    <p className="text-xs text-purple-500 mt-2 font-bold">Leads to Deals</p>
                </div>

                <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm hover:border-blue-500/30 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest">Task Efficiency</span>
                        <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400">
                            <ListTodo size={20} />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{taskStats.completionRate.toFixed(1)}%</h3>
                    <p className="text-xs text-blue-500 mt-2 font-bold">{taskStats.overdue} tasks overdue</p>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Trend Chart */}
                <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Revenue Trend</h3>
                        <div className="flex bg-gray-100 dark:bg-black/50 p-1 rounded-xl border border-gray-200 dark:border-white/10">
                            <button
                                onClick={() => setTrendView('monthly')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${trendView === 'monthly' ? 'bg-amber-500 text-black shadow-md' : 'text-gray-500'}`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setTrendView('quarterly')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${trendView === 'quarterly' ? 'bg-amber-500 text-black shadow-md' : 'text-gray-500'}`}
                            >
                                Quarterly
                            </button>
                        </div>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `AED ${(value / 1000).toFixed(0)}k`} />
                                <Tooltip
                                    cursor={{ fill: trendView === 'monthly' ? 'rgba(255,255,255,0.05)' : 'transparent' }}
                                    contentStyle={{ backgroundColor: '#1C1C1E', border: '1px solid #333', borderRadius: '12px', color: '#fff' }}
                                    formatter={(value: any) => [`AED ${Number(value).toLocaleString()}`, "Revenue"]}
                                />
                                <Bar dataKey="revenue" fill="url(#colorRev)" radius={[6, 6, 0, 0]} barSize={trendView === 'monthly' ? 32 : 64} />
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pipeline Value by Stage */}
                <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Pipeline Value by Stage (AED)</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stageValueData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} horizontal={false} />
                                <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                                <YAxis dataKey="name" type="category" width={100} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#1C1C1E', border: '1px solid #333', borderRadius: '12px', color: '#fff' }}
                                    formatter={(value: any) => [`AED ${Number(value).toLocaleString()}`, "Stage Value"]}
                                />
                                <Bar dataKey="value" fill="#3B82F6" radius={[0, 6, 6, 0]} barSize={32}>
                                    {stageValueData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Lead Conversion Funnel (Counts) */}
                <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Master Lead Funnel (Counts)</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={funnelData}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#1C1C1E', border: '1px solid #333', borderRadius: '12px', color: '#fff' }}
                                />
                                <Bar dataKey="count" fill="#8B5CF6" radius={[6, 6, 0, 0]} barSize={40}>
                                    {funnelData.map((_, index) => (
                                        <Cell key={`cell-f-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Agent Leaderboard Table */}
                <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm flex flex-col">
                    <div className="p-6 border-b border-gray-200 dark:border-white/5 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Elite Agent Ranking</h3>
                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full">Top Performers</span>
                    </div>
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 text-[10px] uppercase font-bold tracking-widest">
                                <tr>
                                    <th className="p-4 pl-6">Rank</th>
                                    <th className="p-4">Agent</th>
                                    <th className="p-4">Deals</th>
                                    <th className="p-4 text-right pr-6">Production (AED)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                                {agentPerformance.map((agent, index) => (
                                    <tr key={index} className="hover:bg-gray-100 dark:hover:bg-white/5 transition-all group">
                                        <td className="p-4 pl-6">
                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-amber-500 text-black' : 'bg-gray-200 dark:bg-white/10 text-gray-500'}`}>
                                                {index + 1}
                                            </div>
                                        </td>
                                        <td className="p-4 font-bold text-gray-900 dark:text-white group-hover:text-amber-500 transition-colors">{agent.name}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full max-w-[60px] overflow-hidden">
                                                    <div className="h-full bg-amber-500" style={{ width: `${(agent.deals / Math.max(...agentPerformance.map(a => a.deals), 1)) * 100}%` }} />
                                                </div>
                                                <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">{agent.deals}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right pr-6 font-bold text-green-600 dark:text-green-400 font-mono">
                                            {(agent.sales).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                {agentPerformance.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-10 text-center text-gray-500 italic">No closure data for this period</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Bottom Row - Status Pie */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 text-center">Task Distribution</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={taskStats.categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {taskStats.categoryData.map((_, index) => (
                                        <Cell key={`cell-task-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1C1C1E', border: 'none', borderRadius: '12px', color: '#fff' }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-gradient-to-br from-amber-500/5 via-transparent to-amber-500/5 p-8 rounded-3xl border border-amber-500/10 flex flex-col justify-center items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 mb-2">
                        <Shield size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Executive Oversight Mode</h3>
                    <p className="max-w-md text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                        You are viewing the enterprise-grade performance engine. All data is synchronized across the global lead pipeline and agent activity logs.
                        Use the <strong>Export PDF</strong> button to generate boardsheets for stakeholder reviews.
                    </p>
                    <div className="flex gap-4 pt-4">
                        <div className="px-4 py-2 bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 text-[10px] font-bold uppercase tracking-widest">
                            Real-Time Sync: Active
                        </div>
                        <div className="px-4 py-2 bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 text-[10px] font-bold uppercase tracking-widest">
                            Data Integrity: Certified
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
