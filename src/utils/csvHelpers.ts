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

export const generateTemplate = () => {
    const template = [
        {
            Name: 'John Doe',
            Email: 'john@example.com',
            Phone: '+971501234567',
            Source: 'Instagram',
            Budget: '1500000',
            Status: 'New',
            Notes: 'Interested in Downtown'
        },
        {
            Name: 'Jane Smith',
            Email: 'jane@example.com',
            Phone: '0559876543',
            Source: 'Referral',
            Budget: '2000000',
            Status: 'Contacted',
            Notes: 'Looking for villa'
        }
    ];
    return Papa.unparse(template);
};

export const validateLead = (lead: any): { isValid: boolean; error?: string } => {
    if (!lead.Name) return { isValid: false, error: 'Name is required' };

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (lead.Email && !emailRegex.test(lead.Email)) {
        return { isValid: false, error: 'Invalid email format' };
    }

    // Basic phone validation (just check minimum length)
    if (!lead.Phone || lead.Phone.length < 8) {
        return { isValid: false, error: 'Invalid phone number' };
    }

    return { isValid: true };
};

export const parseCSV = (file: File): Promise<{ data: any[]; errors: any[] }> => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results: ParseResult<any>) => {
                resolve({
                    data: results.data,
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
        DateCheck: new Date(lead.createdAt).toLocaleDateString()
    }));
    return Papa.unparse(data);
};
