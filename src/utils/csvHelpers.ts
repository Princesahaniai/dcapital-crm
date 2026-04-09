import Papa from 'papaparse';
import type { ParseResult } from 'papaparse';

export interface CSVLead {
    Name: string;
    Email: string;
    Phone: string;
    Source: string;
    Budget: string;
    MaxBudget?: string;
    Status: string;
    Notes?: string;
    TargetLocation?: string;
    /** Raw remark text extracted from Remarks/Comments/Message columns — injected into historyLog */
    _remark?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// FUZZY HEADER RESOLVER
// Each entry is [canonicalFieldName, [...matchers]]
// A matcher is either an exact lowercase-stripped string OR a regex.
// The resolver checks every header against these matchers in order.
// ─────────────────────────────────────────────────────────────────────────────
type CanonicalField =
    | 'Name' | 'Email' | 'Phone' | 'Source'
    | 'Budget' | 'MaxBudget' | 'Status'
    | 'TargetLocation' | 'Notes' | 'Remark' | 'AssignedTo';

const FIELD_MATCHERS: [CanonicalField, (string | RegExp)[]][] = [
    // ── Name ──────────────────────────────────────────────────────────────────
    ['Name', [
        'name', 'fullname', 'firstname', 'lastname', 'clientname',
        'leadname', 'customername', 'contactname', 'person',
        /name/i
    ]],
    // ── Email ─────────────────────────────────────────────────────────────────
    ['Email', [
        'email', 'emailaddress', 'mail', 'e-mail',
        /email/i
    ]],
    // ── Phone ─────────────────────────────────────────────────────────────────
    ['Phone', [
        'phone', 'phonenumber', 'mobile', 'mobilenumber', 'mob',
        'contact', 'contactnumber', 'whatsapp', 'whatsappnumber',
        'cell', 'cellphone', 'telephone', 'tel',
        /phone|mobile|whatsapp|contact.*num|cell/i
    ]],
    // ── Source ────────────────────────────────────────────────────────────────
    ['Source', [
        'source', 'leadsource', 'channel', 'medium', 'platform',
        /source/i
    ]],
    // ── Budget (primary) ──────────────────────────────────────────────────────
    ['Budget', [
        'budget', 'price', 'value', 'amount', 'aed', 'cost',
        'minbudget', 'minprice', 'askingprice',
        /budget|price|value|aed/i
    ]],
    // ── Max Budget ────────────────────────────────────────────────────────────
    ['MaxBudget', [
        'maxbudget', 'maximumbudget', 'max_budget', 'maxprice',
        'maximumprice', 'upperlimit', 'ceiling',
        /max.*budget|max.*price/i
    ]],
    // ── Status ────────────────────────────────────────────────────────────────
    ['Status', [
        'status', 'stage', 'pipelinestage', 'leadstatus', 'dealstage',
        /status|stage/i
    ]],
    // ── Target Location ───────────────────────────────────────────────────────
    ['TargetLocation', [
        'targetlocation', 'location', 'area', 'community', 'zone',
        'preferredlocation', 'interestedarea', 'preferredarea',
        /location|area|community|zone/i
    ]],
    // ── Remarks / Notes → historyLog ──────────────────────────────────────────
    ['Remark', [
        'remarks', 'remark', 'comments', 'comment', 'notes', 'note',
        'message', 'messages', 'feedback', 'description', 'details',
        'operationalintel', 'intel', 'info', 'additional',
        /remark|comment|note|message|feedback|description|detail|intel/i
    ]],
    // ── Assigned To → agent name (caller resolves to ID via team roster) ─────
    ['AssignedTo', [
        'assignedto', 'assigned', 'agent', 'agentname', 'assignee',
        'handledby', 'responsibleagent', 'assignedagent', 'owner',
        'salesperson', 'salesrep', 'responsiblefor',
        /assigned.*to|agent.*name|assignee|owner|salesperson|sales.*rep/i
    ]],
];

/**
 * Resolve a raw CSV header string to a canonical field name.
 * Returns null if no match found (column will be ignored).
 */
const resolveHeader = (rawHeader: string): CanonicalField | null => {
    const stripped = rawHeader.toLowerCase().trim().replace(/[\s_\-\/\\]/g, '');

    for (const [canonical, matchers] of FIELD_MATCHERS) {
        for (const matcher of matchers) {
            if (typeof matcher === 'string') {
                if (stripped === matcher) return canonical;
            } else {
                // regex — test against the original trimmed header
                if (matcher.test(rawHeader.trim())) return canonical;
            }
        }
    }
    return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// SANITIZERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Strip spaces, dashes, dots, parentheses from phone numbers.
 * Preserves leading + for international format.
 */
const sanitizePhone = (raw: any): string => {
    if (!raw) return '';
    return String(raw).replace(/[^\d+]/g, '').trim();
};

/**
 * Strip currency symbols, commas, and text from budget values.
 */
const sanitizeBudget = (raw: any): number => {
    if (!raw) return 0;
    const cleaned = String(raw)
        .replace(/[aAbBeEdD\s,₹$€£¥]/g, '')   // strip AED + common currency chars
        .replace(/[^\d.]/g, '');                 // keep only digits and decimal
    return parseInt(cleaned) || 0;
};

/**
 * Normalise a lead status string to one of the accepted union values.
 */
const normalizeStatus = (raw: string): string => {
    const map: Record<string, string> = {
        new: 'New',
        fresh: 'New',
        contacted: 'Contacted',
        called: 'Contacted',
        qualified: 'Qualified',
        interested: 'Qualified',
        viewing: 'Viewing',
        visit: 'Viewing',
        negotiation: 'Negotiation',
        negotiating: 'Negotiation',
        offer: 'Negotiation',
        closed: 'Closed',
        won: 'Closed',
        sold: 'Closed',
        lost: 'Lost',
        dead: 'Lost',
        rejected: 'Lost',
    };
    const key = (raw || '').toLowerCase().trim();
    return map[key] || 'New';
};

// ─────────────────────────────────────────────────────────────────────────────
// SMART ROW TRANSFORMER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Transform a raw CSV row (any column names) into a clean standardised object.
 *
 * Handles:
 *  - Fuzzy column name resolution
 *  - Phone sanitization (strips spaces / dashes)
 *  - Budget parsing (strips AED text / commas)
 *  - Remarks/Notes/Comments → _remark field (caller injects into historyLog)
 *  - Default values for missing required fields
 */
export const transformRow = (rawRow: Record<string, any>): Record<string, any> => {
    // Step 1: Build a canonical-keyed map from the raw row
    const canonical: Partial<Record<CanonicalField, any>> = {};

    for (const [rawKey, rawValue] of Object.entries(rawRow)) {
        const field = resolveHeader(rawKey);
        if (!field) continue;                        // unknown column → discard
        const val = typeof rawValue === 'string' ? rawValue.trim() : rawValue;

        // For fields that can capture multiple columns (e.g., two "Notes" cols),
        // concatenate rather than overwrite.
        if (field === 'Remark' && canonical['Remark']) {
            canonical['Remark'] = `${canonical['Remark']} | ${val}`;
        } else if (field === 'Notes' && canonical['Notes']) {
            canonical['Notes'] = `${canonical['Notes']} | ${val}`;
        } else {
            canonical[field] = val;
        }
    }

    // Step 2: Build the clean output
    const phone = sanitizePhone(canonical.Phone);
    const budget = sanitizeBudget(canonical.Budget);
    const maxBudget = sanitizeBudget(canonical.MaxBudget);
    const remark = [canonical.Remark, canonical.Notes]
        .filter(Boolean)
        .join(' | ')
        .trim();

    return {
        Name:           canonical.Name || (phone ? 'Unknown Lead' : ''),
        Email:          canonical.Email || '',
        Phone:          phone,
        Source:         canonical.Source || 'Import',
        Budget:         budget,
        MaxBudget:      maxBudget,
        Status:         normalizeStatus(String(canonical.Status || '')),
        TargetLocation: canonical.TargetLocation || '',
        Notes:          remark || '',   // kept for backwards compatibility
        _remark:        remark,         // caller injects into historyLog + notes textarea
        // Raw agent name from CSV — caller matches against team roster to get an ID
        AssignedTo:     (canonical.AssignedTo ? String(canonical.AssignedTo).trim() : ''),
    };
};

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

export const validateLead = (lead: any): { isValid: boolean; error?: string } => {
    if (!lead.Name && !lead.Phone) {
        return { isValid: false, error: 'Name or Phone is required' };
    }

    if (lead.Email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(lead.Email)) {
            return {
                isValid: false,
                error: `Invalid email format for "${lead.Name || 'Unknown'}"`,
            };
        }
    }

    const phone = sanitizePhone(lead.Phone);
    if (phone && phone.length < 5) {
        return {
            isValid: false,
            error: `Invalid phone for "${lead.Name || 'Unknown'}"`,
        };
    }

    return { isValid: true };
};

// ─────────────────────────────────────────────────────────────────────────────
// CSV PARSER
// ─────────────────────────────────────────────────────────────────────────────

export const parseCSV = (file: File): Promise<{ data: any[]; errors: any[] }> => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            // Do NOT pre-transform headers here — we do fuzzy mapping in transformRow
            transformHeader: (header: string) => header.trim(),
            complete: (results: ParseResult<any>) => {
                const transformed = results.data.map(transformRow);
                resolve({
                    data: transformed,
                    errors: results.errors,
                });
            },
            error: (error: Error) => {
                reject(error);
            },
        });
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export const exportToCSV = (leads: any[]) => {
    const data = leads.map(lead => ({
        Name:           lead.name,
        Email:          lead.email,
        Phone:          lead.phone,
        Source:         lead.source,
        Budget:         lead.budget,
        MaxBudget:      lead.maxBudget || '',
        Status:         lead.status,
        AssignedTo:     lead.assignedTo || 'Unassigned',
        TargetLocation: lead.targetLocation || '',
        DateCreated:    new Date(lead.createdAt).toLocaleDateString(),
    }));
    return Papa.unparse(data);
};

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE GENERATOR
// ─────────────────────────────────────────────────────────────────────────────

export const generateTemplate = () => {
    const template = [
        {
            'Full Name':        'John Doe',
            'Email':            'john@example.com',
            'Mobile':           '+971 50 123 4567',
            'Source':           'Instagram',
            'Budget (AED)':     '1,500,000',
            'Max Budget (AED)': '2,000,000',
            'Status':           'New',
            'Remarks':          'Interested in Downtown — prefers high floor',
            'Target Location':  'Downtown Dubai',
        },
        {
            'Full Name':        'Jane Smith',
            'Email':            'jane@example.com',
            'WhatsApp':         '055-987-6543',
            'Source':           'Referral',
            'Budget (AED)':     '3,000,000',
            'Max Budget (AED)': '4,500,000',
            'Status':           'Contacted',
            'Comments':         'Looking for villa, family of 4',
            'Target Location':  'Palm Jumeirah',
        },
    ];
    return Papa.unparse(template);
};
