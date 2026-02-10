import React, { useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { Wallet, Users, Building2, Trophy, PieChart as PieChartIcon, ArrowUpRight, Inbox } from 'lucide-react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Header } from '../components/Header';
import { DemoBanner } from '../components/DemoBanner';
import { EmptyState } from '../components/EmptyState';
import { getVisibleLeads } from '../utils/permissions';
import { useNavigate } from 'react-router-dom';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };
const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#EC4899', '#8B5CF6'];

export const Dashboard = () => {
    const { leads, properties, team, user, addLead } = useStore();
    const navigate = useNavigate();

    // Initialize test leads for functionality testing (only if completely empty)
    useEffect(() => {
        if (leads.length === 0) {
            const testLeads = [
                {
                    id: 'test-1',
                    name: 'Ahmed Al Maktoum',
                    email: 'ahmed@example.ae',
                    phone: '+971501234567',
                    budget: 3500000,
                    status: 'New' as const,
                    source: 'Website',
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                },
                {
                    id: 'test-2',
                    name: 'Sarah Johnson',
                    email: 'sarah@example.com',
                    phone: '+971509876543',
                    budget: 2800000,
                    status: 'Qualified' as const,
                    source: 'Referral',
                    createdAt: Date.now() - 86400000,
                    updatedAt: Date.now()
                },
                {
                    id: 'test-3',
                    name: 'Mohammed Hassan',
                    email: 'mohammed@example.ae',
                    phone: '+971555555555',
                    budget: 5200000,
                    status: 'Closed' as const,
                    source: 'Instagram',
                    createdAt: Date.now() - 172800000,
                    updatedAt: Date.now(),
                    commission: 104000,
                    commissionPaid: false
                }
            ];
            testLeads.forEach(lead => addLead(lead));
        }
    }, [leads.length, addLead]);

    // RBAC: Filter leads based on user role
    const accessibleLeads = useMemo(() => getVisibleLeads(user, leads, team), [user, leads, team]);

    // Analytics Calculations (using accessible leads only)
    const pipeline = accessibleLeads.filter(l => l.status !== 'Lost').reduce((sum, l) => sum + (l.budget || 0), 0);

    // Commission: Show based on role
    const isCEO = user?.role === 'ceo' || (user?.email?.includes('ajay') ?? false);

    const relevantLeads = isCEO ? accessibleLeads : accessibleLeads.filter(l => l.assignedTo === user?.id);
    const unpaidCommission = relevantLeads
        .filter(l => l.status === 'Closed' && !l.commissionPaid)
        .reduce((sum, l) => sum + (l.commission || 0), 0);

    // Lead Source Data (from accessible leads)
    const sources = accessibleLeads.reduce((acc: any, l) => {
        const src = l.source || 'Other';
        acc[src] = (acc[src] || 0) + 1;
        return acc;
    }, {});
    const pieData = Object.keys(sources).map(k => ({ name: k, value: sources[k] }));

    // Recent Leads (Limit 5, from accessible leads)
    const recentLeads = [...accessibleLeads].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 5);

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 p-6 md:p-10 h-screen w-full overflow-y-auto">
            {/* HEADER */}
            <Header title="Executive Dashboard" subtitle="Real-time organization intelligence" />

            <DemoBanner />

            {/* METRICS ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <motion.div variants={item} className="bg-white dark:bg-[#1C1C1E] dark:apple-glass shadow-sm dark:shadow-none p-6 rounded-3xl relative overflow-hidden border border-gray-100 dark:border-none">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500"><Wallet size={24} /></div>
                        <span className="text-xs font-bold text-green-500 flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded-full"><ArrowUpRight size={12} /> Live</span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">AED {(pipeline / 1000000).toFixed(1)}M</h3>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Total Pipeline</p>
                </motion.div>

                <motion.div variants={item} className="bg-white dark:bg-[#1C1C1E] dark:apple-glass shadow-sm dark:shadow-none p-6 rounded-3xl relative overflow-hidden border border-gray-100 dark:border-none">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500"><Users size={24} /></div>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">{accessibleLeads.length}</h3>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Total Leads</p>
                </motion.div>

                <motion.div variants={item} className="bg-white dark:bg-[#1C1C1E] dark:apple-glass shadow-sm dark:shadow-none p-6 rounded-3xl relative overflow-hidden border border-amber-500/20">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg"><Trophy size={24} /></div>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">AED {unpaidCommission.toLocaleString()}</h3>
                    <p className="text-amber-500 text-xs font-bold uppercase tracking-widest">{isCEO ? 'Company Commission' : 'My Commission'}</p>
                </motion.div>

                <motion.div variants={item} className="bg-white dark:bg-[#1C1C1E] dark:apple-glass shadow-sm dark:shadow-none p-6 rounded-3xl relative overflow-hidden border border-gray-100 dark:border-none">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500"><Building2 size={24} /></div>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">{properties.filter(p => p.status === 'Available').length}</h3>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Active Listings</p>
                </motion.div>
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* RECENT LEADS (New Widget) */}
                <motion.div variants={item} className="lg:col-span-2 bg-white dark:bg-[#1C1C1E] dark:apple-glass shadow-sm dark:shadow-none p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-none">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Users size={20} className="text-blue-500" /> Recent Leads
                        </h3>
                    </div>
                    {recentLeads.length > 0 ? (
                        <div className="space-y-4">
                            {recentLeads.length > 0 ? (
                                recentLeads.map((lead) => (
                                    <div key={lead.id} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors border border-transparent hover:border-blue-500/30">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center font-bold text-gray-600 dark:text-white">
                                            {lead.name.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-gray-900 dark:text-white">{lead.name}</p>
                                            <div className="flex gap-2 text-xs text-gray-500">
                                                <span>{lead.source}</span> • <span>AED {lead.budget?.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${lead.status === 'New' ? 'bg-blue-500/20 text-blue-400' :
                                                lead.status === 'Closed' ? 'bg-amber-500/20 text-amber-400' :
                                                    'bg-gray-700 text-gray-300'
                                                }`}>
                                                {lead.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <EmptyState
                                    icon={Inbox}
                                    title="No Leads Yet"
                                    description="Start building your pipeline by adding your first lead"
                                    actionLabel="Add Lead"
                                    onAction={() => navigate('/leads')}
                                />
                            )}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm text-center py-20">No leads yet. Add your first lead to start the engine.</p>
                    )}
                </motion.div>

                {/* LEAD SOURCES */}
                <motion.div variants={item} className="bg-white dark:bg-[#1C1C1E] dark:apple-glass shadow-sm dark:shadow-none p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-none">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <PieChartIcon size={20} className="text-blue-500" /> Lead Sources
                    </h3>
                    {pieData.length > 0 ? (
                        <>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#1C1C1E', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-4">
                                {pieData.map((entry, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                        <span className="text-xs text-gray-400">{entry.name} ({entry.value})</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <EmptyState
                            icon={PieChartIcon}
                            title="No Data Yet"
                            description="Lead sources will appear here once you start adding leads"
                            actionLabel="Add First Lead"
                            onAction={() => navigate('/leads')}
                        />
                    )}
                </motion.div>

            </div>
        </motion.div>
    );
};
