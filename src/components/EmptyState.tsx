import React from 'react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
    icon: React.ComponentType<{ className?: string; size?: number }>;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-4 text-center"
        >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center mb-6">
                <Icon className="text-blue-500" size={40} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {title}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
                {description}
            </p>
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="bg-blue-500 text-white font-semibold px-6 py-3 rounded-full hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
                >
                    {actionLabel}
                </button>
            )}
        </motion.div>
    );
};
