import { useState, useMemo } from 'react';
import { useStore } from '../store';
import { CheckCircle, Circle, Plus, Trash2, Calendar, Phone, Mail, FileText, AlertCircle, User, Clock, Search, PlayCircle, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TaskDetail } from '../components/TaskDetail';
import toast from 'react-hot-toast';
import type { Task } from '../types';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } };

export const Tasks = () => {
    const { tasks, addTask, deleteTask, user, team } = useStore();
    const [text, setText] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<Task['priority']>('Medium');
    const [category, setCategory] = useState<Task['category']>('Call');
    const [assignedTo, setAssignedTo] = useState<string>(user?.id || '');
    const [dueDate, setDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [dueTime, setDueTime] = useState<string>('12:00');

    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'In Progress' | 'Completed' | 'Overdue'>('All');

    // Role-based filtering
    const visibleTasks = useMemo(() => {
        return tasks.filter(t => {
            const isAssignedToMe = t.assignedTo === user?.id;
            const isAssignedByMe = t.assignedBy === user?.id;
            const canSeeAll = user?.role === 'ceo' || user?.role === 'admin';

            const canSeeAsManager = user?.role === 'manager' && (isAssignedToMe || isAssignedByMe);

            if (canSeeAll) return true;
            if (canSeeAsManager) return true;
            return isAssignedToMe;
        }).filter(t => filterStatus === 'All' || t.status === filterStatus);
    }, [tasks, user, filterStatus]);

    const handleAdd = () => {
        if (!text.trim()) {
            toast.error('Task title is required');
            return;
        }

        const combinedDueDate = new Date(`${dueDate}T${dueTime}`).getTime();

        addTask({
            id: Math.random().toString(36).substr(2, 9),
            title: text,
            description,
            status: 'Pending',
            priority,
            category,
            dueDate: combinedDueDate,
            assignedTo: assignedTo || user?.id || '',
            assignedBy: user?.id || 'system',
            createdAt: Date.now(),
            completed: false,
            history: [],
            comments: []
        });

        setText('');
        setDescription('');
        setShowAddForm(false);
        toast.success('Task Force: Mission Dispatched');
    };

    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case 'Call': return <Phone size={14} />;
            case 'Meeting': return <Calendar size={14} />;
            case 'Email': return <Mail size={14} />;
            case 'Site Visit': return <Search size={14} />;
            default: return <FileText size={14} />;
        }
    };

    const getStatusIcon = (status: Task['status']) => {
        switch (status) {
            case 'Completed': return <CheckCircle className="text-green-500" size={20} />;
            case 'In Progress': return <PlayCircle className="text-blue-500" size={20} />;
            case 'Overdue': return <AlertCircle className="text-red-500" size={20} />;
            default: return <Circle className="text-gray-400 group-hover:text-blue-500" size={20} />;
        }
    };

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="p-4 md:p-10 space-y-8 bg-gray-50 dark:bg-black min-h-screen pb-24">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-12 md:pt-0">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Task Force</h1>
                    <p className="text-gray-600 dark:text-gray-500 text-sm mt-1">Advanced mission control and agent tracking</p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    title="Toggle add task form"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95 touch-target"
                >
                    <Plus size={20} /> New Mission
                </button>
            </div>

            {/* Quick Filter */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-white/5 rounded-xl w-fit overflow-x-auto no-scrollbar">
                {(['All', 'Pending', 'In Progress', 'Completed', 'Overdue'] as const).map(s => (
                    <button
                        key={s}
                        onClick={() => setFilterStatus(s)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${filterStatus === s ? 'bg-white dark:bg-blue-500 text-black dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-white'}`}
                    >
                        {s}
                    </button>
                ))}
            </div>

            <AnimatePresence>
                {showAddForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 p-6 rounded-3xl space-y-4 shadow-sm overflow-hidden"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <input
                                    placeholder="Mission Title (e.g., Follow up with Mr. Khalil)"
                                    title="Task Title"
                                    className="w-full bg-gray-50 dark:bg-transparent border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white outline-none focus:border-blue-500"
                                    value={text}
                                    onChange={e => setText(e.target.value)}
                                />
                                <textarea
                                    placeholder="Detailed mission briefing..."
                                    title="Task Description"
                                    className="w-full bg-gray-50 dark:bg-transparent border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white outline-none focus:border-blue-500 min-h-[100px]"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase ml-2">Assignee</p>
                                    <select
                                        title="Assignee"
                                        className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 p-3 rounded-xl text-sm"
                                        value={assignedTo}
                                        onChange={e => setAssignedTo(e.target.value)}
                                    >
                                        <option value={user?.id}>Myself</option>
                                        {(user?.role === 'ceo' || user?.role === 'admin' || user?.role === 'manager') && team.map(m => (
                                            <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase ml-2">Category</p>
                                    <select title="Category" className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 p-3 rounded-xl text-sm" value={category} onChange={e => setCategory(e.target.value as any)}>
                                        <option>Call</option><option>Meeting</option><option>Email</option><option>Paperwork</option><option>Follow-up</option><option>Site Visit</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase ml-2">Due Date</p>
                                    <input type="date" title="Due Date" className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 p-3 rounded-xl text-sm" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase ml-2">Time</p>
                                    <input type="time" title="Due Time" className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 p-3 rounded-xl text-sm" value={dueTime} onChange={e => setDueTime(e.target.value)} />
                                </div>
                                <div className="space-y-1 col-span-2">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase ml-2">Priority</p>
                                    <div className="flex gap-2">
                                        {(['Low', 'Medium', 'High'] as const).map(p => (
                                            <button
                                                key={p}
                                                onClick={() => setPriority(p)}
                                                className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border ${priority === p ? 'bg-blue-500 border-blue-500 text-white' : 'bg-gray-50 dark:bg-transparent border-gray-200 dark:border-white/10 text-gray-500'}`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
                            <button onClick={() => setShowAddForm(false)} className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 dark:hover:text-white transition-colors">Cancel</button>
                            <button onClick={handleAdd} className="bg-blue-500 text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 active:scale-95">Dispatch Mission</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-4">
                {visibleTasks.map(task => (
                    <motion.div
                        variants={item}
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className={`group bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/5 p-5 rounded-3xl flex items-center gap-5 transition-all hover:bg-gray-50 dark:hover:bg-[#2C2C2E] hover:border-blue-500/30 cursor-pointer shadow-sm ${task.status === 'Completed' ? 'opacity-60' : ''}`}
                    >
                        <div className="relative">
                            {getStatusIcon(task.status)}
                            {task.priority === 'High' && <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className={`text-lg font-bold truncate ${task.status === 'Completed' ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                                    {task.title}
                                </h3>
                                <div className="flex gap-2">
                                    <span className="text-[10px] flex items-center gap-1 bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded font-bold">
                                        {getCategoryIcon(task.category)} {task.category}
                                    </span>
                                    {task.assignedTo !== user?.id && (
                                        <span className="text-[10px] flex items-center gap-1 bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded font-bold">
                                            <User size={10} /> {team.find(m => m.id === task.assignedTo)?.name || 'Agent'}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-4 mt-1">
                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <Clock size={12} />
                                    <span>Due {new Date(task.dueDate).toLocaleDateString()} at {new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                {task.comments?.length > 0 && (
                                    <div className="flex items-center gap-1 text-[10px] text-blue-500 font-bold">
                                        <Mail size={10} /> {task.comments.length} updates
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={(e) => { e.stopPropagation(); setSelectedTask(task); }}
                                title="View details"
                                className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                            >
                                <Eye size={18} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); deleteTask(task.id); toast.success('Mission Aborted'); }}
                                title="Delete mission"
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </motion.div>
                ))}

                {visibleTasks.length === 0 && (
                    <div className="text-center py-24 bg-white dark:bg-[#1C1C1E] rounded-3xl border border-dashed border-gray-200 dark:border-white/10">
                        <CheckCircle className="mx-auto text-gray-200 dark:text-gray-800 mb-4" size={64} />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">All Clear</h3>
                        <p className="text-gray-500 mt-2">No active missions for the current filter.</p>
                        <button
                            onClick={() => { setFilterStatus('All'); setShowAddForm(true); }}
                            className="mt-6 text-blue-500 font-bold hover:underline"
                        >
                            Assign a new task
                        </button>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {selectedTask && (
                    <TaskDetail
                        task={selectedTask}
                        onClose={() => setSelectedTask(null)}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};
