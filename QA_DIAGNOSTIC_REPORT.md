# QA Diagnostic & Hotfix Report

**Date:** March 9, 2026
**Target:** D-Capital CRM Pro Production App

## 1. CSV Import Failure Diagnosis

**The Problem:** 
Agents uploading large Excel/CSV lists of leads were experiencing silent failures or incomplete imports.

**Root Cause Analysis:** 
The `addBulkLeads` function in `store.ts` was executing 100s or 1000s of simultaneous `setDoc` network requests via `Promise.allSettled`. For large lists, this exceeded Google Firestore's rate limits and maximum connection pools, causing the API to reject the requests. Compounding the issue, the error handling explicitly hid the actual Firebase database error (`error.message`), swallowing the failure reason and making it impossible for the user to understand what went wrong.

**The Hotfix:**
1. **Pipelining Constraints:** Rewrote `addBulkLeads` to use Firestore's `writeBatch` API, chunking the data into strict batches of 400 records per transaction (safely under the 500 max limit).
2. **Error Transparency:** Stripped the generic error handling in the `catch` block of `Leads.tsx` and modified it to explicitly print the raw failure reason directly to the UI toast notification (`Import Failed: <error>`).

## 2. Notification Trigger Failure Diagnosis

**The Problem:** 
The Notification Bell UI was correctly built and functioning, but agents were not being alerted when a task or lead was explicitly assigned to them. 

**Root Cause Analysis:** 
The frontend UI and the Zustand store memory state for notifications were disconnected from the actual backend action dispatchers. In `store.ts`, the core functions responsible for assigning work (`assignLeads`) changed the ownership field on the database document, but never invoked the `addFirestoreNotification` trigger. The "wires" were cut between the action and the alert system.

**The Hotfix:**
1. **Hardware Wiring:** Bound the action to the trigger. Inside the `assignLeads` logic block, explicitly injected a call to `get().addFirestoreNotification()`. Now, the moment ownership transfers, a direct write is made to the `notifications` collection of the receiving agent's precise `userId`, instantly firing their notification bell in real-time.

---

*Status: Diagnostics Complete. Hotfixes Applied. Ready for Production Deployment.*
