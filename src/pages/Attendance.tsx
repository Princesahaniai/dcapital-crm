import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { motion } from 'framer-motion';
import { MapPin, Clock, CheckCircle2, XCircle, AlertCircle, Map, User, Calendar as CalendarIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import type { AttendanceLog } from '../types';

export const Attendance = () => {
    const { user, team, clockIn, updateAttendanceLog, attendanceLogs, setAttendanceLogs } = useStore();
    const [isLoading, setIsLoading] = useState(false);
    const [isClockingIn, setIsClockingIn] = useState(false);

    const isAdmin = user?.role === 'admin' || user?.role === 'ceo' || user?.role === 'manager';
    const todayStr = new Date().toISOString().split('T')[0];

    // Fetch logs on mount
    useEffect(() => {
        const fetchLogs = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                const cmpId = user.companyId || 'd-capital-main';
                let q;
                if (isAdmin) {
                    q = query(
                        collection(db, 'attendanceLogs'),
                        where('companyId', '==', cmpId)
                    );
                } else {
                    q = query(
                        collection(db, 'attendanceLogs'),
                        where('companyId', '==', cmpId),
                        where('userId', '==', user.id)
                    );
                }

                const snapshot = await getDocs(q);
                const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceLog));
                
                // Sort by date desc, then time desc
                logs.sort((a, b) => {
                    if (a.date !== b.date) return b.date.localeCompare(a.date);
                    return b.clockInTime.localeCompare(a.clockInTime);
                });
                
                setAttendanceLogs(logs);
            } catch (err) {
                console.error('Failed to fetch attendance logs', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLogs();
    }, [user, isAdmin, setAttendanceLogs]);

    // Agent: Clock In Handler
    const handleClockIn = () => {
        if (!user) return;
        
        // Check if already clocked in today
        const alreadyClockedIn = attendanceLogs.some(log => log.userId === user.id && log.date === todayStr);
        if (alreadyClockedIn) {
            toast.error('You have already clocked in today!');
            return;
        }

        setIsClockingIn(true);
        toast.loading('Acquiring secure GPS coordinates...', { id: 'gps' });

        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser.', { id: 'gps' });
            setIsClockingIn(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const now = new Date();
                
                const newLog: AttendanceLog = {
                    id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    userId: user.id,
                    employeeName: user.name,
                    date: todayStr,
                    clockInTime: now.toTimeString().split(' ')[0], // HH:MM:SS
                    status: 'Present',
                    markedBy: 'Self',
                    location: {
                        latitude,
                        longitude,
                        addressString: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`
                    }
                };

                await clockIn(newLog);
                toast.success('Successfully clocked in!', { id: 'gps' });
                setIsClockingIn(false);
            },
            (error) => {
                console.error('GPS Error:', error);
                toast.error('Failed to get location. Please enable location services.', { id: 'gps' });
                setIsClockingIn(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const hasClockedInToday = attendanceLogs.some(log => log.userId === user?.id && log.date === todayStr);

    return (
        <div className="p-4 md:p-8 pt-16 md:pt-8 bg-gray-50 dark:bg-black w-full min-h-screen overflow-y-auto">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <MapPin className="text-white" size={24} />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Attendance</h1>
                    <p className="text-gray-500 text-sm font-medium">Secure Location & Time Tracking</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LEFT: PERSONAL CLOCK-IN PANEL */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[#1C1C1E] border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                        
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <Clock className="text-amber-500" /> My Attendance
                        </h2>

                        <div className="space-y-4">
                            <div className="bg-black/50 rounded-2xl p-4 border border-white/5 flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Today's Date</p>
                                    <p className="text-white font-mono font-medium">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                                <CalendarIcon className="text-gray-600" size={24} />
                            </div>

                            <div className="bg-black/50 rounded-2xl p-4 border border-white/5 flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Status</p>
                                    {hasClockedInToday ? (
                                        <div className="flex items-center gap-2 text-green-500 font-bold">
                                            <CheckCircle2 size={16} /> Present
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-red-500 font-bold">
                                            <XCircle size={16} /> Not Clocked In
                                        </div>
                                    )}
                                </div>
                            </div>

                            {!hasClockedInToday ? (
                                <button
                                    onClick={handleClockIn}
                                    disabled={isClockingIn}
                                    className={`w-full py-4 rounded-2xl font-black text-lg transition-all shadow-lg flex justify-center items-center gap-2 ${
                                        isClockingIn 
                                        ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
                                        : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-amber-500/30'
                                    }`}
                                >
                                    {isClockingIn ? 'Acquiring GPS...' : 'CLOCK IN'}
                                </button>
                            ) : (
                                <div className="w-full py-4 rounded-2xl font-black text-lg text-center bg-green-500/10 text-green-500 border border-green-500/20">
                                    Clocked In Today
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT: HISTORY OR ADMIN DASHBOARD */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#1C1C1E] border border-white/10 rounded-3xl p-6 shadow-xl h-full flex flex-col">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            {isAdmin ? <User className="text-amber-500" /> : <Clock className="text-amber-500" />}
                            {isAdmin ? 'Team Master Dashboard' : 'My History'}
                        </h2>

                        {isLoading ? (
                            <div className="flex-1 flex items-center justify-center text-gray-500">
                                Loading records...
                            </div>
                        ) : attendanceLogs.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-3 py-10">
                                <AlertCircle size={32} className="opacity-20" />
                                <p>No attendance records found.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-xl border border-white/5 flex-1">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-black/40 border-b border-white/5">
                                            {isAdmin && <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Employee</th>}
                                            <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                                            <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Time In</th>
                                            <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                            <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Location</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attendanceLogs.map((log) => (
                                            <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                                {isAdmin && (
                                                    <td className="p-4">
                                                        <span className="font-bold text-white text-sm">{log.employeeName}</span>
                                                    </td>
                                                )}
                                                <td className="p-4">
                                                    <span className="font-mono text-sm text-gray-300">{log.date}</span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="font-mono text-sm text-amber-500">{log.clockInTime}</span>
                                                </td>
                                                <td className="p-4">
                                                    {isAdmin ? (
                                                        <select
                                                            value={log.status}
                                                            onChange={(e) => updateAttendanceLog(log.id, { status: e.target.value as any, markedBy: 'Admin' })}
                                                            className="bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-sm font-bold outline-none focus:border-amber-500 cursor-pointer text-white"
                                                            style={{
                                                                color: log.status === 'Present' ? '#22c55e' : log.status === 'Absent' ? '#ef4444' : log.status === 'Late' ? '#eab308' : '#3b82f6'
                                                            }}
                                                        >
                                                            <option value="Present">Present</option>
                                                            <option value="Absent">Absent</option>
                                                            <option value="Late">Late</option>
                                                            <option value="Half-Day">Half-Day</option>
                                                        </select>
                                                    ) : (
                                                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                                                            log.status === 'Present' ? 'bg-green-500/10 text-green-500' :
                                                            log.status === 'Absent' ? 'bg-red-500/10 text-red-500' :
                                                            log.status === 'Late' ? 'bg-yellow-500/10 text-yellow-500' :
                                                            'bg-blue-500/10 text-blue-500'
                                                        }`}>
                                                            {log.status}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <a 
                                                        href={`https://www.google.com/maps/search/?api=1&query=${log.location.latitude},${log.location.longitude}`} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-bold transition-colors"
                                                    >
                                                        <Map size={12} /> View Map
                                                    </a>
                                                    {log.markedBy === 'Admin' && <span className="ml-2 text-[10px] text-gray-500 uppercase">Modified</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
