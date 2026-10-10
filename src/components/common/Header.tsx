'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCog,
  Clock,
  FileSpreadsheet,
  Palmtree,
  Wifi,
  WifiOff,
  ChevronDown,
} from 'lucide-react';
import { UserProfile, AttendanceAlert } from '@/types';
import { AlertsNotificationCenter } from './AlertsNotificationCenter';

interface HeaderProps {
  currentUser: UserProfile;
  allProfiles: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
  activeView: string;
  onSelectView: (view: string) => void;
  isOnline: boolean;
  onToggleOnline: () => void;
  pendingSyncCount: number;
  alerts: AttendanceAlert[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onResolveAlert: (id: string, approverName: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  allProfiles,
  onSelectUser,
  activeView,
  onSelectView,
  isOnline,
  onToggleOnline,
  pendingSyncCount,
  alerts,
  onMarkAsRead,
  onMarkAllAsRead,
  onResolveAlert,
}) => {
  const [currentLocalTime, setCurrentLocalTime] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentLocalTime(
        now.toLocaleTimeString('es-MX', {
          timeZone: 'America/Mexico_City',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const isSuperAdmin = currentUser.role === 'superadmin_rh';
  const isSupervisor = currentUser.role === 'supervisor_ops';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Top Navbar Row */}
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand with Verifield and Green Seven Logo */}
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/green-seven-logo.jpg"
              alt="Green Seven México"
              className="h-10 w-10 rounded-xl object-contain bg-white border border-slate-200/80 shadow-xs p-0.5 shrink-0"
            />
            <div>
              <div className="flex items-center gap-1.5 leading-tight">
                <span className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                  <span className="text-emerald-600">Veri</span>field
                </span>
                <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-1.5 py-0.2 rounded">
                  NOM-151
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium block">
                Green Seven México • Asistencia & Nómina LFT
              </span>
            </div>
          </div>

          {/* Clock */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 font-mono bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>{currentLocalTime} CDMX</span>
          </div>

          {/* Alerts, Online Toggle & User */}
          <div className="flex items-center gap-2">
            {/* Alerts Center for Admin & Supervisor */}
            {(isSuperAdmin || isSupervisor) && (
              <AlertsNotificationCenter
                alerts={alerts}
                onMarkAsRead={onMarkAsRead}
                onMarkAllAsRead={onMarkAllAsRead}
                onResolveAlert={onResolveAlert}
                currentUserName={currentUser.full_name}
              />
            )}

            <button
              type="button"
              onClick={onToggleOnline}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                isOnline
                  ? 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  : 'bg-amber-50 text-amber-900 font-semibold border border-amber-300'
              }`}
              title="Alternar conexión para pruebas offline"
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-600" /> : <WifiOff className="w-3.5 h-3.5 text-orange-600" />}
              <span>{isOnline ? 'Online' : 'Offline'}</span>
              {pendingSyncCount > 0 && (
                <span className="bg-orange-500 text-white text-[10px] px-1 rounded-full font-bold">
                  {pendingSyncCount}
                </span>
              )}
            </button>

            {/* User Dropdown */}
            <div className="relative">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-2 py-1 transition cursor-pointer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={currentUser.full_name}
                  className="w-6 h-6 rounded-full object-cover border border-emerald-500/40"
                />
                <span className="text-xs font-semibold text-slate-800 hidden md:inline truncate max-w-[120px]">
                  {currentUser.full_name.split(' ')[0]}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />

                <select
                  value={currentUser.id}
                  onChange={e => {
                    const found = allProfiles.find(p => p.id === e.target.value);
                    if (found) onSelectUser(found);
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                >
                  {allProfiles.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.role === 'superadmin_rh' ? 'SuperAdmin' : p.role === 'supervisor_ops' ? 'Supervisor' : p.employee_type})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Minimal Navigation Tabs with Green Seven accents */}
        <div className="flex items-center gap-1 overflow-x-auto py-2 no-scrollbar text-xs border-t border-slate-100">
          <button
            type="button"
            onClick={() => onSelectView('kiosk')}
            className={`px-3 py-1.5 rounded-lg font-medium transition shrink-0 flex items-center gap-1.5 ${
              activeView === 'kiosk'
                ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Checador
          </button>

          <button
            type="button"
            onClick={() => onSelectView('history')}
            className={`px-3 py-1.5 rounded-lg font-medium transition shrink-0 flex items-center gap-1.5 ${
              activeView === 'history'
                ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Historial de Marcajes
          </button>

          <button
            type="button"
            onClick={() => onSelectView('incidents')}
            className={`px-3 py-1.5 rounded-lg font-medium transition shrink-0 flex items-center gap-1.5 ${
              activeView === 'incidents'
                ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Palmtree className="w-3.5 h-3.5" />
            Vacaciones & Permisos
          </button>

          {(isSuperAdmin || isSupervisor) && (
            <button
              type="button"
              onClick={() => onSelectView('monitor')}
              className={`px-3 py-1.5 rounded-lg font-medium transition shrink-0 flex items-center gap-1.5 ${
                activeView === 'monitor'
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Turnos & 40h
            </button>
          )}

          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => onSelectView('payroll')}
              className={`px-3 py-1.5 rounded-lg font-medium transition shrink-0 flex items-center gap-1.5 ${
                activeView === 'payroll'
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Pre-Nómina
            </button>
          )}

          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => onSelectView('collaborators')}
              className={`px-3 py-1.5 rounded-lg font-medium transition shrink-0 flex items-center gap-1.5 ${
                activeView === 'collaborators'
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <UserCog className="w-3.5 h-3.5" />
              Colaboradores
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
