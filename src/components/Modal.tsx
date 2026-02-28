import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) => {
    const handleEscape = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, handleEscape]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="mobile-modal-container">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className={`mobile-modal-content ${maxWidth} bg-white dark:bg-zinc-900 border border-transparent dark:border-zinc-700 relative overflow-hidden rounded-2xl shadow-2xl flex flex-col max-h-[90vh]`}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-zinc-900 z-10 shrink-0">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
                            <button
                                onClick={onClose}
                                className="p-2 -mr-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors touch-target"
                                title="Close Modal"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="max-h-[80vh] overflow-y-auto scrollbar-hide">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
