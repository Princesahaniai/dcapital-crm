import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
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
import { useStore } from './store';
import toast, { Toaster } from 'react-hot-toast';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const user = useStore((state) => state.user);
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

        const interval = setInterval(checkMeetings, 60000); // Check every minute
        checkMeetings(); // Check immediately

        return () => clearInterval(interval);
    }, []);

    if (!user) return <Navigate to="/login" replace />;
    return (
        <div className="flex safe-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white overflow-hidden transition-colors duration-300">
            <Sidebar />
            <div className="flex-1 relative h-full flex flex-col overflow-hidden bg-gray-50 dark:bg-black">
                <CommandPalette />
                <main className="flex-1 overflow-y-auto pb-32 md:pb-6 relative scrollbar-hide">
                    {children}
                </main>
                <MobileNav />
            </div>
        </div>
    );
};

export default function App() {
    return (
        <>
            <Toaster position="top-center" toastOptions={{ style: { background: '#1C1C1E', color: '#fff', border: '1px solid #333' } }} />
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
                <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
                <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
                <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} /> {/* Added Calendar Route */}
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}
