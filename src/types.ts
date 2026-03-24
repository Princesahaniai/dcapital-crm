export interface User {
    id: string;
    name: string;
    email: string;
    role: 'ceo' | 'admin' | 'manager' | 'agent' | 'viewer'; // Added viewer
    avatar?: string;
    managerId?: string;
    status?: 'Pending' | 'Active' | 'Suspended' | 'Inactive' | 'Revoked'; // Added Revoked
    invitationToken?: string;
    invitationExpires?: number;
    // Enterprise Tracking
    lastLoginAt?: number;
    loginCount?: number;
    department?: string;
    phone?: string;
    tempPassword?: string;
    mustChangePassword?: boolean;
    companyId?: string;
    // SaaS Flags
    isSuperAdmin?: boolean;
    subscriptionStatus?: 'active' | 'suspended';
}

export interface ActivityLog {
    id: string;
    action: string; // LOGIN, INVITE, SUSPEND, etc.
    performedBy: string; // User ID or 'System'
    performedByName?: string;
    targetUserId?: string;
    details?: any;
    timestamp: number;
}

export interface LeadDocument {
    id: string;
    name: string;
    url: string;
    type: 'pdf' | 'image';
    uploadedAt: number;
    uploadedBy: string;
    companyId?: string;
}

export interface Lead {
    id: string;
    name: string;
    email: string;
    phone?: string;
    budget?: number;
    source?: string;
    status: 'New' | 'Contacted' | 'Qualified' | 'Viewing' | 'Negotiation' | 'Closed' | 'Lost' | 'Trash';
    notes?: any[] | string;
    assignedTo?: string;
    assignedName?: string;
    createdAt: number;
    updatedAt?: number;
    lastContact?: number;
    propertyId?: string;
    commission?: number;
    commissionPaid?: boolean;
    deletedAt?: number;
    targetLocation?: string;
    maxBudget?: number;
    // Enterprise Extensions
    history?: any[];
    meetingsDone?: number;
    meetingsTarget?: number;
    nextMeeting?: string;
    potentialCommission?: number;
    // AI Scoring & Nurture
    leadScore?: 'A' | 'B' | 'C';
    smartNurture?: boolean;
    // Secure Deal Vault & KYC
    documents?: LeadDocument[];
    kyc?: {
        passport: boolean;
        emiratesId: boolean;
        formB: boolean;
    };
    waStatus?: 'Sent' | 'Delivered' | 'Failed';
    companyId?: string;
    // Batch Management & Prospect Mode
    category?: 'lead' | 'prospect';
    fileId?: string;
    fileName?: string;
}

export interface ImportFile {
    id: string;
    name: string;
    uploadDate: number;
    leadCount: number;
    category: 'lead' | 'prospect';
    companyId?: string;
}

export interface Property {
    id: string;
    name: string;
    developer: string;
    type: 'Studio' | 'Apartment' | 'Villa' | 'Penthouse' | 'Townhouse';
    price: number;
    status: 'Available' | 'Sold' | 'Reserved';
    commissionRate: number;
    location: string;
    imageUrl: string;
    description?: string;
    agentId?: string;
    bedrooms: number;
    bathrooms: number;
    sqft: number;
    createdAt: number;
    updatedAt?: number;
    gallery?: string[];
    features?: string[];
    companyId?: string;
}

export interface Activity {
    id: string;
    type: string;
    description: string;
    timestamp: number;
    userId: string;
    userName?: string;
    leadId?: string;
    metadata?: any;
    companyId?: string;
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
    companyId?: string;
}

export interface Notification {
    id: string;
    text: string;
    read: boolean;
    date: string;
    type?: string;
}

export interface MessageTemplate {
    id: string;
    title: string;
    content: string;
    target: 'whatsapp' | 'email';
    companyId?: string;
}

export interface GlobalSettings {
    autoRouting: boolean;
    routingStrategy: 'round-robin' | 'manual';
    lastAssignedIndex: number;
    companyId?: string;
    whatsappToken?: string;
    whatsappPhoneId?: string;
    metaAppSecret?: string;
}
