import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    Building2,
    ShieldAlert,
    CheckCircle2,
    XCircle,
    Search,
    MoreVertical,
    Activity
} from 'lucide-react';
import { collection, query, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Company {
    id: string;
    name: string;
    adminUid: string;
    createdAt: any;
    status: 'active' | 'suspended';
    plan: string;
}

export const SuperAdmin = () => {
    const user = useStore(state => state.user);
    const navigate = useNavigate();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Extra layer of protection in case routing slips
    useEffect(() => {
        if (!user?.isSuperAdmin) {
            navigate('/');
            return;
        }
        fetchCompanies();
    }, [user, navigate]);

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            // Bypass user's companyId to grab global data
            const q = query(collection(db, 'companies'));
            const snapshot = await getDocs(q);

            const fetched: Company[] = [];
            snapshot.forEach((doc) => {
                fetched.push({ id: doc.id, ...doc.data() } as Company);
            });

            // Sort by creation date descending
            fetched.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
            setCompanies(fetched);
        } catch (error) {
            console.error('Error fetching companies:', error);
            toast.error('Failed to load company directory');
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (company: Company) => {
        const newStatus = company.status === 'active' ? 'suspended' : 'active';

        // Confirmation dialog for suspension
        if (newStatus === 'suspended') {
            if (!window.confirm(`Are you sure you want to suspend ${company.name}? This will instantly lock all their agents out of the CRM.`)) {
                return;
            }
        }

        try {
            // 1. Update Company Doc
            await updateDoc(doc(db, 'companies', company.id), {
                status: newStatus
            });

            // 2. Find and update the CEO/Admin user document specifically to trigger auth guard
            // In a larger prod environment, you might use a Firebase Cloud function to batch update 
            // all users under this companyId. For now, we update the primary Admin, or we rely 
            // on the Auth Guard checking the company status dynamically (which is safer). 
            // Actually, we added subscriptionStatus to the User. Let's update all users in this company.
            const userQuery = query(collection(db, 'users'));
            const userSnap = await getDocs(userQuery);

            const updatePromises: any[] = [];
            userSnap.forEach(uDoc => {
                if (uDoc.data().companyId === company.id) {
                    updatePromises.push(updateDoc(doc(db, 'users', uDoc.id), {
                        subscriptionStatus: newStatus
                    }));
                }
            });

            await Promise.all(updatePromises);

            toast.success(`${company.name} is now ${newStatus.toUpperCase()}`);

            // Update local state
            setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, status: newStatus } : c));

        } catch (error) {
            console.error('Error toggling status:', error);
            toast.error('Failed to update company status');
        }
    };

    const filteredCompanies = companies.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeCount = companies.filter(c => c.status === 'active').length;
    const suspendedCount = companies.filter(c => c.status === 'suspended').length;

    if (!user?.isSuperAdmin) return null;

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 pb-24">

            {/* Header / God Mode Title */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 text-red-500 mb-2">
                        <ShieldAlert size={20} />
                        <span className="font-bold tracking-widest text-sm uppercase">God Mode Authorized</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Global Command Center</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage tenant agencies and SaaS subscriptions.</p>
                </div>
            </header>

            {/* Quick Stats Network */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Agencies</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{companies.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center">
                        <Building2 size={24} className="text-blue-500" />
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Active Subscriptions</p>
                        <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{activeCount}</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center">
                        <CheckCircle2 size={24} className="text-emerald-500" />
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Suspended Accounts</p>
                        <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{suspendedCount}</p>
                    </div>
                    <div className="w-12 h-12 bg-red-50 dark:bg-red-500/10 rounded-xl flex items-center justify-center">
                        <XCircle size={24} className="text-red-500" />
                    </div>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Users size={20} className="text-purple-500" />
                        Tenant Directory
                    </h2>

                    <div className="relative w-full sm:w-64">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search agencies..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-[#0D0D0D] border border-gray-200 dark:border-gray-800 rounded-xl py-2 pl-10 pr-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-[#0D0D0D] border-b border-gray-200 dark:border-gray-800">
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Company ID</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Agency Name</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joined</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-gray-500">
                                        <div className="flex items-center justify-center gap-2">
                                            <Activity className="animate-spin text-purple-500" size={20} />
                                            Loading tenants...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredCompanies.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-gray-500">No agencies found</td>
                                </tr>
                            ) : (
                                filteredCompanies.map((company) => (
                                    <tr key={company.id} className="hover:bg-gray-50 dark:hover:bg-[#222] transition-colors">
                                        <td className="py-4 px-6 text-sm text-gray-500 dark:text-gray-400 font-mono">
                                            {company.id}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="font-medium text-gray-900 dark:text-white">{company.name}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">Plan: {company.plan?.toUpperCase()}</div>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-gray-500 dark:text-gray-400">
                                            {company.createdAt?.toDate ? new Date(company.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${company.status === 'active'
                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                                                    : 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20'
                                                }`}>
                                                {company.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <button
                                                onClick={() => toggleStatus(company)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${company.status === 'active'
                                                        ? 'bg-gray-100 hover:bg-red-100 text-gray-700 hover:text-red-600 dark:bg-gray-800 dark:hover:bg-red-500/20 dark:text-gray-300 dark:hover:text-red-400'
                                                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-400'
                                                    }`}
                                            >
                                                {company.status === 'active' ? 'Suspend License' : 'Reactivate License'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};
