import React, { useMemo, useState } from 'react';
import { useStore } from '../store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, PieChart, Pie, Legend } from 'recharts';
import { Download, TrendingUp, Users, DollarSign, Filter, Calendar } from 'lucide-react';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

export const Reports = () => {
    const { leads, team, user } = useStore();
    const [dateRange, setDateRange] = useState('all');

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

    // --- DATA AGGREGATION (Using filteredLeads) ---

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

    // Monthly Revenue (Last 6 Months) - Note: This chart might look empty if filtered to "This Month", 
    // but the requirement implies "Reports based on date range". 
    // For "Trend" charts, it usually makes sense to show the trend WITHIN the range or just show all if range is 'all'.
    // However, strictly applying the filter to the source data is the most consistent approach for "Revenue during this period".
    const monthlyRevenueData = useMemo(() => {
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
    }, [filteredLeads]);

    // Lead Conversion Funnel
    const funnelData = useMemo(() => {
        const stages = ['New', 'Contacted', 'Qualified', 'Viewing', 'Negotiation', 'Closed'];
        return stages.map(stage => ({
            name: stage,
            count: filteredLeads.filter(l => l.status === stage).length
        }));
    }, [filteredLeads]);

    // Deals by Status (Pie Chart)
    const leadsByStatus = useMemo(() => {
        const statusCounts = filteredLeads.reduce((acc, lead) => {
            acc[lead.status] = (acc[lead.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.keys(statusCounts).map(status => ({
            name: status,
            value: statusCounts[status]
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

    // --- EXPORT PDF ---
    const handleExport = () => {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text("D-Capital Custom Report", 20, 20);

        doc.setFontSize(12);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
        doc.text(`Date Range: ${dateRange.replace('_', ' ').toUpperCase()}`, 20, 38);
        doc.text(`Total Revenue: AED ${totalRevenue.toLocaleString()}`, 20, 50);
        doc.text(`Pipeline Value: AED ${pipelineValue.toLocaleString()}`, 20, 60);

        doc.text("Top Agents:", 20, 80);
        agentPerformance.forEach((agent, i) => {
            doc.text(`${i + 1}. ${agent.name} - AED ${agent.sales.toLocaleString()} (${agent.deals} deals)`, 20, 90 + (i * 10));
        });

        doc.save(`d-capital-report-${dateRange}.pdf`);
        toast.success("Report downloaded successfully");
    };

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];

    return (
        <div className="p-6 md:p-10 min-h-screen pb-24 space-y-8 bg-gray-50 dark:bg-black">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
                    <p className="text-gray-600 dark:text-gray-500">Business insights and performance metrics</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Date Filter */}
                    <div className="relative">
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="appearance-none bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white py-2 pl-4 pr-10 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                        >
                            <option value="all">All Time</option>
                            <option value="this_month">This Month</option>
                            <option value="last_month">Last Month</option>
                            <option value="this_year">This Year</option>
                        </select>
                        <Calendar className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={16} />
                    </div>

                    <button onClick={handleExport} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20">
                        <Download size={18} /> Export PDF
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase">Total Revenue</span>
                        <div className="p-2 bg-green-100 dark:bg-green-500/20 rounded-lg text-green-600 dark:text-green-400">
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">AED {totalRevenue.toLocaleString()}</h3>
                    <p className="text-xs text-green-500 mt-2 font-bold">{dateRange === 'all' ? 'Lifetime' : dateRange.replace('_', ' ')}</p>
                </div>

                <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase">Pipeline Value</span>
                        <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg text-blue-600 dark:text-blue-400">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">AED {pipelineValue.toLocaleString()}</h3>
                    <p className="text-xs text-gray-500 mt-2">Active opportunities</p>
                </div>

                <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase">Deals Closed</span>
                        <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-lg text-purple-600 dark:text-purple-400">
                            <Filter size={20} />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{filteredLeads.filter(l => l.status === 'Closed').length}</h3>
                    <p className="text-xs text-purple-500 mt-2 font-bold">Safe</p>
                </div>

                <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase">Active Agents</span>
                        <div className="p-2 bg-amber-100 dark:bg-amber-500/20 rounded-lg text-amber-600 dark:text-amber-400">
                            <Users size={20} />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{team.length}</h3>
                    <p className="text-xs text-gray-500 mt-2">Team members</p>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Chart */}
                <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Revenue Trend</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={monthlyRevenueData}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `AED ${(value / 1000000).toFixed(1)}M`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1C1C1E', border: 'none', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                    formatter={(value: number) => [`AED ${value.toLocaleString()}`, 'Revenue']}
                                />
                                <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pipeline Funnel */}
                <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Pipeline Funnel</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={funnelData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} horizontal={false} />
                                <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis dataKey="name" type="category" width={100} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ backgroundColor: '#1C1C1E', border: 'none', borderRadius: '8px', color: '#fff' }}
                                />
                                <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={32}>
                                    {funnelData.map((entry, index) => (
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
                {/* Deals by Status Pie Chart */}
                <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Deals Distribution</h3>
                    <div className="h-80 flex justify-center items-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={leadsByStatus}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {leadsByStatus.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1C1C1E', border: 'none', borderRadius: '8px', color: '#fff' }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Agents Table */}
                <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-gray-200 dark:border-white/5">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Top Performing Agents</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 text-xs uppercase font-bold">
                                <tr>
                                    <th className="p-4 pl-6">Rank</th>
                                    <th className="p-4">Agent Name</th>
                                    <th className="p-4">Deals Closed</th>
                                    <th className="p-4 text-right pr-6">Total Sales</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                                {agentPerformance.map((agent, index) => (
                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="p-4 pl-6 font-mono text-gray-500">#{index + 1}</td>
                                        <td className="p-4 font-bold text-gray-900 dark:text-white">{agent.name}</td>
                                        <td className="p-4 text-gray-600 dark:text-gray-400">{agent.deals}</td>
                                        <td className="p-4 text-right pr-6 font-bold text-green-600 dark:text-green-400">AED {agent.sales.toLocaleString()}</td>
                                    </tr>
                                ))}
                                {agentPerformance.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-gray-500">No data for selected period</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
