import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface TemplateLibraryProps {
    onSelect: (template: any) => void;
}

export const TemplateLibrary = ({ onSelect }: TemplateLibraryProps) => {
    const templates = [
        { id: 1, title: "New Launch", icon: "🚀", topic: "New Launch: [Project Name]", bullets: "• [Price] Starting\n• [Location] Prime Location\n• [Handover] Date\n• [Payment Plan] Details" },
        { id: 2, title: "Just Sold", icon: "🥂", topic: "Just Sold: [Property Type] in [Area]", bullets: "• Sold in [Number] Days\n• Record Price per Sq.Ft\n• Happy Seller & Buyer\n• Demand is High" },
        { id: 3, title: "Market Update", icon: "📈", topic: "Dubai Market Update: [Month]", bullets: "• Transactions up [X]%\n• Top performing areas\n• Why buy now\n• Rental yield analysis" },
        { id: 4, title: "Luxury Lifestyle", icon: "✨", topic: "Luxury Living in [Area]", bullets: "• Morning routine at [Location]\n• Example of amenities\n• The view from the top\n• Exclusive community feel" },
        { id: 5, title: "Tips & Advice", icon: "💡", topic: "3 Tips for [Buyer Type]", bullets: "• Tip 1: Location\n• Tip 2: Developer Reputation\n• Tip 3: Long-term ROI\n• Call D-Capital today" },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {templates.map(t => (
                <button
                    key={t.id}
                    onClick={() => onSelect(t)}
                    className="flex flex-col items-center justify-center p-4 bg-white dark:bg-[#1C1C1E] rounded-xl border border-gray-100 dark:border-white/5 hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-500/10 transition-all group"
                >
                    <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">{t.icon}</span>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{t.title}</span>
                </button>
            ))}
        </div>
    );
};
