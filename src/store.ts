import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Lead, Property, Task, Activity, User } from './types';
import { auth, db } from './firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

interface TeamMember extends User {
    id: string;
    status: 'Active' | 'Inactive';
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
    passwordResetTokens: Record<string, { token: string; email: string; expires: number }>;

    // Auth Actions
    login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
    signup: (email: string, password: string, name: string) => Promise<boolean>;
    logout: () => void;
    resetPasswordRequest: (email: string) => boolean;
    changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
    resetUserPassword: (userId: string, newPassword: string) => boolean;
    checkSessionExpiry: () => void;

    // Data Actions
    updateProfile: (name: string, email: string) => void;
    addLead: (l: ExtendedLead) => void;
    addBulkLeads: (leads: ExtendedLead[]) => { success: number; failed: number };
    updateLead: (id: string, data: Partial<ExtendedLead>) => void;
    deleteLead: (id: string) => void;
    assignLeads: (leadIds: string[], agentId: string, agentName: string) => void;
    addQuickNote: (leadId: string, note: string) => void;
    addProperty: (p: Property) => void;
    updateProperty: (id: string, data: Partial<Property>) => void;
    deleteProperty: (id: string) => void;
    addTask: (t: Task) => void;
    toggleTask: (id: string) => void;
    deleteTask: (id: string) => void;
    markNotificationRead: (id: string) => void;
    clearNotifications: () => void;
    importData: (data: any) => void;
    resetSystem: () => void;
    resetLeads: () => void;
    resetProperties: () => void;
    addTeamMember: (member: TeamMember) => void;
    removeTeamMember: (id: string) => void;
    addActivity: (a: Activity) => void;
    addNotification: (text: string) => void;
}

export const useStore = create<Store>()(
    persist(
        (set, get) => ({
            user: null,
            leads: [], // Production: Empty state
            loginTimestamp: null,
            rememberMe: false,
            passwordResetTokens: {},
            properties: [], // Production: Empty state
            tasks: [], // Production: Empty state
            activities: [], // Production: Empty state
            team: [], // Production: Empty state - Only CEO and Admin via login
            notifications: [], // Production: Empty state

            login: async (email, password, rememberMe = false) => {
                // 🛡️ DEV BYPASS
                if (password === 'admin' && (email === 'admin@dcapitalrealestate.com' || email === 'ajay@dcapitalrealestate.com')) {
                    const role = email.startsWith('ajay') ? 'ceo' : 'admin';
                    const name = email.startsWith('ajay') ? 'Ajay' : 'Admin User';
                    set({
                        user: {
                            id: 'dev-bypass-' + role,
                            email,
                            name,
                            role: role as any
                        },
                        loginTimestamp: Date.now(),
                        rememberMe
                    });
                    return true;
                }

                try {
                    const userCredential = await signInWithEmailAndPassword(auth, email, password);
                    const user = userCredential.user;
                    set({
                        user: { id: user.uid, email: user.email || '', name: user.displayName || 'Admin', role: 'ceo' } as any,
                        loginTimestamp: Date.now(),
                        rememberMe
                    });
                    return true;
                } catch (error) {
                    // Login failed - error handled by caller
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

            resetPasswordRequest: (email) => { return true; },

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

                const now = Date.now();
                const twentyFourHours = 24 * 60 * 60 * 1000;

                // If not "Remember Me" and session expired, logout
                if (!state.rememberMe && (now - state.loginTimestamp) > twentyFourHours) {
                    get().logout();
                }
            },

            updateProfile: (name, email) => set((s) => ({ user: s.user ? { ...s.user, name, email } : null })),
            addLead: (l) => set((s) => {
                if (s.leads.some(existing => existing.id === l.id)) return s;
                return { leads: [l, ...s.leads] };
            }),
            addBulkLeads: (newLeads) => set((s) => ({ leads: [...newLeads, ...s.leads] })),

            // Helper to add notification
            addNotification: (text) => set((s) => ({
                notifications: [{
                    id: Math.random().toString(36).substr(2, 9),
                    text,
                    read: false,
                    date: new Date().toISOString()
                }, ...s.notifications]
            })),

            updateLead: (id, data) => set((s) => {
                const oldLead = s.leads.find(l => l.id === id);
                if (!oldLead) return s;

                // Commission Logic: If status changes to 'Closed', add commission
                let commissionUpdate = {};
                let newTeam = s.team;
                let newNotifications = s.notifications;

                if (data.status === 'Closed' && oldLead.status !== 'Closed') {
                    // Use the new budget if provided, otherwise the old one
                    const budget = data.budget ?? oldLead.budget ?? 0;
                    const commission = budget * 0.02;
                    commissionUpdate = { commission, commissionPaid: false };

                    // Update Agent Stats (Leaderboard)
                    if (oldLead.assignedTo) {
                        newTeam = s.team.map(m => m.id === oldLead.assignedTo
                            ? { ...m, totalSales: (m.totalSales || 0) + budget, commissionEarned: (m.commissionEarned || 0) + commission }
                            : m
                        );
                    }

                    // Notification Logic
                    newNotifications = [{
                        id: Math.random().toString(36).substr(2, 9),
                        text: `🎉 Deal Closed! ${oldLead.name} - AED ${budget.toLocaleString()}`,
                        read: false,
                        date: new Date().toISOString()
                    }, ...s.notifications];

                } else if (data.status && data.status !== 'Closed' && oldLead.status === 'Closed') {
                    // Reset commission if reopened
                    commissionUpdate = { commission: 0, commissionPaid: false };
                }

                return {
                    leads: s.leads.map(l => l.id === id ? { ...l, ...data, ...commissionUpdate, updatedAt: Date.now() } : l),
                    team: newTeam,
                    notifications: newNotifications
                };
            }),

            deleteLead: (id) => set((s) => ({ leads: s.leads.filter(l => l.id !== id) })),
            assignLeads: (leadIds, agentId, agentName) => set((s) => {
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
            }),
            addQuickNote: (leadId, note) => set((s) => ({ leads: s.leads.map(l => l.id === leadId ? { ...l, notes: l.notes ? l.notes + '\n' + note : note, updatedAt: Date.now() } : l) })),
            markNotificationRead: (id) => set(s => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n) })),
            clearNotifications: () => set({ notifications: [] }),
            addProperty: (p) => set((s) => ({ properties: [p, ...s.properties] })),
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
            addTask: (t) => set((s) => ({ tasks: [{ ...t, createdAt: Date.now(), completed: t.status === 'done' }, ...s.tasks] })),
            toggleTask: (id) => set((s) => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, status: t.status === 'done' ? 'todo' : 'done', completed: !t.completed } : t) })),
            deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter(t => t.id !== id) })),
            importData: (data) => set({ leads: data.leads, properties: data.properties, tasks: data.tasks, activities: data.activities }),
            resetSystem: () => set({ leads: [], properties: [], tasks: [], activities: [] }),
            resetLeads: () => set({ leads: [] }),
            resetProperties: () => set({ properties: [] }),
            addActivity: (a) => set((s) => ({ activities: [a, ...s.activities] })),
            addTeamMember: (m) => set((s) => ({ team: [...s.team, m] })),
            removeTeamMember: (id) => set((s) => ({ team: s.team.filter(t => t.id !== id) }))
        }),
        { name: 'dcapital-ultimate-db', storage: createJSONStorage(() => localStorage) }
    )
);
