import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Copy, Link as LinkIcon, Sparkles, User as UserIcon, Loader2, Check } from 'lucide-react';
import { useStore } from '../store';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { doc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

export const AICopilotWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'assistant', content: "Hello! I'm your AI Inventory Co-Pilot. Paste a client's requirements, and I'll find the best matching properties from our inventory." }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [linkedLeadId, setLinkedLeadId] = useState<string>('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const { leads, user } = useStore();
    
    // Only show active leads
    const activeLeads = leads.filter(l => l.status !== 'Closed' && l.status !== 'Trash' && l.status !== 'Lost');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async (text: string) => {
        if (!text.trim()) return;
        
        const userMsgId = Math.random().toString(36).substr(2, 9);
        const newMessages: Message[] = [...messages, { id: userMsgId, role: 'user', content: text }];
        setMessages(newMessages);
        setQuery('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/copilot-match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: text })
            });
            
            const data = await response.json();
            
            if (data.reply) {
                const assistantMsgId = Math.random().toString(36).substr(2, 9);
                setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: data.reply }]);

                // Save to Firestore if linked to a lead
                if (linkedLeadId) {
                    try {
                        const historyRef = collection(db, 'leads', linkedLeadId, 'copilot_history');
                        await addDoc(historyRef, {
                            query: text,
                            response: data.reply,
                            agentId: user?.id,
                            agentName: user?.name,
                            timestamp: serverTimestamp()
                        });
                        toast.success('Saved to Lead History', { position: 'top-left' });
                    } catch (err) {
                        console.error('Failed to save history to lead', err);
                        toast.error('Failed to link history to lead');
                    }
                }
            } else {
                toast.error('Failed to get a valid response from the Co-Pilot.');
            }
        } catch (error) {
            console.error('Copilot Error:', error);
            toast.error('An error occurred while matching properties.');
            setMessages(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopiedId(null), 2000);
    };

    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Custom renderer to detect property blocks and inject copy buttons
    const renderMessageContent = (content: string) => {
        // Split by the pin emoji which starts our property block
        const parts = content.split(/(?=📌)/);
        
        return parts.map((part, index) => {
            if (part.startsWith('📌')) {
                const blockId = `block-${index}`;
                return (
                    <div key={index} className="relative group mb-4 p-3 bg-white/5 border border-white/10 rounded-xl">
                        <button 
                            onClick={() => copyToClipboard(part.trim(), blockId)}
                            className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-amber-500 hover:text-black rounded-lg text-gray-400 transition-all opacity-0 group-hover:opacity-100"
                            title="Copy Block"
                        >
                            {copiedId === blockId ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                        <ReactMarkdown className="prose prose-invert prose-sm max-w-none">
                            {part}
                        </ReactMarkdown>
                    </div>
                );
            }
            return (
                <div key={index} className="mb-4">
                    <ReactMarkdown className="prose prose-invert prose-sm max-w-none">
                        {part}
                    </ReactMarkdown>
                </div>
            );
        });
    };

    const suggestions = [
        "Find distress deals under 2M",
        "Show ready villas in Damac Hills",
        "2 bed off-plan with post handover"
    ];

    return (
        <>
            {/* Floating Action Button */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white ${isOpen ? 'hidden' : 'flex'} items-center justify-center`}
            >
                <Bot size={28} />
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-white border-2 border-purple-500"></span>
                </span>
            </motion.button>

            {/* Chat Widget Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
                        className="fixed bottom-6 right-6 z-50 w-[400px] h-[600px] max-h-[80vh] bg-[#111111] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 bg-gradient-to-r from-indigo-900/50 via-purple-900/50 to-pink-900/50 border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                                    <Sparkles size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-sm">AI Inventory Co-Pilot</h3>
                                    <p className="text-xs text-purple-300">RAG Matchmaker</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* CRM Linking Toolbar */}
                        <div className="px-4 py-2 bg-black/40 border-b border-white/5 flex items-center gap-2 text-sm">
                            <LinkIcon size={14} className="text-gray-400" />
                            <select 
                                value={linkedLeadId}
                                onChange={(e) => setLinkedLeadId(e.target.value)}
                                className="bg-transparent text-gray-300 text-xs outline-none flex-1 font-medium"
                            >
                                <option value="" className="bg-[#111]">No Lead Linked (Anonymous Session)</option>
                                {activeLeads.map(l => (
                                    <option key={l.id} value={l.id} className="bg-[#111]">{l.name} - {l.status}</option>
                                ))}
                            </select>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`flex items-end gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-amber-500/20 text-amber-500' : 'bg-purple-500/20 text-purple-400'}`}>
                                            {msg.role === 'user' ? <UserIcon size={14} /> : <Bot size={14} />}
                                        </div>
                                        <div className={`p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-amber-500/10 text-amber-50 border border-amber-500/20 rounded-br-none' : 'bg-white/5 text-gray-200 border border-white/10 rounded-bl-none'}`}>
                                            {msg.role === 'user' ? (
                                                <p>{msg.content}</p>
                                            ) : (
                                                renderMessageContent(msg.content)
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex items-start gap-2 max-w-[85%]">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                                        <Loader2 size={14} className="animate-spin" />
                                    </div>
                                    <div className="p-3 rounded-2xl bg-white/5 text-gray-400 border border-white/10 rounded-bl-none text-sm italic">
                                        Analyzing inventory vectors...
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-black/40 border-t border-white/10">
                            {messages.length === 1 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {suggestions.map((sug, i) => (
                                        <button 
                                            key={i} 
                                            onClick={() => handleSend(sug)}
                                            className="text-[10px] px-2 py-1 bg-purple-500/10 text-purple-300 hover:bg-purple-500/30 rounded-full border border-purple-500/20 transition-colors"
                                        >
                                            {sug}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <form 
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSend(query);
                                }} 
                                className="relative flex items-center"
                            >
                                <textarea
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Paste client requirements..."
                                    className="w-full bg-[#1A1A1A] text-white text-sm rounded-xl py-3 pl-4 pr-12 border border-white/10 focus:border-purple-500 outline-none resize-none h-[50px] max-h-[120px] shadow-inner"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend(query);
                                        }
                                    }}
                                />
                                <button 
                                    type="submit" 
                                    disabled={!query.trim() || isLoading}
                                    className="absolute right-2 p-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                                >
                                    <Send size={16} />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
