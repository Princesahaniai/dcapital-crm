import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Lead, Property, Task, Activity, User, MessageTemplate, ImportFile } from './types';
import { auth, db, secondaryAuth } from './firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { doc, setDoc, getDocs, getDoc, query, where, collection, deleteDoc, addDoc, updateDoc, arrayUnion, writeBatch } from 'firebase/firestore';
import toast from 'react-hot-toast';

interface TeamMember extends User {
    id: string;
    status: 'Active' | 'Inactive' | 'Pending' | 'Suspended';
    joinedDate: string;
    password: string;
    designation: string;
    phone: string;
    totalSales: number;
    commissionEarned: number;
}

interface Notification {
    id: string;
    text: string;
    read: boolean;
    date: string;
    toUser?: string;
    userId?: string; // Firestore: who this notification is for
}

interface ExtendedLead extends Lead {
    assignedTo?: string;
    assignedName?: string;
    history?: any[];
    meetingsDone?: number;
    meetingsTarget?: number;
    nextMeeting?: string;
    potentialCommission?: number;
}

interface Store {
    user: User | null;
    leads: ExtendedLead[];
    properties: Property[];
    tasks: Task[];
    activities: Activity[];
    team: TeamMember[];
    notifications: Notification[];
    loginTimestamp: number | null;
    rememberMe: boolean;
    isAuthLoading: boolean;
    passwordResetTokens: Record<string, { token: string; email: string; expires: number }>;
    
    importFiles: ImportFile[];
    isDataLoading: boolean;

    // Auth Actions
    login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
    signup: (email: string, password: string, name: string) => Promise<boolean>;
    logout: () => void;
    resetPasswordRequest: (email: string) => boolean;
    changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
    resetUserPassword: (userId: string, newPassword: string) => boolean;
    checkSessionExpiry: () => void;
    subscribeToAuthChanges: () => () => void;

    // Enterprise Actions
    auditLogs: any[]; // Using any to avoid import issues for now, or use ActivityLog
    fetchAuditLogs: () => Promise<void>;
    logAudit: (action: string, targetUserId?: string, details?: any) => Promise<void>;
    suspendTeamMember: (id: string) => Promise<void>;
    activateTeamMember: (id: string) => Promise<void>;
    generateTempPassword: (id: string) => Promise<string>;

    // Real-Time Sync Setters (called by onSnapshot listeners)
    setLeads: (leads: ExtendedLead[]) => void;
    setTasks: (tasks: Task[]) => void;
    setTeamFromSnapshot: (team: TeamMember[]) => void;

    // Data Actions
    updateProfile: (name: string, email: string) => void;
    addLead: (l: ExtendedLead) => void;
    addBulkLeads: (leads: ExtendedLead[]) => { success: number; failed: number };
    updateLead: (id: string, data: Partial<ExtendedLead>) => void;
    deleteLead: (id: string) => void;
    restoreLead: (id: string) => void;
    permanentDeleteLead: (id: string) => void;
    assignLeads: (leadIds: string[], agentId: string, agentName: string) => void;
    addQuickNote: (leadId: string, note: string) => void;
    addProperty: (p: Property) => void;
    updateProperty: (id: string, data: Partial<Property>) => void;
    deleteProperty: (id: string) => void;
    addTask: (t: Task | any) => void;
    updateTaskStatus: (id: string, status: Task['status'], note?: string) => void;
    addTaskComment: (id: string, text: string) => void;
    toggleTask: (id: string) => void;
    deleteTask: (id: string) => void;
    runDailyTaskSweep: () => Promise<void>;
    markNotificationRead: (id: string) => void;
    clearNotifications: () => void;
    setNotifications: (notifications: Notification[]) => void;
    addFirestoreNotification: (userId: string, text: string) => void;
    importData: (data: any) => void;
    addImportFile: (file: ImportFile) => void;
    deleteBatch: (batchId: string) => Promise<void>;
    bulkAssignFile: (batchId: string, agentId: string, agentName: string) => Promise<void>;
    resetSystem: () => void;
    resetLeads: () => void;
    resetProperties: () => void;
    addTeamMember: (member: TeamMember) => Promise<any>; // Returns credentials object
    removeTeamMember: (id: string) => Promise<void>;
    fetchTeam: () => Promise<void>; // New action to sync team
    addActivity: (a: Activity) => void;
    addNotification: (text: string) => void;

    // Multi-Stream Revenue
    tradingRevenue: number;
    saasRevenue: number;
    updateTradingRevenue: (amount: number) => void;
    updateSaasRevenue: (amount: number) => void;

    // Matchmaker Engine
    getMatchedProperties: (lead: ExtendedLead) => Property[];

    // Comms Hub
    messageTemplates: MessageTemplate[];
    fetchMessageTemplates: () => Promise<void>;
    saveMessageTemplate: (template: Partial<MessageTemplate>) => Promise<void>;
    deleteMessageTemplate: (id: string) => Promise<void>;

    // AI Lead Scoring & Nurture
    calculateLeadScore: (lead: ExtendedLead) => 'A' | 'B' | 'C';
    toggleSmartNurture: (leadId: string) => void;
}

export const useStore = create<Store>()(
    persist(
        (set, get) => ({
            user: null,
            leads: [], // Production: Empty state
            loginTimestamp: null,
            rememberMe: false,
            isAuthLoading: true,
            passwordResetTokens: {},
            properties: [], // Production: Empty state
            tasks: [], // Production: Empty state
            activities: [], // Production: Empty state
            team: [], // Production: Empty state - Only CEO and Admin via login
            notifications: [], // Production: Empty state
            auditLogs: [],
            messageTemplates: [],
            importFiles: [],
            isDataLoading: false,

            tradingRevenue: 0,
            saasRevenue: 0,
            updateTradingRevenue: (amount) => set({ tradingRevenue: amount }),
            updateSaasRevenue: (amount) => set({ saasRevenue: amount }),

            getMatchedProperties: (lead: ExtendedLead) => {
                if (!lead.targetLocation || !lead.maxBudget) return [];

                return get().properties
                    .filter(p => p.status === 'Available' && p.location === lead.targetLocation && p.price <= (lead.maxBudget || 0))
                    .sort((a, b) => b.price - a.price)
                    .slice(0, 3);
            },

            login: async (email, password, rememberMe = false) => {
                const normalizedEmail = email.toLowerCase().trim();
                console.log(`[AUTH] Attempting login for: ${normalizedEmail}`);

                // 🛡️ DEV BYPASS
                // 🛡️ DEV BYPASS & EMERGENCY ACCESS
                const isDevPass = password === 'admin' || password === 'TempPass123!';

                if (isDevPass) {
                    let role = 'agent';
                    let name = 'Dev Agent';

                    if (normalizedEmail.includes('prince') || normalizedEmail.includes('ajay')) {
                        role = 'ceo';
                        name = normalizedEmail.includes('prince') ? 'Prince Sahani' : 'Ajay';
                    } else if (normalizedEmail.includes('rashmi') || normalizedEmail.includes('admin')) {
                        role = 'admin';
                        name = normalizedEmail.includes('rashmi') ? 'Rashmi' : 'Admin User';
                    }

                    console.log('[AUTH] 🛡️ Emergency Bypass Success for:', normalizedEmail);
                    set({
                        user: {
                            id: 'bypass-' + normalizedEmail.replace(/[^a-z0-9]/g, '-'),
                            email: normalizedEmail,
                            name,
                            role: role as any
                        },
                        loginTimestamp: Date.now(),
                        rememberMe
                    });

                    toast.success(`Emergency Access Granted: ${role.toUpperCase()}`);
                    return true;
                }

                try {
                    console.log('[AUTH] Setting Persistence to LOCAL');
                    await setPersistence(auth, browserLocalPersistence);

                    console.log('[AUTH] Attempting Firebase Auth...', normalizedEmail);
                    const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
                    const user = userCredential.user;
                    console.log('[AUTH] Firebase Auth Success:', user.uid);

                    // Fetch User Profile from Firestore to Check Status & Role
                    const userDocRef = doc(db, 'users', userCredential.user.uid);
                    let userProfile = null;

                    try {
                        const docSnap = await getDoc(userDocRef);
                        if (docSnap.exists()) {
                            userProfile = docSnap.data();
                        } else {
                            // Fallback: Query by email if UID doc missing
                            console.log('[AUTH] User doc not found by UID, trying email query...');
                            const q = query(collection(db, 'users'), where('email', '==', normalizedEmail));
                            const querySnapshot = await getDocs(q);
                            if (!querySnapshot.empty) {
                                userProfile = querySnapshot.docs[0].data();
                                console.log('[AUTH] Found profile via email query');
                            }
                        }
                    } catch (err) {
                        console.error('[AUTH] Firestore Profile Fetch Error:', err);
                    }

                    if (userProfile) {
                        if (userProfile.status === 'Suspended' || userProfile.status === 'Inactive') {
                            await signOut(auth);
                            toast.error('Access Suspended. Contact Admin.');
                            return false;
                        }

                        // Super Admin Override
                        const isSuperAdmin = normalizedEmail === 'admin@dcapitalrealestate.com';

                        set({
                            user: {
                                id: user.uid,
                                email: user.email || '',
                                name: userProfile.name || user.displayName || 'User',
                                role: userProfile.role || 'agent',
                                isSuperAdmin,
                                subscriptionStatus: userProfile.subscriptionStatus || 'active',
                                companyId: userProfile.companyId || 'd-capital-main'
                            } as any,
                            loginTimestamp: Date.now(),
                            rememberMe
                        });
                        return true;
                    } else {
                        // Master Admin Fallback
                        if (normalizedEmail === 'princesahani.work@gmail.com' || normalizedEmail === 'ajay@dcapitalrealestate.com') {
                            console.log('[AUTH] Master Admin Fallback Triggered');
                            set({
                                user: { id: user.uid, email: user.email || '', name: 'Master Admin', role: 'ceo' } as any,
                                loginTimestamp: Date.now(),
                                rememberMe
                            });
                            return true;
                        }

                        console.warn('[AUTH] No user profile found in Firestore for:', normalizedEmail);
                        // Do NOT sign out immediately if it's a valid auth but missing profile - maybe show a warning?
                        // But for security, better to deny if strict. 
                        // For now, let's allow basic access if Auth succeeded but Profile failed, 
                        // OR enforce profile. The existing code enforces profile.
                        await signOut(auth);
                        toast.error('User profile not linked. Contact IT.');
                        return false;
                    }

                } catch (error: any) {
                    console.error('[AUTH] Login Failed:', error.code, error.message);
                    if (error.code === 'auth/invalid-credential') {
                        toast.error('Invalid email or password');
                    } else {
                        toast.error('Login failed: ' + error.message);
                    }
                    return false;
                }
            },

            signup: async (email, password, name) => {
                try {
                    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                    const user = userCredential.user;
                    await setDoc(doc(db, 'users', user.uid), {
                        name, email, role: 'CEO', status: 'Active', joinedDate: new Date().toISOString()
                    });
                    set({ user: { id: user.uid, email: user.email || '', name: name, role: 'CEO' } as any });
                    return true;
                } catch (error) {
                    // Signup failed - error handled by caller
                    return false;
                }
            },

            resetPasswordRequest: (_email) => { return true; },

            logout: async () => {
                await signOut(auth);
                set({ user: null, loginTimestamp: null, rememberMe: false });
            },

            changePassword: async (currentPassword, newPassword) => {
                const state = get();
                if (!state.user) return false;

                // For dev bypass users, just update the team member password
                if (state.user.id.startsWith('dev-bypass')) {
                    const teamMember = state.team.find(m => m.email === state.user?.email);
                    if (teamMember && teamMember.password === currentPassword) {
                        set((s) => ({
                            team: s.team.map(m =>
                                m.email === state.user?.email ? { ...m, password: newPassword } : m
                            )
                        }));
                        return true;
                    }
                    return false;
                }

                // For Firebase users, would use updatePassword from Firebase Auth
                // For now, mock implementation
                return true;
            },

            resetUserPassword: (userId, newPassword) => {
                const state = get();
                const currentUser = state.user;

                // Only CEO and Admin can reset passwords
                if (!currentUser || (currentUser.role !== 'ceo' && currentUser.role !== 'admin')) {
                    return false;
                }

                // Update team member password
                set((s) => ({
                    team: s.team.map(m =>
                        m.id === userId ? { ...m, password: newPassword } : m
                    )
                }));

                return true;
            },

            checkSessionExpiry: () => {
                const state = get();
                if (!state.user || !state.loginTimestamp) return;

                // 24 hour expiry
                if (Date.now() - state.loginTimestamp > 24 * 60 * 60 * 1000) {
                    if (!state.rememberMe) {
                        get().logout();
                    }
                }
            },

            subscribeToAuthChanges: () => {
                return onAuthStateChanged(auth, async (user) => {
                    const state = get();
                    if (user) {
                        console.log('[AUTH] User detected:', user.uid);
                        // If already logged in with same ID, just clear loading and skip re-fetch
                        if (state.user?.id === user.uid) {
                            set({ isAuthLoading: false });
                            return;
                        }

                        // Fetch Profile — wrapped in try/catch/finally to guarantee isAuthLoading clears
                        try {
                            const userDocRef = doc(db, 'users', user.uid);
                            const docSnap = await getDoc(userDocRef);

                            if (docSnap.exists()) {
                                const userProfile = docSnap.data();
                                if (userProfile.status === 'Suspended' || userProfile.status === 'Inactive') {
                                    await signOut(auth);
                                    set({ user: null, isAuthLoading: false });
                                    toast.error('Access Suspended');
                                    return;
                                }

                                const normalizedEmail = (user.email || '').toLowerCase().trim();
                                const isSuperAdmin = normalizedEmail === 'admin@dcapitalrealestate.com';

                                // 🛡️ INSTRUCTION 5: Fallback companyId for ALL users
                                const resolvedCompanyId = userProfile.companyId || 'd-capital-main';
                                if (!userProfile.companyId) {
                                    console.warn('[AUTH] No companyId on profile — defaulting to d-capital-main');
                                    // Silently patch the Firestore doc so next login is clean
                                    setDoc(doc(db, 'users', user.uid), { companyId: 'd-capital-main' }, { merge: true }).catch(() => {});
                                }
                                set({
                                    user: {
                                        id: user.uid,
                                        email: user.email || '',
                                        name: userProfile.name || user.displayName || 'User',
                                        role: userProfile.role || 'agent',
                                        isSuperAdmin,
                                        subscriptionStatus: userProfile.subscriptionStatus || 'active',
                                        companyId: resolvedCompanyId
                                    } as any,
                                    loginTimestamp: Date.now(),
                                    rememberMe: true,
                                    isAuthLoading: false
                                });
                            } else {
                                // Handle edge case: User in Auth but not Firestore
                                // Allow Master Admins specifically
                                if (user.email === 'princesahani.work@gmail.com' || user.email === 'ajay@dcapitalrealestate.com') {
                                    set({
                                        user: { id: user.uid, email: user.email || '', name: 'Master Admin', role: 'ceo', companyId: 'd-capital-main' } as any,
                                        loginTimestamp: Date.now(),
                                        rememberMe: true,
                                        isAuthLoading: false
                                    });
                                } else {
                                    // No profile found and not a master admin — stop loading
                                    set({ isAuthLoading: false });
                                }
                            }
                        } catch (error) {
                            console.error('[AUTH] Error fetching user profile during auth change:', error);
                            // Even if Firestore fails, clear loading so the app doesn't hang
                            set({ isAuthLoading: false });
                        }
                    } else {
                        // No user signed in — always clear loading
                        if (state.user) {
                            console.log('[AUTH] No user. Clearing session.');
                            set({ user: null, loginTimestamp: null, isAuthLoading: false });
                        } else {
                            set({ isAuthLoading: false });
                        }
                    }
                });
            },

            // Real-Time Sync Setters
            setLeads: (leads) => set({ leads }),
            setTasks: (tasks) => set({ tasks }),
            setTeamFromSnapshot: (team) => set({ team }),
            setNotifications: (notifications) => set({ notifications }),

            // Data Actions
            updateProfile: (name, email) => set((s) => ({ user: s.user ? { ...s.user, name, email } : null })),

            addLead: (l) => {
                // 🛡️ INSTRUCTION 5: Always use fallback companyId
                const cmpId = get().user?.companyId || 'd-capital-main';
                const leadWithCompany = { ...l, companyId: cmpId };

                set((s) => {
                    if (s.leads.some(existing => existing.id === l.id)) return {};
                    return { leads: [leadWithCompany, ...s.leads] };
                });

                // Fire-and-forget Firestore write
                setDoc(doc(db, 'leads', l.id), leadWithCompany, { merge: true }).catch(err => console.error('[SYNC] Lead write failed:', err));
            },

            addBulkLeads: (newLeads) => {
                // 🛡️ INSTRUCTION 5: Always use fallback companyId — never block imports
                const cmpId = get().user?.companyId || 'd-capital-main';

                const stampedLeads = newLeads.map(l => ({ ...l, companyId: cmpId }));

                set((s) => ({ leads: [...stampedLeads, ...s.leads] }));

                // Batch write to Firestore
                stampedLeads.forEach(l => {
                    setDoc(doc(db, 'leads', l.id), l, { merge: true }).catch(err => console.error('[SYNC] Bulk lead write failed:', err));
                });
                return { success: stampedLeads.length, failed: 0 };
            },

            fetchTeam: async () => {
                try {
                    const querySnapshot = await getDocs(collection(db, 'users'));
                    const team = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamMember));
                    set({ team });
                } catch (error) {
                    console.error('Error fetching team:', error);
                }
            },

            // Enterprise Implementations
            fetchAuditLogs: async () => {
                const cmpId = get().user?.companyId;
                if (!cmpId) return;

                try {
                    const q = query(collection(db, 'audit_logs'), where('companyId', '==', cmpId), where('timestamp', '>', Date.now() - 30 * 24 * 60 * 60 * 1000));
                    const querySnapshot = await getDocs(q);
                    const logs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)).sort((a, b) => b.timestamp - a.timestamp);
                    set({ auditLogs: logs });
                } catch (error) {
                    console.error('Error fetching audit logs:', error);
                }
            },

            logAudit: async (action, targetUserId, details) => {
                try {
                    const currentUser = get().user;
                    if (!currentUser?.companyId) return;

                    const logEntry = {
                        action,
                        performedBy: currentUser?.id || 'system',
                        performedByName: currentUser?.name || 'System',
                        targetUserId,
                        details,
                        timestamp: Date.now(),
                        companyId: currentUser.companyId
                    };
                    await setDoc(doc(collection(db, 'audit_logs')), logEntry);
                    set(s => ({ auditLogs: [logEntry, ...s.auditLogs] }));
                } catch (error) {
                    console.error('Failed to log audit:', error);
                }
            },

            suspendTeamMember: async (id) => {
                await setDoc(doc(db, 'users', id), { status: 'Suspended' }, { merge: true });
                set(s => ({ team: s.team.map(m => m.id === id ? { ...m, status: 'Suspended' } : m) }));
                get().logAudit('SUSPEND_USER', id);
                toast.success('User Suspended');
            },

            activateTeamMember: async (id) => {
                await setDoc(doc(db, 'users', id), { status: 'Active' }, { merge: true });
                set(s => ({ team: s.team.map(m => m.id === id ? { ...m, status: 'Active' } : m) }));
                get().logAudit('ACTIVATE_USER', id);
                toast.success('User Activated');
            },

            generateTempPassword: async (id) => {
                const tempPass = Math.random().toString(36).slice(-8).toUpperCase();
                await setDoc(doc(db, 'users', id), {
                    tempPassword: tempPass,
                    mustChangePassword: true
                }, { merge: true });

                get().logAudit('RESET_PASSWORD', id);
                return tempPass;
            },


            addTeamMember: async (member) => {
                console.log('[INVITE] Starting invitation process for:', member.email);

                try {
                    // Generate secure temporary password
                    const generateTempPassword = () => {
                        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$';
                        let password = '';
                        for (let i = 0; i < 12; i++) {
                            password += chars.charAt(Math.floor(Math.random() * chars.length));
                        }
                        return password;
                    };

                    const tempPassword = generateTempPassword();
                    const normalizedEmail = member.email.toLowerCase().trim();

                    console.log('[INVITE] Creating Firebase Auth account...');

                    // ⭐ CRITICAL: Create user via SECONDARY auth to prevent admin session hijack
                    const userCredential = await createUserWithEmailAndPassword(
                        secondaryAuth,
                        normalizedEmail,
                        tempPassword
                    );

                    const uid = userCredential.user.uid;
                    console.log('[INVITE] Firebase Auth account created with UID:', uid);

                    // Create Firestore profile with UID as document ID
                    const adminCompanyId = get().user?.companyId || 'd-capital-main';
                    const newMember = {
                        uid: uid,
                        email: normalizedEmail,
                        name: member.name,
                        role: member.role || 'agent',
                        designation: member.designation || '',
                        phone: member.phone || '',
                        department: member.department || '',
                        companyId: adminCompanyId, // ✅ CRITICAL: Ensures the team onSnapshot query finds this user
                        status: 'Active', // Active immediately - they can login right away
                        tempPassword: tempPassword, // Store for reference
                        createdAt: new Date().toISOString(),
                        joinedDate: new Date().toISOString().split('T')[0],
                        invitedBy: get().user?.email || 'system',
                        loginCount: 0,
                        totalSales: 0,
                        commissionEarned: 0
                    };

                    await setDoc(doc(db, 'users', uid), newMember);
                    console.log('[INVITE] Firestore profile created');

                    // 🛡️ Sign out the secondary auth so it doesn't linger
                    await signOut(secondaryAuth);
                    console.log('[INVITE] Secondary auth signed out — admin session safe');

                    // Log audit trail
                    try {
                        await addDoc(collection(db, 'audit_logs'), {
                            action: 'USER_INVITED',
                            performedBy: get().user?.email || 'system',
                            performedByUid: get().user?.id || 'system',
                            targetUserEmail: normalizedEmail,
                            targetUserUid: uid,
                            details: { role: member.role, department: member.department },
                            timestamp: new Date().toISOString()
                        });
                    } catch (auditError) {
                        console.warn('[INVITE] Failed to create audit log:', auditError);
                    }

                    // Update local state
                    set((state) => ({
                        team: [...state.team, { ...newMember, id: uid } as unknown as TeamMember]
                    }));

                    console.log('[INVITE] ✅ Success! User can login immediately');
                    console.log('[INVITE] Email:', normalizedEmail);
                    console.log('[INVITE] Temp Password:', tempPassword);

                    // Return credentials for admin to share
                    return {
                        success: true,
                        email: normalizedEmail,
                        tempPassword: tempPassword,
                        uid: uid,
                        message: `User created successfully! Share these credentials:\n\nEmail: ${normalizedEmail}\nPassword: ${tempPassword}\n\nThey can login immediately at ${window.location.origin}/login`
                    };

                } catch (error: any) {
                    console.error('[INVITE] Failed:', error);

                    // 👻 GHOST USER RECOVERY: Email exists in Firebase Auth but has no/wrong Firestore profile
                    if (error.code === 'auth/email-already-in-use') {
                        throw new Error('Ghost User Detected: This email exists in Firebase Auth but has no dashboard profile. Please delete the user from console.firebase.google.com -> Authentication, and try again.');
                    } else if (error.code === 'auth/invalid-email') {
                        throw new Error('Invalid email format. Please check and try again.');
                    } else if (error.code === 'auth/weak-password') {
                        throw new Error('Generated password is too weak. Please try again.');
                    } else {
                        throw new Error(error.message || 'Failed to create user account. Please try again.');
                    }
                }
            },


            removeTeamMember: async (id) => {
                await deleteDoc(doc(db, 'users', id));
                set((state) => ({
                    team: state.team.filter((m) => m.id !== id)
                }));
            },

            addActivity: (activity) => set((state) => ({
                activities: [activity, ...state.activities]
            })),

            addNotification: (text) => {
                const state = get();
                const notifId = Math.random().toString(36).substr(2, 9);
                const newNotif: Notification = {
                    id: notifId,
                    text,
                    read: false,
                    date: new Date().toISOString(),
                    userId: state.user?.id
                };
                set({ notifications: [newNotif, ...state.notifications] });
                // Persist to Firestore
                if (state.user?.id) {
                    const payload: any = { ...newNotif };
                    if (state.user.companyId) payload.companyId = state.user.companyId;
                    setDoc(doc(db, 'notifications', notifId), payload).catch(err => console.error('[SYNC] Notification write failed:', err));
                }
            },

            // Write a notification to Firestore for another user (e.g. when assigning a task)
            addFirestoreNotification: (userId, text) => {
                const notifId = Math.random().toString(36).substr(2, 9);
                const cmpId = get().user?.companyId;
                const notifDoc: any = {
                    id: notifId,
                    text,
                    read: false,
                    date: new Date().toISOString(),
                    userId
                };
                if (cmpId) notifDoc.companyId = cmpId;

                setDoc(doc(db, 'notifications', notifId), notifDoc).catch(err => console.error('[SYNC] Remote notification write failed:', err));
            },

            updateLead: (id, data) => {
                set((s) => {
                    const oldLead = s.leads.find(l => l.id === id);
                    if (!oldLead) return s;

                    // Commission Logic: If status changes to 'Closed', add commission
                    let commissionUpdate = {};
                    let newTeam = s.team;
                    let newNotifications = s.notifications;

                    if (data.status === 'Closed' && oldLead.status !== 'Closed') {
                        const budget = data.budget ?? oldLead.budget ?? 0;
                        const commission = budget * 0.02;
                        commissionUpdate = { commission, commissionPaid: false };

                        if (oldLead.assignedTo) {
                            newTeam = s.team.map(m => m.id === oldLead.assignedTo
                                ? { ...m, totalSales: (m.totalSales || 0) + budget, commissionEarned: (m.commissionEarned || 0) + commission }
                                : m
                            );
                        }

                        newNotifications = [{
                            id: Math.random().toString(36).substr(2, 9),
                            text: `🎉 Deal Closed! ${oldLead.name} - AED ${budget.toLocaleString()}`,
                            read: false,
                            date: new Date().toISOString()
                        }, ...s.notifications];

                    } else if (data.status && data.status !== 'Closed' && oldLead.status === 'Closed') {
                        commissionUpdate = { commission: 0, commissionPaid: false };
                    }

                    return {
                        leads: s.leads.map(l => l.id === id ? { ...l, ...data, ...commissionUpdate, updatedAt: Date.now() } : l),
                        team: newTeam,
                        notifications: newNotifications
                    };
                });
                // Firestore write-through
                const updatedData = { ...data, updatedAt: Date.now() };
                const oldLead = get().leads.find(l => l.id === id);

                // 📝 THE HOME-TO-HOME TRACKER: Log assignment if it changed
                if (data.assignedTo && data.assignedTo !== oldLead?.assignedTo) {
                    const newAgentName = get().team.find(m => m.id === data.assignedTo)?.name || 'Unknown Agent';
                    (updatedData as any).historyLog = arrayUnion({
                        date: new Date().toISOString(),
                        action: 'Assigned',
                        fromName: get().user?.name || 'System',
                        toName: newAgentName
                    });
                }

                updateDoc(doc(db, 'leads', id), updatedData).catch(err => console.error('[SYNC] Lead update failed:', err));
                // 🔔 INSTRUCTION 3: If lead is being reassigned, notify the new agent immediately
                if (data.assignedTo && data.assignedTo !== oldLead?.assignedTo) {
                    const lead = get().leads.find(l => l.id === id);
                    get().addFirestoreNotification(
                        data.assignedTo,
                        `📋 You have been assigned a new lead: ${lead?.name || 'Unknown'} by ${get().user?.name || 'Admin'}`
                    );
                }
                get().logAudit('UPDATE_LEAD', undefined, { leadId: id, updates: data });
            },

            deleteLead: (id) => {
                set((state) => ({
                    leads: state.leads.map((l) => l.id === id ? { ...l, status: 'Trash', deletedAt: Date.now() } : l)
                }));
                updateDoc(doc(db, 'leads', id), { status: 'Trash', deletedAt: Date.now() }).catch(err => console.error('[SYNC] Lead trash failed:', err));
                get().logAudit('TRASH_LEAD', undefined, { leadId: id });
            },

            restoreLead: (id) => {
                set((state) => ({
                    leads: state.leads.map((l) => l.id === id ? { ...l, status: 'New', deletedAt: undefined } : l)
                }));
                updateDoc(doc(db, 'leads', id), { status: 'New', deletedAt: null }).catch(err => console.error('[SYNC] Lead restore failed:', err));
            },

            permanentDeleteLead: (id) => {
                set((state) => ({
                    leads: state.leads.filter((l) => l.id !== id)
                }));
                deleteDoc(doc(db, 'leads', id)).catch(err => console.error('[SYNC] Lead permanent delete failed:', err));
                get().logAudit('DELETE_LEAD_PERMANENT', undefined, { leadId: id });
            },

            assignLeads: (leadIds, agentId, agentName) => {
                set((s) => {
                    const count = leadIds.length;
                    return {
                        leads: s.leads.map(l => leadIds.includes(l.id) ? { ...l, assignedTo: agentId, assignedName: agentName, updatedAt: Date.now() } : l),
                        notifications: [{
                            id: Math.random().toString(36).substr(2, 9),
                            text: `📋 ${count} Leads Assigned to ${agentName}`,
                            read: false,
                            date: new Date().toISOString()
                        }, ...s.notifications]
                    };
                });
                // Sync each assigned lead to Firestore so the agent's onSnapshot query picks them up
                leadIds.forEach(leadId => {
                    const historyEntry = {
                        date: new Date().toISOString(),
                        action: 'Assigned',
                        fromName: get().user?.name || 'System',
                        toName: agentName
                    };
                    updateDoc(doc(db, 'leads', leadId), { 
                        assignedTo: agentId, 
                        assignedName: agentName, 
                        updatedAt: Date.now(),
                        historyLog: arrayUnion(historyEntry)
                    }).catch(err => console.error('[SYNC] Lead assign failed:', err));
                });
                // 🔔 Push a real Firestore notification so the agent's bell rings in real-time
                const count = leadIds.length;
                get().addFirestoreNotification(agentId, `📋 ${count} new lead${count > 1 ? 's' : ''} assigned to you by ${get().user?.name || 'Admin'}`);
                get().logAudit('ASSIGN_LEADS', agentId, { leadIds, agentName });
            },

            addQuickNote: (leadId, note) => {
                const state = get();
                const userName = state.user?.name || 'System';
                const newNoteObj = {
                    text: note,
                    author: userName,
                    timestamp: Date.now()
                };

                set((s) => ({
                    leads: s.leads.map(l => {
                        if (l.id !== leadId) return l;
                        let currentNotes: any[] = [];
                        if (Array.isArray(l.notes)) {
                            currentNotes = l.notes;
                        } else if (typeof l.notes === 'string' && l.notes.trim()) {
                            currentNotes = l.notes.split('\n').filter(Boolean).map(text => ({
                                text,
                                author: 'Legacy Note',
                                timestamp: l.createdAt || Date.now()
                            }));
                        }
                        return { ...l, notes: [...currentNotes, newNoteObj], updatedAt: Date.now() };
                    })
                }));

                try {
                    updateDoc(doc(db, 'leads', leadId), {
                        notes: arrayUnion(newNoteObj),
                        updatedAt: Date.now()
                    });
                } catch (err) {
                    console.error('[SYNC] Quick note write failed:', err);
                }
            },

            markNotificationRead: (id) => {
                set(s => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n) }));
                updateDoc(doc(db, 'notifications', id), { read: true }).catch(err => console.error('[SYNC] Notification read failed:', err));
            },

            clearNotifications: async () => {
                const state = get();
                const notifsToDelete = [...state.notifications];
                set({ notifications: [] });

                // BULLETPROOF NOTIFICATIONS: Execute a writeBatch
                if (notifsToDelete.length === 0) return;
                try {
                    const batch = writeBatch(db);
                    notifsToDelete.forEach(n => {
                        batch.delete(doc(db, 'notifications', n.id));
                    });
                    await batch.commit();
                    console.log('[SYNC] ✅ writeBatch successfully cleared notifications.');
                } catch (err) {
                    console.error('[SYNC] writeBatch notification clear failed:', err);
                }
            },

            addProperty: (p) => {
                const s = get();
                // Ensure ID exists for real-time sync later if needed
                const cmpId = s.user?.companyId;
                const newProperty: any = { ...p, id: p.id || Math.random().toString(36).substr(2, 9), createdAt: Date.now() };
                if (cmpId) newProperty.companyId = cmpId;

                set({ properties: [newProperty, ...s.properties] });

                // Firestore write
                if (cmpId) {
                    setDoc(doc(db, 'properties', newProperty.id), newProperty).catch(err => console.error('[SYNC] Property write failed:', err));
                } else {
                    console.error('[SYNC] Blocked: No Company ID found for Property');
                }

                // Smart Inventory Match algorithm against A-Grade Leads
                try {
                    const aGradeLeads = s.leads.filter((l: any) => s.calculateLeadScore(l) === 'A');
                    aGradeLeads.forEach((lead: any) => {
                        const leadLoc = (lead.targetLocation || '').toLowerCase();
                        const propLoc = (newProperty.location || '').toLowerCase();
                        if (leadLoc && propLoc.includes(leadLoc) && lead.maxBudget && newProperty.price <= lead.maxBudget) {
                            // Match Found!
                            const msg = `🌟 High-Value Match: ${newProperty.name} matches A-Grade client ${lead.name}'s criteria!`;
                            if (lead.assignedTo) {
                                get().addFirestoreNotification(lead.assignedTo, msg);
                            } else {
                                // Send to all admins if unassigned
                                const admins = s.team.filter(m => m.role === 'ceo' || m.role === 'admin');
                                admins.forEach(admin => {
                                    get().addFirestoreNotification(admin.id, msg);
                                });
                            }
                            get().logAudit('High-Value Match Found', undefined, { propertyId: newProperty.id, leadId: lead.id, leadName: lead.name });
                        }
                    });
                } catch (e) {
                    console.error('[SYNC] Smart Inventory Match failed to run:', e);
                }
            },

            updateProperty: (id, data) => set((s) => {
                const oldProp = s.properties.find(p => p.id === id);
                if (!oldProp) return s;

                // Commission Logic for Property Sale
                let newTeam = s.team;
                if (data.status === 'Sold' && oldProp.status !== 'Sold') {
                    const price = data.price ?? oldProp.price;
                    const rate = data.commissionRate ?? oldProp.commissionRate ?? 2;
                    const commission = price * (rate / 100);

                    // Assign commission to the agent listed on the property
                    const agentId = data.agentId ?? oldProp.agentId;
                    if (agentId) {
                        newTeam = s.team.map(m => m.id === agentId
                            ? { ...m, totalSales: (m.totalSales || 0) + price, commissionEarned: (m.commissionEarned || 0) + commission }
                            : m
                        );
                    }
                }

                return {
                    properties: s.properties.map(p => p.id === id ? { ...p, ...data, updatedAt: Date.now() } : p),
                    team: newTeam
                };
            }),

            deleteProperty: (id) => set((s) => ({ properties: s.properties.filter(p => p.id !== id) })),

            addTask: (t) => {
                const s = get();
                const cmpId = s.user?.companyId;

                const newTask: any = {
                    ...t,
                    id: t.id || Math.random().toString(36).substr(2, 9),
                    createdAt: Date.now(),
                    history: [{
                        id: Math.random().toString(36).substr(2, 9),
                        action: 'Created',
                        userId: s.user?.id || 'system',
                        userName: s.user?.name || 'System',
                        timestamp: Date.now(),
                        note: 'Task initialized'
                    }],
                    comments: []
                };

                if (cmpId) newTask.companyId = cmpId;

                set({ tasks: [newTask, ...s.tasks] });

                // Firestore write
                if (cmpId) {
                    setDoc(doc(db, 'tasks', newTask.id), newTask, { merge: true }).catch(err => console.error('[SYNC] Task write failed:', err));
                } else {
                    console.error('[SYNC] Blocked: No Company ID found for Task');
                }
                // If assigned to another user, write a Firestore notification for them
                if (newTask.assignedTo && newTask.assignedTo !== s.user?.id) {
                    get().addFirestoreNotification(newTask.assignedTo, `📌 New Task Assigned: ${newTask.title}`);
                }
                get().logAudit('CREATE_TASK', undefined, { taskId: newTask.id, title: newTask.title });
            },

            updateTaskStatus: (id, status, note) => {
                const s = get();
                const updatedTasks = s.tasks.map(t => t.id === id ? {
                    ...t,
                    status,
                    completed: status === 'Completed',
                    updatedAt: Date.now(),
                    history: [...(t.history || []), {
                        id: Math.random().toString(36).substr(2, 9),
                        action: `Status changed to ${status}`,
                        userId: s.user?.id || 'system',
                        userName: s.user?.name || 'System',
                        timestamp: Date.now(),
                        note
                    }]
                } : t);
                set({ tasks: updatedTasks });
                const updatedTask = updatedTasks.find(t => t.id === id);
                if (updatedTask) {
                    setDoc(doc(db, 'tasks', id), { ...updatedTask }, { merge: true }).catch(err => console.error('[SYNC] Task status update failed:', err));
                    get().logAudit(`UPDATE_TASK_${status.toUpperCase().replace(' ', '_')}`, undefined, { taskId: id, note });
                }
            },

            addTaskComment: (id, text) => {
                const s = get();
                const updatedTasks = s.tasks.map(t => t.id === id ? {
                    ...t,
                    comments: [...(t.comments || []), {
                        id: Math.random().toString(36).substr(2, 9),
                        userId: s.user?.id || 'system',
                        userName: s.user?.name || 'System',
                        text,
                        timestamp: Date.now()
                    }],
                    history: [...(t.history || []), {
                        id: Math.random().toString(36).substr(2, 9),
                        action: 'Comment added',
                        userId: s.user?.id || 'system',
                        userName: s.user?.name || 'System',
                        timestamp: Date.now()
                    }]
                } : t);
                set({ tasks: updatedTasks });
                const updatedTask = updatedTasks.find(t => t.id === id);
                if (updatedTask) {
                    setDoc(doc(db, 'tasks', id), { ...updatedTask }, { merge: true }).catch(err => console.error('[SYNC] Task comment write failed:', err));
                    get().logAudit('ADD_TASK_COMMENT', undefined, { taskId: id, text });
                }
            },

            toggleTask: (id) => {
                const s = get();
                const task = s.tasks.find(t => t.id === id);
                if (!task) return;
                const newStatus: Task['status'] = task.status === 'Completed' ? 'Pending' : 'Completed';
                const updatedTasks = s.tasks.map(t => t.id === id ? {
                    ...t,
                    status: newStatus,
                    completed: !t.completed,
                    updatedAt: Date.now(),
                    history: [...(t.history || []), {
                        id: Math.random().toString(36).substr(2, 9),
                        action: `Marked as ${newStatus}`,
                        userId: s.user?.id || 'system',
                        userName: s.user?.name || 'System',
                        timestamp: Date.now()
                    }]
                } : t);
                set({ tasks: updatedTasks });
                const updatedTask = updatedTasks.find(t => t.id === id);
                if (updatedTask) {
                    setDoc(doc(db, 'tasks', id), { ...updatedTask }, { merge: true }).catch(err => console.error('[SYNC] Task toggle failed:', err));
                    get().logAudit(`TOGGLE_TASK_${newStatus.toUpperCase()}`, undefined, { taskId: id });
                }
            },

            deleteTask: (id) => {
                const s = get();
                const updatedTasks = s.tasks.filter(t => t.id !== id);
                set({ tasks: updatedTasks });
                deleteDoc(doc(db, 'tasks', id)).catch(err => console.error('[SYNC] Task delete failed:', err));
                get().logAudit('DELETE_TASK', undefined, { taskId: id });
            },

            runDailyTaskSweep: async () => {
                const s = get();
                try {
                    const lastSweep = localStorage.getItem('dcapital_last_task_sweep');
                    const today = new Date().toISOString().split('T')[0];
                    if (lastSweep === today) return; // Already swept today

                    const now = Date.now();
                    const fortyEightHoursMs = 48 * 60 * 60 * 1000;
                    let sweepCount = 0;

                    const updatedTasks = s.tasks.map(t => {
                        if (!t.completed && t.dueDate && (now - t.dueDate) > fortyEightHoursMs && !t.title.includes('[URGENT]')) {
                            sweepCount++;
                            const updatedTask = {
                                ...t,
                                title: `[URGENT] ${t.title}`,
                                priority: 'High' as const,
                                updatedAt: now
                            };
                            updateDoc(doc(db, 'tasks', t.id), {
                                title: updatedTask.title,
                                priority: 'High',
                                updatedAt: now
                            }).catch(err => console.error('[SYNC] Task sweep update failed:', err));
                            return updatedTask;
                        }
                        return t;
                    });

                    if (sweepCount > 0) {
                        set({ tasks: updatedTasks });
                        const admins = s.team.filter(m => m.role === 'ceo' || m.role === 'admin');
                        admins.forEach(admin => {
                            get().addFirestoreNotification(admin.id, `⚠️ Task Sweep: ${sweepCount} overdue task(s) auto-flagged as High Priority.`);
                        });
                        get().logAudit('AUTO_TASK_SWEEP', undefined, { flaggedCount: sweepCount });
                    }
                    localStorage.setItem('dcapital_last_task_sweep', today);
                } catch (e) {
                    console.error('[SYNC] Task sweep failed:', e);
                }
            },

            // COMMS HUB
            fetchMessageTemplates: async () => {
                try {
                    const snapshot = await getDocs(collection(db, 'message_templates'));
                    const templates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MessageTemplate));
                    set({ messageTemplates: templates });
                } catch (err) {
                    console.error('[SYNC] Failed to fetch message templates', err);
                }
            },
            saveMessageTemplate: async (template) => {
                try {
                    const cmpId = get().user?.companyId;
                    if (!cmpId) throw new Error('No company ID found');

                    const id = template.id || Math.random().toString(36).substr(2, 9);
                    const newTemplate = { ...template, id, companyId: cmpId } as MessageTemplate;
                    const docRef = doc(db, 'message_templates', id);
                    await setDoc(docRef, newTemplate, { merge: true });
                    set(s => ({
                        messageTemplates: s.messageTemplates.find(t => t.id === id)
                            ? s.messageTemplates.map(t => t.id === id ? newTemplate : t)
                            : [...s.messageTemplates, newTemplate]
                    }));
                    toast.success('Template saved');
                } catch (err) {
                    console.error('[SYNC] Failed to save message template', err);
                    toast.error('Failed to save template');
                }
            },
            deleteMessageTemplate: async (id) => {
                try {
                    await deleteDoc(doc(db, 'message_templates', id));
                    set(s => ({ messageTemplates: s.messageTemplates.filter(t => t.id !== id) }));
                    toast.success('Template deleted');
                } catch (err) {
                    console.error('[SYNC] Failed to delete message template', err);
                }
            },

            // AI LEAD SCORING ENGINE
            calculateLeadScore: (lead) => {
                const primeLocations = ['jlt', 'palm jumeirah', 'downtown', 'dubai marina', 'city walk', 'business bay', 'difc', 'jumeirah'];
                const budget = lead.budget || lead.maxBudget || 0;
                const location = (lead.targetLocation || '').toLowerCase();
                const isPrime = primeLocations.some(loc => location.includes(loc));

                if (budget >= 2000000 && isPrime) return 'A';
                if (budget >= 1000000) return 'B';
                return 'C';
            },

            toggleSmartNurture: (leadId) => {
                const lead = get().leads.find(l => l.id === leadId);
                if (!lead) return;
                const newValue = !lead.smartNurture;
                set(s => ({
                    leads: s.leads.map(l => l.id === leadId ? { ...l, smartNurture: newValue } : l)
                }));
                updateDoc(doc(db, 'leads', leadId), { smartNurture: newValue }).catch(err => console.error('[SYNC] Nurture toggle failed:', err));
                toast.success(newValue ? '🤖 Smart Nurture Enabled' : 'Smart Nurture Disabled');
            },

            importData: (data) => set({ leads: data.leads, properties: data.properties, tasks: data.tasks, activities: data.activities }),

            addImportFile: (file) => {
                const cmpId = get().user?.companyId;
                const fileWithCompany = cmpId ? { ...file, companyId: cmpId } : file;
                set((s) => ({ importFiles: [fileWithCompany, ...s.importFiles] }));
                // Persist to Firestore so it's available cross-device
                if (cmpId) {
                    setDoc(doc(db, 'importFiles', file.id), fileWithCompany, { merge: true })
                        .catch(err => console.error('[SYNC] importFile write failed:', err));
                }
            },
            
            deleteBatch: async (batchId) => {
                const s = get();
                const leadsToDelete = s.leads.filter(l => l.fileId === batchId);
                const batch = writeBatch(db);
                leadsToDelete.forEach(l => {
                    batch.delete(doc(db, 'leads', l.id));
                });
                await batch.commit();
                // Also remove the importFiles Firestore record
                deleteDoc(doc(db, 'importFiles', batchId)).catch(err => console.error('[SYNC] importFile delete failed:', err));
                set({ 
                    leads: s.leads.filter(l => l.fileId !== batchId),
                    importFiles: s.importFiles.filter(f => f.id !== batchId)
                });
                get().logAudit('DELETE_BATCH_FILE', undefined, { batchId, leadCount: leadsToDelete.length });
            },
            
            bulkAssignFile: async (batchId, agentId, agentName) => {
                const s = get();
                const leadsToUpdate = s.leads.filter(l => l.fileId === batchId);
                const batch = writeBatch(db);
                leadsToUpdate.forEach(l => {
                    batch.update(doc(db, 'leads', l.id), { assignedTo: agentId, assignedName: agentName });
                });
                await batch.commit();
                
                set({
                    leads: s.leads.map(l => l.fileId === batchId ? { ...l, assignedTo: agentId, assignedName: agentName } : l)
                });
            },

            resetSystem: async () => {
                const cmpId = get().user?.companyId;
                if (!cmpId) return;

                try {
                    // Wipe leads for this company
                    const leadsSnap = await getDocs(query(collection(db, 'leads'), where('companyId', '==', cmpId)));
                    const taskSnap = await getDocs(query(collection(db, 'tasks'), where('companyId', '==', cmpId)));
                    const propsSnap = await getDocs(query(collection(db, 'properties'), where('companyId', '==', cmpId)));

                    const batch: Promise<void>[] = [];
                    leadsSnap.forEach(d => batch.push(deleteDoc(doc(db, 'leads', d.id))));
                    taskSnap.forEach(d => batch.push(deleteDoc(doc(db, 'tasks', d.id))));
                    propsSnap.forEach(d => batch.push(deleteDoc(doc(db, 'properties', d.id))));

                    await Promise.all(batch);
                    set({ leads: [], properties: [], tasks: [], activities: [] });
                    console.log('[RESET] Factory reset complete — all data wiped for', cmpId);
                } catch (error) {
                    console.error('[RESET] Factory reset failed:', error);
                }
            },

            resetLeads: () => set({ leads: [] }),

            resetProperties: () => set({ properties: [] })
        }),
        {
            name: 'dcapital-ultimate-db',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => Object.fromEntries(
                Object.entries(state).filter(([key]) => key !== 'isAuthLoading')
            )
        }
    )
);
