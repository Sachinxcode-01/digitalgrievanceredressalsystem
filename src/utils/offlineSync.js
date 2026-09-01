/**
 * ResolveNow — IndexedDB Offline Storage & Background Sync Manager
 * Allows students, citizens, and officers to draft grievances offline,
 * store attachments locally, and auto-sync seamlessly when reconnected.
 */

const DB_NAME = 'ResolveNowOfflineDB';
const DB_VERSION = 1;
const STORE_DRAFTS = 'grievance_drafts';
const STORE_SYNC_QUEUE = 'sync_queue';

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_DRAFTS)) {
        db.createObjectStore(STORE_DRAFTS, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORE_SYNC_QUEUE)) {
        db.createObjectStore(STORE_SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const offlineSyncManager = {
  /**
   * Save a grievance draft to offline IndexedDB storage
   */
  async saveDraft(draftData) {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_DRAFTS, 'readwrite');
        const store = tx.objectStore(STORE_DRAFTS);
        const record = {
          ...draftData,
          updatedAt: Date.now()
        };
        const req = store.put(record);
        req.onsuccess = () => resolve({ success: true, id: req.result });
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('Offline draft save fallback to localStorage:', err.message);
      try {
        localStorage.setItem('grievance_offline_draft', JSON.stringify(draftData));
        return { success: true, fallback: true };
      } catch {
        return { success: false, error: err.message };
      }
    }
  },

  /**
   * Retrieve all saved offline grievance drafts
   */
  async getDrafts() {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_DRAFTS, 'readonly');
        const store = tx.objectStore(STORE_DRAFTS);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      try {
        const item = localStorage.getItem('grievance_offline_draft');
        return item ? [JSON.parse(item)] : [];
      } catch {
        return [];
      }
    }
  },

  /**
   * Delete a draft by ID
   */
  async deleteDraft(id) {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_DRAFTS, 'readwrite');
        const store = tx.objectStore(STORE_DRAFTS);
        const req = store.delete(id);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    } catch {
      localStorage.removeItem('grievance_offline_draft');
      return true;
    }
  },

  /**
   * Queue a submission for background sync when offline
   */
  async queueForSync(submissionPayload) {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_SYNC_QUEUE, 'readwrite');
        const store = tx.objectStore(STORE_SYNC_QUEUE);
        const record = {
          payload: submissionPayload,
          queuedAt: Date.now(),
          attempts: 0
        };
        const req = store.add(record);
        req.onsuccess = () => resolve({ success: true, syncId: req.result });
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.error('Failed to queue offline submission:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Process and dispatch all queued offline submissions once online
   */
  async processSyncQueue(submitCallback) {
    if (!navigator.onLine) return { synced: 0, pending: 0 };

    try {
      const db = await openDB();
      const items = await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_SYNC_QUEUE, 'readonly');
        const store = tx.objectStore(STORE_SYNC_QUEUE);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });

      let syncedCount = 0;

      for (const item of items) {
        try {
          if (typeof submitCallback === 'function') {
            await submitCallback(item.payload);
          }
          // Remove from queue on success
          const deleteTx = db.transaction(STORE_SYNC_QUEUE, 'readwrite');
          deleteTx.objectStore(STORE_SYNC_QUEUE).delete(item.id);
          syncedCount++;
        } catch (err) {
          console.warn(`Sync item #${item.id} failed, will retry:`, err.message);
        }
      }

      return { synced: syncedCount, pending: items.length - syncedCount };
    } catch (err) {
      console.warn('Sync queue processing error:', err.message);
      return { synced: 0, error: err.message };
    }
  },

  /**
   * Initialize online/offline auto-sync listeners
   */
  initAutoSync(onSyncComplete = null) {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', async () => {
      console.log('🌐 Network connectivity restored. Initiating offline grievance sync...');
      const result = await this.processSyncQueue();
      if (result.synced > 0 && typeof onSyncComplete === 'function') {
        onSyncComplete(result);
      }
    });
  }
};
