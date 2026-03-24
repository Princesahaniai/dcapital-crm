import Papa from 'papaparse';
import type { ParseResult } from 'papaparse';

export interface CSVLead {
    Name: string;
    Email: string;
    Phone: string;
    Source: string;
    Budget: string;
    Status: string;
    Notes?: string;
}

// Case-insensitive header mapping — handles "name", "Name", "NAME", etc.
const HEADER_MAP: Record<string, string> = {
    // Name variants
    name: 'Name',
    clientname: 'Name',
    firstname: 'Name',
    fullname: 'Name',
    // Email
    email: 'Email',
    // Phone variants
    phone: 'Phone',
    phonenumber: 'Phone',
    mobile: 'Phone',
    contact: 'Phone',
    // Source
    source: 'Source',
    // Budget variants
    budget: 'Budget',
    maxbudget: 'MaxBudget',
    max_budget: 'MaxBudget',
    value: 'Budget',
    aed: 'Budget',
    price: 'Budget',
    // Other
    status: 'Status',
    notes: 'Notes',
    targetlocation: 'TargetLocation',
    target_location: 'TargetLocation',
    location: 'TargetLocation'
};

/**
 * Normalize a CSV row's keys to expected casing.
 * "name" → "Name", "BUDGET" → "Budget", etc.
 */
const normalizeHeaders = (row: Record<string, any>): Record<string, any> => {
    const normalized: Record<string, any> = {};
    for (const [key, value] of Object.entries(row)) {
        const cleanKey = key.toLowerCase().trim().replace(/\s+/g, '');
        let mappedKey = key;

        if (cleanKey.includes('name')) mappedKey = 'Name';
        else if (cleanKey.includes('phone') || cleanKey.includes('mob') || cleanKey.includes('cont')) mappedKey = 'Phone';
        else if (cleanKey.includes('email')) mappedKey = 'Email';
        else if (HEADER_MAP[cleanKey]) mappedKey = HEADER_MAP[cleanKey];

        normalized[mappedKey] = typeof value === 'string' ? value.trim() : value;
    }
    return normalized;
};

/**
 * Sanitize budget values: strip "AED", commas, spaces, currency symbols
 */
const sanitizeBudget = (raw: any): number => {
    if (!raw) return 0;
    const cleaned = String(raw)
        .replace(/[AaEeDd\s,₹$€£¥]/g, '')
        .replace(/[^\d.]/g, '');
    return parseInt(cleaned) || 0;
};

/**
 * Sanitize phone: strip spaces, dashes, parentheses
 */
const sanitizePhone = (raw: any): string => {
    if (!raw) return '';
    // Strip everything except digits and the plus sign
    return String(raw).replace(/[^\d+]/g, '').trim();
};

/**
 * Transform a raw CSV row into a clean, validated object
 */
export const transformRow = (rawRow: Record<string, any>): Record<string, any> => {
    const row = normalizeHeaders(rawRow);
    const cleanPhone = sanitizePhone(row.Phone);
    return {
        ...row,
        Name: row.Name || (cleanPhone ? 'Unknown Lead' : ''),
        Phone: cleanPhone,
        Budget: sanitizeBudget(row.Budget),
        MaxBudget: sanitizeBudget(row.MaxBudget),
    };
};

export const generateTemplate = () => {
    const template = [
        {
            Name: 'John Doe',
            Email: 'john@example.com',
            Phone: '+971501234567',
            Source: 'Instagram',
            Budget: '1500000',
            Status: 'New',
            Notes: 'Interested in Downtown',
            TargetLocation: 'Downtown Dubai'
        },
        {
            Name: 'Jane Smith',
            Email: 'jane@example.com',
            Phone: '0559876543',
            Source: 'Referral',
            Budget: '2000000',
            Status: 'Contacted',
            Notes: 'Looking for villa',
            TargetLocation: 'Palm Jumeirah'
        }
    ];
    return Papa.unparse(template);
};

export const validateLead = (lead: any): { isValid: boolean; error?: string } => {
    // If we have a phone, we can accept "Unknown Lead"
    if (!lead.Name && !lead.Phone) return { isValid: false, error: 'Name or Phone is required' };

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (lead.Email && !emailRegex.test(lead.Email)) {
        return { isValid: false, error: `Invalid email format for "${lead.Name || 'Unknown'}"` };
    }

    // Basic phone validation (just check minimum length after sanitization)
    const phone = sanitizePhone(lead.Phone);
    if (phone && phone.length < 5) { // Relaxed to 5 for internal numbers etc
        return { isValid: false, error: `Invalid phone for "${lead.Name || 'Unknown'}"` };
    }

    return { isValid: true };
};

export const parseCSV = (file: File): Promise<{ data: any[]; errors: any[] }> => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            delimiter: ",",
            transformHeader: (header: string) => header.trim(),
            complete: (results: ParseResult<any>) => {
                // Transform all rows through normalizer
                const transformed = results.data.map(transformRow);
                resolve({
                    data: transformed,
                    errors: results.errors
                });
            },
            error: (error: Error) => {
                reject(error);
            }
        });
    });
};

export const exportToCSV = (leads: any[]) => {
    const data = leads.map(lead => ({
        Name: lead.name,
        Email: lead.email,
        Phone: lead.phone,
        Source: lead.source,
        Budget: lead.budget,
        Status: lead.status,
        AssignedTo: lead.assignedTo || 'Unassigned',
        TargetLocation: lead.targetLocation || '',
        DateCheck: new Date(lead.createdAt).toLocaleDateString()
    }));
    return Papa.unparse(data);
};
