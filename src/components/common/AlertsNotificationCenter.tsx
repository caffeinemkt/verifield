'use client';

import React, { useState } from 'react';
import {
  Bell,
  Clock,
  AlertTriangle,
  X,
  CheckCircle2,
  CheckCheck,
  User,
  ShieldAlert,
} from 'lucide-react';
import { AttendanceAlert } from '@/types';

interface AlertsNotificationCenterProps {
  alerts: AttendanceAlert[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onResolveAlert: (id: string, approverName: string) => void;
  currentUserName: string;
}

export const AlertsNotificationCenter: React.FC<AlertsNotificationCenterProps> = ({
  alerts,
  onMarkAsRead,
  onMarkAllAsRead,
  onResolveAlert,
  currentUserName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'retrasos' | 'faltas'>('all');

  const unreadAlerts = alerts.filter((a) => !a.read);
  const unreadCount = unreadAlerts.length;

  const lateAlerts = alerts.filter(
    (a) => a.type === 'retardo_leve' || a.type === 'retardo_grave'
  );
  const absenceAlerts = alerts.filter(
    (a) => a.type === 'falta_injustificada' || a.type === 'retardos_acumulados_falta'
  );

  const filteredAlerts = alerts.filter((a) => {
    if (activeFilter === 'retrasos') {
      return a.type === 'retardo_leve' || a.type === 'retardo_grave';
    }
    if (activeFilter === 'faltas') {
      return a.type === 'falta_injustificada' || a.type === 'retardos_acumulados_falta';
    }
    return true;
  });

  return (
    <div className="relative">
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 transition flex items-center gap-1.5 focus:outline-hidden"
        title="Centro de Alertas de Asistencia"
      >
        <Bell className="w-4 h-4 text-slate-600" />

        {/* Counter Pill */}
        {unreadCount > 0 ? (
          <span className="flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white shadow-xs animate-pulse">
            {unreadCount}
          </span>
        ) : (
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
        )}
      </button>

      {/* Popover / Dropdown Modal */}
      {isOpen && (
        <>
          {/* Backdrop for click outside */}
          <div
            className="fixed inset-0 z-40 bg-black/25 sm:bg-transparent backdrop-blur-xs sm:backdrop-blur-none"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed left-3 right-3 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden flex flex-col max-h-[82vh] sm:max-h-none animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-3.5 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                  <ShieldAlert className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">
                    Alertas de Asistencia
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Retrasos y Faltas en tiempo real
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={onMarkAllAsRead}
                    className="text-[10px] text-slate-500 hover:text-emerald-700 font-medium px-2 py-1 rounded hover:bg-slate-100 transition flex items-center gap-1"
                    title="Marcar todas como leídas"
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span>Leídas</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick KPI Counters */}
            <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-100/50 border-b border-slate-100 text-xs shrink-0">
              <div
                onClick={() => setActiveFilter('retrasos')}
                className={`p-2 rounded-xl border cursor-pointer transition flex items-center gap-2 ${
                  activeFilter === 'retrasos'
                    ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs'
                    : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Clock className="w-3 h-3" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">Retrasos</span>
                  <span className="font-bold text-slate-900">{lateAlerts.length} activos</span>
                </div>
              </div>

              <div
                onClick={() => setActiveFilter('faltas')}
                className={`p-2 rounded-xl border cursor-pointer transition flex items-center gap-2 ${
                  activeFilter === 'faltas'
                    ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-xs'
                    : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-3 h-3" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">Faltas</span>
                  <span className="font-bold text-slate-900">{absenceAlerts.length} activas</span>
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-2 border-b border-slate-100 text-[11px] bg-white shrink-0 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition shrink-0 ${
                  activeFilter === 'all'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                Todas ({alerts.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('retrasos')}
                className={`px-2.5 py-1 rounded-lg font-medium transition shrink-0 ${
                  activeFilter === 'retrasos'
                    ? 'bg-amber-600 text-white font-semibold'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                Retrasos ({lateAlerts.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('faltas')}
                className={`px-2.5 py-1 rounded-lg font-medium transition shrink-0 ${
                  activeFilter === 'faltas'
                    ? 'bg-rose-600 text-white font-semibold'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                Faltas ({absenceAlerts.length})
              </button>
            </div>

            {/* Alerts List */}
            <div className="flex-1 overflow-y-auto max-h-[55vh] sm:max-h-80 divide-y divide-slate-100 text-xs">
              {filteredAlerts.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5 opacity-60" />
                  <p className="font-medium text-slate-600">No hay alertas pendientes</p>
                  <p className="text-[10px]">La asistencia se encuentra en orden.</p>
                </div>
              ) : (
                filteredAlerts.map((alert) => {
                  const isLate =
                    alert.type === 'retardo_leve' || alert.type === 'retardo_grave';
                  const isCumulativeAbsence = alert.type === 'retardos_acumulados_falta';

                  return (
                    <div
                      key={alert.id}
                      className={`p-3 transition hover:bg-slate-50 ${
                        !alert.read ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                            isLate
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {isLate ? (
                            <Clock className="w-3.5 h-3.5" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          )}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-1.5">
                            <h5 className="font-bold text-slate-900 text-xs break-words leading-tight">
                              {alert.title}
                            </h5>
                            {!alert.read && (
                              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-0.5" />
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-[11px] text-slate-700 mt-1 flex-wrap">
                            <User className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="font-semibold text-slate-900">{alert.user_name}</span>
                            <span className="text-slate-500 text-[10px]">({alert.employee_number})</span>
                          </div>

                          <p className="text-[11px] text-slate-600 mt-1 leading-snug break-words">
                            {alert.description}
                          </p>

                          <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-400 flex-wrap">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">{alert.department}</span>
                            <span>•</span>
                            <span>{new Date(alert.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} CDMX</span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        {alert.resolved ? (
                          <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>Resuelto por {alert.resolved_by || 'Supervisor'}</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onResolveAlert(alert.id, currentUserName)}
                            className="min-h-[28px] text-emerald-700 hover:text-emerald-800 font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition active:scale-95"
                          >
                            {isCumulativeAbsence ? 'Aplicar Descuento' : 'Justificar / Gestionar'}
                          </button>
                        )}

                        {!alert.read && (
                          <button
                            type="button"
                            onClick={() => onMarkAsRead(alert.id)}
                            className="text-slate-400 hover:text-slate-600 py-1 px-1.5 text-[11px] font-medium transition"
                          >
                            Marcar leída
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
