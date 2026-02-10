import React, { useState } from 'react';
import { useStore } from '../store';
import { CheckCircle, Circle, Plus, Trash2, Calendar, Phone, Mail, FileText, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } };

export const Tasks = () => {
    const { tasks, addTask, toggleTask, deleteTask } = useStore();
    const [text, setText] = useState('');
    const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
    const [category, setCategory] = useState<'Call' | 'Meeting' | 'Email' | 'Paperwork'>('Call');

    const handleAdd = () => {
        if (text.trim()) {
            addTask({
                id: Math.random().toString(),
                title: text,
                dueDate: new Date().toLocaleDateString(),
                completed: false,
                priority,
                category
            });
            setText('');
            toast.success('Task Added');
        }
    };

    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case 'Call': return <Phone size={14} />;
            case 'Meeting': return <Calendar size={14} />;
            case 'Email': return <Mail size={14} />;
            default: return <FileText size={14} />;
        }
    };

    const priorityTasks = tasks.filter(t => !t.completed && t.priority === 'High');
    const regularTasks = tasks.filter(t => !t.completed && t.priority !== 'High');
    const completedTasks = tasks.filter(t => t.completed);

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 p-6 md:p-10 h-screen w-full overflow-y-auto bg-gray-50 dark:bg-black">
            <div>
                <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">Task Force</h1>
                <p className="text-gray-600 dark:text-gray-500 text-sm mt-1">Mission control for daily operations</p>
            </div>

            <div className="bg-white dark:bg-[#1C1C1E] dark:apple-glass border border-gray-200 dark:border-white/10 p-6 rounded-3xl flex flex-col gap-4 shadow-sm">
                <input
                    placeholder="What is your mission?"
                    className="bg-gray-50 dark:bg-transparent w-full outline-none text-lg md:text-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 p-2 rounded-lg border border-transparent dark:border-transparent focus:border-blue-500 dark:focus:border-blue-500"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                />
                <div className="flex flex-wrap gap-3">
                    <select title="Priority" className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 p-2 rounded-lg text-xs w-32 outline-none focus:border-blue-500 dark:focus:border-blue-500" value={priority} onChange={e => setPriority(e.target.value as any)}>
                        <option>High</option><option>Medium</option><option>Low</option>
                    </select>
                    <select title="Category" className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 p-2 rounded-lg text-xs w-32 outline-none focus:border-blue-500 dark:focus:border-blue-500" value={category} onChange={e => setCategory(e.target.value as any)}>
                        <option>Call</option><option>Meeting</option><option>Email</option><option>Paperwork</option>
                    </select>
                    <button onClick={handleAdd} className="bg-blue-500 dark:bg-white text-white dark:text-black px-6 py-2 rounded-lg font-bold text-sm hover:bg-blue-600 dark:hover:bg-gray-200 transition-colors shadow-lg">Add Task</button>
                </div>
            </div>

            {/* HIGH PRIORITY SECTION */}
            {priorityTasks.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="text-red-500" size={18} />
                        <h2 className="text-sm font-bold text-red-500 uppercase tracking-widest">High Priority ({priorityTasks.length})</h2>
                    </div>
                    {priorityTasks.map(task => (
                        <motion.div variants={item} key={task.id} className="p-5 rounded-2xl border border-red-500/30 bg-red-500/5 flex items-center gap-4 transition-all group">
                            <button onClick={() => toggleTask(task.id)} className="transition-transform active:scale-90">
                                <Circle className="text-red-500 group-hover:text-red-400" size={22} />
                            </button>
                            <div className="flex-1">
                                <p className="text-lg text-white font-medium">{task.title}</p>
                                <div className="flex gap-2 mt-1">
                                    <span className="text-[10px] flex items-center gap-1 bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-bold">{getCategoryIcon(task.category)} {task.category}</span>
                                </div>
                            </div>
                            <button onClick={() => { deleteTask(task.id); toast.success('Task Deleted'); }} className="text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* REGULAR TASKS */}
            {regularTasks.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-sm font-bold text-gray-600 dark:text-gray-500 uppercase tracking-widest">Active Tasks ({regularTasks.length})</h2>
                    {regularTasks.map(task => (
                        <motion.div variants={item} key={task.id} className="bg-white dark:bg-[#1C1C1E] dark:apple-glass border border-gray-200 dark:border-gray-800 p-5 rounded-2xl flex items-center gap-4 transition-all group hover:bg-gray-50 dark:hover:bg-[#2C2C2E] shadow-sm">
                            <button onClick={() => toggleTask(task.id)} className="transition-transform active:scale-90">
                                <Circle className="text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-white" size={22} />
                            </button>
                            <div className="flex-1">
                                <p className="text-lg text-gray-900 dark:text-white font-medium">{task.title}</p>
                                <div className="flex gap-2 mt-1">
                                    <span className={`text-[10px] flex items-center gap-1 px-2 py-0.5 rounded ${task.priority === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-400'}`}>{task.priority}</span>
                                    <span className="text-[10px] flex items-center gap-1 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-400 px-2 py-0.5 rounded">{getCategoryIcon(task.category)} {task.category}</span>
                                </div>
                            </div>
                            <button onClick={() => { deleteTask(task.id); toast.success('Task Deleted'); }} className="text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* COMPLETED TASKS */}
            {completedTasks.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-sm font-bold text-gray-500 dark:text-gray-600 uppercase tracking-widest">Completed ({completedTasks.length})</h2>
                    {completedTasks.map(task => (
                        <motion.div variants={item} key={task.id} className="p-5 rounded-2xl border border-transparent bg-transparent flex items-center gap-4 opacity-40">
                            <button onClick={() => toggleTask(task.id)} className="transition-transform active:scale-90">
                                <CheckCircle className="text-green-500" size={22} />
                            </button>
                            <div className="flex-1">
                                <p className="text-lg line-through text-gray-400 dark:text-gray-500">{task.title}</p>
                            </div>
                            <button onClick={() => { deleteTask(task.id); toast.success('Task Deleted'); }} className="text-gray-600 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                        </motion.div>
                    ))}
                </div>
            )}

            {tasks.length === 0 && (
                <div className="text-center py-20">
                    <CheckCircle className="mx-auto text-gray-300 dark:text-gray-700 mb-4" size={48} />
                    <p className="text-gray-600 dark:text-gray-500">No tasks yet. Add your first mission above.</p>
                </div>
            )}
        </motion.div>
    );
};
