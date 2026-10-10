'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/common/Header';
import { OfflineBanner } from '@/components/common/OfflineBanner';
import { AttendanceKiosk } from '@/components/attendance/AttendanceKiosk';
import { AttendanceHistory } from '@/components/attendance/AttendanceHistory';
import { LiveShiftMonitor } from '@/components/supervisor/LiveShiftMonitor';
import { IncidentsModule } from '@/components/incidents/IncidentsModule';
import { PrePayrollModule } from '@/components/payroll/PrePayrollModule';
import { CollaboratorsModule } from '@/components/admin/CollaboratorsModule';
import {
  INITIAL_PROFILES,
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_OVERTIME_LOGS,
  INITIAL_INCIDENTS,
  INITIAL_PREPAYROLL_DATA,
  INITIAL_ATTENDANCE_ALERTS,
} from '@/lib/mock-data';
import {
  UserProfile,
  AttendanceRecord,
  OvertimeLog,
  Incident,
  IncidentStatus,
  PrePayrollSummaryItem,
  AttendanceAlert,
} from '@/types';
import { syncManager } from '@/lib/offline/sync-manager';
import { getPendingCount } from '@/lib/offline/indexed-db';
import { ShieldCheck } from 'lucide-react';

export default function Home() {
  const [profiles, setProfiles] = useState<UserProfile[]>(INITIAL_PROFILES);
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_PROFILES[0]);
  const [records, setRecords] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE_RECORDS);
  const [overtimeLogs, setOvertimeLogs] = useState<OvertimeLog[]>(INITIAL_OVERTIME_LOGS);
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [prepayrollData, setPrepayrollData] = useState<PrePayrollSummaryItem[]>(INITIAL_PREPAYROLL_DATA);
  const [alerts, setAlerts] = useState<AttendanceAlert[]>(INITIAL_ATTENDANCE_ALERTS);
  const [activeView, setActiveView] = useState<string>('kiosk');

  // Network & Sync State
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator !== 'undefined') return navigator.onLine;
    return true;
  });
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncResult, setLastSyncResult] = useState<{ success: number; failed: number } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      }

      const unsubscribe = syncManager.subscribe((count, result) => {
        setPendingSyncCount(count);
        if (result) {
          setLastSyncResult(result);
          setTimeout(() => setLastSyncResult(null), 5000);
        }
      });

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        unsubscribe();
      };
    }
  }, []);

  const refreshPendingCount = async () => {
    const count = await getPendingCount();
    setPendingSyncCount(count);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    const result = await syncManager.syncPendingPunches();
    setIsSyncing(false);
    setLastSyncResult(result);
    await refreshPendingCount();
  };

  const toggleOnline = () => {
    setIsOnline(prev => {
      const next = !prev;
      if (next) {
        syncManager.syncPendingPunches();
      }
      return next;
    });
  };

  const handleRecordCreated = (newRecord: AttendanceRecord) => {
    setRecords(prev => [newRecord, ...prev]);
    refreshPendingCount();

    if (
      newRecord.status === 'retardo_leve' ||
      newRecord.status === 'retardo_grave' ||
      newRecord.status === 'fuera_geocerca'
    ) {
      const isGrave = newRecord.status === 'retardo_grave';
      const isGeofence = newRecord.status === 'fuera_geocerca';
      const alertItem: AttendanceAlert = {
        id: `alt-${Date.now()}`,
        user_id: newRecord.user_id,
        user_name: newRecord.user_name || currentUser.full_name,
        employee_number: currentUser.employee_number,
        department: currentUser.department,
        type: isGrave ? 'retardo_grave' : 'retardo_leve',
        severity: isGrave ? 'danger' : 'warning',
        title: isGeofence
          ? 'Marcaje Fuera de Geocerca'
          : isGrave
          ? 'Retardo Grave (+30 min)'
          : 'Retardo en Tolerancia',
        description: `Marcaje ${newRecord.event_type} a las ${newRecord.local_timestamp}.`,
        timestamp: newRecord.timestamp,
        read: false,
        resolved: false,
      };
      setAlerts(prev => [alertItem, ...prev]);
    }
  };

  const handleMarkAlertAsRead = (id: string) => {
    setAlerts(prev => prev.map(a => (a.id === id ? { ...a, read: true } : a)));
  };

  const handleMarkAllAlertsAsRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
  };

  const handleResolveAlert = (id: string, approverName: string) => {
    setAlerts(prev =>
      prev.map(a =>
        a.id === id
          ? {
              ...a,
              resolved: true,
              resolved_by: approverName,
              resolved_at: new Date().toISOString(),
            }
          : a
      )
    );
  };

  const handleApproveOvertime = (id: string, approverName: string) => {
    setOvertimeLogs(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              status: 'aprobado_jefe',
              approved_by: approverName,
              approved_at: new Date().toISOString(),
            }
          : item
      )
    );
  };

  const handleRejectOvertime = (id: string, reason: string) => {
    setOvertimeLogs(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              status: 'rechazado',
              rejection_reason: reason,
            }
          : item
      )
    );
  };

  const handleSendToPrepayroll = (id: string) => {
    const target = overtimeLogs.find(o => o.id === id);
    if (!target) return;

    setOvertimeLogs(prev =>
      prev.map(item => (item.id === id ? { ...item, status: 'computable_prenomina' } : item))
    );

    setPrepayrollData(prev =>
      prev.map(p => {
        if (p.user_id === target.user_id) {
          const isDouble = target.multiplier_type === 'doble';
          const newDoubleHrs = isDouble ? p.overtime_double_hours + target.hours : p.overtime_double_hours;
          const newDoubleMxn = isDouble
            ? p.overtime_double_total_mxn + target.total_payout_mxn
            : p.overtime_double_total_mxn;
          const newTripleHrs = !isDouble ? p.overtime_triple_hours + target.hours : p.overtime_triple_hours;
          const newTripleMxn = !isDouble
            ? p.overtime_triple_total_mxn + target.total_payout_mxn
            : p.overtime_triple_total_mxn;

          const newGross = p.regular_salary_total + newDoubleMxn + newTripleMxn + p.sunday_premium_mxn;
          const newNet = newGross - p.total_deductions_mxn;

          return {
            ...p,
            overtime_double_hours: Number(newDoubleHrs.toFixed(2)),
            overtime_double_total_mxn: Number(newDoubleMxn.toFixed(2)),
            overtime_triple_hours: Number(newTripleHrs.toFixed(2)),
            overtime_triple_total_mxn: Number(newTripleMxn.toFixed(2)),
            gross_earnings_mxn: Number(newGross.toFixed(2)),
            net_payable_mxn: Number(newNet.toFixed(2)),
          };
        }
        return p;
      })
    );
  };

  const handleAddIncident = (newIncident: Incident) => {
    setIncidents(prev => [newIncident, ...prev]);
  };

  const handleUpdateIncidentStatus = (id: string, status: IncidentStatus, approverName: string) => {
    setIncidents(prev =>
      prev.map(inc =>
        inc.id === id
          ? {
              ...inc,
              status,
              approved_by: approverName,
              approved_at: new Date().toISOString(),
            }
          : inc
      )
    );
  };

  const handleAddCollaborator = (newProfile: UserProfile) => {
    setProfiles(prev => [newProfile, ...prev]);

    // Automatically register employee in pre-payroll summary
    const newPrePayrollItem: PrePayrollSummaryItem = {
      user_id: newProfile.id,
      employee_number: newProfile.employee_number,
      full_name: newProfile.full_name,
      department: newProfile.department,
      position: newProfile.position,
      employee_type: newProfile.employee_type,
      daily_salary_mxn: newProfile.daily_salary_mxn,
      regular_days_worked: 5,
      regular_salary_total: Number((newProfile.daily_salary_mxn * 5).toFixed(2)),
      justified_absences: 0,
      unjustified_absences: 0,
      absence_deductions_mxn: 0,
      tardiness_count: 0,
      tardiness_deductions_mxn: 0,
      overtime_double_hours: 0,
      overtime_double_total_mxn: 0,
      overtime_triple_hours: 0,
      overtime_triple_total_mxn: 0,
      sunday_premium_mxn: 0,
      holiday_worked_mxn: 0,
      gross_earnings_mxn: Number((newProfile.daily_salary_mxn * 5).toFixed(2)),
      total_deductions_mxn: 0,
      net_payable_mxn: Number((newProfile.daily_salary_mxn * 5).toFixed(2)),
      nom151_batch_hash: `${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
    };

    setPrepayrollData(prev => [newPrePayrollItem, ...prev]);
  };

  const handleDeleteCollaborator = (id: string) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
    setPrepayrollData(prev => prev.filter(p => p.user_id !== id));

    // If active user is the one deleted, fallback to another active admin
    if (currentUser.id === id) {
      const fallback =
        profiles.find(p => p.id !== id && p.role === 'superadmin_rh') ||
        profiles.find(p => p.id !== id) ||
        INITIAL_PROFILES[0];
      setCurrentUser(fallback);
    }
  };

  const handleSelectUser = (profile: UserProfile) => {
    setCurrentUser(profile);
    if (
      profile.role !== 'superadmin_rh' &&
      (activeView === 'payroll' || activeView === 'collaborators')
    ) {
      setActiveView('kiosk');
    } else if (profile.role === 'colaborador' && activeView === 'monitor') {
      setActiveView('kiosk');
    }
  };

  // Dynamic quick-switch presets
  const superAdminPreset = profiles.find(p => p.role === 'superadmin_rh');
  const supervisorPreset = profiles.find(p => p.role === 'supervisor_ops');
  const driverPreset = profiles.find(p => p.employee_type === 'chofer');
  const officePreset = profiles.find(p => p.employee_type === 'oficina' && p.role === 'colaborador');
  const homeOfficePreset = profiles.find(p => p.employee_type === 'home_office');
  const constructorPreset = profiles.find(p => p.employee_type === 'constructor');
  const securityPreset = profiles.find(p => p.employee_type === 'seguridad');
  const salesPreset = profiles.find(p => p.employee_type === 'vendedor_campo');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Navbar */}
      <Header
        currentUser={currentUser}
        allProfiles={profiles}
        onSelectUser={handleSelectUser}
        activeView={activeView}
        onSelectView={setActiveView}
        isOnline={isOnline}
        onToggleOnline={toggleOnline}
        pendingSyncCount={pendingSyncCount}
        alerts={alerts}
        onMarkAsRead={handleMarkAlertAsRead}
        onMarkAllAsRead={handleMarkAllAlertsAsRead}
        onResolveAlert={handleResolveAlert}
      />

      {/* Offline Banner */}
      <OfflineBanner
        isOnline={isOnline}
        pendingSyncCount={pendingSyncCount}
        isSyncing={isSyncing}
        onManualSync={handleManualSync}
        lastSyncResult={lastSyncResult}
      />

      {/* Minimal Role Quick-Switch Bar (Worky Style) */}
      <div className="bg-white border-b border-slate-200/80 px-4 py-2">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Usuario activo:</span>
            <span className="font-semibold text-slate-800">{currentUser.full_name}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 capitalize">
              {currentUser.role === 'superadmin_rh'
                ? 'SuperAdmin'
                : currentUser.role === 'supervisor_ops'
                ? 'Supervisor'
                : currentUser.employee_type.replace('_', ' ')}
            </span>
          </div>

          {/* Quick preset switches */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
            {superAdminPreset && (
              <button
                type="button"
                onClick={() => handleSelectUser(superAdminPreset)}
                className={`px-2.5 py-1 rounded-lg transition shrink-0 ${
                  currentUser.id === superAdminPreset.id
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                SuperAdmin RH
              </button>
            )}
            {supervisorPreset && (
              <button
                type="button"
                onClick={() => handleSelectUser(supervisorPreset)}
                className={`px-2.5 py-1 rounded-lg transition shrink-0 ${
                  currentUser.id === supervisorPreset.id
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Supervisor Ops
              </button>
            )}
            {driverPreset && (
              <button
                type="button"
                onClick={() => handleSelectUser(driverPreset)}
                className={`px-2.5 py-1 rounded-lg transition shrink-0 ${
                  currentUser.id === driverPreset.id
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Chofer ({driverPreset.full_name.split(' ')[0]})
              </button>
            )}
            {officePreset && (
              <button
                type="button"
                onClick={() => handleSelectUser(officePreset)}
                className={`px-2.5 py-1 rounded-lg transition shrink-0 ${
                  currentUser.id === officePreset.id
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Oficina ({officePreset.full_name.split(' ')[0]})
              </button>
            )}
            {homeOfficePreset && (
              <button
                type="button"
                onClick={() => handleSelectUser(homeOfficePreset)}
                className={`px-2.5 py-1 rounded-lg transition shrink-0 ${
                  currentUser.id === homeOfficePreset.id
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Home Office
              </button>
            )}
            {constructorPreset && (
              <button
                type="button"
                onClick={() => handleSelectUser(constructorPreset)}
                className={`px-2.5 py-1 rounded-lg transition shrink-0 ${
                  currentUser.id === constructorPreset.id
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Constructor
              </button>
            )}
            {securityPreset && (
              <button
                type="button"
                onClick={() => handleSelectUser(securityPreset)}
                className={`px-2.5 py-1 rounded-lg transition shrink-0 ${
                  currentUser.id === securityPreset.id
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Seguridad
              </button>
            )}
            {salesPreset && (
              <button
                type="button"
                onClick={() => handleSelectUser(salesPreset)}
                className={`px-2.5 py-1 rounded-lg transition shrink-0 ${
                  currentUser.id === salesPreset.id
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Ventas Campo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6">
        {activeView === 'kiosk' && (
          <AttendanceKiosk
            currentUser={currentUser}
            onRecordCreated={handleRecordCreated}
            isOnline={isOnline}
          />
        )}

        {activeView === 'history' && (
          <AttendanceHistory currentUser={currentUser} records={records} />
        )}

        {activeView === 'monitor' && (
          <LiveShiftMonitor
            records={records}
            profiles={profiles}
            overtimeLogs={overtimeLogs}
            onApproveOvertime={handleApproveOvertime}
            onRejectOvertime={handleRejectOvertime}
            onSendToPrepayroll={handleSendToPrepayroll}
            alerts={alerts}
            onResolveAlert={handleResolveAlert}
          />
        )}

        {activeView === 'incidents' && (
          <IncidentsModule
            currentUser={currentUser}
            incidents={incidents}
            onAddIncident={handleAddIncident}
            onUpdateStatus={handleUpdateIncidentStatus}
          />
        )}

        {activeView === 'payroll' && (
          <PrePayrollModule payrollItems={prepayrollData} />
        )}

        {activeView === 'collaborators' && currentUser.role === 'superadmin_rh' && (
          <CollaboratorsModule
            currentUser={currentUser}
            profiles={profiles}
            onAddProfile={handleAddCollaborator}
            onDeleteProfile={handleDeleteCollaborator}
          />
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="w-full border-t border-slate-200 bg-white py-4 px-4 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verifield • NOM-151-SCFI & LFT</span>
          </div>
          <div>Green Seven México • Asistencia, 40 Horas & Pre-Nómina</div>
        </div>
      </footer>
    </div>
  );
}
