import React from 'react';
import { motion } from 'framer-motion';

interface StageIndicatorProps {
    currentStage: string;
    onStageSelect?: (stage: string) => void;
    compact?: boolean;
}

const STAGES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Closed'];

export const StageIndicator: React.FC<StageIndicatorProps> = ({ currentStage, onStageSelect, compact = false }) => {
    const currentIndex = STAGES.indexOf(currentStage) === -1 ? 0 : STAGES.indexOf(currentStage);

    const getStageColor = (stage: string) => {
        switch (stage) {
            case 'New': return 'bg-blue-500';
            case 'Contacted': return 'bg-amber-500';
            case 'Qualified': return 'bg-purple-500';
            case 'Proposal': return 'bg-cyan-500';
            case 'Negotiation': return 'bg-orange-500';
            case 'Closed': return 'bg-green-500';
            case 'Lost': return 'bg-red-500';
            default: return 'bg-gray-300';
        }
    };

    if (compact) {
        return (
            <div className="flex gap-1">
                {STAGES.map((stage, index) => (
                    <div
                        key={stage}
                        className={`h-1.5 rounded-full transition-all duration-300 ${index <= currentIndex ? getStageColor(currentStage) : 'bg-gray-200 dark:bg-gray-700'
                            }`}
                        style={{ width: `${100 / STAGES.length}%` }}
                        title={stage}
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="w-full space-y-2">
            <div className="flex justify-between text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                <span>Pipeline Progress</span>
                <span>{Math.round(((currentIndex + 1) / STAGES.length) * 100)}%</span>
            </div>
            <div className="flex items-center w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden relative">
                <motion.div
                    className={`h-full ${getStageColor(currentStage)}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentIndex + 1) / STAGES.length) * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                />

                {/* Interactive Dots */}
                <div className="absolute inset-0 flex justify-between px-1 items-center">
                    {STAGES.map((stage, index) => (
                        <button
                            key={stage}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onStageSelect) onStageSelect(stage);
                            }}
                            className={`w-2 h-2 rounded-full transition-colors z-10 ${index <= currentIndex ? 'bg-white/50' : 'bg-transparent hover:bg-white/20'
                                }`}
                            title={`Move to ${stage}`}
                        />
                    ))}
                </div>
            </div>
            <div className="flex justify-between">
                {STAGES.map((stage, index) => (
                    <span
                        key={stage}
                        className={`text-[9px] font-bold uppercase transition-colors ${index === currentIndex ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'
                            }`}
                    >
                        {stage}
                    </span>
                ))}
            </div>
        </div>
    );
};
