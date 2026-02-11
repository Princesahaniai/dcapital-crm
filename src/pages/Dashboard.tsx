import { useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { Wallet, Users, Building2, Trophy, PieChart as PieChartIcon, ArrowUpRight, Inbox, Calendar, MapPin, Clock, CheckCircle2, ListTodo } from 'lucide-react';
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
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 p-6 md:p-10 pt-16 md:pt-8 h-screen w-full overflow-y-auto">
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

                {/* TODAY'S AGENDA */}
                <motion.div variants={item} className="bg-white dark:bg-[#1C1C1E] apple-glass p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-white/5 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-amber-500/10 transition-colors duration-500" />
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Calendar size={20} className="text-amber-500" /> Today's Agenda
                        </h3>
                        <button onClick={() => navigate('/calendar')} className="text-[10px] font-bold text-amber-500 hover:text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full transition-all">
                            Full Calendar
                        </button>
                    </div>

                    <div className="space-y-4">
                        {useStore.getState().tasks
                            .filter(t => {
                                if (t.category !== 'Meeting' || t.completed || !t.dueDate) return false;
                                const d = new Date(t.dueDate);
                                const today = new Date();
                                return d.getDate() === today.getDate() &&
                                    d.getMonth() === today.getMonth() &&
                                    d.getFullYear() === today.getFullYear();
                            })
                            .sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0))
                            .map(meeting => (
                                <div key={meeting.id} className="p-4 rounded-2xl bg-gray-50 dark:bg-black/40 border border-white/5 hover:border-amber-500/30 transition-all group/item">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex flex-col">
                                            <h4 className="font-bold text-gray-900 dark:text-white group-hover/item:text-amber-500 transition-colors">{meeting.title}</h4>
                                            <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-wider mt-1">
                                                <Clock size={10} className="text-amber-500" />
                                                {new Date(meeting.dueDate || 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {meeting.duration && <span className="opacity-50">({meeting.duration}m)</span>}
                                            </div>
                                        </div>
                                        <div className={`p-2 rounded-xl ${meeting.meetingType === 'video' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                            {meeting.meetingType === 'video' ? <ArrowUpRight size={16} /> : <MapPin size={16} />}
                                        </div>
                                    </div>

                                    {meeting.leadId && (
                                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px] font-bold text-amber-500">
                                                    {leads.find(l => l.id === meeting.leadId)?.name.charAt(0)}
                                                </div>
                                                <span className="text-xs text-gray-400">{leads.find(l => l.id === meeting.leadId)?.name}</span>
                                            </div>
                                            {meeting.meetingType === 'video' && (
                                                <button className="text-[10px] font-bold text-blue-400 hover:underline uppercase tracking-widest">
                                                    Join Call
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        }
                        {useStore.getState().tasks.filter(t => {
                            if (t.category !== 'Meeting' || t.completed || !t.dueDate) return false;
                            const d = new Date(t.dueDate);
                            const today = new Date();
                            return d.getDate() === today.getDate() &&
                                d.getMonth() === today.getMonth() &&
                                d.getFullYear() === today.getFullYear();
                        }).length === 0 && (
                                <div className="py-10 text-center flex flex-col items-center">
                                    <div className="p-4 rounded-full bg-amber-500/5 text-amber-500/20 mb-4">
                                        <Inbox size={40} />
                                    </div>
                                    <p className="text-gray-500 text-sm italic">Clear schedule for today.</p>
                                    <button onClick={() => navigate('/calendar')} className="mt-4 text-[10px] font-bold text-amber-500 uppercase tracking-widest hover:underline">
                                        Schedule Something
                                    </button>
                                </div>
                            )}
                    </div>
                </motion.div>

                {/* MY TASKS QUICK VIEW */}
                <motion.div variants={item} className="bg-white dark:bg-[#1C1C1E] apple-glass p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-white/5 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors duration-500" />
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <ListTodo size={20} className="text-blue-500" /> My Tasks
                        </h3>
                        <button onClick={() => navigate('/tasks')} className="text-[10px] font-bold text-blue-500 hover:text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full transition-all">
                            View All
                        </button>
                    </div>

                    <div className="space-y-3">
                        {useStore.getState().tasks
                            .filter(t => t.assignedTo === user?.id && !t.completed && t.category !== 'Meeting')
                            .sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0))
                            .slice(0, 4)
                            .map(task => (
                                <div
                                    key={task.id}
                                    onClick={() => navigate('/tasks')}
                                    className="p-3 rounded-xl bg-gray-50 dark:bg-black/30 border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer group/task"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-1.5 h-8 rounded-full ${task.priority === 'High' ? 'bg-red-500' :
                                            task.priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'
                                            }`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm text-gray-900 dark:text-white truncate group-hover/task:text-blue-500 transition-colors">
                                                {task.title}
                                            </p>
                                            <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                                                <Clock size={10} /> {new Date(task.dueDate || 0).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <CheckCircle2 size={16} className="text-gray-300 dark:text-gray-700 group-hover/task:text-blue-500 transition-colors" />
                                    </div>
                                </div>
                            ))
                        }
                        {useStore.getState().tasks.filter(t => t.assignedTo === user?.id && !t.completed && t.category !== 'Meeting').length === 0 && (
                            <div className="py-8 text-center flex flex-col items-center">
                                <div className="p-3 rounded-full bg-blue-500/5 text-blue-500/20 mb-3">
                                    <CheckCircle2 size={32} />
                                </div>
                                <p className="text-gray-500 text-xs italic">All caught up!</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* RECENT LEADS */}
                <motion.div variants={item} className="lg:col-span-2 bg-white dark:bg-[#1C1C1E] dark:apple-glass shadow-sm dark:shadow-none p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-none">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Users size={20} className="text-blue-500" /> Recent Leads
                        </h3>
                    </div>
                    {recentLeads.length > 0 ? (
                        <div className="space-y-4">
                            {recentLeads.map((lead) => (
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
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={Users}
                            title="No Leads Yet"
                            description="Start building your pipeline by adding your first lead"
                            actionLabel="Add Lead"
                            onAction={() => navigate('/leads')}
                        />
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
                                {pieData.map((data, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                        <span className="text-xs text-gray-400">{data.name} ({data.value})</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <EmptyState
                            icon={PieChartIcon as any}
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
