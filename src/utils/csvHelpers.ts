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
    /** Formatted intel string built from Remarks + Source/Form/Channel/Labels */
    _remark?: string;
    /** Raw agent name or 'Unassigned' — caller resolves to ID */
    AssignedTo?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXACT COLUMN MAP — Google Sheet / CRM export column names (HIGHEST PRIORITY)
// Checked BEFORE the fuzzy resolver. Preserves spaces & capitalisation.
// ─────────────────────────────────────────────────────────────────────────────
const EXACT_COLUMN_MAP: Record<string, string> = {
    // Identity
    'Name':                   'Name',
    'Full Name':              'Name',
    'Contact Name':           'Name',
    'Client Name':            'Name',
    'Lead Name':              'Name',

    // Email  ← exact Google Sheets CRM export header
    'Email address':          'Email',
    'Email Address':          'Email',
    'Email':                  'Email',
    'E-mail':                 'Email',

    // Phone — primary + two fallback columns
    'Phone':                  'Phone',
    'Phone Number':           'Phone',
    'Mobile':                 'Phone',
    'Mobile Number':          'Phone',
    'Telephone':              'Phone',
    'WhatsApp number':        'PhoneFallback1',   // ← exact Google Sheets header
    'WhatsApp Number':        'PhoneFallback1',
    'WhatsApp':               'PhoneFallback1',
    'Secondary phone number': 'PhoneFallback2',   // ← exact Google Sheets header
    'Secondary Phone Number': 'PhoneFallback2',
    'Alt Phone':              'PhoneFallback2',

    // Assignment  ← exact Google Sheets CRM export header
    'Owner':                  'AssignedTo',
    'Assigned To':            'AssignedTo',
    'Assignee':               'AssignedTo',
    'Agent':                  'AssignedTo',
    'Agent Name':             'AssignedTo',
    'Handled By':             'AssignedTo',
    'Sales Person':           'AssignedTo',

    // Pipeline state  ← exact Google Sheets CRM export header
    'Stage':                  'Status',
    'Pipeline Stage':         'Status',
    'Lead Stage':             'Status',
    'Status':                 'Status',
    'Lead Status':            'Status',
    'Deal Stage':             'Status',

    // ── CRITICAL DATA RETENTION ─────────────────────────────────────────────
    // These four are captured individually and formatted into the intel string.
    'Source':                 'Source',
    'Lead Source':            'Source',
    'Form':                   'Form',
    'Channel':                'Channel',
    'Medium':                 'Channel',
    'Labels':                 'Labels',
    'Label':                  'Labels',
    'Tags':                   'Labels',
    'Tag':                    'Labels',

    // Budget
    'Budget':                 'Budget',
    'Budget (AED)':           'Budget',
    'Min Budget':             'Budget',
    'Min Budget (AED)':       'Budget',
    'Price':                  'Budget',
    'Max Budget':             'MaxBudget',
    'Max Budget (AED)':       'MaxBudget',
    'Maximum Budget':         'MaxBudget',

    // Location
    'Target Location':        'TargetLocation',
    'Location':               'TargetLocation',
    'Area':                   'TargetLocation',
    'Community':              'TargetLocation',
    'Zone':                   'TargetLocation',
    'Preferred Location':     'TargetLocation',
    'Interested Area':        'TargetLocation',

    // Notes / Remarks
    'Remarks':                'Remark',
    'Remark':                 'Remark',
    'Comments':               'Remark',
    'Comment':                'Remark',
    'Description':            'Remark',
    'Feedback':               'Remark',
    'Notes':                  'Notes',
    'Note':                   'Notes',
    'Additional Info':        'Notes',
};

// ─────────────────────────────────────────────────────────────────────────────
// FUZZY HEADER RESOLVER — fallback when exact map has no match
// ─────────────────────────────────────────────────────────────────────────────
type CanonicalField =
    | 'Name' | 'Email'
    | 'Phone' | 'PhoneFallback1' | 'PhoneFallback2'
    | 'Source' | 'Form' | 'Channel' | 'Labels'
    | 'Budget' | 'MaxBudget' | 'Status'
    | 'TargetLocation' | 'Notes' | 'Remark' | 'AssignedTo';

const FIELD_MATCHERS: [CanonicalField, (string | RegExp)[]][] = [
    ['Name', [
        'name', 'fullname', 'firstname', 'lastname', 'clientname',
        'leadname', 'customername', 'contactname', 'person',
        /name/i,
    ]],
    ['Email', [
        'email', 'emailaddress', 'mail',
        /email/i,
    ]],
    ['Phone', [
        'phone', 'phonenumber', 'mobile', 'mobilenumber', 'mob',
        'contactnumber', 'telephone', 'tel',
        /^phone$|^mobile$/i,
    ]],
    ['PhoneFallback1', [
        'whatsapp', 'whatsappnumber', 'whatsappno',
        /whatsapp/i,
    ]],
    ['PhoneFallback2', [
        'secondaryphone', 'secondarymobile', 'altphone',
        /secondary.*phone|alternate.*phone/i,
    ]],
    ['Source', ['source', 'leadsource', /^source$/i]],
    ['Form',   ['form',   /^form$/i]],
    ['Channel',['channel','medium', /^channel$|^medium$/i]],
    ['Labels', ['labels','label','tags','tag', /^labels?$|^tags?$/i]],
    ['Budget', [
        'budget', 'price', 'value', 'amount', 'aed', 'cost',
        'minbudget', 'minprice', 'askingprice',
        /budget|price|value|aed/i,
    ]],
    ['MaxBudget', [
        'maxbudget', 'maximumbudget', 'max_budget', 'maxprice',
        'maximumprice', 'upperlimit', 'ceiling',
        /max.*budget|max.*price/i,
    ]],
    ['Status', [
        'status', 'stage', 'pipelinestage', 'leadstatus', 'dealstage',
        /status|stage/i,
    ]],
    ['TargetLocation', [
        'targetlocation', 'location', 'area', 'community', 'zone',
        'preferredlocation', 'interestedarea', 'preferredarea',
        /location|area|community|zone/i,
    ]],
    ['Remark', [
        'remarks', 'remark', 'comments', 'comment',
        'message', 'messages', 'feedback', 'description', 'details',
        'operationalintel', 'intel', 'info', 'additional',
        /remark|comment|message|feedback|description|detail|intel/i,
    ]],
    ['Notes', ['notes', 'note', /^notes?$/i]],
    ['AssignedTo', [
        'assignedto', 'assigned', 'agent', 'agentname', 'assignee',
        'handledby', 'responsibleagent', 'assignedagent', 'owner',
        'salesperson', 'salesrep', 'responsiblefor',
        /assigned.*to|agent.*name|assignee|owner|salesperson|sales.*rep/i,
    ]],
];

/**
 * Resolve a raw CSV header to a canonical field.
 * Priority: EXACT_COLUMN_MAP → fuzzy FIELD_MATCHERS → null (column discarded).
 */
const resolveHeader = (rawHeader: string): CanonicalField | null => {
    const trimmed = rawHeader.trim();

    // 1. Exact match (preserves spaces — critical for "Email address", "WhatsApp number", etc.)
    const exact = EXACT_COLUMN_MAP[trimmed];
    if (exact) return exact as CanonicalField;

    // 2. Fuzzy match on stripped lowercase
    const stripped = trimmed.toLowerCase().replace(/[\s_\-\/\\]/g, '');
    for (const [canonical, matchers] of FIELD_MATCHERS) {
        for (const matcher of matchers) {
            if (typeof matcher === 'string') {
                if (stripped === matcher) return canonical;
            } else {
                if (matcher.test(trimmed)) return canonical;
            }
        }
    }
    return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// SANITIZERS
// ─────────────────────────────────────────────────────────────────────────────

const sanitizePhone = (raw: any): string => {
    if (!raw) return '';
    const s = String(raw).replace(/[^\d+]/g, '').trim();
    return s;
};

const sanitizeBudget = (raw: any): number => {
    if (!raw) return 0;
    const cleaned = String(raw)
        .replace(/[aAbBeEdD\s,₹$€£¥]/g, '')
        .replace(/[^\d.]/g, '');
    return parseInt(cleaned) || 0;
};

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
 * Transform a raw CSV row into a standardised object.
 *
 * Google Sheet exact column handling:
 *  - 'Name'                → Name
 *  - 'Email address'       → Email
 *  - 'Phone'               → Phone  (fallback: 'WhatsApp number' → 'Secondary phone number')
 *  - 'Owner'               → AssignedTo  ('Unassigned' passed through; caller maps to currentUser)
 *  - 'Stage'               → Status
 *  - 'Source','Form','Channel','Labels' → formatted Operational Intel string in notes/_remark
 */
export const transformRow = (rawRow: Record<string, any>): Record<string, any> => {
    // Step 1: Map every raw column to its canonical field
    const canonical: Partial<Record<CanonicalField, any>> = {};

    for (const [rawKey, rawValue] of Object.entries(rawRow)) {
        const field = resolveHeader(rawKey);
        if (!field) continue;
        const val = typeof rawValue === 'string' ? rawValue.trim() : rawValue;
        if (val === '' || val === null || val === undefined) continue;

        // Concatenate if multiple columns map to the same text field
        if ((field === 'Remark' || field === 'Notes') && canonical[field]) {
            canonical[field] = `${canonical[field]} | ${val}`;
        } else if (!canonical[field]) {
            canonical[field] = val;
        }
    }

    // Step 2: Phone with fallback chain
    const phone =
        sanitizePhone(canonical.Phone) ||
        sanitizePhone(canonical.PhoneFallback1) ||
        sanitizePhone(canonical.PhoneFallback2) ||
        '';

    // Step 3: Build Operational Intel string from Source / Form / Channel / Labels
    // CRITICAL: none of this data is discarded — it is formatted and stored in notes.
    const intelParts: string[] = [];
    if (canonical.Source)  intelParts.push(`Source: ${canonical.Source}`);
    if (canonical.Form)    intelParts.push(`Form: ${canonical.Form}`);
    if (canonical.Channel) intelParts.push(`Channel: ${canonical.Channel}`);
    if (canonical.Labels)  intelParts.push(`Labels: ${canonical.Labels}`);
    const intelString = intelParts.join(' | ');

    // Step 4: Merge intel + raw remarks into _remark (goes to historyLog & notes textarea)
    const remarksRaw = [canonical.Remark, canonical.Notes]
        .filter(Boolean)
        .join(' | ')
        .trim();
    const remark = [intelString, remarksRaw].filter(Boolean).join('\n').trim();

    // Step 5: AssignedTo — 'Unassigned' is kept as-is; Leads.tsx maps it to currentUser
    const assignedTo = String(canonical.AssignedTo || '').trim();

    return {
        Name:           canonical.Name || (phone ? 'Unknown Lead' : ''),
        Email:          canonical.Email || '',
        Phone:          phone,
        Source:         canonical.Source || 'Import',
        Budget:         sanitizeBudget(canonical.Budget),
        MaxBudget:      sanitizeBudget(canonical.MaxBudget),
        Status:         normalizeStatus(String(canonical.Status || '')),
        TargetLocation: canonical.TargetLocation || '',
        Notes:          remark || '',
        _remark:        remark,
        // 'Unassigned' → caller (Leads.tsx) falls back to user?.id
        AssignedTo:     assignedTo,
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
            // Keep raw header exactly — exact matching in resolveHeader handles spaces
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
        'Email address': lead.email,
        Phone:          lead.phone,
        Source:         lead.source,
        Budget:         lead.budget,
        'Max Budget':   lead.maxBudget || '',
        Stage:          lead.status,
        Owner:          lead.assignedTo || 'Unassigned',
        'Target Location': lead.targetLocation || '',
        DateCreated:    new Date(lead.createdAt).toLocaleDateString(),
    }));
    return Papa.unparse(data);
};

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE GENERATOR — matches Google Sheet export format exactly
// ─────────────────────────────────────────────────────────────────────────────

export const generateTemplate = () => {
    const template = [
        {
            'Name':               'John Doe',
            'Email address':      'john@example.com',
            'Phone':              '+971 50 123 4567',
            'WhatsApp number':    '',
            'Stage':              'New',
            'Owner':              'Agent Name Here',
            'Source':             'Paid',
            'Form':               'Equity',
            'Channel':            'Instagram',
            'Labels':             'Hot Lead',
            'Budget (AED)':       '1,500,000',
            'Max Budget (AED)':   '2,000,000',
            'Target Location':    'Downtown Dubai',
            'Remarks':            'Interested in high floor, prefers sea view',
        },
        {
            'Name':               'Jane Smith',
            'Email address':      'jane@example.com',
            'Phone':              '',
            'WhatsApp number':    '055-987-6543',
            'Stage':              'Contacted',
            'Owner':              'Unassigned',
            'Source':             'Referral',
            'Form':               '',
            'Channel':            'WhatsApp',
            'Labels':             'VIP, Investor',
            'Budget (AED)':       '3,000,000',
            'Max Budget (AED)':   '4,500,000',
            'Target Location':    'Palm Jumeirah',
            'Remarks':            'Looking for villa, family of 4',
        },
    ];
    return Papa.unparse(template);
};
