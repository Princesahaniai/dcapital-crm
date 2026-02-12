import { useStore } from '../store';
import type { Activity } from '../types';

export const logActivity = (
    leadId: string,
    action: string,
    details?: string,
    userId: string = 'system',
    userName: string = 'System'
) => {
    const activity: Activity = {
        id: Math.random().toString(36).substr(2, 9),
        leadId,
        userId,
        userName,
        type: 'System',
        timestamp: Date.now(),
        description: action + (details ? `: ${details}` : '')
    };

    useStore.getState().addActivity(activity);
};

export const logCall = (leadId: string, userId: string, userName: string) => {
    logActivity(leadId, 'Call', '📞 Outbound Call Initiated', userId, userName);
};

export const logEmail = (leadId: string, userId: string, userName: string) => {
    logActivity(leadId, 'Email', '✉️ Email Sent', userId, userName);
};

export const logWhatsApp = (leadId: string, userId: string, userName: string) => {
    logActivity(leadId, 'WhatsApp', '💬 WhatsApp Chat Opened', userId, userName);
};

export const logStageChange = (leadId: string, oldStage: string, newStage: string, userId: string, userName: string) => {
    logActivity(leadId, 'Stage Change', `Moved from ${oldStage} to ${newStage}`, userId, userName);
};
