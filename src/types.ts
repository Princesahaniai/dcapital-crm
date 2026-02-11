export interface User {
    id: string;
    name: string;
    email: string;
    role: 'ceo' | 'admin' | 'manager' | 'agent';
    avatar?: string;
    managerId?: string; // For agents/managers - who manages them
}

export interface Lead {
    id: string;
    name: string;
    email: string;
    phone?: string;
    budget?: number;
    source?: string;
    status: 'New' | 'Contacted' | 'Qualified' | 'Viewing' | 'Negotiation' | 'Closed' | 'Lost';
    notes?: string;
    assignedTo?: string;
    createdAt: number;
    updatedAt?: number;
    lastContact?: number;
    propertyId?: string;
    commission?: number;
    commissionPaid?: boolean;
}

export interface Property {
    id: string;
    name: string; // Property name
    developer: string; // 'Damac', 'Emaar', 'Binghatti', 'Sobha', etc.
    type: 'Studio' | 'Apartment' | 'Villa' | 'Penthouse' | 'Townhouse';
    price: number;
    status: 'Available' | 'Sold' | 'Reserved';
    commissionRate: number; // percentage, e.g., 2
    location: string;
    imageUrl: string; // Main property image
    description?: string;
    agentId?: string;
    bedrooms: number;
    bathrooms: number;
    sqft: number;
    createdAt: number;
    updatedAt?: number;
    gallery?: string[];
    features?: string[];
}

// ✅ CLASS DEFINITION (Browser cannot ignore this)
export class Activity {
    id: string = '';
    type: 'call' | 'email' | 'meeting' | 'note' | 'deal' | 'system' | 'whatsapp' = 'system';
    description: string = '';
    timestamp: number = Date.now();
    userId: string = '';
    leadId?: string;
    metadata?: any;
}

export interface TaskHistoryItem {
    id: string;
    action: string;
    userId: string;
    userName: string;
    timestamp: number;
    note?: string;
}

export interface TaskComment {
    id: string;
    userId: string;
    userName: string;
    text: string;
    timestamp: number;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
    priority: 'High' | 'Medium' | 'Low';
    category: 'Call' | 'Meeting' | 'Follow-up' | 'Site Visit' | 'Paperwork' | 'Email';
    dueDate: number;
    assignedTo: string;
    assignedBy: string;
    createdAt: number;
    updatedAt?: number;
    completed: boolean;
    history: TaskHistoryItem[];
    comments: TaskComment[];
    // Meeting specific fields
    leadId?: string; // Link to a lead
    location?: string;
    meetingType?: 'in-person' | 'video' | 'call';
    duration?: number; // in minutes
}

export interface Notification {
    id: string;
    type: string;
    message: string;
    read: boolean;
    timestamp: number;
}
