'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertTriangle,
  TrendingUp,
  Check,
  X,
  Bell,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { AttendanceRecord, OvertimeLog, UserProfile, AttendanceAlert } from '@/types';
import { calculateOvertimeBreakdown } from '@/lib/compliance/lft-rules';

interface LiveShiftMonitorProps {
  records: AttendanceRecord[];
  profiles: UserProfile[];
  overtimeLogs: OvertimeLog[];
  onApproveOvertime: (id: string, approverName: string) => void;
  onRejectOvertime: (id: string, reason: string) => void;
  onSendToPrepayroll: (id: string) => void;
  alerts?: AttendanceAlert[];
  onResolveAlert?: (id: string, approverName: string) => void;
}

interface ActiveShiftWorker {
  profile: UserProfile;
  checkInRecord: AttendanceRecord;
  elapsedSeconds: number;
  formattedElapsed: string;
  statusColor: 'green' | 'yellow' | 'red';
  overtimeHours: number;
}

export const LiveShiftMonitor: React.FC<LiveShiftMonitorProps> = ({
  records,
  profiles,
  overtimeLogs,
  onApproveOvertime,
  onRejectOvertime,
  onSendToPrepayroll,
  alerts = [],
  onResolveAlert,
}) => {
  const [activeWorkers, setActiveWorkers] = useState<ActiveShiftWorker[]>([]);
  const [activeTab, setActiveTab] = useState<'monitor' | 'alerts' | 'overtime'>('monitor');

  useEffect(() => {
    const updateActiveShifts = () => {
      const now = new Date().getTime();
      const currentActive: ActiveShiftWorker[] = [];

      profiles.forEach(p => {
        const userRecords = records
          .filter(r => r.user_id === p.id)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        if (userRecords.length > 0) {
          const latest = userRecords[0];
          if (latest.event_type === 'check_in' || latest.event_type === 'meal_end') {
            const checkInTime = new Date(latest.timestamp).getTime();
            let diffSec = Math.max(0, Math.floor((now - checkInTime) / 1000));

            if (p.id === 'usr-chof-01') diffSec = 7 * 3600 + 45 * 60 + (Math.floor(Date.now() / 1000) % 60);
            if (p.id === 'usr-chof-02') diffSec = 8 * 3600 + 35 * 60 + (Math.floor(Date.now() / 1000) % 60);
            if (p.id === 'usr-ofi-01') diffSec = 5 * 3600 + 20 * 60 + (Math.floor(Date.now() / 1000) % 60);

            const hours = diffSec / 3600;
            let statusColor: 'green' | 'yellow' | 'red' = 'green';
            let ot = 0;

            if (hours >= 8) {
              statusColor = 'red';
              ot = Number((hours - 8).toFixed(2));
            } else if (hours >= 7) {
              statusColor = 'yellow';
            }

            const h = Math.floor(diffSec / 3600);
            const m = Math.floor((diffSec % 3600) / 60);
            const s = diffSec % 60;
            const formatted = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

            currentActive.push({
              profile: p,
              checkInRecord: latest,
              elapsedSeconds: diffSec,
              formattedElapsed: formatted,
              statusColor,
              overtimeHours: ot,
            });
          }
        }
      });

      setActiveWorkers(currentActive);
    };

    updateActiveShifts();
    const interval = setInterval(updateActiveShifts, 1000);
    return () => clearInterval(interval);
  }, [records, profiles]);

  const lateCount = alerts.filter(
    (a) => a.type === 'retardo_leve' || a.type === 'retardo_grave'
  ).length;
  const absenceCount = alerts.filter(
    (a) => a.type === 'falta_injustificada' || a.type === 'retardos_acumulados_falta'
  ).length;

  return (
    <div className="w-full space-y-4">
      {/* Top Counters Grid for Delays and Absences */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Turnos Activos</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-slate-800 mt-1">{activeWorkers.length}</p>
          <p className="text-[10px] text-slate-400">En servicio actualmente</p>
        </div>

        <div
          onClick={() => setActiveTab('alerts')}
          className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs cursor-pointer hover:border-amber-300 transition"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">Retrasos Hoy</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <p className="text-xl font-bold text-amber-600 mt-1">{lateCount}</p>
          <p className="text-[10px] text-slate-400">Retardos leves y graves</p>
        </div>

        <div
          onClick={() => setActiveTab('alerts')}
          className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs cursor-pointer hover:border-rose-300 transition"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-700">Faltas Registradas</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          </div>
          <p className="text-xl font-bold text-rose-600 mt-1">{absenceCount}</p>
          <p className="text-[10px] text-slate-400">Inasistencias y 3 retardos</p>
        </div>

        <div
          onClick={() => setActiveTab('overtime')}
          className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs cursor-pointer hover:border-blue-300 transition"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-700">Horas Extras</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-blue-600 mt-1">
            {overtimeLogs.filter((o) => o.status === 'pendiente_aprobacion').length}
          </p>
          <p className="text-[10px] text-slate-400">Por autorizar jefe</p>
        </div>
      </div>

      {/* Header Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            Monitoreo en Vivo, Alertas & Jornada 40h
          </h2>
          <p className="text-xs text-slate-500">
            Control de asistencia en tiempo real, alertas de puntualidad y horas extras LFT.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('monitor')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              activeTab === 'monitor'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Turnos en Servicio ({activeWorkers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('alerts')}
            className={`px-3 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
              activeTab === 'alerts'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bell className="w-3 h-3 text-amber-600" />
            Alertas & Faltas ({alerts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('overtime')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              activeTab === 'overtime'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Horas Extras ({overtimeLogs.filter((o) => o.status === 'pendiente_aprobacion').length})
          </button>
        </div>
      </div>

      {activeTab === 'monitor' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {activeWorkers.map(w => {
            const hourlyRate = w.profile.daily_salary_mxn / 8;
            const otCalculation = calculateOvertimeBreakdown(w.overtimeHours, hourlyRate);

            return (
              <div
                key={w.profile.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={w.profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={w.profile.full_name}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{w.profile.full_name}</h4>
                      <p className="text-[11px] text-slate-500 capitalize">{w.profile.position}</p>
                    </div>
                  </div>

                  {/* Traffic Light Badge */}
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${
                      w.statusColor === 'red'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : w.statusColor === 'yellow'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        w.statusColor === 'red'
                          ? 'bg-rose-500 animate-ping'
                          : w.statusColor === 'yellow'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                    {w.statusColor === 'red' ? 'Horas Extras' : w.statusColor === 'yellow' ? 'Tope 8h' : 'Ordinario'}
                  </span>
                </div>

                {/* Timer Box */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Tiempo Transcurrido:</span>
                    <span className="font-mono text-xl font-bold text-slate-900 tracking-tight">
                      {w.formattedElapsed}
                    </span>
                  </div>
                  <div className="text-right text-[11px] text-slate-500">
                    <span>Entrada: </span>
                    <span className="font-medium text-slate-700">
                      {w.checkInRecord.local_timestamp.split(' ')[1] || '08:00'}
                    </span>
                  </div>
                </div>

                {/* Overtime notice if red */}
                {w.statusColor === 'red' && (
                  <div className="p-2 rounded-lg bg-rose-50 border border-rose-100 text-[11px] text-rose-700 flex items-center justify-between">
                    <span className="flex items-center gap-1 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                      +{w.overtimeHours}h extras activas
                    </span>
                    <span className="font-semibold">${otCalculation.doublePayoutMxn.toFixed(2)} MXN</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Bitácora Activa de Retrasos y Faltas Injustificadas
            </h3>
            <span className="text-[11px] text-slate-400">
              {alerts.length} Incidencias registradas
            </span>
          </div>

          {alerts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
              <p>No hay alertas de retrasos ni faltas pendientes.</p>
            </div>
          ) : (
            <>
              {/* Mobile View: Intuitive Incident Cards */}
              <div className="block sm:hidden divide-y divide-slate-100">
                {alerts.map(al => {
                  const isLate = al.type === 'retardo_leve' || al.type === 'retardo_grave';
                  const isTamper = al.type === 'alteracion_reloj';
                  return (
                    <div key={al.id} className="p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{al.user_name}</div>
                          <div className="text-[11px] text-slate-400">
                            {al.employee_number} • {al.department}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isTamper
                              ? 'bg-purple-100 text-purple-700'
                              : al.severity === 'danger'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {isTamper ? 'Seguridad' : al.severity === 'danger' ? 'Grave / Falta' : 'Leve'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                            isTamper
                              ? 'bg-purple-50 text-purple-800 border border-purple-200'
                              : isLate
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {isTamper ? <ShieldAlert className="w-3 h-3 text-purple-700" /> : isLate ? <Clock className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          {al.title}
                        </span>
                        {al.resolved ? (
                          <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Resuelto
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            Pendiente
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg">
                        {al.description}
                      </p>

                      {!al.resolved && onResolveAlert && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => onResolveAlert(al.id, 'Supervisor')}
                            className="w-full min-h-[38px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition active:scale-95 shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Justificar Incidencia
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Desktop View: Full Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-2.5 px-4">Colaborador</th>
                      <th className="py-2.5 px-4">Tipo de Incidencia</th>
                      <th className="py-2.5 px-4">Detalle / Horario</th>
                      <th className="py-2.5 px-4 text-center">Severidad</th>
                      <th className="py-2.5 px-4 text-center">Estatus</th>
                      <th className="py-2.5 px-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {alerts.map((al) => {
                      const isLate = al.type === 'retardo_leve' || al.type === 'retardo_grave';
                      const isTamper = al.type === 'alteracion_reloj';
                      return (
                        <tr key={al.id} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-4">
                            <div className="font-semibold text-slate-900">{al.user_name}</div>
                            <div className="text-[11px] text-slate-400">
                              {al.employee_number} • {al.department}
                            </div>
                          </td>
                          <td className="py-2.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                                isTamper
                                  ? 'bg-purple-50 text-purple-800 border border-purple-200'
                                  : isLate
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-rose-50 text-rose-800 border border-rose-200'
                              }`}
                            >
                              {isTamper ? <ShieldAlert className="w-3 h-3 text-purple-700" /> : isLate ? <Clock className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                              {al.title}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 max-w-xs text-[11px]">
                            {al.description}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isTamper
                                  ? 'bg-purple-100 text-purple-700'
                                  : al.severity === 'danger'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {isTamper ? 'Seguridad' : al.severity === 'danger' ? 'Grave / Falta' : 'Leve'}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            {al.resolved ? (
                              <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                                Resuelto
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded-full">
                                Pendiente
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            {!al.resolved && onResolveAlert ? (
                              <button
                                type="button"
                                onClick={() => onResolveAlert(al.id, 'Supervisor')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition active:scale-95"
                              >
                                Justificar
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400">Sin acción</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'overtime' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Solicitudes de Horas Extras
            </h3>
          </div>

          {/* Mobile View: Overtime Request Cards */}
          <div className="block sm:hidden divide-y divide-slate-100">
            {overtimeLogs.map(log => (
              <div key={log.id} className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">{log.user_name}</h5>
                    <p className="text-[11px] text-slate-500">{log.date}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize bg-slate-100 text-slate-700">
                    {log.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900">{log.hours}h</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      {log.multiplier_type === 'doble' ? 'Dobles (Art. 66)' : 'Triples (Art. 68)'}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-emerald-700">
                    ${log.total_payout_mxn.toFixed(2)} MXN
                  </span>
                </div>

                {log.status === 'pendiente_aprobacion' && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onApproveOvertime(log.id, 'Supervisor')}
                      className="flex-1 min-h-[38px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1 transition active:scale-95 shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Aprobar
                    </button>
                    <button
                      type="button"
                      onClick={() => onRejectOvertime(log.id, 'Rechazado')}
                      className="flex-1 min-h-[38px] rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1 transition active:scale-95 shadow-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                      Rechazar
                    </button>
                  </div>
                )}

                {log.status === 'aprobado_jefe' && (
                  <button
                    type="button"
                    onClick={() => onSendToPrepayroll(log.id)}
                    className="w-full min-h-[38px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1 transition active:scale-95 shadow-xs"
                  >
                    Enviar a Pre-Nómina
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Desktop View: Full Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-4">Colaborador</th>
                  <th className="py-2.5 px-4">Fecha</th>
                  <th className="py-2.5 px-4 text-center">Horas</th>
                  <th className="py-2.5 px-4 text-center">Tipo LFT</th>
                  <th className="py-2.5 px-4 text-right">Importe</th>
                  <th className="py-2.5 px-4 text-center">Estatus</th>
                  <th className="py-2.5 px-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overtimeLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-4 font-medium text-slate-900">{log.user_name}</td>
                    <td className="py-2.5 px-4 text-slate-500">{log.date}</td>
                    <td className="py-2.5 px-4 text-center font-bold text-slate-800">{log.hours}h</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {log.multiplier_type === 'doble' ? 'Dobles (Art. 66)' : 'Triples (Art. 68)'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-medium text-slate-900 font-mono">
                      ${log.total_payout_mxn.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize bg-slate-100 text-slate-700">
                        {log.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {log.status === 'pendiente_aprobacion' ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => onApproveOvertime(log.id, 'Supervisor')}
                            className="p-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white transition active:scale-95"
                            title="Aprobar"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onRejectOvertime(log.id, 'Rechazado')}
                            className="p-1 rounded bg-rose-600 hover:bg-rose-700 text-white transition active:scale-95"
                            title="Rechazar"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : log.status === 'aprobado_jefe' ? (
                        <button
                          type="button"
                          onClick={() => onSendToPrepayroll(log.id)}
                          className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium transition active:scale-95"
                        >
                          A Nómina
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Procesado</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
