import React, { useState } from 'react';
import { MessageCircle, Send, X, ExternalLink } from 'lucide-react';
import { useStore } from '../store';
import { Activity } from '../types';

interface WhatsAppButtonProps {
    phone: string;
    name: string;
    leadId: string;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({ phone, name, leadId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { addActivity, user } = useStore();

    const templates = [
        {
            label: "Introduction",
            text: `Hi ${name}, this is ${user?.name} from D-Capital Real Estate. I received your enquiry and would love to assist you.`
        },
        {
            label: "Follow Up",
            text: `Hi ${name}, just following up on our last conversation regarding D-Capital properties. Do you have any questions?`
        },
        {
            label: "Meeting Request",
            text: `Hi ${name}, would you be available for a brief call or meeting this week to discuss investment opportunities?`
        },
        {
            label: "Property Details",
            text: `Hi ${name}, here are the details for the property we discussed. Let me know if you need more info.`
        }
    ];

    const handleSend = (message: string) => {
        // Log activity
        const newActivity: Activity = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'whatsapp',
            description: `Sent WhatsApp: "${message.substring(0, 30)}..."`,
            timestamp: Date.now(),
            userId: user?.id || 'unknown',
            leadId: leadId
        };
        addActivity(newActivity);

        // Open WhatsApp
        // Remove special chars from phone for the link
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');

        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 hover:bg-green-100 dark:hover:bg-green-500/20 rounded-lg text-green-600 dark:text-green-400 transition-colors"
                title="Send WhatsApp"
            >
                <MessageCircle size={16} />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 bottom-full mb-2 w-72 bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-3 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50 dark:bg-white/5">
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Select Template</span>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={14} />
                            </button>
                        </div>
                        <div className="p-2 max-h-64 overflow-y-auto space-y-1">
                            {templates.map((t, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSend(t.text)}
                                    className="w-full text-left p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{t.label}</span>
                                        <ExternalLink size={10} className="text-gray-300 group-hover:text-green-500 opacity-0 group-hover:opacity-100 transition-all" />
                                    </div>
                                    <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">
                                        {t.text}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
