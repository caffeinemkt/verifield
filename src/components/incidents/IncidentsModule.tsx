'use client';

import React, { useState } from 'react';
import {
  Palmtree,
  Plus,
  FileCheck,
  UploadCloud,
  Check,
  X,
} from 'lucide-react';
import { Incident, IncidentType, IncidentStatus, UserProfile } from '@/types';
import { calculateVacacionesDignas } from '@/lib/compliance/lft-rules';

interface IncidentsModuleProps {
  currentUser: UserProfile;
  incidents: Incident[];
  onAddIncident: (incident: Incident) => void;
  onUpdateStatus: (id: string, status: IncidentStatus, approverName: string) => void;
}

const INCIDENT_LABELS: Record<IncidentType, { label: string; badge: string }> = {
  vacaciones: { label: 'Vacaciones Dignas', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  permiso_con_goce: { label: 'Permiso con Goce', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  permiso_sin_goce: { label: 'Permiso sin Goce', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  incapacidad_enfermedad: { label: 'Incapacidad IMSS (Enfermedad)', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
  incapacidad_riesgo_trabajo: { label: 'Incapacidad IMSS (Riesgo)', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  incapacidad_maternidad: { label: 'Incapacidad Maternidad', badge: 'bg-pink-50 text-pink-700 border-pink-200' },
  falta_justificada: { label: 'Falta Justificada', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
  falta_injustificada: { label: 'Falta Injustificada', badge: 'bg-red-50 text-red-700 border-red-200' },
};

export const IncidentsModule: React.FC<IncidentsModuleProps> = ({
  currentUser,
  incidents,
  onAddIncident,
  onUpdateStatus,
}) => {
  const [showNewModal, setShowNewModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | IncidentStatus>('all');

  const [selectedType, setSelectedType] = useState<IncidentType>('vacaciones');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [comments, setComments] = useState('');
  const [mockFileName, setMockFileName] = useState('');

  const isManagerOrAdmin = currentUser.role === 'superadmin_rh' || currentUser.role === 'supervisor_ops';

  const vacationStats = calculateVacacionesDignas(currentUser.hire_date);
  const vacationsUsed = incidents
    .filter(i => i.user_id === currentUser.id && i.type === 'vacaciones' && i.status === 'aprobada')
    .reduce((acc, curr) => acc + curr.days_count, 0);
  const vacationDaysAvailable = Math.max(0, vacationStats.statutoryVacationDays - vacationsUsed);

  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const daysCount = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

    const newInc: Incident = {
      id: `inc-${Date.now()}`,
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      type: selectedType,
      start_date: startDate,
      end_date: endDate,
      days_count: daysCount,
      document_name: mockFileName || undefined,
      document_url: mockFileName ? 'https://example.com/' + mockFileName : undefined,
      status: 'pendiente',
      comments: comments || 'Solicitud de incidencia',
      created_at: new Date().toISOString(),
    };

    onAddIncident(newInc);
    setShowNewModal(false);
    setComments('');
    setMockFileName('');
  };

  const filteredIncidents = incidents.filter(i => {
    if (!isManagerOrAdmin && i.user_id !== currentUser.id) return false;
    if (statusFilter !== 'all' && i.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="w-full space-y-4">
      {/* Vacation Balance Hero Card (Worky Style) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <Palmtree className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-emerald-700">Vacaciones Dignas (LFT)</div>
            <h3 className="text-xl font-bold text-slate-900">
              {vacationDaysAvailable} días disponibles
            </h3>
            <p className="text-xs text-slate-500">
              {currentUser.full_name} • {vacationStats.yearsOfSeniority} años de antigüedad
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 text-center">
            <span className="text-[10px] text-slate-400 block">Por Ley</span>
            <span className="text-sm font-bold text-slate-800">{vacationStats.statutoryVacationDays}d</span>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 text-center">
            <span className="text-[10px] text-slate-400 block">Tomados</span>
            <span className="text-sm font-bold text-amber-600">{vacationsUsed}d</span>
          </div>
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition ml-2"
          >
            <Plus className="w-4 h-4" />
            Nueva Solicitud
          </button>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900">Historial de Solicitudes</h4>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Estatus:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as 'all' | IncidentStatus)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-slate-700 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">Todas</option>
              <option value="pendiente">Pendientes</option>
              <option value="aprobada">Aprobadas</option>
              <option value="rechazada">Rechazadas</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-4">Colaborador</th>
                <th className="py-2.5 px-4">Tipo</th>
                <th className="py-2.5 px-4">Periodo</th>
                <th className="py-2.5 px-4 text-center">Días</th>
                <th className="py-2.5 px-4">Adjunto</th>
                <th className="py-2.5 px-4 text-center">Estatus</th>
                {isManagerOrAdmin && <th className="py-2.5 px-4 text-center">Acción</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredIncidents.map(inc => {
                const labelCfg = INCIDENT_LABELS[inc.type];

                return (
                  <tr key={inc.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-4 font-medium text-slate-900">{inc.user_name}</td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${labelCfg.badge}`}>
                        {labelCfg.label}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">
                      {inc.start_date} al {inc.end_date}
                    </td>
                    <td className="py-2.5 px-4 text-center font-bold text-slate-800">{inc.days_count}d</td>
                    <td className="py-2.5 px-4">
                      {inc.document_name ? (
                        <span className="flex items-center gap-1 text-blue-600 truncate max-w-[140px] text-[11px]">
                          <FileCheck className="w-3.5 h-3.5 shrink-0" />
                          {inc.document_name}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                          inc.status === 'aprobada'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : inc.status === 'rechazada'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {inc.status}
                      </span>
                    </td>
                    {isManagerOrAdmin && (
                      <td className="py-2.5 px-4 text-center">
                        {inc.status === 'pendiente' ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => onUpdateStatus(inc.id, 'aprobada', currentUser.full_name)}
                              className="p-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white transition"
                              title="Aprobar"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onUpdateStatus(inc.id, 'rechazada', currentUser.full_name)}
                              className="p-1 rounded bg-rose-600 hover:bg-rose-700 text-white transition"
                              title="Rechazar"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">-</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Request Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-200/80 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Nueva Solicitud de Incidencia</h3>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Tipo de Incidencia</label>
                <select
                  value={selectedType}
                  onChange={e => setSelectedType(e.target.value as IncidentType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="vacaciones">Vacaciones Dignas</option>
                  <option value="permiso_con_goce">Permiso con Goce</option>
                  <option value="permiso_sin_goce">Permiso sin Goce</option>
                  <option value="incapacidad_enfermedad">Incapacidad Médica IMSS</option>
                  <option value="incapacidad_riesgo_trabajo">Riesgo de Trabajo ST-7</option>
                  <option value="falta_justificada">Falta Justificada</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Inicio</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Fin</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Comprobante IMSS / Justificante</label>
                <div className="border border-dashed border-slate-200 bg-slate-50 rounded-xl p-3 text-center">
                  <UploadCloud className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  <p className="text-[11px] text-slate-500">
                    {mockFileName || 'Sin archivo adjunto'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setMockFileName(`Incapacidad_IMSS_${Math.floor(1000 + Math.random() * 9000)}.pdf`)}
                    className="text-[11px] text-blue-600 hover:underline mt-1 font-medium"
                  >
                    Simular adjuntar archivo
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Motivo (Opcional)</label>
                <input
                  type="text"
                  value={comments}
                  onChange={e => setComments(e.target.value)}
                  placeholder="Detalles breves..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="w-1/2 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  Solicitar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
