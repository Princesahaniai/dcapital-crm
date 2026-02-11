import React from 'react';
import { motion } from 'framer-motion';
import { Clock, MessageSquare, History } from 'lucide-react';
import type { TaskHistoryItem, TaskComment } from '../types';

interface TaskTimelineProps {
    history: TaskHistoryItem[];
    comments: TaskComment[];
}

export const TaskTimeline: React.FC<TaskTimelineProps> = ({ history, comments }) => {
    // Combine and sort by timestamp
    const events = [
        ...history.map(h => ({ ...h, type: 'history' })),
        ...comments.map(c => ({ ...c, type: 'comment' }))
    ].sort((a, b) => b.timestamp - a.timestamp);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <History size={18} className="text-amber-500" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">Task Journey</h3>
            </div>

            <div className="relative border-l-2 border-gray-100 dark:border-white/5 ml-3 pl-6 space-y-8">
                {events.map((event, idx) => (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={event.id}
                        className="relative"
                    >
                        {/* Dot */}
                        <div
                            className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 bg-white dark:bg-[#1C1C1E] ${event.type === 'history' ? 'border-amber-500' : 'border-blue-500'
                                }`}
                        />

                        <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    {event.type === 'history' ? (
                                        <Clock size={14} className="text-amber-500" />
                                    ) : (
                                        <MessageSquare size={14} className="text-blue-500" />
                                    )}
                                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                                        {'userName' in event ? event.userName : 'System'}
                                    </span>
                                </div>
                                <span className="text-[10px] text-gray-500 font-mono">
                                    {new Date(event.timestamp).toLocaleString()}
                                </span>
                            </div>

                            <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                {'action' in event ? (
                                    <div>
                                        <strong className="text-gray-900 dark:text-white">{String(event.action)}</strong>
                                        {'note' in event && event.note && (
                                            <span className="block mt-1 italic opacity-80">"{String(event.note)}"</span>
                                        )}
                                    </div>
                                ) : (
                                    <div>{String('text' in event ? event.text : '')}</div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}

                {events.length === 0 && (
                    <p className="text-sm text-gray-500 italic">No activity recorded yet.</p>
                )}
            </div>
        </div>
    );
};
