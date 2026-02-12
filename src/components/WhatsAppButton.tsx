import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useStore } from '../store';
import { logWhatsApp } from '../services/activityLog';

interface WhatsAppButtonProps {
    phone: string;
    name: string;
    leadId: string;
    compact?: boolean;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({ phone, name, leadId, compact = false }) => {
    const { user } = useStore();

    const handleSend = (e: React.MouseEvent) => {
        e.stopPropagation();

        const message = `Hi ${name}, this is ${user?.name || 'an agent'} from D-Capital Real Estate. I received your enquiry and would love to assist you.`;

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
    };

    if (compact) {
        return (
            <button
                onClick={handleSend}
                className="p-2.5 rounded-xl bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors"
                title="WhatsApp"
            >
                <MessageCircle size={16} />
            </button>
        );
    }

    return (
        <button
            onClick={handleSend}
            className="p-2 hover:bg-green-100 dark:hover:bg-green-500/20 rounded-lg text-green-600 dark:text-green-400 transition-colors"
            title="Send WhatsApp"
        >
            <MessageCircle size={16} />
        </button>
    );
};
