import React, { useState } from 'react';
import { useStore } from '../store';
import { Shield, Trash2, UserPlus, Mail, Key, Phone, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export const Team = () => {
    const { team, addTeamMember, removeTeamMember, user } = useStore();
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', role: 'Agent', password: '', designation: '', phone: '' });

    const isAdmin = user?.role === 'CEO' || user?.role === 'Admin';

    const handleAdd = () => {
        if (!form.name || !form.email || !form.password) return toast.error('All fields required');
        addTeamMember({ ...form, id: Math.random().toString(), status: 'Active', joinedDate: new Date().toISOString().split('T')[0] } as any);
        toast.success(`${form.name} Onboarded Successfully`);
        setForm({ name: '', email: '', role: 'Agent', password: '', designation: '', phone: '' });
        setShowModal(false);
    };

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="p-6 md:p-10 w-full h-screen overflow-y-auto">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Team Access</h1>
                    <p className="text-gray-500 mt-2">Manage your organization</p>
                </div>
                {isAdmin && (
                    <button onClick={() => setShowModal(true)} className="apple-button px-6 py-3 rounded-full flex items-center gap-2 w-full md:w-auto justify-center">
                        <UserPlus size={18} /> Onboard Member
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {team.map(member => (
                    <motion.div variants={item} key={member.id} className="apple-glass p-6 rounded-2xl border border-gray-800 hover:border-gray-700 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-700 to-black flex items-center justify-center font-bold text-xl shadow-lg">
                                {member.name.charAt(0)}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${member.role === 'CEO' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : member.role === 'Admin' ? 'bg-blue-500/20 text-blue-500 border border-blue-500/30' : 'bg-gray-700 text-gray-300'}`}>
                                {member.role}
                            </span>
                        </div>
                        <h3 className="text-xl font-semibold text-white">{member.name}</h3>
                        <p className="text-sm text-gray-400 flex items-center gap-2 mt-1">
                            <Briefcase size={12} /> {member.designation || 'Real Estate Agent'}
                        </p>
                        <div className="mt-4 space-y-2 text-xs text-gray-400">
                            <p className="flex items-center gap-2"><Mail size={12} /> {member.email}</p>
                            <p className="flex items-center gap-2"><Phone size={12} /> {member.phone || 'N/A'}</p>
                            <p className="flex items-center gap-2 text-[10px]"><Key size={10} /> Joined {member.joinedDate}</p>
                        </div>
                        {isAdmin && member.role !== 'CEO' && (
                            <button
                                onClick={() => {
                                    if (confirm(`Revoke access for ${member.name}?`)) {
                                        removeTeamMember(member.id);
                                        toast.success('Access Revoked');
                                    }
                                }}
                                className="w-full mt-6 py-2 bg-red-500/10 text-red-500 rounded-lg text-sm font-semibold hover:bg-red-500 hover:text-white transition-colors"
                            >
                                Revoke Access
                            </button>
                        )}
                    </motion.div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#1C1C1E] p-8 rounded-3xl w-full max-w-md border border-gray-800">
                        <h2 className="text-xl font-semibold mb-6 text-white">Onboard New Member</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 uppercase block mb-1">Full Name</label>
                                <input className="w-full apple-input p-3 rounded-lg" placeholder="John Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase block mb-1">Designation</label>
                                <input className="w-full apple-input p-3 rounded-lg" placeholder="Sales Director" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase block mb-1">Phone Number</label>
                                <input className="w-full apple-input p-3 rounded-lg" placeholder="+971501234567" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase block mb-1">Company Email</label>
                                <input className="w-full apple-input p-3 rounded-lg" placeholder="john@dcapitalrealestate.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase block mb-1">Role</label>
                                <select className="w-full apple-input p-3 rounded-lg" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                                    <option>Agent</option>
                                    <option>Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase block mb-1">Temporary Password</label>
                                <input className="w-full apple-input p-3 rounded-lg" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                            </div>
                            <button onClick={handleAdd} className="w-full bg-white text-black py-3 rounded-xl font-bold mt-4 hover:bg-gray-200 transition-colors">Grant Access</button>
                            <button onClick={() => setShowModal(false)} className="w-full py-3 text-gray-500 text-sm hover:text-white transition-colors">Cancel</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
};
