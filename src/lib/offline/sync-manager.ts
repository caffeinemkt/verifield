import {
  getPendingOfflinePunches,
  updateOfflinePunchStatus,
  getPendingCount,
} from './indexed-db';
import { getSupabaseClient } from '@/lib/supabase/client';

type SyncListener = (pendingCount: number, lastSyncResult?: { success: number; failed: number }) => void;

class SyncManager {
  private listeners: Set<SyncListener> = new Set();
  private isSyncing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[ChecadorPro Sync] Conexión a internet restaurada. Disparando sincronización de cola offline...');
        this.syncPendingPunches();
      });
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    getPendingCount().then(count => listener(count));
    return () => this.listeners.delete(listener);
  }

  private notify(lastResult?: { success: number; failed: number }) {
    getPendingCount().then(count => {
      this.listeners.forEach(fn => fn(count, lastResult));
    });
  }

  /**
   * Performs an idempotent batch upload of all pending punch records
   */
  public async syncPendingPunches(): Promise<{ success: number; failed: number }> {
    if (this.isSyncing) {
      return { success: 0, failed: 0 };
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.warn('[ChecadorPro Sync] No hay conexión a internet.');
      return { success: 0, failed: 0 };
    }

    this.isSyncing = true;
    let successCount = 0;
    let failedCount = 0;

    try {
      const pendingItems = await getPendingOfflinePunches();

      if (pendingItems.length === 0) {
        this.isSyncing = false;
        this.notify();
        return { success: 0, failed: 0 };
      }

      console.log(`[ChecadorPro Sync] Procesando ${pendingItems.length} registros en cola offline...`);
      const supabase = getSupabaseClient();

      for (const item of pendingItems) {
        try {
          await updateOfflinePunchStatus(item.id, 'syncing');

          let cloudSelfieUrl = item.selfie_url;

          // If Supabase is configured and selfie is a base64 string, upload to Supabase Storage
          if (supabase && item.selfie_url.startsWith('data:')) {
            try {
              const res = await fetch(item.selfie_url);
              const blob = await res.blob();
              const fileName = `selfies/${item.user_id}/${item.id}.jpg`;

              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('attendance-selfies')
                .upload(fileName, blob, { upsert: true });

              if (!uploadError && uploadData) {
                const { data: urlData } = supabase.storage
                  .from('attendance-selfies')
                  .getPublicUrl(fileName);
                cloudSelfieUrl = urlData.publicUrl;
              }
            } catch (storageErr) {
              console.warn('[ChecadorPro Sync] Error subiendo selfie a storage, conservando testigo local:', storageErr);
            }
          }

          // Upsert to Supabase PostgreSQL or confirm local sync
          if (supabase) {
            const { error: dbError } = await supabase.from('attendance_records').upsert(
              {
                id: item.id, // client_generated_uuid ensures idempotency
                user_id: item.user_id,
                event_type: item.event_type,
                timestamp: item.timestamp,
                local_timestamp: item.local_timestamp,
                is_offline: false,
                sync_timestamp: new Date().toISOString(),
                latitude: item.latitude,
                longitude: item.longitude,
                selfie_url: cloudSelfieUrl,
                status: item.status,
                hash_nom151: item.hash_nom151,
                nom151_cert_id: item.nom151_cert_id,
                audit_trail_id: item.audit_trail_id,
                notes: item.notes,
              },
              { onConflict: 'id' }
            );

            if (dbError) throw dbError;
          }

          // Mark as synced in local IndexedDB
          await updateOfflinePunchStatus(item.id, 'synced');
          successCount++;
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Error de sincronización';
          console.error(`[ChecadorPro Sync] Error al sincronizar registro ${item.id}:`, err);
          await updateOfflinePunchStatus(item.id, 'failed', errorMessage);
          failedCount++;
        }
      }
    } finally {
      this.isSyncing = false;
      this.notify({ success: successCount, failed: failedCount });
    }

    return { success: successCount, failed: failedCount };
  }
}

export const syncManager = new SyncManager();
