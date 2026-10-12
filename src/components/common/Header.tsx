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
  MoreHorizontal,
  X,
  ShieldCheck,
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
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);

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

  const isMoreActive = activeView === 'payroll' || activeView === 'collaborators';

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6">
          {/* Top Navbar Row */}
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
            {/* Brand with Verifield and Green Seven Logo */}
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/green-seven-logo.jpg"
                alt="Green Seven México"
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl object-contain bg-white border border-slate-200/80 shadow-xs p-0.5 shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 leading-tight">
                  <span className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                    <span className="text-emerald-600">Veri</span>field
                  </span>
                  <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-1.5 py-0.2 rounded shrink-0">
                    NOM-151
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium block truncate max-w-[150px] sm:max-w-none">
                  Green Seven México • Asistencia LFT
                </span>
              </div>
            </div>

            {/* Clock (Desktop) */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 font-mono bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>{currentLocalTime} CDMX</span>
            </div>

            {/* Alerts, Online Toggle & User */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
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

              {/* Online/Offline status pill with min 40px touch area */}
              <button
                type="button"
                onClick={onToggleOnline}
                className={`h-9 px-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition active:scale-95 ${
                  isOnline
                    ? 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                    : 'bg-amber-50 text-amber-900 font-semibold border border-amber-300'
                }`}
                title="Alternar conexión para pruebas offline"
              >
                {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-600" /> : <WifiOff className="w-3.5 h-3.5 text-orange-600" />}
                <span className="hidden xs:inline">{isOnline ? 'Online' : 'Offline'}</span>
                {pendingSyncCount > 0 && (
                  <span className="bg-orange-500 text-white text-[10px] px-1 rounded-full font-bold">
                    {pendingSyncCount}
                  </span>
                )}
              </button>

              {/* User Dropdown */}
              <div className="relative">
                <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-2 h-9 transition cursor-pointer">
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
                    aria-label="Seleccionar usuario"
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

          {/* Desktop Navigation Tabs (Hidden on mobile) */}
          <div className="hidden sm:flex items-center gap-1 overflow-x-auto py-2 no-scrollbar text-xs border-t border-slate-100">
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

      {/* Mobile Ergonomic Bottom Navigation Bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom,0px)]">
        <div className="flex items-center justify-around h-15 px-1">
          {/* 1. Checador */}
          <button
            type="button"
            onClick={() => {
              onSelectView('kiosk');
              setIsMobileMoreOpen(false);
            }}
            className={`flex-1 py-1 flex flex-col items-center justify-center gap-0.5 transition active:scale-90 ${
              activeView === 'kiosk'
                ? 'text-emerald-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`p-1 rounded-xl transition ${activeView === 'kiosk' ? 'bg-emerald-50 text-emerald-600' : ''}`}>
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[10px] leading-tight">Checador</span>
          </button>

          {/* 2. Historial */}
          <button
            type="button"
            onClick={() => {
              onSelectView('history');
              setIsMobileMoreOpen(false);
            }}
            className={`flex-1 py-1 flex flex-col items-center justify-center gap-0.5 transition active:scale-90 ${
              activeView === 'history'
                ? 'text-emerald-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`p-1 rounded-xl transition ${activeView === 'history' ? 'bg-emerald-50 text-emerald-600' : ''}`}>
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <span className="text-[10px] leading-tight">Historial</span>
          </button>

          {/* 3. Vacaciones / Permisos */}
          <button
            type="button"
            onClick={() => {
              onSelectView('incidents');
              setIsMobileMoreOpen(false);
            }}
            className={`flex-1 py-1 flex flex-col items-center justify-center gap-0.5 transition active:scale-90 ${
              activeView === 'incidents'
                ? 'text-emerald-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`p-1 rounded-xl transition ${activeView === 'incidents' ? 'bg-emerald-50 text-emerald-600' : ''}`}>
              <Palmtree className="w-5 h-5" />
            </div>
            <span className="text-[10px] leading-tight">Permisos</span>
          </button>

          {/* 4. Turnos & 40h (Visible to Admin and Supervisor) */}
          {(isSuperAdmin || isSupervisor) && (
            <button
              type="button"
              onClick={() => {
                onSelectView('monitor');
                setIsMobileMoreOpen(false);
              }}
              className={`flex-1 py-1 flex flex-col items-center justify-center gap-0.5 transition active:scale-90 ${
                activeView === 'monitor'
                  ? 'text-emerald-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className={`p-1 rounded-xl transition ${activeView === 'monitor' ? 'bg-emerald-50 text-emerald-600' : ''}`}>
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[10px] leading-tight">Turnos</span>
            </button>
          )}

          {/* 5. More Admin Tools Sheet Button (For SuperAdmin) */}
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setIsMobileMoreOpen(prev => !prev)}
              className={`flex-1 py-1 flex flex-col items-center justify-center gap-0.5 transition active:scale-90 ${
                isMoreActive
                  ? 'text-emerald-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className={`p-1 rounded-xl transition ${isMoreActive ? 'bg-emerald-50 text-emerald-600' : ''}`}>
                {activeView === 'payroll' ? (
                  <FileSpreadsheet className="w-5 h-5" />
                ) : activeView === 'collaborators' ? (
                  <UserCog className="w-5 h-5" />
                ) : (
                  <MoreHorizontal className="w-5 h-5" />
                )}
              </div>
              <span className="text-[10px] leading-tight">
                {activeView === 'payroll' ? 'Nómina' : activeView === 'collaborators' ? 'Colabs' : 'Gestión'}
              </span>
            </button>
          )}
        </div>
      </nav>

      {/* Mobile "More" Drawer for SuperAdmin */}
      {isMobileMoreOpen && isSuperAdmin && (
        <div className="sm:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div
            className="fixed inset-0"
            onClick={() => setIsMobileMoreOpen(false)}
          />
          <div className="relative bg-white rounded-t-3xl p-5 shadow-2xl border-t border-slate-200 space-y-3 animate-in slide-in-from-bottom duration-200">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto -mt-1 mb-2" />
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Módulos Administrativos</h3>
                <p className="text-[11px] text-slate-500">Gestión laboral Green Seven México</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMoreOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  onSelectView('payroll');
                  setIsMobileMoreOpen(false);
                }}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-3 transition active:scale-95 ${
                  activeView === 'payroll'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Pre-Nómina</div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Layouts CONTPAQi, Aspel & LFT</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectView('collaborators');
                  setIsMobileMoreOpen(false);
                }}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-3 transition active:scale-95 ${
                  activeView === 'collaborators'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <UserCog className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Colaboradores</div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Altas, bajas y geocercas</p>
                </div>
              </button>
            </div>

            <div className="pt-2 text-center">
              <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1 font-mono">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                NOM-151 • LFT 40 HORAS
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

