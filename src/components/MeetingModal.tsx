import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, AlignLeft, User, Video } from 'lucide-react';
import { useStore } from '../store';
import type { Task } from '../types';
import toast from 'react-hot-toast';

interface MeetingModalProps {
    leadId?: string;
    onClose: () => void;
}

export const MeetingModal: React.FC<MeetingModalProps> = ({ leadId, onClose }) => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('12:00');
    const [location, setLocation] = useState('');
    const [type, setType] = useState<'in-person' | 'video' | 'call'>('in-person');
    const [duration, setDuration] = useState('60');
    const { addTask, user } = useStore();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const scheduledAt = new Date(`${date}T${time}`).getTime();

        const newTask: Task = {
            id: Math.random().toString(36).substr(2, 9),
            title,
            description: `Location: ${location} | Type: ${type}`,
            status: 'Pending',
            priority: 'High',
            category: 'Meeting',
            dueDate: scheduledAt,
            createdAt: Date.now(),
            completed: false,
            leadId,
            location,
            meetingType: type,
            duration: parseInt(duration),
            assignedTo: user?.id || '',
            assignedBy: user?.id || 'system',
            history: [],
            comments: []
        };

        addTask(newTask);
        toast.success('Meeting Scheduled');
        onClose();
    };

    return (
        <div className="mobile-modal-container">
            <div className="mobile-modal-content max-w-lg">
                <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                            <Calendar size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Schedule Meeting</h2>
                    </div>
                    <button onClick={onClose} title="Close" className="text-gray-400 hover:text-white p-2 touch-target">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Meeting Title</label>
                        <input
                            required
                            title="Meeting Title"
                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-2xl text-gray-900 dark:text-white outline-none focus:border-blue-500"
                            placeholder="e.g., Property Viewing - Downtown Dubai"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Date</label>
                            <input
                                type="date"
                                title="Meeting Date"
                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-2xl text-gray-900 dark:text-white outline-none focus:border-blue-500"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Time</label>
                            <input
                                type="time"
                                title="Meeting Time"
                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-2xl text-gray-900 dark:text-white outline-none focus:border-blue-500"
                                value={time}
                                onChange={e => setTime(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Location / Join Link</label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 pl-12 rounded-2xl text-gray-900 dark:text-white outline-none focus:border-blue-500"
                                placeholder="Location or Virtual Link"
                                title="Location"
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Type</label>
                            <select
                                title="Meeting Type"
                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-2xl text-gray-900 dark:text-white outline-none focus:border-blue-500"
                                value={type}
                                onChange={e => setType(e.target.value as any)}
                            >
                                <option value="in-person">In-Person</option>
                                <option value="video">Virtual Video</option>
                                <option value="call">Phone Call</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Duration (Min)</label>
                            <select
                                title="Duration"
                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-2xl text-gray-900 dark:text-white outline-none focus:border-blue-500"
                                value={duration}
                                onChange={e => setDuration(e.target.value)}
                            >
                                <option value="15">15 min</option>
                                <option value="30">30 min</option>
                                <option value="60">1 hour</option>
                                <option value="120">2 hours</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all mt-4"
                    >
                        Confirm Mission
                    </button>
                </form>
            </div>
        </div>
    );
};
