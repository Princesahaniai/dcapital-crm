import React, { useRef, useState } from 'react';
import { useStore } from '../store';
import { Save, Upload, Download, Trash2, UserCircle, ShieldCheck, Lock, AlertTriangle, HardDrive, Webhook, Copy, MessageSquare, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { PasswordStrengthIndicator } from '../components/PasswordStrengthIndicator';
import { validatePassword } from '../utils/password';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export const Settings = () => {
    const { user, leads, properties, tasks, activities, importData, resetSystem, resetLeads, resetProperties, updateProfile, changePassword, messageTemplates, fetchMessageTemplates, saveMessageTemplate, deleteMessageTemplate } = useStore();
    const fileInput = useRef<HTMLInputElement>(null);
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');

    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showBackupReminder, setShowBackupReminder] = useState(false);
    const [daysSinceBackup, setDaysSinceBackup] = useState(0);
    const [showDailyBackup, setShowDailyBackup] = useState(false);
    const [storageUsage, setStorageUsage] = useState({ used: 0, total: 5, percentage: 0 });
    const [showStorageWarning, setShowStorageWarning] = useState(false);

    // Comms Hub State
    const [templateTitle, setTemplateTitle] = useState('');
    const [templateContent, setTemplateContent] = useState('');

    // Calculate localStorage usage
    const calculateStorageUsage = () => {
        let totalSize = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                totalSize += localStorage[key].length + key.length;
            }
        }
        const usedMB = (totalSize / (1024 * 1024)).toFixed(2);
        const totalMB = 5; // Browser limit is ~5-10MB, we use 5MB as safe limit
        const percentage = (parseFloat(usedMB) / totalMB) * 100;

        setStorageUsage({ used: parseFloat(usedMB), total: totalMB, percentage });

        // Show warning if approaching limit (80% = 4MB)
        if (percentage >= 80) {
            setShowStorageWarning(true);
        }
    };

    // Check for backup reminders and daily auto-backup on mount
    React.useEffect(() => {
        // Calculate storage usage
        calculateStorageUsage();

        // Check last backup date
        const lastBackup = localStorage.getItem('dcapital_last_backup');
        const lastDailyPrompt = localStorage.getItem('dcapital_last_daily_prompt');

        if (lastBackup) {
            const daysSince = Math.floor((Date.now() - new Date(lastBackup).getTime()) / (1000 * 60 * 60 * 24));
            setDaysSinceBackup(daysSince);

            // Show monthly reminder (30 days)
            if (daysSince >= 30) {
                setShowBackupReminder(true);
            }

            // Show daily auto-backup prompt (24 hours since last prompt)
            if (lastDailyPrompt) {
                const hoursSincePrompt = Math.floor((Date.now() - new Date(lastDailyPrompt).getTime()) / (1000 * 60 * 60));
                if (hoursSincePrompt >= 24) {
                    setShowDailyBackup(true);
                }
            } else {
                // Never prompted before
                setShowDailyBackup(true);
            }
        } else {
            // Never backed up
            setShowBackupReminder(true);
            setDaysSinceBackup(999);
            setShowDailyBackup(true);
        }

        // Fetch templates on mount
        if (user?.role === 'ceo' || user?.role === 'admin') {
            fetchMessageTemplates();
        }
    }, [user?.role]);

    const handleExport = (isDailyBackup = false) => {
        // Data integrity check before export
        const integrityCheck = {
            leadsValid: Array.isArray(leads),
            propertiesValid: Array.isArray(properties),
            tasksValid: Array.isArray(tasks),
            activitiesValid: Array.isArray(activities),
            timestamp: Date.now()
        };

        if (!integrityCheck.leadsValid || !integrityCheck.propertiesValid ||
            !integrityCheck.tasksValid || !integrityCheck.activitiesValid) {
            toast.error('⚠️ Data integrity check failed! Contact Admin@dcapitalrealestate.com.');
            return;
        }

        const exportData = {
            version: '1.0.0', // Data version for future migrations
            exportedAt: new Date().toISOString(),
            exportedBy: user?.email || 'unknown',
            exportType: isDailyBackup ? 'auto-daily' : 'manual',
            integrityCheck,
            metadata: {
                totalLeads: leads.length,
                totalProperties: properties.length,
                totalTasks: tasks.length,
                totalActivities: activities.length,
                companyName: 'D-Capital Real Estate'
            },
            data: {
                leads,
                properties,
                tasks,
                activities
            }
        };

        const data = JSON.stringify(exportData, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `DCAPITAL_BACKUP_v${exportData.version}_${new Date().toISOString().split('T')[0]}.json`;
        a.click();

        // Track last backup date
        localStorage.setItem('dcapital_last_backup', new Date().toISOString());

        // Track daily prompt if this was auto-backup
        if (isDailyBackup) {
            localStorage.setItem('dcapital_last_daily_prompt', new Date().toISOString());
            setShowDailyBackup(false);
        }

        // Recalculate storage after backup
        calculateStorageUsage();

        toast.success(isDailyBackup ? '✅ Daily Backup Complete!' : '✅ Backup Downloaded Successfully');
    };

    const handleSaveTemplate = async () => {
        if (!templateTitle || !templateContent) return toast.error('Fill all fields');
        await saveMessageTemplate({ title: templateTitle, content: templateContent, target: 'whatsapp' });
        setTemplateTitle('');
        setTemplateContent('');
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const parsed = JSON.parse(event.target?.result as string);

                    // Check if it's a versioned backup
                    if (parsed.version && parsed.data) {
                        // Versioned backup (v1.0.0+)
                        const { version, data, metadata } = parsed;

                        toast.success(`📦 Restoring backup v${version}...`);

                        // Future: Add migration logic here if needed
                        // if (version === '1.0.0') { ... migrate to 2.0.0 ... }

                        importData(data);
                        toast.success(`✅ System Restored (${metadata?.totalLeads || 0} leads, ${metadata?.totalProperties || 0} properties)`);
                    } else {
                        // Legacy backup (pre-versioning)
                        toast.success('📦 Restoring legacy backup...');
                        importData(parsed);
                        toast.success('✅ System Restored');
                    }
                } catch (error) {
                    toast.error('❌ Invalid Backup File');
                }
            };
            reader.readAsText(file);
        }
    };

    const handlePasswordChange = async () => {
        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error('All password fields are required');
            return;
        }

        const validation = validatePassword(newPassword);
        if (!validation.valid) {
            toast.error(validation.message);
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        const success = await changePassword(currentPassword, newPassword);
        if (success) {
            toast.success('Password changed successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            toast.error('Current password is incorrect');
        }
    };

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 p-10 overflow-y-auto h-screen w-full">
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">Settings</h1>

            {/* BACKUP REMINDER BANNER */}
            {showBackupReminder && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 rounded-2xl shadow-lg flex items-center justify-between"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-full">
                            <Download size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">⚠️ Backup Reminder</h3>
                            <p className="text-sm text-white/90">
                                {daysSinceBackup === 999
                                    ? 'You haven\'t backed up your data yet!'
                                    : `Last backup was ${daysSinceBackup} days ago. Backup recommended every 30 days.`}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                handleExport();
                                setShowBackupReminder(false);
                            }}
                            className="bg-white text-amber-600 font-bold px-6 py-3 rounded-full hover:bg-gray-100 transition-all shadow-lg flex items-center gap-2"
                        >
                            <Download size={18} /> Backup Now
                        </button>
                        <button
                            onClick={() => setShowBackupReminder(false)}
                            className="text-white/80 hover:text-white px-4"
                        >
                            Dismiss
                        </button>
                    </div>
                </motion.div>
            )}

            {/* DAILY AUTO-BACKUP PROMPT */}
            {showDailyBackup && !showBackupReminder && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg flex items-center justify-between"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-full">
                            <Download size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">📅 Daily Backup Recommended</h3>
                            <p className="text-sm text-white/90">
                                Protect your data with a quick daily backup. Takes 2 seconds!
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => handleExport(true)}
                            className="bg-white text-blue-600 font-bold px-6 py-3 rounded-full hover:bg-gray-100 transition-all shadow-lg flex items-center gap-2"
                        >
                            <Download size={18} /> Backup Now
                        </button>
                        <button
                            onClick={() => {
                                setShowDailyBackup(false);
                                localStorage.setItem('dcapital_last_daily_prompt', new Date().toISOString());
                            }}
                            className="text-white/80 hover:text-white px-4"
                        >
                            Later
                        </button>
                    </div>
                </motion.div>
            )}

            {/* STORAGE WARNING BANNER */}
            {showStorageWarning && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-2xl shadow-lg"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-full">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">⚠️ Storage Limit Warning</h3>
                                <p className="text-sm text-white/90">
                                    You're using {storageUsage.used}MB of {storageUsage.total}MB ({storageUsage.percentage.toFixed(0)}%). Backup now and consider Firebase migration.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowStorageWarning(false)}
                            className="text-white/80 hover:text-white px-4"
                        >
                            Dismiss
                        </button>
                    </div>
                </motion.div>
            )}

            <motion.div variants={item} className="bg-white dark:bg-[#1C1C1E] dark:apple-glass border-2 border-gray-200 dark:border-white/10 p-8 rounded-2xl shadow-lg dark:shadow-none">
                <h2 className="text-xl font-semibold mb-8 flex items-center gap-3 text-gray-900 dark:text-white"><UserCircle className="text-blue-500 dark:text-white" size={22} /> Profile</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Name</label>
                        <input
                            className="w-full border-2 border-gray-300 dark:border-gray-600 p-3 rounded-lg focus:border-blue-500 dark:focus:border-blue-500 outline-none transition-colors"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Your name"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Email</label>
                        <input
                            className="w-full border-2 border-gray-300 dark:border-gray-600 p-3 rounded-lg focus:border-blue-500 dark:focus:border-blue-500 outline-none transition-colors"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="your@email.com"
                        />
                    </div>
                </div>
                <div className="mt-8">
                    <button
                        onClick={() => { updateProfile(name, email); toast.success('Profile Updated'); }}
                        className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-8 py-3 rounded-full flex items-center gap-2 shadow-lg transition-colors"
                    >
                        <Save size={18} /> Save Changes
                    </button>
                </div>
            </motion.div>

            {/* PASSWORD CHANGE */}
            <motion.div variants={item} className="bg-white dark:bg-[#1C1C1E] dark:apple-glass border-2 border-gray-200 dark:border-white/10 p-8 rounded-2xl shadow-lg dark:shadow-none">
                <h2 className="text-xl font-semibold mb-8 flex items-center gap-3 text-gray-900 dark:text-white">
                    <Lock className="text-amber-500" size={22} /> Change Password
                </h2>
                <div className="space-y-6 max-w-md">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Current Password</label>
                        <input
                            type="password"
                            className="w-full border-2 border-gray-300 dark:border-gray-600 p-3 rounded-lg focus:border-amber-500 dark:focus:border-amber-500 outline-none transition-colors"
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">New Password</label>
                        <input
                            type="password"
                            className="w-full border-2 border-gray-300 dark:border-gray-600 p-3 rounded-lg focus:border-amber-500 dark:focus:border-amber-500 outline-none transition-colors"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="Enter new password (min 6 chars)"
                        />
                        <PasswordStrengthIndicator password={newPassword} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Confirm New Password</label>
                        <input
                            type="password"
                            className="w-full border-2 border-gray-300 dark:border-gray-600 p-3 rounded-lg focus:border-amber-500 dark:focus:border-amber-500 outline-none transition-colors"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                        />
                    </div>
                    <button
                        onClick={handlePasswordChange}
                        className="bg-amber-500 text-white font-bold px-8 py-3 rounded-full hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20"
                    >
                        Update Password
                    </button>
                </div>
            </motion.div>

            {/* MARKETING INTEGRATIONS - ADMIN ONLY */}
            {(user?.role === 'ceo' || user?.role === 'admin' || user?.email?.includes('admin')) && (
                <motion.div variants={item} className="bg-white dark:bg-[#1C1C1E] dark:apple-glass border-2 border-amber-500/20 p-8 rounded-2xl shadow-lg dark:shadow-none mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold flex items-center gap-3 text-gray-900 dark:text-white">
                            <Webhook className="text-amber-500" size={22} /> Marketing Integrations
                        </h2>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-6">
                        <h3 className="font-bold text-amber-900 dark:text-amber-500">Facebook/Meta Lead Webhook</h3>
                        <p className="text-sm text-amber-700 dark:text-amber-400 mt-1 mb-4">
                            Connect this URL directly to your Facebook Lead Ads or Zapier to automatically funnel new leads into the CRM.
                        </p>
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                readOnly
                                title="Webhook URL"
                                value="https://dcapital-crm.vercel.app/api/lead-webhook"
                                className="flex-1 bg-white dark:bg-black border border-amber-200 dark:border-amber-500/30 p-3 rounded-lg text-gray-900 dark:text-gray-300 font-mono text-sm outline-none"
                            />
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText('https://dcapital-crm.vercel.app/api/lead-webhook');
                                    toast.success('Webhook URL Copied!');
                                }}
                                className="bg-amber-500 hover:bg-amber-600 text-white p-3 rounded-lg shadow-lg flex items-center justify-center transition-colors shrink-0"
                                title="Copy Webhook URL"
                            >
                                <Copy size={20} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* COMMS HUB - ADMIN ONLY */}
            {(user?.role === 'ceo' || user?.role === 'admin' || user?.email?.includes('admin')) && (
                <motion.div variants={item} className="bg-white dark:bg-[#1C1C1E] dark:apple-glass border-2 border-emerald-500/20 p-8 rounded-2xl shadow-lg dark:shadow-none mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold flex items-center gap-3 text-gray-900 dark:text-white">
                            <MessageSquare className="text-emerald-500" size={22} /> Comms Hub (Templates)
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Define New */}
                        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-6 h-fit">
                            <h3 className="font-bold text-emerald-900 dark:text-emerald-500 mb-4">Create WhatsApp Template</h3>
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Template Name e.g., Initial Intro"
                                    value={templateTitle}
                                    onChange={(e) => setTemplateTitle(e.target.value)}
                                    className="w-full bg-white dark:bg-black border border-emerald-200 dark:border-emerald-500/30 p-3 rounded-lg text-gray-900 dark:text-gray-300 outline-none"
                                />
                                <textarea
                                    placeholder="Hi {name}, I noticed your interest in..."
                                    value={templateContent}
                                    onChange={(e) => setTemplateContent(e.target.value)}
                                    rows={4}
                                    className="w-full bg-white dark:bg-black border border-emerald-200 dark:border-emerald-500/30 p-3 rounded-lg text-gray-900 dark:text-gray-300 outline-none resize-none"
                                />
                                <button
                                    onClick={handleSaveTemplate}
                                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Plus size={18} /> Save Template
                                </button>
                            </div>
                        </div>

                        {/* List Existing */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Saved Quick Replies ({messageTemplates.length})</h3>
                            {messageTemplates.length === 0 ? (
                                <div className="text-center p-6 text-gray-500 text-sm border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                                    No templates stored yet. Establish your enterprise scripts here for 1-click sales blasting.
                                </div>
                            ) : (
                                messageTemplates.map(t => (
                                    <div key={t.id} className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-4 rounded-xl flex items-start justify-between group">
                                        <div>
                                            <h4 className="font-bold text-sm text-gray-900 dark:text-white">{t.title}</h4>
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{t.content}</p>
                                        </div>
                                        <button
                                            onClick={() => { if (confirm('Delete template?')) deleteMessageTemplate(t.id) }}
                                            className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Delete Template"
                                            aria-label="Delete Template"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* DATA MANAGEMENT - ADMIN ONLY */}
            {(user?.role === 'ceo' || user?.role === 'admin' || user?.email?.includes('admin')) && (
                <motion.div variants={item} className="bg-white dark:bg-[#1C1C1E] dark:apple-glass border border-gray-100 dark:border-none p-8 rounded-2xl shadow-sm dark:shadow-none">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-semibold flex items-center gap-3 text-gray-900 dark:text-white">
                            <ShieldCheck className="text-blue-500" size={22} /> Data Management
                        </h2>
                        <div className="flex items-center gap-3 text-sm">
                            <HardDrive size={16} className="text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">Storage:</span>
                            <span className={`font-mono font-bold ${storageUsage.percentage >= 80 ? 'text-red-400' :
                                storageUsage.percentage >= 60 ? 'text-amber-400' :
                                    'text-green-400'
                                }`}>
                                {storageUsage.used}MB / {storageUsage.total}MB
                            </span>
                            <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all ${storageUsage.percentage >= 80 ? 'bg-red-500' :
                                        storageUsage.percentage >= 60 ? 'bg-amber-500' :
                                            'bg-green-500'
                                        }`}
                                    style={{ width: `${Math.min(storageUsage.percentage, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Backup Section */}
                    <div className="flex flex-col md:flex-row gap-6 items-center justify-between p-6 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-transparent mb-8">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white text-base">System Backup</h3>
                            <p className="text-sm text-gray-500 mt-1">Export your data safely before making changes.</p>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => handleExport()} className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white font-medium px-6 py-3 rounded-full flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-white/20 transition-all shadow-sm">
                                <Download size={18} /> Export
                            </button>
                            <button onClick={() => fileInput.current?.click()} className="bg-blue-500 text-white font-medium px-6 py-3 rounded-full flex items-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20">
                                <Upload size={18} /> Import
                            </button>
                            <input type="file" ref={fileInput} className="hidden" accept=".json" onChange={handleImport} />
                        </div>
                    </div>

                    {/* Reset Options */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm uppercase tracking-wide">Reset Options</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button onClick={() => { if (confirm('Clear all LEADS? This cannot be undone.')) { resetLeads(); toast.success('Leads Cleared'); } }} className="p-4 rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5 hover:bg-red-100 dark:hover:bg-red-500/10 transition-colors flex items-center justify-between group">
                                <div className="text-left">
                                    <p className="font-bold text-red-600 dark:text-red-400">Clear Leads</p>
                                    <p className="text-xs text-red-400 dark:text-red-500/60">Removes all lead data</p>
                                </div>
                                <Trash2 size={18} className="text-red-400 group-hover:text-red-600" />
                            </button>

                            <button onClick={() => { if (confirm('Clear all PROPERTIES? This cannot be undone.')) { resetProperties(); toast.success('Properties Cleared'); } }} className="p-4 rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5 hover:bg-red-100 dark:hover:bg-red-500/10 transition-colors flex items-center justify-between group">
                                <div className="text-left">
                                    <p className="font-bold text-red-600 dark:text-red-400">Clear Inventory</p>
                                    <p className="text-xs text-red-400 dark:text-red-500/60">Removes all property data</p>
                                </div>
                                <Trash2 size={18} className="text-red-400 group-hover:text-red-600" />
                            </button>
                        </div>

                        <div className="mt-8 pt-8 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-red-600">Factory Reset</h3>
                                <p className="text-sm text-gray-500 mt-1">Wipes EVERYTHING to clean state.</p>
                            </div>
                            <button onClick={() => { if (confirm('FACTORY RESET: Are you sure? This wipes EVERYTHING.')) { resetSystem(); toast.success('System Reset'); } }} className="bg-red-600 text-white font-bold px-6 py-3 rounded-full flex items-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-600/20">
                                <Trash2 size={18} /> Reset System
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Official Branding Footer */}
            <div className="mt-12 text-center border-t border-gray-100 dark:border-white/5 pt-8 pb-4">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Powered by <strong className="text-gray-900 dark:text-white">Doom Capital Real Estate L.L.C.</strong>
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">
                    Support: <a href="mailto:Admin@dcapitalrealestate.com" className="text-[#D4AF37] hover:text-[#B8962F] transition-colors">Admin@dcapitalrealestate.com</a>
                </p>
            </div>
        </motion.div>
    );
};
