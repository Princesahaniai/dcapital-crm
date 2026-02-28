import { useState, useEffect } from 'react';
import { useStore } from '../store';
import {
    UserPlus, Mail, Phone, Shield,
    Ban, CheckCircle, Trash2, Search,
    Clock, Copy, Key, Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export const Team = () => {
    const {
        team, user, fetchTeam, addTeamMember,
        suspendTeamMember, activateTeamMember,
        generateTempPassword, removeTeamMember,
        auditLogs, fetchAuditLogs
    } = useStore();

    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showAuditModal, setShowAuditModal] = useState(false);
    const [inviteLink, setInviteLink] = useState('');

    useEffect(() => {
        fetchTeam();
    }, []);

    useEffect(() => {
        if (showAuditModal) {
            fetchAuditLogs();
        }
    }, [showAuditModal]);

    const isAdmin = user?.role === 'ceo' || user?.role === 'admin';

    const handleInvite = async (formData: any) => {
        try {
            const result = await addTeamMember({
                ...formData
            } as any);

            // Display credentials to admin
            if (result.success) {
                setInviteLink(result.message); // Now contains credentials message
                toast.success('User created successfully!');

                // Also copy password to clipboard for convenience  
                navigator.clipboard.writeText(`Email: ${result.email}\nPassword: ${result.tempPassword}`);
                toast.success('Credentials copied to clipboard!', { duration: 3000 });
            }
        } catch (error: any) {
            console.error('Invite error:', error);
            toast.error(error.message || 'Failed to create user');
        }
    };

    const handleResetPassword = async (userId: string) => {
        if (!confirm('Generate a temporary password for this user?')) return;
        const tempPass = await generateTempPassword(userId);
        navigator.clipboard.writeText(tempPass);
        toast.success(`Temp Password: ${tempPass} (Copied to Clipboard)`);
        alert(`Temporary Password: ${tempPass}\n\nShare this with the user. They will be prompted to change it on login.`);
    };

    const closeModal = () => {
        setInviteLink('');
        setShowInviteModal(false);
    };

    const exportWPSPayroll = () => {
        const headers = ['Employee ID', 'Employee Name', 'Basic Salary', 'Commission', 'Total Earnings', 'Currency'];
        const csvRows = team.map(member => {
            const basicSalary = member.role === 'ceo' ? 50000 : member.role === 'manager' ? 20000 : 10000;
            const commission = member.commissionEarned || 0;
            const total = basicSalary + commission;
            return `"${member.id}","${member.name}","${basicSalary}","${commission}","${total}","AED"`;
        });

        const csvString = [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `WPS_Payroll_Export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("WPS Payroll Exported Successfully!");
    };

    const filteredUsers = team.filter(member => {
        const matchesFilter = filter === 'all' || member.status === filter;
        const matchesSearch =
            member.name.toLowerCase().includes(search.toLowerCase()) ||
            member.email.toLowerCase().includes(search.toLowerCase()) ||
            member.designation?.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'Pending': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            case 'Suspended': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
            case 'Revoked': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-zinc-500/20 text-zinc-400';
        }
    };

    return (
        <div className="p-6 md:p-10 w-full h-screen overflow-y-auto pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Team Access</h1>
                    <p className="text-zinc-400 mt-1">Manage your organization members</p>
                </div>
                {isAdmin && (
                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        <button
                            onClick={exportWPSPayroll}
                            className="bg-green-500/10 text-green-500 border border-green-500/20 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-500 hover:text-black transition-colors"
                        >
                            <Download className="w-5 h-5" />
                            Export WPS Payroll
                        </button>
                        <button
                            onClick={() => setShowAuditModal(true)}
                            className="bg-zinc-800 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-700 transition-colors"
                        >
                            <Clock className="w-5 h-5" />
                            Audit Logs
                        </button>
                        <button
                            onClick={() => setShowInviteModal(true)}
                            className="bg-[#D4AF37] text-black px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#B8962F] transition-colors"
                        >
                            <UserPlus className="w-5 h-5" />
                            Invite Member
                        </button>
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total Members', value: team.length, color: 'text-white' },
                    { label: 'Active', value: team.filter(u => u.status === 'Active').length, color: 'text-green-400' },
                    { label: 'Pending', value: team.filter(u => u.status === 'Pending').length, color: 'text-amber-400' },
                    { label: 'Suspended', value: team.filter(u => u.status === 'Suspended').length, color: 'text-orange-400' }
                ].map((stat, i) => (
                    <div key={i} className="bg-[#1C1C1E] border border-white/5 rounded-2xl p-4">
                        <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">{stat.label}</p>
                        <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search by name, email, or designation..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-[#D4AF37]/50"
                    />
                </div>
                <select
                    title="Filter by Status"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="bg-[#1C1C1E] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]/50"
                >
                    <option value="all">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Suspended">Suspended</option>
                </select>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {filteredUsers.map((member) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            key={member.id}
                            className="bg-[#1C1C1E] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors group relative overflow-hidden"
                        >
                            <div className={`absolute top-0 right-0 p-4`}>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(member.status)}`}>
                                    {member.status}
                                </span>
                            </div>

                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-800 to-black border border-white/10 flex items-center justify-center text-white font-bold text-lg">
                                    {member.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg leading-tight">{member.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Shield className={`w-3 h-3 ${member.role === 'ceo' ? 'text-amber-500' : 'text-blue-500'}`} />
                                        <span className="text-xs text-zinc-400 font-medium uppercase">{member.role}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-white/5">
                                <div className="flex items-center gap-3 text-zinc-400 text-sm">
                                    <Mail className="w-4 h-4 shrink-0" />
                                    <span className="truncate">{member.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-zinc-400 text-sm">
                                    <Phone className="w-4 h-4 shrink-0" />
                                    <span>{member.phone || 'No phone'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-zinc-400 text-sm">
                                    <Clock className="w-4 h-4 shrink-0" />
                                    <span>Joined {new Date(member.joinedDate || Date.now()).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {/* Actions - Only for Admins */}
                            {isAdmin && member.role !== 'ceo' && (
                                <div className="mt-6 grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => handleResetPassword(member.id)}
                                        className="flex items-center justify-center gap-2 py-2 bg-zinc-800/50 text-zinc-300 rounded-lg text-xs font-semibold hover:bg-zinc-800 hover:text-white transition-colors"
                                        title="Generate Temp Password"
                                    >
                                        <Key className="w-3.5 h-3.5" />
                                        Reset Pass
                                    </button>

                                    {member.status === 'Active' ? (
                                        <button
                                            onClick={() => suspendTeamMember(member.id)}
                                            className="flex items-center justify-center gap-2 py-2 bg-orange-500/10 text-orange-500 rounded-lg text-xs font-semibold hover:bg-orange-500 hover:text-black transition-colors"
                                        >
                                            <Ban className="w-3.5 h-3.5" />
                                            Suspend
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => activateTeamMember(member.id)}
                                            className="flex items-center justify-center gap-2 py-2 bg-green-500/10 text-green-500 rounded-lg text-xs font-semibold hover:bg-green-500 hover:text-black transition-colors"
                                        >
                                            <CheckCircle className="w-3.5 h-3.5" />
                                            Activate
                                        </button>
                                    )}

                                    <button
                                        onClick={() => {
                                            if (confirm('Are you sure you want to permanently revoke this user?')) removeTeamMember(member.id);
                                        }}
                                        className="col-span-2 flex items-center justify-center gap-2 py-2 bg-red-500/10 text-red-500 rounded-lg text-xs font-semibold hover:bg-red-500 hover:text-white transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Revoke Access
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-zinc-900 p-8 rounded-3xl w-full max-w-md border border-zinc-700 relative max-h-[80vh] overflow-y-auto custom-scrollbar">
                        {inviteLink ? (
                            <div className="text-center">
                                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                <h2 className="text-xl font-bold text-white mb-2">User Created Successfully! 🎉</h2>
                                <p className="text-zinc-400 text-sm mb-6">Share these credentials with the new team member.<br />They can login immediately!</p>

                                <div className="bg-black/50 p-4 rounded-xl mb-6 text-left text-sm text-zinc-300 font-mono border border-white/10 whitespace-pre-wrap">
                                    {inviteLink}
                                </div>

                                <button onClick={closeModal} className="w-full bg-[#D4AF37] text-black py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#B8962F] transition-colors">
                                    <Copy size={18} /> Credentials Copied! Close
                                </button>
                            </div>
                        ) : (
                            <InviteForm onInvite={handleInvite} onClose={() => setShowInviteModal(false)} />
                        )}
                    </motion.div>
                </div>
            )}

            {/* Audit Logs Modal */}
            {showAuditModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-zinc-900 p-8 rounded-3xl w-full max-w-4xl h-[80vh] border border-zinc-700 relative flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-white">System Audit Logs</h2>
                                <p className="text-zinc-400 text-xs">Tracking all security and user events</p>
                            </div>
                            <button onClick={() => setShowAuditModal(false)} className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors">
                                <Trash2 className="w-5 h-5 opacity-0" /> {/* Spacer */}
                                <span className="sr-only">Close</span>
                                <div className="absolute top-8 right-8 cursor-pointer" onClick={() => setShowAuditModal(false)}>✕</div>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {!auditLogs || auditLogs.length === 0 ? (
                                <div className="text-zinc-500 text-center py-10">No logs found</div>
                            ) : (
                                auditLogs.map((log: any) => (
                                    <div key={log.id} className="bg-black/40 border border-white/5 p-4 rounded-xl flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[#D4AF37] font-bold text-xs uppercase tracking-wider">{log.action}</span>
                                                <span className="text-zinc-500 text-[10px]">{new Date(log.timestamp).toLocaleString()}</span>
                                            </div>
                                            <p className="text-zinc-300 text-sm">
                                                Performed by <span className="text-white font-medium">{log.performedByName}</span>
                                                {log.targetUserId && <span className="text-zinc-500"> on user {log.targetUserId}</span>}
                                            </p>
                                            {log.details && (
                                                <pre className="mt-2 text-[10px] text-zinc-500 bg-black/50 p-2 rounded overflow-x-auto">
                                                    {JSON.stringify(log.details, null, 2)}
                                                </pre>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

const InviteForm = ({ onInvite, onClose }: any) => {
    const [form, setForm] = useState({ name: '', email: '', role: 'agent', designation: '', phone: '' });

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Invite Member</h2>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors">
                    <Trash2 className="w-5 h-5 opacity-0" /> {/* Spacer */}
                </button>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Full Name</label>
                    <input
                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-[#D4AF37] outline-none transition-colors"
                        placeholder="John Doe"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Email Address</label>
                    <input
                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-[#D4AF37] outline-none transition-colors"
                        placeholder="john@example.com"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Role</label>
                        <select
                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-[#D4AF37] outline-none transition-colors"
                            value={form.role}
                            onChange={e => setForm({ ...form, role: e.target.value })}
                        >
                            <option value="agent">Agent</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Designation</label>
                        <input
                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-[#D4AF37] outline-none transition-colors"
                            placeholder="Sales Executive"
                            value={form.designation}
                            onChange={e => setForm({ ...form, designation: e.target.value })}
                        />
                    </div>
                </div>

                <div className="pt-4 flex gap-4">
                    <button onClick={onClose} className="flex-1 py-3 bg-zinc-800 text-white rounded-xl font-bold hover:bg-zinc-700 transition-colors">
                        Cancel
                    </button>
                    <button onClick={() => onInvite(form)} className="flex-1 py-3 bg-[#D4AF37] text-black rounded-xl font-bold hover:bg-[#B8962F] transition-colors">
                        Generate Link
                    </button>
                </div>
            </div>
        </>
    );
}
