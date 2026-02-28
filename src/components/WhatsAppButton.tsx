import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, ChevronDown, Check } from 'lucide-react';
import { useStore } from '../store';
import { logWhatsApp } from '../services/activityLog';

interface WhatsAppButtonProps {
    phone: string;
    name: string;
    leadId: string;
    compact?: boolean;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({ phone, name, leadId, compact = false }) => {
    const { user, messageTemplates } = useStore();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSend = (e: React.MouseEvent, content?: string) => {
        e.stopPropagation();

        let message = `Hi ${name}, this is ${user?.name || 'an agent'} from D-Capital Real Estate.`;

        if (content) {
            // Apply variables
            message = content.replace(/{name}/g, name).replace(/{agent}/g, user?.name || 'an agent');
        }

        // Log activity
        logWhatsApp(leadId, user?.id || 'unknown', user?.name || 'Unknown');

        // Open WhatsApp
        // Remove special chars from phone for the link
        let cleanPhone = phone.replace(/[^0-9]/g, '');

        // Add country code if missing (Simple check)
        if (!cleanPhone.startsWith('971') && !cleanPhone.startsWith('00971') && cleanPhone.length === 9) {
            cleanPhone = '971' + cleanPhone;
        }

        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
        setIsOpen(false);
    };

    const hasTemplates = messageTemplates && messageTemplates.length > 0;

    const btnClass = compact
        ? "p-2.5 rounded-xl bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors flex items-center gap-1"
        : "p-2 hover:bg-green-100 dark:hover:bg-green-500/20 rounded-lg text-green-600 dark:text-green-400 transition-colors flex items-center justify-center gap-1 w-full"; // added w-full

    return (
        <div className={`relative ${compact ? '' : 'w-full'}`} ref={dropdownRef}>
            <button
                onClick={(e) => hasTemplates ? setIsOpen(!isOpen) : handleSend(e)}
                className={btnClass}
                title="Send WhatsApp"
            >
                <div className="flex items-center gap-1">
                    <MessageCircle size={16} />
                    {!compact && <span>WhatsApp</span>}
                </div>
                {hasTemplates && <ChevronDown size={14} className="opacity-50" />}
            </button>

            {/* Dropdown Menu */}
            {isOpen && hasTemplates && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden transform origin-top-right">
                    <div className="p-2 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-black/20">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">Select Template</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-1">
                        {messageTemplates.map(t => (
                            <button
                                key={t.id}
                                onClick={(e) => handleSend(e, t.content)}
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400 rounded-lg transition-colors flex items-center justify-between group"
                            >
                                <span>{t.title}</span>
                                <Check size={14} className="opacity-0 group-hover:opacity-100 text-green-500" />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
