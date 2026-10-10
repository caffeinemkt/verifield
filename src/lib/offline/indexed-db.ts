import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { AttendanceRecord } from '@/types';

export interface PendingAttendancePunch extends AttendanceRecord {
  sync_status: 'pending_sync' | 'syncing' | 'synced' | 'failed';
  retry_count: number;
  last_error?: string;
}

interface ChecadorProDB extends DBSchema {
  offline_punches: {
    key: string; // client_generated_uuid (id)
    value: PendingAttendancePunch;
    indexes: {
      'by-sync-status': string;
      'by-timestamp': string;
    };
  };
}

const DB_NAME = 'checadorpro_offline_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<ChecadorProDB>> | null = null;

export function getDatabase(): Promise<IDBPDatabase<ChecadorProDB>> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB only available in browser'));
  }

  if (!dbPromise) {
    dbPromise = openDB<ChecadorProDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('offline_punches')) {
          const store = db.createObjectStore('offline_punches', { keyPath: 'id' });
          store.createIndex('by-sync-status', 'sync_status');
          store.createIndex('by-timestamp', 'timestamp');
        }
      },
    });
  }

  return dbPromise;
}

/**
 * Saves a punch record to IndexedDB with pending_sync status
 */
export async function saveOfflinePunch(punch: AttendanceRecord): Promise<void> {
  const db = await getDatabase();
  const pendingRecord: PendingAttendancePunch = {
    ...punch,
    is_offline: true,
    sync_status: 'pending_sync',
    retry_count: 0,
  };
  await db.put('offline_punches', pendingRecord);
}

/**
 * Returns all pending punches in the offline queue
 */
export async function getPendingOfflinePunches(): Promise<PendingAttendancePunch[]> {
  const db = await getDatabase();
  const all = await db.getAllFromIndex('offline_punches', 'by-sync-status', 'pending_sync');
  return all;
}

/**
 * Updates status of an offline punch
 */
export async function updateOfflinePunchStatus(
  id: string,
  status: 'pending_sync' | 'syncing' | 'synced' | 'failed',
  errorMsg?: string
): Promise<void> {
  const db = await getDatabase();
  const item = await db.get('offline_punches', id);
  if (item) {
    item.sync_status = status;
    if (status === 'synced') {
      item.is_offline = false;
      item.sync_timestamp = new Date().toISOString();
    }
    if (errorMsg) {
      item.last_error = errorMsg;
      item.retry_count = (item.retry_count || 0) + 1;
    }
    await db.put('offline_punches', item);
  }
}

/**
 * Gets count of pending offline punches
 */
export async function getPendingCount(): Promise<number> {
  if (typeof window === 'undefined') return 0;
  try {
    const db = await getDatabase();
    return db.countFromIndex('offline_punches', 'by-sync-status', 'pending_sync');
  } catch {
    return 0;
  }
}

/**
 * Removes synced punch or clears store
 */
export async function deleteOfflinePunch(id: string): Promise<void> {
  const db = await getDatabase();
  await db.delete('offline_punches', id);
}
