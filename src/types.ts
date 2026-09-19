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
    assignedToId?: string; // The agent's actual Firebase UID — used for role-based querying
    assignedName?: string;
    createdAt: number;
    updatedAt?: number;
    lastContact?: number;
    propertyId?: string;
    commission?: number;
    commissionPaid?: boolean;
    historyLog?: any[];
    deletedAt?: number;
    targetLocation?: string;
    maxBudget?: number;
    targetBedrooms?: number;
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
    delegatedBy?: string; // Tracks the user who assigned the lead
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
    // --- Basic Information ---
    name: string;
    developer: string;
    type: 'Studio' | 'Apartment' | 'Villa' | 'Penthouse' | 'Townhouse' | 'Office' | 'Retail' | 'Plot' | 'Other';
    bedrooms: number;
    bathrooms: number;
    maidsRoom?: boolean;
    studyRoom?: boolean;
    floor?: string;
    tower?: string;
    unitNumber?: string;
    sqft: number;
    bua?: number;
    plotSize?: number;
    balconyTerrace?: boolean;
    parkingSpaces?: number;
    
    // --- Location ---
    location: string;
    emirate?: string;
    area?: string;
    community?: string;
    exactLocation?: string;
    googleMapsLink?: string;

    // --- Financial Information ---
    price: number; // Current Selling / Asking Price
    originalPrice?: number;
    marketPrice?: number;
    previousPrice?: number;
    discount?: number;
    amountPaid?: number;
    amountRemaining?: number;
    paymentPlan?: string;
    postHandoverPlan?: string;
    dldInfo?: string;
    commissionRate: number;
    serviceCharge?: number;

    // --- Status & Handover ---
    status: 'Available' | 'Sold' | 'Reserved' | 'Active' | 'Off-Market';
    projectStatus?: 'Ready' | 'Off-Plan' | 'Under Construction';
    handoverDate?: string;
    occupancyStatus?: 'Vacant' | 'Rented' | 'Owner Occupied';
    fullyPaid?: boolean;

    // --- Rental Information ---
    currentRent?: number;
    rentalFrequency?: 'Monthly' | 'Quarterly' | 'Yearly';
    tenancyStartDate?: string;
    tenancyExpiryDate?: string;
    shortTermRentalInfo?: string;
    longTermRentalInfo?: string;

    // --- Features & Specs ---
    view?: string;
    furnishing?: 'Furnished' | 'Unfurnished' | 'Semi-Furnished';
    condition?: string;
    cornerUnit?: boolean;
    floorLevel?: 'High' | 'Mid' | 'Low';
    waterfront?: boolean;
    beachAccess?: boolean;
    pool?: boolean;
    garden?: boolean;
    terrace?: boolean;
    features?: string[];

    // --- Media & Links ---
    imageUrl: string;
    gallery?: string[];
    videos?: string[];
    brochures?: string[];
    floorPlans?: string[];
    propertyLinks?: string[];
    documents?: string[]; // Drive links etc

    // --- Owner Information (Restricted) ---
    ownerName?: string;
    ownerPhone?: string;
    ownerEmail?: string;
    
    // --- Internal & Source Tracking ---
    description?: string; // Internal Notes
    agentId?: string;
    createdAt: number;
    updatedAt?: number;
    companyId?: string;
    sourceType?: 'PDF' | 'Google Drive' | 'Google Sheet' | 'Excel/CSV' | 'Image' | 'Agent' | 'Owner' | 'WhatsApp' | 'Internal';
    sourceLink?: string;
    conflictStatus?: 'Clear' | 'Duplicate' | 'Conflict';
    isDeleted?: boolean;

    // Legacy fields for backward compatibility
    inventoryType?: 'Direct' | 'Indirect';
    reraPermit?: string;
    projectType?: 'Off-Plan Project' | 'Secondary Project';
}

export interface ClientRequirement {
    id: string;
    type: 'Client' | 'Agent' | 'Internal';
    clientName: string;
    budgetMax: number;
    location: string;
    propertyType: string;
    bedrooms: number;
    sizeMin?: number;
    statusRequirement?: 'Ready' | 'Off-Plan' | 'Any';
    handoverRequirement?: string;
    view?: string;
    otherRequirements?: string;
    dateReceived: number;
    assignedToId: string; // User ID
    status: 'Active' | 'Fulfilled' | 'Archived';
    matchedPropertyIds?: string[];
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
    // 'text' is the legacy field name; 'message' is the canonical alias
    text: string;
    message?: string;       // Alias for 'text' — use whichever is present
    read: boolean;
    isRead?: boolean;       // Alias for 'read' — both kept for compatibility
    date: string;
    timestamp?: number;     // Unix ms — for real-time sorting
    type?: 'assignment' | 'update' | 'system' | 'alert' | string;
    // Who this notification targets:
    //   - a Firebase UID      → only that user sees it
    //   - 'Admin'             → visible to all ceo/admin/manager roles
    targetUserId?: string;
    userId?: string;        // Legacy alias for targetUserId — kept for backward compat
    toUser?: string;        // Another legacy alias
    companyId?: string;
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
