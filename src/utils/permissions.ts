import type { User, Lead } from '../types';

/**
 * Permission utility functions for Role-Based Access Control
 */

// Role hierarchy levels (higher = more permissions)
const ROLE_LEVELS = {
    'agent': 1,
    'manager': 2,
    'admin': 3,
    'ceo': 4
} as const;

/**
 * Check if user can view all leads in the system
 */
export const canViewAllLeads = (user: User | null): boolean => {
    if (!user) return false;
    return user.role === 'ceo' || user.role === 'admin';
};

/**
 * Check if user can view a specific lead
 */
export const canViewLead = (user: User | null, lead: Lead, teamMembers: User[] = []): boolean => {
    if (!user) return false;

    // CEO and Admin can see everything
    if (user.role === 'ceo' || user.role === 'admin') return true;

    // Agents can only see their own leads
    if (user.role === 'agent') {
        return lead.assignedTo === user.id;
    }

    // Managers can see their own leads + their team's leads
    if (user.role === 'manager') {
        if (lead.assignedTo === user.id) return true;

        // Check if lead is assigned to one of their team members
        const myTeam = teamMembers.filter(m => m.managerId === user.id);
        return myTeam.some(member => member.id === lead.assignedTo);
    }

    return false;
};

/**
 * Check if user can edit a specific lead
 */
export const canEditLead = (user: User | null, lead: Lead, teamMembers: User[] = []): boolean => {
    // Same rules as viewing for now
    return canViewLead(user, lead, teamMembers);
};

/**
 * Check if user can delete a lead
 */
export const canDeleteLead = (user: User | null): boolean => {
    if (!user) return false;
    return user.role === 'ceo' || user.role === 'admin';
};

/**
 * Check if user can access system settings
 */
export const canAccessSettings = (user: User | null): boolean => {
    if (!user) return false;
    return user.role === 'ceo' || user.role === 'admin';
};

/**
 * Check if user can manage team (view/edit team members)
 */
export const canManageTeam = (user: User | null): boolean => {
    if (!user) return false;
    // CEO and Admin can manage all team members
    // Managers can view their own team (but limited editing)
    return user.role === 'ceo' || user.role === 'admin' || user.role === 'manager';
};

/**
 * Check if user can create/delete team members
 */
export const canModifyTeamMembers = (user: User | null): boolean => {
    if (!user) return false;
    return user.role === 'ceo' || user.role === 'admin';
};

/**
 * Check if user can assign managers to agents
 */
export const canAssignManagers = (user: User | null): boolean => {
    if (!user) return false;
    return user.role === 'ceo' || user.role === 'admin';
};

/**
 * Get filtered team members based on user role
 */
export const getVisibleTeamMembers = (user: User | null, allMembers: User[]): User[] => {
    if (!user) return [];

    // CEO and Admin see everyone
    if (user.role === 'ceo' || user.role === 'admin') {
        return allMembers;
    }

    // Managers see only their team members
    if (user.role === 'manager') {
        return allMembers.filter(m => m.managerId === user.id || m.id === user.id);
    }

    // Agents see only themselves
    return allMembers.filter(m => m.id === user.id);
};

/**
 * Get filtered leads based on user role
 */
export const getVisibleLeads = (user: User | null, allLeads: Lead[], teamMembers: User[] = []): Lead[] => {
    if (!user) return [];

    // CEO and Admin see all leads
    if (user.role === 'ceo' || user.role === 'admin') {
        return allLeads;
    }

    // Agents see only their own leads
    if (user.role === 'agent') {
        return allLeads.filter(lead => lead.assignedTo === user.id);
    }

    // Managers see their leads + their team's leads
    if (user.role === 'manager') {
        const myTeamIds = teamMembers
            .filter(m => m.managerId === user.id)
            .map(m => m.id);

        return allLeads.filter(lead =>
            lead.assignedTo === user.id || myTeamIds.includes(lead.assignedTo || '')
        );
    }

    return [];
};

/**
 * Check if user has higher or equal role level than target role
 */
export const hasRoleLevel = (user: User | null, minRole: keyof typeof ROLE_LEVELS): boolean => {
    if (!user) return false;
    return ROLE_LEVELS[user.role] >= ROLE_LEVELS[minRole];
};

/**
 * Check if navigation item should be visible
 */
export const canAccessRoute = (user: User | null, route: string): boolean => {
    if (!user) return false;

    switch (route) {
        case '/':
        case '/leads':
        case '/inventory':
        case '/tasks':
            return true; // All roles can access these

        case '/team':
            return canManageTeam(user);

        case '/settings':
            return canAccessSettings(user);

        default:
            return true;
    }
};
