import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useStore } from '../store';
import { Activity } from '../types';

interface WhatsAppButtonProps {
    phone: string;
    name: string;
    leadId: string;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({ phone, name, leadId }) => {
    const { addActivity, user } = useStore();

    const handleSend = () => {
        const message = `Hi ${name}, this is ${user?.name || 'an agent'} from D-Capital Real Estate. I received your enquiry and would love to assist you.`;

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
        let cleanPhone = phone.replace(/[^0-9]/g, '');

        // Add country code if missing (Simple check)
        if (!cleanPhone.startsWith('971') && !cleanPhone.startsWith('00971') && cleanPhone.length === 9) {
            cleanPhone = '971' + cleanPhone;
        }

        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
    };

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
