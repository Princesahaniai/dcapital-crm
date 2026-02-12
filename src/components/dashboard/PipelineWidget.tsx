import React from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../store';

export const PipelineWidget = () => {
    const { leads } = useStore();

    // Stages Order
    const stages = ['New', 'Contacted', 'Qualified', 'Viewing', 'Negotiation', 'Closed', 'Lost'];

    // Calculate Stage Counts & Value
    const stageData = stages.map(stage => {
        const stageLeads = leads.filter(l => l.status === stage);
        const count = stageLeads.length;
        const value = stageLeads.reduce((sum, l) => sum + (l.budget || 0), 0);
        return { stage, count, value };
    });

    const totalValue = stageData.reduce((sum, s) => sum + s.value, 0);

    return (
        <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 border border-gray-100 dark:border-white/5 h-full">
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                MISSION PIPELINE
                <span className="text-xs font-normal text-gray-400 bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-lg">
                    AED {(totalValue / 1000000).toFixed(1)}M Potential
                </span>
            </h3>

            <div className="space-y-4">
                {stageData.filter(s => s.count > 0 || ['New', 'Contacted', 'Negotiation'].includes(s.stage)).map((item, index) => (
                    <div key={item.stage} className="relative">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{item.stage}</span>
                            <div className="text-right">
                                <span className="text-xs font-bold text-gray-900 dark:text-white block">{item.count} Leads</span>
                                <span className="text-[10px] text-gray-400">AED {(item.value / 1000000).toFixed(2)}M</span>
                            </div>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(item.value / totalValue) * 100}%` }}
                                transition={{ duration: 1, delay: index * 0.1 }}
                                className={`h-full rounded-full ${item.stage === 'New' ? 'bg-blue-500' :
                                        item.stage === 'Contacted' ? 'bg-indigo-500' :
                                            item.stage === 'Qualified' ? 'bg-purple-500' :
                                                item.stage === 'Viewing' ? 'bg-pink-500' :
                                                    item.stage === 'Negotiation' ? 'bg-amber-500' :
                                                        item.stage === 'Closed' ? 'bg-green-500' :
                                                            'bg-red-500'
                                    }`}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
