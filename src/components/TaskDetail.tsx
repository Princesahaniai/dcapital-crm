import { useState } from 'react';
import { Modal } from './Modal';
import { Clock, User, AlertCircle, MessageSquare, Trash2, History, CheckCircle, Tag, PlayCircle } from 'lucide-react';
import type { Task } from '../types';
import { useStore } from '../store';
import { TaskTimeline } from './TaskTimeline';
import toast from 'react-hot-toast';

interface TaskDetailProps {
    task: Task;
    onClose: () => void;
}

export const TaskDetail = ({ task, onClose }: TaskDetailProps) => {
    const { updateTaskStatus, addTaskComment, deleteTask, user, team } = useStore();
    const [comment, setComment] = useState('');

    const handleStatusUpdate = (status: Task['status']) => {
        updateTaskStatus(task.id, status, 'Mission state updated');
        toast.success(`Mission Protocol: ${status}`);
    };

    const handleAddComment = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!comment.trim()) return;
        addTaskComment(task.id, comment);
        setComment('');
        toast.success('Operational intel logged');
    };

    const assignee = team.find(m => m.id === task.assignedTo);
    const creator = team.find(m => m.id === task.assignedBy) || (task.assignedBy === 'dev-bypass-ceo' ? { name: 'CEO (Ajay)' } : null);

    return (
        <Modal isOpen={true} onClose={onClose} title="Mission Briefing Details" maxWidth="max-w-4xl">
            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-y-auto max-h-[85vh]">
                {/* Left Column: Details & Comments */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Status & Priority */}
                    <div className="flex flex-wrap items-center gap-4">
                        <select
                            title="Mission Status"
                            value={task.status}
                            onChange={(e) => handleStatusUpdate(e.target.value as any)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border outline-none transition-all ${task.status === 'Completed' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                                task.status === 'In Progress' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                                    'bg-gray-200 dark:bg-white/10 border-transparent text-gray-500'
                                }`}
                        >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Overdue">Overdue</option>
                        </select>
                        <span className={`px-4 py-2 rounded-xl text-xs font-bold border ${task.priority === 'High' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                            'bg-gray-100 dark:bg-white/10 border-transparent text-gray-500'
                            }`}>
                            {task.priority} Priority
                        </span>
                        <div className="flex-1" />
                        <button
                            onClick={() => { deleteTask(task.id); onClose(); toast.success('Mission Purged'); }}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Abort Mission"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-blue-500">
                            <AlertCircle size={18} />
                            <h3 className="text-xs font-bold uppercase tracking-widest font-mono">Mission Objectives</h3>
                        </div>
                        <p className="bg-gray-50 dark:bg-white/5 p-6 rounded-3xl border border-gray-100 dark:border-white/5 text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap min-h-[120px]">
                            {task.description || 'No additional briefing intel.'}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-amber-500">
                            <MessageSquare size={18} />
                            <h3 className="text-xs font-bold uppercase tracking-widest font-mono">Operational Updates</h3>
                        </div>
                        <form onSubmit={handleAddComment} className="relative group">
                            <textarea
                                title="Add Intel"
                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 pr-16 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 min-h-[120px] transition-all"
                                placeholder="Log mission update..."
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                            />
                            <button
                                type="submit"
                                title="Log update"
                                disabled={!comment.trim()}
                                className="absolute bottom-6 right-6 p-3 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20"
                            >
                                <History size={20} />
                            </button>
                        </form>
                    </div>

                    {/* Visual Timeline */}
                    <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-2 text-purple-500">
                            <PlayCircle size={18} />
                            <h3 className="text-xs font-bold uppercase tracking-widest font-mono">Transmission History</h3>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto no-scrollbar">
                            <TaskTimeline history={task.history} comments={task.comments} />
                        </div>
                    </div>
                </div>

                {/* Right Column: Mission Metadata */}
                <div className="space-y-6">
                    <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-3xl border border-gray-100 dark:border-white/5 space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
                                    <Clock size={16} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Protocol Deadline</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                                        {new Date(task.dueDate).toLocaleDateString()} at {new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                                    <User size={16} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Field Agent</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                                        {assignee ? assignee.name : 'Unassigned'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-500/10 rounded-xl text-gray-500">
                                    <User size={16} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Dispatch Officer</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                                        {creator ? (typeof creator === 'string' ? creator : (creator as any).name) : 'Command'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500/10 rounded-xl text-green-500">
                                    <Tag size={16} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Mission Class</p>
                                    <span className="text-xs font-bold px-3 py-1 bg-green-500/10 text-green-500 rounded-full border border-green-500/20 uppercase tracking-tighter">
                                        {task.category}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-black font-black rounded-3xl hover:opacity-90 transition-all active:scale-[0.98] shadow-xl shadow-black/10 dark:shadow-white/5 uppercase tracking-widest text-xs"
                    >
                        Close Intel
                    </button>
                </div>
            </div>
        </Modal>
    );
};
