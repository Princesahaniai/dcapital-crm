import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, User, Tag, Clock, Send, CheckCircle, AlertCircle, PlayCircle, History } from 'lucide-react';
import { useStore } from '../store';
import type { Task } from '../types';
import { TaskTimeline } from './TaskTimeline';
import toast from 'react-hot-toast';

interface TaskDetailProps {
    task: Task;
    onClose: () => void;
}

export const TaskDetail: React.FC<TaskDetailProps> = ({ task, onClose }) => {
    const { updateTaskStatus, addTaskComment, team } = useStore();
    const [comment, setComment] = useState('');

    const handleUpdateStatus = (status: Task['status']) => {
        updateTaskStatus(task.id, status, 'Status updated via detail view');
        toast.success(`Task marked as ${status}`);
    };

    const handleAddComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim()) return;
        addTaskComment(task.id, comment);
        setComment('');
        toast.success('Comment added');
    };

    const getStatusColor = (status: Task['status']) => {
        switch (status) {
            case 'Completed': return 'text-green-500 bg-green-500/10';
            case 'In Progress': return 'text-blue-500 bg-blue-500/10';
            case 'Overdue': return 'text-red-500 bg-red-500/10';
            default: return 'text-amber-500 bg-amber-500/10';
        }
    };

    const assignee = team.find(m => m.id === task.assignedTo);
    const creator = team.find(m => m.id === task.assignedBy) || (task.assignedBy === 'dev-bypass-ceo' ? { name: 'CEO (Ajay)' } : null);

    return (
        <div className="mobile-modal-container">
            <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="mobile-modal-content max-w-4xl"
            >
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-[#1C1C1E] p-6 border-b border-gray-200 dark:border-white/10 flex justify-between items-center z-30">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${getStatusColor(task.status)}`}>
                            {task.status === 'Completed' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white capitalize leading-none">{task.title}</h2>
                            <p className="text-xs text-gray-500 mt-1">ID: {task.id}</p>
                        </div>
                    </div>
                    <button onClick={onClose} title="Close" className="p-2 -mr-2 text-gray-400 hover:text-white transition-colors touch-target">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Details & Comments */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Description */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Description</h3>
                            <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {task.description || 'No description provided for this task.'}
                                </p>
                            </div>
                        </div>

                        {/* Status Quick Actions */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Update Progress</h3>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() => handleUpdateStatus('In Progress')}
                                    title="Mark as In Progress"
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${task.status === 'In Progress' ? 'bg-blue-500 text-white shadow-lg' : 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
                                        }`}
                                >
                                    <PlayCircle size={18} /> In Progress
                                </button>
                                <button
                                    onClick={() => handleUpdateStatus('Completed')}
                                    title="Mark as Completed"
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${task.status === 'Completed' ? 'bg-green-500 text-white shadow-lg' : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                                        }`}
                                >
                                    <CheckCircle size={18} /> Complete
                                </button>
                            </div>
                        </div>

                        {/* Discussion/Comments */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <History size={16} className="text-blue-500" />
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Discussion</h3>
                            </div>

                            <form onSubmit={handleAddComment} className="relative">
                                <textarea
                                    title="Add a comment"
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 pr-12 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 min-h-[100px] transition-all"
                                    placeholder="Add a comment or update..."
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    title="Send comment"
                                    disabled={!comment.trim()}
                                    className="absolute bottom-4 right-4 p-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 transition-all touch-target"
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right Column: Sidebar Stats */}
                    <div className="space-y-6">
                        <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-3xl border border-gray-100 dark:border-white/5 space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Clock size={16} className="text-gray-400" />
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Due Date</p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                                            {new Date(task.dueDate).toLocaleDateString()} at {new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <User size={16} className="text-gray-400" />
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Assigned To</p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                                            {assignee ? assignee.name : (task.assignedTo === 'dev-bypass-ceo' ? 'CEO (Ajay)' : 'Unassigned')}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <User size={16} className="text-gray-400" />
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Assigned By</p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                                            {creator ? creator.name : 'System'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Tag size={16} className="text-gray-400" />
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Category</p>
                                        <span className="text-xs font-bold px-2 py-0.5 bg-gray-200 dark:bg-white/10 rounded-full text-gray-700 dark:text-gray-300">
                                            {task.category}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Visual Timeline (History) */}
                        <div className="max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                            <TaskTimeline history={task.history} comments={task.comments} />
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
