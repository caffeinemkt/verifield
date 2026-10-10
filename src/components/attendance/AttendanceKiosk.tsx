'use client';

import React, { useState } from 'react';
import {
  LogIn,
  LogOut,
  Coffee,
  Clock,
  CheckCircle2,
  Wifi,
  WifiOff,
  type LucideIcon,
} from 'lucide-react';
import { CameraWatermark } from './CameraWatermark';
import { GeolocationCheck } from './GeolocationCheck';
import {
  UserProfile,
  AttendanceEventType,
  AttendanceRecord,
  AttendanceStatus,
} from '@/types';
import { evaluateEntryStatus } from '@/lib/compliance/lft-rules';
import {
  generateNom151RecordHash,
  generateNom151PscReceiptId,
} from '@/lib/compliance/nom151';
import { saveOfflinePunch } from '@/lib/offline/indexed-db';
import { syncManager } from '@/lib/offline/sync-manager';

interface AttendanceKioskProps {
  currentUser: UserProfile;
  onRecordCreated: (record: AttendanceRecord) => void;
  isOnline: boolean;
}

const EVENTS: { key: AttendanceEventType; label: string; icon: LucideIcon; activeClass: string }[] = [
  { key: 'check_in', label: 'Entrada', icon: LogIn, activeClass: 'bg-emerald-600 text-white' },
  { key: 'meal_start', label: 'Comida', icon: Coffee, activeClass: 'bg-amber-600 text-white' },
  { key: 'meal_end', label: 'Regreso', icon: Clock, activeClass: 'bg-blue-600 text-white' },
  { key: 'check_out', label: 'Salida', icon: LogOut, activeClass: 'bg-purple-600 text-white' },
];

export const AttendanceKiosk: React.FC<AttendanceKioskProps> = ({
  currentUser,
  onRecordCreated,
  isOnline,
}) => {
  const [selectedEvent, setSelectedEvent] = useState<AttendanceEventType>('check_in');
  const [photoData, setPhotoData] = useState<{ base64: string; hash: string } | null>(null);
  const [geoData, setGeoData] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
    distanceToBase: number;
    isOutOfRange: boolean;
  }>({
    latitude: currentUser.base_lat,
    longitude: currentUser.base_lng,
    accuracy: 10,
    distanceToBase: 0,
    isOutOfRange: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState<AttendanceRecord | null>(null);

  const handlePhotoCaptured = (photoBase64: string, photoHash: string) => {
    setPhotoData({ base64: photoBase64, hash: photoHash });
  };

  const handleSubmitPunch = async () => {
    if (!photoData) {
      alert('Por favor toma una foto para continuar.');
      return;
    }

    setIsSubmitting(true);

    try {
      const now = new Date();
      const timestampUtc = now.toISOString();
      const localTimeString = now.toLocaleTimeString('es-MX', {
        timeZone: 'America/Mexico_City',
        hour: '2-digit',
        minute: '2-digit',
      });
      const localDateString = now.toLocaleDateString('es-MX', {
        timeZone: 'America/Mexico_City',
      });
      const localFormatted = `${localDateString} ${localTimeString}`;

      let status: AttendanceStatus = 'puntual';
      let notes = '';

      if (selectedEvent === 'check_in') {
        const timeHHMM = now.toLocaleTimeString('es-MX', {
          timeZone: 'America/Mexico_City',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        const evalResult = evaluateEntryStatus(timeHHMM, '08:00', 15);
        status = evalResult.status;
        notes = evalResult.message;
      }

      if (geoData.isOutOfRange && currentUser.employee_type === 'oficina') {
        status = 'fuera_geocerca';
        notes = 'Fuera de geocerca permitida';
      }

      const nom151Hash = await generateNom151RecordHash({
        userId: currentUser.id,
        eventType: selectedEvent,
        timestampUtc,
        latitude: geoData.latitude,
        longitude: geoData.longitude,
        photoHash: photoData.hash,
      });

      const nom151CertId = generateNom151PscReceiptId(nom151Hash);
      const clientGeneratedUuid = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `uuid-${Date.now()}`;

      const auditTrailId = `STPS-${nom151CertId.substring(14)}`;

      const newRecord: AttendanceRecord = {
        id: clientGeneratedUuid,
        user_id: currentUser.id,
        user_name: currentUser.full_name,
        employee_type: currentUser.employee_type,
        event_type: selectedEvent,
        timestamp: timestampUtc,
        local_timestamp: localFormatted,
        is_offline: !isOnline,
        latitude: geoData.latitude,
        longitude: geoData.longitude,
        accuracy_meters: geoData.accuracy,
        distance_to_base_meters: geoData.distanceToBase,
        is_geofence_violation: geoData.isOutOfRange,
        selfie_url: photoData.base64,
        photo_hash: photoData.hash,
        status,
        notes,
        hash_nom151: nom151Hash,
        nom151_cert_id: nom151CertId,
        audit_trail_id: auditTrailId,
      };

      await saveOfflinePunch(newRecord);
      if (isOnline) {
        await syncManager.syncPendingPunches();
      }

      onRecordCreated(newRecord);
      setSuccessReceipt(newRecord);
      setPhotoData(null);
    } catch (err: unknown) {
      console.error(err);
      alert('Error registrando checada.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedEventObj = EVENTS.find(e => e.key === selectedEvent) || EVENTS[0];

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Success Modal */}
      {successReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200/80 w-full max-w-sm text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">¡Marcaje Registrado!</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Checador Digital Green Seven • {selectedEventObj.label} • {successReceipt.local_timestamp}
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 text-left text-xs space-y-1.5 border border-slate-100">
              <div className="flex justify-between text-slate-500">
                <span>Colaborador:</span>
                <span className="font-medium text-slate-800">{successReceipt.user_name}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Certificado NOM-151:</span>
                <span className="font-mono text-emerald-700 font-medium">{successReceipt.nom151_cert_id}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Estatus:</span>
                <span className="capitalize font-medium text-slate-800">{successReceipt.status.replace('_', ' ')}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSuccessReceipt(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
            >
              Listo
            </button>
          </div>
        </div>
      )}

      {/* Main Kiosk Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        {/* User Compact Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={currentUser.full_name}
              className="w-10 h-10 rounded-full object-cover border border-slate-200"
            />
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">{currentUser.full_name}</h2>
              <span className="text-[11px] text-slate-500">
                {currentUser.employee_number} • <span className="capitalize">{currentUser.position}</span>
              </span>
            </div>
          </div>

          <div
            className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
              isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}
          >
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>

        {/* 1. Event Selector (Pill tiles) */}
        <div className="grid grid-cols-4 gap-2">
          {EVENTS.map(evt => {
            const Icon = evt.icon;
            const isSelected = selectedEvent === evt.key;

            return (
              <button
                key={evt.key}
                type="button"
                onClick={() => setSelectedEvent(evt.key)}
                className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl border text-center transition-all ${
                  isSelected
                    ? `${evt.activeClass} border-transparent shadow-xs font-semibold`
                    : 'bg-slate-50 border-slate-200/70 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4 mb-1" />
                <span className="text-xs">{evt.label}</span>
              </button>
            );
          })}
        </div>

        {/* 2. Compact Location */}
        <GeolocationCheck
          employeeType={currentUser.employee_type}
          baseName={currentUser.base_name}
          baseLat={currentUser.base_lat}
          baseLng={currentUser.base_lng}
          geofenceRadius={currentUser.geofence_radius}
          onLocationResolved={setGeoData}
        />

        {/* 3. Compact Camera */}
        <CameraWatermark
          userId={currentUser.id}
          userName={currentUser.full_name}
          employeeNumber={currentUser.employee_number}
          latitude={geoData.latitude}
          longitude={geoData.longitude}
          accuracy={geoData.accuracy}
          onPhotoCaptured={handlePhotoCaptured}
        />

        {/* Big Action Punch Button */}
        <button
          type="button"
          onClick={handleSubmitPunch}
          disabled={!photoData || isSubmitting}
          className={`w-full py-3 px-4 rounded-xl font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition active:scale-[0.99] ${
            photoData && !isSubmitting
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-emerald-700/20 shadow-md'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isSubmitting
            ? 'Registrando...'
            : photoData
            ? `Marcar ${selectedEventObj.label}`
            : 'Toma la foto para marcar'}
        </button>
      </div>
    </div>
  );
};
