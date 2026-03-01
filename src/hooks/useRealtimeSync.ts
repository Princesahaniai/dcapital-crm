import { useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useStore } from '../store';
import toast from 'react-hot-toast';
import { getVisibleLeads } from '../utils/permissions';

/**
 * Real-time sync hook — subscribes to Firestore onSnapshot listeners
 * for leads, tasks, team (users), and notifications collections.
 * 
 * - CEO/Admin roles see all leads & tasks
 * - Agents/Managers only see documents assigned to them
 * - Notifications are per-user (userId === currentUser.id)
 * - Fires toast notifications when new tasks or leads are assigned
 */
export function useRealtimeSync() {
    const user = useStore((s) => s.user);
    const setLeads = useStore((s) => s.setLeads);
    const setTasks = useStore((s) => s.setTasks);
    const setTeamFromSnapshot = useStore((s) => s.setTeamFromSnapshot);
    const setNotifications = useStore((s) => s.setNotifications);

    // Track known IDs to detect *new* documents for notification purposes
    const knownLeadIds = useRef<Set<string>>(new Set());
    const knownTaskIds = useRef<Set<string>>(new Set());
    const isFirstSnapshot = useRef({ leads: true, tasks: true });

    useEffect(() => {
        if (!user) return;

        const unsubscribes: Unsubscribe[] = [];
        const canSeeAll = user.role === 'ceo' || user.role === 'admin';
        const cmpId = user.companyId;

        if (!cmpId) {
            console.warn('[REALTIME] 🛑 No companyId found for user. Real-time sync blocked to prevent data leakage.');
            return;
        }

        // ─── LEADS LISTENER ─────────────────────────────────────
        try {
            const leadsQuery = user.role === 'agent'
                ? query(collection(db, 'leads'), where('companyId', '==', cmpId), where('assignedTo', '==', user.id))
                : query(collection(db, 'leads'), where('companyId', '==', cmpId));

            const unsubLeads = onSnapshot(leadsQuery, (snapshot) => {
                let rawLeads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

                // STRICT RBAC ENFORCEMENT
                const team = useStore.getState().team;
                const leads = getVisibleLeads(user, rawLeads, team);

                setLeads(leads);

                // Detect new leads assigned to current user (skip first snapshot)
                if (isFirstSnapshot.current.leads) {
                    leads.forEach(l => knownLeadIds.current.add(l.id));
                    isFirstSnapshot.current.leads = false;
                } else {
                    snapshot.docChanges().forEach(change => {
                        if (change.type === 'added' && !knownLeadIds.current.has(change.doc.id)) {
                            const newLead = change.doc.data();
                            if (newLead.assignedTo === user.id) {
                                toast(`📋 New Lead Assigned: ${newLead.name || 'Unknown'}`, { icon: '🔔', duration: 5000 });
                            }
                        }
                        knownLeadIds.current.add(change.doc.id);
                    });
                }
            }, (error) => {
                console.error('[REALTIME] Leads listener error:', error);
            });
            unsubscribes.push(unsubLeads);
        } catch (err) {
            console.error('[REALTIME] Failed to set up leads listener:', err);
        }

        // ─── TASKS LISTENER ─────────────────────────────────────
        try {
            const tasksQuery = user.role === 'agent'
                ? query(collection(db, 'tasks'), where('companyId', '==', cmpId), where('assignedTo', '==', user.id))
                : query(collection(db, 'tasks'), where('companyId', '==', cmpId));

            const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
                let rawTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

                // STRICT RBAC ENFORCEMENT
                const tasks = rawTasks.filter(t => {
                    if (user.role === 'ceo' || user.role === 'admin') return true;
                    if (user.role === 'manager') return t.assignedTo === user.id || t.assignedBy === user.id;
                    return t.assignedTo === user.id; // Fallback for agent or viewer
                });

                setTasks(tasks);
                useStore.getState().runDailyTaskSweep();

                // Detect new tasks assigned to current user (skip first snapshot)
                if (isFirstSnapshot.current.tasks) {
                    tasks.forEach(t => knownTaskIds.current.add(t.id));
                    isFirstSnapshot.current.tasks = false;
                } else {
                    snapshot.docChanges().forEach(change => {
                        if (change.type === 'added' && !knownTaskIds.current.has(change.doc.id)) {
                            const newTask = change.doc.data();
                            if (newTask.assignedTo === user.id) {
                                toast(`📌 New Task: ${newTask.title || 'Untitled'}`, { icon: '🔔', duration: 5000 });
                            }
                        }
                        knownTaskIds.current.add(change.doc.id);
                    });
                }
            }, (error) => {
                console.error('[REALTIME] Tasks listener error:', error);
            });
            unsubscribes.push(unsubTasks);
        } catch (err) {
            console.error('[REALTIME] Failed to set up tasks listener:', err);
        }

        // ─── TEAM (USERS) LISTENER ──────────────────────────────
        try {
            const teamQuery = query(collection(db, 'users'), where('companyId', '==', cmpId));
            const unsubTeam = onSnapshot(teamQuery, (snapshot) => {
                const team = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
                setTeamFromSnapshot(team);
            }, (error) => {
                console.error('[REALTIME] Team listener error:', error);
            });
            unsubscribes.push(unsubTeam);
        } catch (err) {
            console.error('[REALTIME] Failed to set up team listener:', err);
        }

        // ─── NOTIFICATIONS LISTENER (Firestore-backed) ─────────
        try {
            const notifsQuery = query(
                collection(db, 'notifications'),
                where('companyId', '==', cmpId),
                where('userId', '==', user.id)
            );

            const unsubNotifs = onSnapshot(notifsQuery, (snapshot) => {
                const notifs = snapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() } as any))
                    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setNotifications(notifs);
            }, (error) => {
                console.error('[REALTIME] Notifications listener error:', error);
            });
            unsubscribes.push(unsubNotifs);
        } catch (err) {
            console.error('[REALTIME] Failed to set up notifications listener:', err);
        }

        console.log(`[REALTIME] ✅ Real-time sync active for ${user.email} (${user.role})`);

        // Cleanup on unmount or user change
        return () => {
            unsubscribes.forEach(unsub => unsub());
            knownLeadIds.current.clear();
            knownTaskIds.current.clear();
            isFirstSnapshot.current = { leads: true, tasks: true };
            console.log('[REALTIME] 🔌 Listeners disconnected');
        };
    }, [user?.id, user?.role]);
}
