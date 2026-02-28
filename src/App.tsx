import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { CommandPalette } from './components/CommandPalette';
import { Dashboard } from './pages/Dashboard';
import { Leads } from './pages/Leads';
import { Inventory } from './pages/Inventory';
import { Tasks } from './pages/Tasks';
import { Settings } from './pages/Settings';
import { Team } from './pages/Team';
import { Login } from './pages/Login';
import { Reports } from './pages/Reports';
import { Calendar } from './pages/Calendar';
import { SocialStudio } from './pages/SocialStudio';
import { WarRoom } from './pages/WarRoom';
import { Trash } from './pages/Trash';
import { ClientPortal } from './pages/ClientPortal';
import { SetPassword } from './pages/SetPassword';
import { AuthDiagnostic } from './pages/AuthDiagnostic';
import { useStore } from './store';
import { useRealtimeSync } from './hooks/useRealtimeSync';
import toast, { Toaster } from 'react-hot-toast';
import PWAInstall from './components/PWAInstall';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const user = useStore((state) => state.user);
    const isAuthLoading = useStore((state) => state.isAuthLoading);

    // Meeting Guidelines Reminder
    React.useEffect(() => {
        const checkMeetings = () => {
            const now = Date.now();
            const upcoming = useStore.getState().tasks.filter(t =>
                t.category === 'Meeting' &&
                !t.completed &&
                t.dueDate &&
                t.dueDate > now &&
                t.dueDate - now <= 30 * 60 * 1000 // 30 minutes
            );

            upcoming.forEach(meeting => {
                const notifText = `🔔 Meeting starting soon: ${meeting.title}`;
                const hasNotified = useStore.getState().notifications.some(n => n.text === notifText && Date.now() - new Date(n.date).getTime() < 30 * 60 * 1000);

                if (!hasNotified) {
                    useStore.getState().addNotification(notifText);
                    toast(`Upcoming Meeting: ${meeting.title}`, { icon: '📅' });
                }
            });
        };

        const interval = setInterval(checkMeetings, 60000);
        checkMeetings();

        return () => clearInterval(interval);
    }, []);

    // 🛡️ AUTH LOADING GUARD: Don't redirect until Firebase has responded
    if (isAuthLoading) {
        return (
            <div className="h-screen w-screen bg-black flex flex-col items-center justify-center gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30 animate-pulse">
                    <span className="font-bold text-white text-3xl">D</span>
                </div>
                <div className="text-center">
                    <p className="text-[#D4AF37] font-bold text-lg tracking-wide">Loading D-Capital OS...</p>
                    <p className="text-zinc-600 text-xs mt-2">Verifying your session</p>
                </div>
                <div className="w-48 h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full animate-[loading_1.5s_ease-in-out_infinite]" style={{ width: '60%', animation: 'loading 1.5s ease-in-out infinite' }} />
                </div>
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;
    return (
        <div className="flex safe-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white overflow-hidden transition-colors duration-300">
            <Sidebar />
            <div className="flex-1 relative h-full flex flex-col overflow-hidden bg-gray-50 dark:bg-black">
                <CommandPalette />
                <main className="flex-1 overflow-y-auto pb-32 md:pb-6 relative scrollbar-hide">
                    {children}
                </main>
                <BottomNav />
            </div>
        </div>
    );
};

export default function App() {
    // Global Auth Listener
    React.useEffect(() => {
        const unsubscribe = useStore.getState().subscribeToAuthChanges();
        return () => unsubscribe();
    }, []);

    // Real-Time Sync (onSnapshot for leads, tasks, team)
    useRealtimeSync();

    return (
        <>
            <PWAInstall />
            <Toaster position="top-center" toastOptions={{ style: { background: '#1C1C1E', color: '#fff', border: '1px solid #333' } }} />
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/set-password" element={<SetPassword />} />
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
                <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
                <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
                <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
                <Route path="/social-studio" element={<ProtectedRoute><SocialStudio /></ProtectedRoute>} />
                <Route path="/admin/social-studio" element={<ProtectedRoute><SocialStudio /></ProtectedRoute>} />
                <Route path="/social-studio-v2" element={<ProtectedRoute><SocialStudio /></ProtectedRoute>} />
                <Route path="/war-room" element={<ProtectedRoute><WarRoom /></ProtectedRoute>} />
                <Route path="/trash" element={<ProtectedRoute><Trash /></ProtectedRoute>} />
                <Route path="/auth-diagnostic" element={<ProtectedRoute><AuthDiagnostic /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/portal/:collectionId" element={<ClientPortal />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}
