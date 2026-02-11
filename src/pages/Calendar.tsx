import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, User } from 'lucide-react';
import { useStore } from '../store';
import { MeetingModal } from '../components/MeetingModal';
import type { Task } from '../types';

export const Calendar = () => {
    const { tasks, leads, user } = useStore();
    const isCEO = user?.role?.toLowerCase() === 'ceo';
    const isAdmin = user?.role?.toLowerCase() === 'admin';
    const canManageTeam = isCEO || isAdmin;

    const [currentDate, setCurrentDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

    const monthDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    }, [currentDate]);

    const getTasksForDate = (date: Date) => {
        return tasks.filter(t => {
            const taskDate = new Date(t.dueDate);
            return taskDate.getDate() === date.getDate() &&
                taskDate.getMonth() === date.getMonth() &&
                taskDate.getFullYear() === date.getFullYear();
        });
    };

    return (
        <div className="p-4 md:p-10 space-y-8 bg-gray-50 dark:bg-black min-h-screen pb-24">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-12 md:pt-0">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Mission Calendar</h1>
                    <p className="text-gray-600 dark:text-gray-500 text-sm mt-1">Strategic operation planning and scheduling</p>
                </div>
                <button
                    onClick={() => { setSelectedDate(new Date()); setIsModalOpen(true); }}
                    title="Schedule meeting"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95 touch-target"
                >
                    <Plus size={20} /> Schedule Meeting
                </button>
            </div>

            <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white capitalize">
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
                            title="Previous Month"
                            className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
                            title="Next Month"
                            className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 border-b border-gray-100 dark:border-white/5">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="p-4 text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-gray-50/50 dark:bg-white/[0.02]">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7">
                    {monthDays.map((date, idx) => {
                        if (!date) return <div key={`empty-${idx}`} className="h-32 border-b border-r border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-white/[0.01]" />;

                        const dayTasks = getTasksForDate(date);
                        const isToday = new Date().toDateString() === date.toDateString();

                        return (
                            <div key={date.toISOString()} className="h-32 border-b border-r border-gray-100 dark:border-white/5 p-2 space-y-1 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors relative group">
                                <div className="flex justify-between items-start">
                                    <span className={`text-sm font-bold ${isToday ? 'bg-blue-500 text-white w-7 h-7 flex items-center justify-center rounded-lg shadow-lg' : 'text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'}`}>
                                        {date.getDate()}
                                    </span>
                                </div>
                                <div className="space-y-1 overflow-y-auto max-h-[85px] no-scrollbar">
                                    {dayTasks.map(task => (
                                        <div key={task.id} className={`text-[9px] font-bold p-1 rounded border ${task.priority === 'High' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-500'} truncate`}>
                                            {task.title}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {isModalOpen && (
                <MeetingModal
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
};
