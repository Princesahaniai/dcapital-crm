/**
 * Password utility functions for validation and strength checking
 */

export interface PasswordStrength {
    score: number; // 0-4
    label: 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Very Strong';
    color: string;
}

/**
 * Validate password meets minimum requirements
 */
export const validatePassword = (password: string): { valid: boolean; message: string } => {
    if (password.length < 6) {
        return { valid: false, message: 'Password must be at least 6 characters' };
    }
    return { valid: true, message: 'Password meets requirements' };
};

/**
 * Calculate password strength
 */
export const getPasswordStrength = (password: string): PasswordStrength => {
    let score = 0;

    if (!password) return { score: 0, label: 'Weak', color: '#EF4444' };

    // Length check
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;

    // Complexity checks
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++; // Mixed case
    if (/\d/.test(password)) score++; // Contains number
    if (/[^a-zA-Z0-9]/.test(password)) score++; // Contains special char

    // Cap at 4
    score = Math.min(score, 4);

    const strengthMap: Record<number, PasswordStrength> = {
        0: { score: 0, label: 'Weak', color: '#EF4444' },
        1: { score: 1, label: 'Weak', color: '#EF4444' },
        2: { score: 2, label: 'Fair', color: '#F59E0B' },
        3: { score: 3, label: 'Good', color: '#3B82F6' },
        4: { score: 4, label: 'Strong', color: '#10B981' }
    };

    return strengthMap[score];
};

/**
 * Generate a random reset token
 */
export const generateResetToken = (): string => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

/**
 * Check if session has expired (24 hours)
 */
export const isSessionExpired = (loginTimestamp: number, rememberMe: boolean): boolean => {
    if (rememberMe) return false; // Never expire if "Remember Me" is checked

    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    return (now - loginTimestamp) > twentyFourHours;
};
