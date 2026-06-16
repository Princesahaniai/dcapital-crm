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
 * - Fires toast notifications AND native OS desktop notifications when new tasks or leads are assigned
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

    // ── REQUEST BROWSER NOTIFICATION PERMISSION ONCE ON MOUNT ──────────
    // We request permission as soon as a user is authenticated.
    // The browser will only show the consent dialog once; subsequent calls
    // are no-ops if permission was already granted or denied.
    useEffect(() => {
        if (!user) return;
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(perm => {
                console.log(`[NOTIF] Browser notification permission: ${perm}`);
            });
        }
    }, [user?.id]);

    useEffect(() => {
        if (!user) return;

        const unsubscribes: Unsubscribe[] = [];
        // 🛡️ Fallback: always provide a company ID so imports & sync never block
        const cmpId = user.companyId || 'd-capital-main';
        if (!user.companyId) {
            console.warn('[REALTIME] ⚠️ No companyId on user — using fallback d-capital-main');
        }

        // ─── LEADS LISTENER — STRICT RBAC ───────────────────────
        // 🔒 Privacy rules (enforced at the Firestore query level):
        //   CEO / Admin  → full company collection, no extra where clauses
        //   Manager      → only leads where assignedTo === uid OR delegatedBy === uid
        //   Agent (else) → only leads where assignedTo === uid (hard restriction)
        try {
            const userRole = (user.role || '').toLowerCase();
            let leadsQuery;

            if (userRole === 'ceo' || userRole === 'admin') {
                // CEO & Admin: unrestricted — fetch entire company lead collection
                leadsQuery = query(collection(db, 'leads'), where('companyId', '==', cmpId));
            } else if (userRole === 'manager') {
                // Manager: own assigned leads UNION leads they delegated out
                leadsQuery = query(
                    collection(db, 'leads'),
                    where('companyId', '==', cmpId),
                    or(where('assignedTo', '==', user.id), where('delegatedBy', '==', user.id))
                );
            } else {
                // Agent (or any unknown role): strictly only their own assigned leads
                leadsQuery = query(
                    collection(db, 'leads'),
                    where('assignedTo', '==', user.id)
                );
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
        // Problem: Users created without a companyId field are silently dropped
        // by a strict where('companyId', '==', cmpId) query.
        // Fix: Run TWO parallel snapshots — one for users WITH the correct companyId,
        // and a fallback that catches users whose companyId field is missing/unset.
        // Both streams are merged and deduplicated so ALL team members appear.
        try {
            const teamById = new Map<string, any>();

            const mergeTeam = () => {
                const merged = Array.from(teamById.values());
                setTeamFromSnapshot(merged);
                console.log(`[REALTIME] 👥 Team synced — ${merged.length} member(s) loaded`);
                if (merged.length === 0) {
                    console.warn('[REALTIME] ⚠️ Team is EMPTY — check Firestore users collection and companyId values');
                }
            };

            // Stream 1: users with matching companyId (the normal case)
            const teamQueryById = query(collection(db, 'users'), where('companyId', '==', cmpId));
            const unsubTeamById = onSnapshot(teamQueryById, (snapshot) => {
                snapshot.docs.forEach(d => teamById.set(d.id, { id: d.id, ...d.data() }));
                mergeTeam();
            }, (error) => {
                console.error('[REALTIME] Team (by companyId) listener error:', error);
            });
            unsubscribes.push(unsubTeamById);

            // Stream 2: fallback — fetch all users in the collection (catches missing companyId)
            // We filter client-side: keep only users whose companyId is missing, empty,
            // or matches our company so we don't bleed cross-company data.
            const teamQueryAll = query(collection(db, 'users'));
            const unsubTeamAll = onSnapshot(teamQueryAll, (snapshot) => {
                snapshot.docs.forEach(d => {
                    const data = d.data();
                    const userCompany = data.companyId || '';
                    // Include if: no companyId set (legacy user) OR matches our company
                    if (!userCompany || userCompany === cmpId) {
                        teamById.set(d.id, { id: d.id, ...data });
                    }
                });
                mergeTeam();
            }, (error) => {
                console.error('[REALTIME] Team (fallback all) listener error:', error);
            });
            unsubscribes.push(unsubTeamAll);

        } catch (err) {
            console.error('[REALTIME] Failed to set up team listener:', err);
        }

        // ─── NOTIFICATIONS LISTENER (Firestore-backed) ─────────
        try {
            const isAdminLike = user.role === 'ceo' || user.role === 'admin' || user.role === 'manager';

            // Admins/managers also receive 'Admin'-targeted notifications (e.g. when agents update leads)
            // We run two parallel queries and merge them client-side because Firestore doesn't support OR on different fields natively.
            const personalQuery = query(
                collection(db, 'notifications'),
                where('companyId', '==', cmpId),
                where('userId', '==', user.id)
            );

            // Accumulate results from both queries; deduplicate by id
            const allNotifs = new Map<string, any>();

            const mergeAndSet = () => {
                const merged = Array.from(allNotifs.values())
                    .sort((a: any, b: any) => (b.timestamp || new Date(b.date).getTime()) - (a.timestamp || new Date(a.date).getTime()));
                setNotifications(merged);
            };

            const handleSnapshot = (snapshot: any, source: string) => {
                snapshot.docs.forEach((d: any) => {
                    allNotifs.set(d.id, { id: d.id, ...d.data() });
                });

                mergeAndSet();

                // 🔔 Fire toasts for genuinely new notifications (skip first load)
                if (isFirstSnapshot.current.notifs && source === 'personal') {
                    // Seed known IDs on first snapshot
                    snapshot.docs.forEach((d: any) => knownNotifIds.current.add(d.id));
                    isFirstSnapshot.current.notifs = false;
                } else if (!isFirstSnapshot.current.notifs) {
                    snapshot.docChanges().forEach((change: any) => {
                        if (change.type === 'added' && !knownNotifIds.current.has(change.doc.id)) {
                            knownNotifIds.current.add(change.doc.id);
                            const data = change.doc.data();
                            const msg = data.message || data.text || 'New notification';
                            const nType = data.type || 'system';

                            // Choose icon based on type
                            const icon = nType === 'assignment' ? '📋' : nType === 'update' ? '📝' : nType === 'alert' ? '⚠️' : '🔔';

                            // Fire the toast
                            toast(msg, {
                                icon,
                                duration: 6000,
                                style: {
                                    background: '#1C1C1E',
                                    color: '#fff',
                                    border: '1px solid #333',
                                    fontSize: '13px',
                                    maxWidth: '380px',
                                },
                            });

                            // ── NATIVE OS DESKTOP NOTIFICATION ─────────────────
                            // Fires even when the browser tab is minimised/hidden.
                            // Falls back silently if permission was denied.
                            if ('Notification' in window && Notification.permission === 'granted') {
                                try {
                                    const osNotif = new Notification('D-Capital CRM', {
                                        body: msg,
                                        icon: '/icon-192.png',  // PWA icon
                                        tag: change.doc.id,    // Prevents duplicate notifications for the same doc
                                        silent: false,
                                    });
                                    // Auto-close after 8 seconds
                                    setTimeout(() => osNotif.close(), 8000);
                                    // Click → focus the tab
                                    osNotif.onclick = () => {
                                        window.focus();
                                        osNotif.close();
                                    };
                                } catch (err) {
                                    console.warn('[NOTIF] Native notification failed:', err);
                                }
                            }

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
            };

            const unsubPersonal = onSnapshot(personalQuery, (snap) => handleSnapshot(snap, 'personal'),
                (err) => console.error('[REALTIME] Personal notifications error:', err));
            unsubscribes.push(unsubPersonal);

            // Admin-targeted notifications — only fetched for admin-like roles
            if (isAdminLike) {
                const adminQuery = query(
                    collection(db, 'notifications'),
                    where('companyId', '==', cmpId),
                    where('userId', '==', 'Admin')
                );
                const unsubAdmin = onSnapshot(adminQuery, (snap) => handleSnapshot(snap, 'admin'),
                    (err) => console.error('[REALTIME] Admin notifications error:', err));
                unsubscribes.push(unsubAdmin);
            }

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
