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
import { useStore } from './store';
import { Toaster } from 'react-hot-toast';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const user = useStore((state) => state.user);
    if (!user) return <Navigate to="/login" replace />;
    return (
        <div className="flex h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white overflow-hidden transition-colors duration-300">
            <Sidebar />
            <div className="flex-1 relative h-full overflow-hidden flex flex-col">
                <CommandPalette />
                <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
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
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}
