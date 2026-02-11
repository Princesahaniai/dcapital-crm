import React, { useState, useEffect } from 'react';
import { X, Send, Mail } from 'lucide-react';
import { useStore } from '../store';
import toast from 'react-hot-toast';

interface EmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: { id: string; name: string; email: string; propertyId?: string };
}

const EMAIL_TEMPLATES = [
    {
        id: 'intro',
        name: 'Introduction',
        subject: 'Luxury Real Estate Investment Opportunities - D-Capital',
        body: `Hi [Name],

Thank you for your interest in D-Capital Real Estate. 

We specialize in premium properties in Dubai's most sought-after locations. I would love to understand your investment goals better and share some exclusive off-plan opportunities that match your criteria.

Are you available for a brief call this week?

Best regards,
[Agent Name]
D-Capital Real Estate`
    },
    {
        id: 'followup',
        name: 'Follow-up',
        subject: 'Following up on our conversation',
        body: `Hi [Name],

I hope you're having a great week.

Just wanted to circle back on the properties we discussed. Have you had a chance to review the details?

Let me know if you have any questions or if you'd like to schedule a viewing.

Best regards,
[Agent Name]`
    },
    {
        id: 'proposal',
        name: 'Property Proposal',
        subject: 'Exclusive Proposal for [Property]',
        body: `Hi [Name],

Please find attached the details for the [Property] we discussed.

This project offers exceptional ROI and capital appreciation potential. Units are selling fast, so please let me know if you'd like to proceed with a reservation.

Looking forward to hearing from you.

Best regards,
[Agent Name]`
    }
];

export const EmailModal = ({ isOpen, onClose, lead }: EmailModalProps) => {
    const { user, addActivity } = useStore();
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('');

    // Reset when modal opens with new lead
    useEffect(() => {
        if (isOpen) {
            setSubject('');
            setBody('');
            setSelectedTemplate('');
        }
    }, [isOpen, lead]);

    const handleTemplateChange = (templateId: string) => {
        setSelectedTemplate(templateId);
        const template = EMAIL_TEMPLATES.find(t => t.id === templateId);
        if (template) {
            setSubject(template.subject.replace('[Property]', 'Luxury Property'));
            setBody(template.body
                .replace('[Name]', lead.name)
                .replace('[Agent Name]', user?.name || 'D-Capital Agent')
                .replace('[Property]', 'Luxury Property')
            );
        }
    };

    const handleSend = () => {
        if (!subject || !body) {
            toast.error('Please fill in both subject and body');
            return;
        }

        // Simulate sending via mailto for now
        const mailtoLink = `mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink, '_blank');

        // Log activity
        addActivity({
            id: crypto.randomUUID(),
            type: 'email',
            description: `Sent email: "${subject}"`,
            timestamp: Date.now(),
            userId: user?.id || 'system',
            leadId: lead.id,
            metadata: { template: selectedTemplate }
        });

        toast.success('Email composer opened');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl w-full max-w-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg text-blue-600 dark:text-blue-400">
                            <Mail size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Compose Email</h2>
                            <p className="text-sm text-gray-500">To: {lead.name} ({lead.email})</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full text-gray-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {/* Template Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Load Template</label>
                        <select
                            value={selectedTemplate}
                            onChange={(e) => handleTemplateChange(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">Select a template...</option>
                            {EMAIL_TEMPLATES.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Subject */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                            placeholder="Email subject..."
                        />
                    </div>

                    {/* Body */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message</label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            rows={10}
                            className="w-full bg-gray-50 dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-sm leading-relaxed"
                            placeholder="Write your message here..."
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3 bg-gray-50 dark:bg-white/5">
                    <button onClick={onClose} className="px-6 py-2 rounded-xl text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSend} className="px-6 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20">
                        <Send size={18} /> Send Email
                    </button>
                </div>
            </div>
        </div>
    );
};
