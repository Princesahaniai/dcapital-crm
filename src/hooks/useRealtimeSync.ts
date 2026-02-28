import { useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useStore } from '../store';
import toast from 'react-hot-toast';

/**
 * Real-time sync hook — subscribes to Firestore onSnapshot listeners
 * for leads, tasks, and team (users) collections.
 * 
 * - CEO/Admin roles see all documents
 * - Agents/Managers only see documents assigned to them
 * - Fires toast notifications when new tasks or leads are assigned
 */
export function useRealtimeSync() {
    const user = useStore((s) => s.user);
    const setLeads = useStore((s) => s.setLeads);
    const setTasks = useStore((s) => s.setTasks);
    const setTeamFromSnapshot = useStore((s) => s.setTeamFromSnapshot);
    const addNotification = useStore((s) => s.addNotification);

    // Track known IDs to detect *new* documents for notification purposes
    const knownLeadIds = useRef<Set<string>>(new Set());
    const knownTaskIds = useRef<Set<string>>(new Set());
    const isFirstSnapshot = useRef({ leads: true, tasks: true });

    useEffect(() => {
        if (!user) return;

        const unsubscribes: Unsubscribe[] = [];
        const canSeeAll = user.role === 'ceo' || user.role === 'admin';

        // ─── LEADS LISTENER ─────────────────────────────────────
        try {
            const leadsQuery = canSeeAll
                ? query(collection(db, 'leads'))
                : query(collection(db, 'leads'), where('assignedTo', '==', user.id));

            const unsubLeads = onSnapshot(leadsQuery, (snapshot) => {
                const leads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
                setLeads(leads);

                // Detect new leads assigned to current user (skip first snapshot)
                if (isFirstSnapshot.current.leads) {
                    // Populate known IDs on first load
                    leads.forEach(l => knownLeadIds.current.add(l.id));
                    isFirstSnapshot.current.leads = false;
                } else {
                    snapshot.docChanges().forEach(change => {
                        if (change.type === 'added' && !knownLeadIds.current.has(change.doc.id)) {
                            const newLead = change.doc.data();
                            if (newLead.assignedTo === user.id) {
                                toast(`📋 New Lead Assigned: ${newLead.name || 'Unknown'}`, { icon: '🔔' });
                                addNotification(`📋 New Lead: ${newLead.name || 'Unknown'} — AED ${(newLead.budget || 0).toLocaleString()}`);
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
            const tasksQuery = canSeeAll
                ? query(collection(db, 'tasks'))
                : query(collection(db, 'tasks'), where('assignedTo', '==', user.id));

            const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
                const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
                setTasks(tasks);

                // Detect new tasks assigned to current user (skip first snapshot)
                if (isFirstSnapshot.current.tasks) {
                    tasks.forEach(t => knownTaskIds.current.add(t.id));
                    isFirstSnapshot.current.tasks = false;
                } else {
                    snapshot.docChanges().forEach(change => {
                        if (change.type === 'added' && !knownTaskIds.current.has(change.doc.id)) {
                            const newTask = change.doc.data();
                            if (newTask.assignedTo === user.id) {
                                toast(`📌 New Task: ${newTask.title || 'Untitled'}`, { icon: '🔔' });
                                addNotification(`📌 New Task Assigned: ${newTask.title || 'Untitled'}`);
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
            const unsubTeam = onSnapshot(collection(db, 'users'), (snapshot) => {
                const team = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
                setTeamFromSnapshot(team);
            }, (error) => {
                console.error('[REALTIME] Team listener error:', error);
            });
            unsubscribes.push(unsubTeam);
        } catch (err) {
            console.error('[REALTIME] Failed to set up team listener:', err);
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
