import React from 'react';
import { getPasswordStrength } from '../utils/password';

interface PasswordStrengthIndicatorProps {
    password: string;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
    const strength = getPasswordStrength(password);

    if (!password) return null;

    return (
        <div className="mt-2">
            <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className="h-full transition-all duration-300"
                        style={{
                            width: `${(strength.score / 4) * 100}%`,
                            backgroundColor: strength.color
                        }}
                    />
                </div>
                <span className="text-xs font-semibold" style={{ color: strength.color }}>
                    {strength.label}
                </span>
            </div>
            <p className="text-xs text-gray-500">
                Use 6+ characters with mixed case, numbers, and symbols
            </p>
        </div>
    );
};
