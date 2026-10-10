'use client';

import React from 'react';
import { WifiOff, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface OfflineBannerProps {
  isOnline: boolean;
  pendingSyncCount: number;
  isSyncing: boolean;
  onManualSync: () => void;
  lastSyncResult?: { success: number; failed: number } | null;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isOnline,
  pendingSyncCount,
  isSyncing,
  onManualSync,
  lastSyncResult,
}) => {
  if (isOnline && pendingSyncCount === 0 && !lastSyncResult) {
    return null;
  }

  return (
    <div
      className={`w-full py-2 px-4 text-xs font-medium border-b flex flex-wrap items-center justify-between gap-2 transition-colors ${
        !isOnline
          ? 'bg-amber-50 border-amber-200 text-amber-800'
          : pendingSyncCount > 0
          ? 'bg-blue-50 border-blue-200 text-blue-800'
          : 'bg-emerald-50 border-emerald-200 text-emerald-800'
      }`}
    >
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <>
            <WifiOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              <strong>Modo Offline:</strong> Puedes checar normalmente con foto y GPS. Los registros se sincronizarán al recuperar red.
            </span>
          </>
        ) : pendingSyncCount > 0 ? (
          <>
            <AlertCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>
              Tienes <strong>{pendingSyncCount} marcaje(s)</strong> pendientes de sincronizar.
            </span>
          </>
        ) : (
          <>
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              Sincronización completada ({lastSyncResult?.success} registros subidos).
            </span>
          </>
        )}
      </div>

      {pendingSyncCount > 0 && isOnline && (
        <button
          type="button"
          onClick={onManualSync}
          disabled={isSyncing}
          className="py-1 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
        </button>
      )}
    </div>
  );
};
