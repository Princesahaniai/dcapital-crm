import { useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, or, type Unsubscribe } from 'firebase/firestore';
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
    const knownNotifIds = useRef<Set<string>>(new Set());
    const isFirstSnapshot = useRef({ leads: true, tasks: true, notifs: true });

    useEffect(() => {
        if (!user) return;

        const unsubscribes: Unsubscribe[] = [];
        // 🛡️ Fallback: always provide a company ID so imports & sync never block
        const cmpId = user.companyId || 'd-capital-main';
        if (!user.companyId) {
            console.warn('[REALTIME] ⚠️ No companyId on user — using fallback d-capital-main');
        }

        // ─── LEADS LISTENER ─────────────────────────────────────
        try {
            // 🛡️ MANAGER TRACKING OVERRIDE: Managers, CEOs, and Admins must query ALL leads within their company.
            // Only agents are restricted to filtering by assignedTo at the query level.
            const userRole = (user.role || '').toLowerCase();
            let leadsQuery;
            
            if (userRole === 'ceo' || userRole === 'admin') {
                leadsQuery = query(collection(db, 'leads'), where('companyId', '==', cmpId));
            } else if (userRole === 'manager') {
                leadsQuery = query(
                    collection(db, 'leads'), 
                    where('companyId', '==', cmpId),
                    or(where('assignedTo', '==', user.id), where('delegatedBy', '==', user.id))
                );
            } else {
                leadsQuery = query(collection(db, 'leads'), where('companyId', '==', cmpId), where('assignedTo', '==', user.id));
            }

            const unsubLeads = onSnapshot(leadsQuery, { includeMetadataChanges: true }, (snapshot) => {
                const fromCache = snapshot.metadata.fromCache;
                if (fromCache) console.log('[REALTIME] 📦 Leads served from offline cache');
                let rawLeads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

                // STRICT RBAC ENFORCEMENT
                const team = useStore.getState().team;
                const leads = getVisibleLeads(user, rawLeads, team);

                setLeads(leads);

                // Detect new leads assigned to current user (skip first snapshot)
                if (isFirstSnapshot.current.leads) {
                    leads.forEach(l => knownLeadIds.current.add(l.id));
                    isFirstSnapshot.current.leads = false;
                    useStore.setState({ isDataLoading: false });
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

            const unsubTasks = onSnapshot(tasksQuery, { includeMetadataChanges: true }, (snapshot) => {
                const fromCache = snapshot.metadata.fromCache;
                if (fromCache) console.log('[REALTIME] 📦 Tasks served from offline cache');
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

                // 🔔 Detect genuinely new notifications and fire the audio chime directly
                if (isFirstSnapshot.current.notifs) {
                    notifs.forEach((n: any) => knownNotifIds.current.add(n.id));
                    isFirstSnapshot.current.notifs = false;
                } else {
                    snapshot.docChanges().forEach(change => {
                        if (change.type === 'added' && !knownNotifIds.current.has(change.doc.id)) {
                            knownNotifIds.current.add(change.doc.id);
                            // Fire audio chime directly — bypasses the App.tsx length-comparison bug
                            try {
                                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                                const osc1 = audioCtx.createOscillator();
                                const gain1 = audioCtx.createGain();
                                osc1.type = 'sine';
                                osc1.frequency.setValueAtTime(880, audioCtx.currentTime);
                                gain1.gain.setValueAtTime(0.12, audioCtx.currentTime);
                                gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
                                osc1.connect(gain1);
                                gain1.connect(audioCtx.destination);
                                osc1.start();
                                osc1.stop(audioCtx.currentTime + 0.6);
                                setTimeout(() => {
                                    const osc2 = audioCtx.createOscillator();
                                    const gain2 = audioCtx.createGain();
                                    osc2.type = 'sine';
                                    osc2.frequency.setValueAtTime(1108.73, audioCtx.currentTime);
                                    gain2.gain.setValueAtTime(0.06, audioCtx.currentTime);
                                    gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
                                    osc2.connect(gain2);
                                    gain2.connect(audioCtx.destination);
                                    osc2.start();
                                    osc2.stop(audioCtx.currentTime + 0.4);
                                }, 50);
                            } catch (err) {
                                console.warn('[REALTIME] Audio chime failed:', err);
                            }
                        }
                    });
                }
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
            knownNotifIds.current.clear();
            isFirstSnapshot.current = { leads: true, tasks: true, notifs: true };
            console.log('[REALTIME] 🔌 Listeners disconnected');
        };
    }, [user?.id, user?.role]);
}
