import React from 'react';

interface HeaderProps {
    title: string;
    subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
    return (
        <div className="flex items-center justify-between mb-8 pt-12 md:pt-0">
            <div className="min-w-0 flex-1">
                <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white truncate">{title}</h1>
                {subtitle && <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{subtitle}</p>}
            </div>
        </div>
    );
};

