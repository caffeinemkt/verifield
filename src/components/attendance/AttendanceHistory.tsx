'use client';

import React, { useState } from 'react';
import {
  Clock,
  ShieldCheck,
  MapPin,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';
import { AttendanceRecord, UserProfile } from '@/types';
import { verifyNom151Integrity } from '@/lib/compliance/nom151';

interface AttendanceHistoryProps {
  currentUser: UserProfile;
  records: AttendanceRecord[];
}

export const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({
  currentUser,
  records,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [verifyingRecord, setVerifyingRecord] = useState<AttendanceRecord | null>(null);
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    recalculatedHash: string;
    storedHash: string;
    details: string;
  } | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  // If collaborator, view only their own records; if admin/supervisor, view all
  const userRecords = records.filter(r => {
    if (currentUser.role === 'colaborador' && r.user_id !== currentUser.id) return false;
    if (filterType !== 'all' && r.event_type !== filterType) return false;
    return true;
  });

  const handleVerify = async (record: AttendanceRecord) => {
    setVerifyingRecord(record);
    const result = await verifyNom151Integrity(
      {
        userId: record.user_id,
        eventType: record.event_type,
        timestampUtc: record.timestamp,
        latitude: record.latitude,
        longitude: record.longitude,
        photoHash: record.photo_hash,
      },
      record.hash_nom151
    );
    setVerificationResult(result);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="w-full space-y-4">
      {/* NOM-151 Verification Modal */}
      {verifyingRecord && verificationResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200/80 w-full max-w-md space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Verificación NOM-151-SCFI-2016</h3>
                  <p className="text-[11px] text-slate-500">Constancia de Conservación de Mensajes de Datos</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVerifyingRecord(null)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            {/* Verification Result Badge */}
            <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3 text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Constancia Íntegra y Válida:</span>
                <p className="text-[11px] text-emerald-700 mt-0.5">{verificationResult.details}</p>
              </div>
            </div>

            {/* Details */}
            <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-2 border border-slate-100 font-mono">
              <div className="flex justify-between text-slate-600">
                <span className="text-slate-400">Colaborador:</span>
                <span className="font-semibold text-slate-800">{verifyingRecord.user_name}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="text-slate-400">Folio PSC:</span>
                <span className="text-blue-700 font-medium">{verifyingRecord.nom151_cert_id}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="text-slate-400">Timestamp UTC:</span>
                <span className="text-slate-700">{verifyingRecord.timestamp}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="text-slate-400">Coordenadas:</span>
                <a
                  href={`https://www.google.com/maps?q=${verifyingRecord.latitude},${verifyingRecord.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1 font-sans text-[11px]"
                >
                  {verifyingRecord.latitude.toFixed(5)}, {verifyingRecord.longitude.toFixed(5)}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="pt-2 border-t border-slate-200/60">
                <div className="text-[10px] text-slate-400 mb-1">Hash SHA-256 Calculado:</div>
                <div className="flex items-center justify-between gap-2 bg-white p-2 rounded border border-slate-200 text-[10px] text-slate-700 break-all">
                  <span>{verificationResult.recalculatedHash}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(verificationResult.recalculatedHash)}
                    className="shrink-0 p-1 hover:text-slate-900 text-slate-400"
                    title="Copiar Hash"
                  >
                    {copiedHash ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setVerifyingRecord(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Historial de Asistencias</h3>
          <p className="text-xs text-slate-500">
            {currentUser.role === 'colaborador'
              ? `Marcajes de ${currentUser.full_name}`
              : `${records.length} marcajes registrados`}
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Filtrar:</span>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:outline-none cursor-pointer"
          >
            <option value="all">Todos</option>
            <option value="check_in">Entrada</option>
            <option value="meal_start">Inicio Comida</option>
            <option value="meal_end">Regreso</option>
            <option value="check_out">Salida</option>
          </select>
        </div>
      </div>

      {/* Records Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {userRecords.map(rec => {
          const statusBadge =
            rec.status === 'puntual'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : rec.status === 'en_tolerancia'
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : rec.status === 'fuera_geocerca'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-rose-50 text-rose-700 border-rose-200';

          return (
            <div
              key={rec.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:border-slate-300 transition space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Photo Thumbnail + Event tag */}
                <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-[4/3] border border-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={rec.selfie_url}
                    alt="Testigo fotográfico"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-black/60 text-white backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-semibold uppercase">
                    {rec.event_type.replace('_', ' ')}
                  </div>
                  {rec.is_offline && (
                    <div className="absolute top-2 right-2 bg-amber-500 text-white px-2 py-0.5 rounded text-[9px] font-bold">
                      Offline
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{rec.user_name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusBadge}`}>
                      {rec.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{rec.local_timestamp}</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer: Google Maps Link + NOM-151 Verifier Button */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                {/* Direct Google Maps Coordinates Link */}
                <a
                  href={`https://www.google.com/maps?q=${rec.latitude},${rec.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-medium hover:underline"
                  title="Abrir coordenadas en Google Maps"
                >
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>Ver en Google Maps ↗</span>
                </a>

                {/* Single-click NOM-151 Verifier */}
                <button
                  type="button"
                  onClick={() => handleVerify(rec)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
                  title="Verificar validez NOM-151 ante la STPS"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  NOM-151
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
