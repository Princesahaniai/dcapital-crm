import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Send, Mail as MailIcon } from 'lucide-react';
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
    }
];

export const EmailModal = ({ isOpen, onClose, lead }: EmailModalProps) => {
    const { user, addActivity } = useStore();
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('');

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
                .replace('[Date]', new Date(Date.now() + 86400000).toLocaleDateString())
                .replace('[Time]', '10:00 AM')
            );
        }
    };

    const handleSend = () => {
        if (!subject || !body) {
            toast.error('Please fill in both subject and body');
            return;
        }

        const mailtoLink = `mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink, '_blank');

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

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Compose Protocol Message" maxWidth="max-w-2xl">
            <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 mb-4 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-500">
                        <MailIcon size={20} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Target: {lead.name}</p>
                        <p className="text-xs text-gray-500">{lead.email}</p>
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 px-1">Template Selection</label>
                    <select
                        title="Template"
                        value={selectedTemplate}
                        onChange={(e) => handleTemplateChange(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-gray-900 dark:text-white outline-none focus:border-blue-500"
                    >
                        <option value="">Select a template...</option>
                        {EMAIL_TEMPLATES.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 px-1">Subject Header</label>
                    <input
                        type="text"
                        title="Subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-gray-900 dark:text-white font-bold outline-none focus:border-blue-500"
                        placeholder="Communication subject..."
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 px-1">Transmission Message</label>
                    <textarea
                        title="Message"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={8}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-gray-900 dark:text-white outline-none focus:border-blue-500 resize-none font-sans leading-relaxed"
                        placeholder="Enter mission brief..."
                    />
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-white/5">
                    <button onClick={onClose} className="flex-1 py-4 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-all">Abort</button>
                    <button onClick={handleSend} className="flex-1 py-4 bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">
                        <Send size={18} /> transmit
                    </button>
                </div>
            </div>
        </Modal>
    );
};
