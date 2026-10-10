'use client';

import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Trash2,
  Search,
  Building2,
  MapPin,
  AlertTriangle,
  X,
  CheckCircle2,
  Truck,
  Layers,
  Home,
  Briefcase,
  HardHat,
  Shield,
} from 'lucide-react';
import { UserProfile, UserRole, EmployeeType } from '@/types';
import { INITIAL_BASE_STATIONS } from '@/lib/mock-data';
import { GeofenceMapPicker } from './GeofenceMapPicker';

interface CollaboratorsModuleProps {
  currentUser: UserProfile;
  profiles: UserProfile[];
  onAddProfile: (newProfile: UserProfile) => void;
  onDeleteProfile: (id: string) => void;
}

export const CollaboratorsModule: React.FC<CollaboratorsModuleProps> = ({
  currentUser,
  profiles,
  onAddProfile,
  onDeleteProfile,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | EmployeeType>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<UserProfile | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // New collaborator form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    employeeNumber: '',
    role: 'colaborador' as UserRole,
    employeeType: 'oficina' as EmployeeType,
    department: 'Administración y Finanzas',
    position: '',
    baseName: INITIAL_BASE_STATIONS[0].name,
    baseAddress: INITIAL_BASE_STATIONS[0].address,
    baseLat: INITIAL_BASE_STATIONS[0].latitude,
    baseLng: INITIAL_BASE_STATIONS[0].longitude,
    geofenceRadius: INITIAL_BASE_STATIONS[0].radius_meters,
    dailySalary: '650',
    hireDate: new Date().toISOString().split('T')[0],
  });

  const [formError, setFormError] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Filter profiles
  const filteredProfiles = profiles.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      p.full_name.toLowerCase().includes(term) ||
      p.email.toLowerCase().includes(term) ||
      p.employee_number.toLowerCase().includes(term) ||
      p.position.toLowerCase().includes(term) ||
      p.department.toLowerCase().includes(term) ||
      p.base_name.toLowerCase().includes(term);

    const matchesType = typeFilter === 'all' || p.employee_type === typeFilter;
    const matchesRole = roleFilter === 'all' || p.role === roleFilter;

    return matchesSearch && matchesType && matchesRole;
  });

  // Calculate quick stats
  const totalProfiles = profiles.length;
  const driverCount = profiles.filter((p) => p.employee_type === 'chofer').length;
  const officeCount = profiles.filter((p) => p.employee_type === 'oficina').length;
  const homeOfficeCount = profiles.filter((p) => p.employee_type === 'home_office').length;
  const constructionCount = profiles.filter((p) => p.employee_type === 'constructor').length;
  const securityCount = profiles.filter((p) => p.employee_type === 'seguridad').length;
  const salesCount = profiles.filter((p) => p.employee_type === 'vendedor_campo').length;

  const handleOpenAdd = () => {
    const defaultBase = INITIAL_BASE_STATIONS[0];
    const randomNum = Math.floor(100 + Math.random() * 900);
    setFormData({
      fullName: '',
      email: '',
      employeeNumber: `EMP-${randomNum}`,
      role: 'colaborador',
      employeeType: 'oficina',
      department: 'Administración y Finanzas',
      position: '',
      baseName: defaultBase.name,
      baseAddress: defaultBase.address,
      baseLat: defaultBase.latitude,
      baseLng: defaultBase.longitude,
      geofenceRadius: defaultBase.radius_meters,
      dailySalary: '650',
      hireDate: new Date().toISOString().split('T')[0],
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleTypeChange = (newType: EmployeeType) => {
    let prefix = 'EMP';
    let defaultDept = 'Administración';
    let defaultPos = '';
    let base = INITIAL_BASE_STATIONS[0];
    let radius = 150;

    switch (newType) {
      case 'chofer':
        prefix = 'CHOF';
        defaultDept = 'Transporte y Distribución';
        defaultPos = 'Operador de Ruta Quinta Rueda';
        base = INITIAL_BASE_STATIONS[2] || INITIAL_BASE_STATIONS[0];
        radius = 500;
        break;
      case 'home_office':
        prefix = 'REM';
        defaultDept = 'Tecnología y Operaciones';
        defaultPos = 'Analista Home Office';
        base = INITIAL_BASE_STATIONS[5] || INITIAL_BASE_STATIONS[0];
        radius = 100;
        break;
      case 'vendedor_campo':
        prefix = 'VEN';
        defaultDept = 'Ventas y Comercial';
        defaultPos = 'Ejecutivo de Cuentas Campo';
        base = INITIAL_BASE_STATIONS[0];
        radius = 800;
        break;
      case 'constructor':
        prefix = 'OBRA';
        defaultDept = 'Construcción e Infraestructura';
        defaultPos = 'Residente de Obra / Supervisor';
        base = INITIAL_BASE_STATIONS[3] || INITIAL_BASE_STATIONS[0];
        radius = 200;
        break;
      case 'seguridad':
        prefix = 'SEG';
        defaultDept = 'Seguridad Patrimonial';
        defaultPos = 'Oficial de Seguridad y Control de Acceso';
        base = INITIAL_BASE_STATIONS[4] || INITIAL_BASE_STATIONS[0];
        radius = 80;
        break;
      case 'operativo':
        prefix = 'OP';
        defaultDept = 'Almacén y Embarques';
        defaultPos = 'Coordinador de Almacén CEDIS';
        base = INITIAL_BASE_STATIONS[1] || INITIAL_BASE_STATIONS[0];
        radius = 300;
        break;
      default:
        prefix = 'EMP';
        defaultDept = 'Administración y Finanzas';
        defaultPos = 'Analista Administrativo';
        base = INITIAL_BASE_STATIONS[0];
        radius = 150;
        break;
    }

    const randomNum = Math.floor(100 + Math.random() * 900);
    setFormData((prev) => ({
      ...prev,
      employeeType: newType,
      employeeNumber: `${prefix}-${randomNum}`,
      department: defaultDept,
      position: defaultPos || prev.position,
      baseName: base.name,
      baseAddress: base.address,
      baseLat: base.latitude,
      baseLng: base.longitude,
      geofenceRadius: radius,
    }));
  };

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setFormError('El nombre completo es obligatorio.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setFormError('Ingresa un correo electrónico válido.');
      return;
    }
    if (!formData.employeeNumber.trim()) {
      setFormError('El número de empleado es obligatorio.');
      return;
    }
    if (!formData.position.trim()) {
      setFormError('El puesto o cargo es obligatorio.');
      return;
    }

    const salary = parseFloat(formData.dailySalary);
    if (isNaN(salary) || salary <= 0) {
      setFormError('Ingresa un salario diario válido en MXN.');
      return;
    }

    // Check duplicate employee number or email
    const duplicateEmp = profiles.find(
      (p) =>
        p.employee_number.toLowerCase() === formData.employeeNumber.trim().toLowerCase()
    );
    if (duplicateEmp) {
      setFormError(`El número de empleado "${formData.employeeNumber}" ya está en uso.`);
      return;
    }

    const duplicateEmail = profiles.find(
      (p) => p.email.toLowerCase() === formData.email.trim().toLowerCase()
    );
    if (duplicateEmail) {
      setFormError(`El correo "${formData.email}" ya está registrado.`);
      return;
    }

    // Pick avatar placeholder based on gender/profile
    const avatarStock = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    ];
    const randomAvatar = avatarStock[Math.floor(Math.random() * avatarStock.length)];

    const newProfile: UserProfile = {
      id: `usr-${Date.now()}`,
      full_name: formData.fullName.trim(),
      email: formData.email.trim().toLowerCase(),
      employee_number: formData.employeeNumber.trim().toUpperCase(),
      role: formData.role,
      employee_type: formData.employeeType,
      department: formData.department.trim(),
      position: formData.position.trim(),
      avatar_url: randomAvatar,
      base_name: formData.baseName || 'Ubicación Asignada',
      base_address: formData.baseAddress,
      base_lat: formData.baseLat,
      base_lng: formData.baseLng,
      geofence_radius: formData.geofenceRadius,
      hire_date: formData.hireDate,
      daily_salary_mxn: salary,
      schedule_id:
        formData.employeeType === 'chofer' ? 'sched-40h-chofer' : 'sched-40h-oficina',
    };

    onAddProfile(newProfile);
    setIsAddModalOpen(false);
    showNotification(`Colaborador ${newProfile.full_name} dado de alta exitosamente en Verifield.`);
  };

  const handleConfirmDelete = () => {
    if (!profileToDelete) return;
    if (profileToDelete.id === currentUser.id) {
      alert('No puedes eliminar tu propio usuario en sesión activa.');
      return;
    }
    const name = profileToDelete.full_name;
    onDeleteProfile(profileToDelete.id);
    setProfileToDelete(null);
    showNotification(`Colaborador ${name} eliminado de la plantilla.`);
  };

  const renderTypeBadge = (type: EmployeeType) => {
    switch (type) {
      case 'oficina':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Building2 className="w-2.5 h-2.5" />
            Oficina
          </span>
        );
      case 'chofer':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
            <Truck className="w-2.5 h-2.5" />
            Chofer
          </span>
        );
      case 'home_office':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium text-[10px] bg-purple-50 text-purple-700 border border-purple-200">
            <Home className="w-2.5 h-2.5" />
            Home Office
          </span>
        );
      case 'vendedor_campo':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium text-[10px] bg-teal-50 text-teal-700 border border-teal-200">
            <Briefcase className="w-2.5 h-2.5" />
            Vendedor Campo
          </span>
        );
      case 'constructor':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium text-[10px] bg-amber-50 text-amber-700 border border-amber-200">
            <HardHat className="w-2.5 h-2.5" />
            Constructor
          </span>
        );
      case 'seguridad':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Shield className="w-2.5 h-2.5" />
            Seguridad
          </span>
        );
      case 'operativo':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium text-[10px] bg-orange-50 text-orange-700 border border-orange-200">
            <Layers className="w-2.5 h-2.5" />
            Operativo
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {notification && (
        <div className="bg-emerald-600 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-md flex items-center justify-between transition">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-emerald-100 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header & Actions Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Gestión de Colaboradores • Verifield
            </h2>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2 py-0.5 rounded-full">
              {totalProfiles} Activos
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Alta y baja de modalidades: Oficina, Home Office, Choferes, Vendedores, Constructores y Seguridad.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition active:scale-[0.98]"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nuevo Colaborador</span>
        </button>
      </div>

      {/* Extended Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-medium uppercase tracking-wider">Oficina</span>
            <Building2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <p className="text-lg font-bold text-slate-800 mt-1">{officeCount}</p>
          <p className="text-[9px] text-slate-400">Geocerca 150m</p>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-medium uppercase tracking-wider">Home Office</span>
            <Home className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <p className="text-lg font-bold text-slate-800 mt-1">{homeOfficeCount}</p>
          <p className="text-[9px] text-slate-400">Residencial 100m</p>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-medium uppercase tracking-wider">Choferes</span>
            <Truck className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <p className="text-lg font-bold text-slate-800 mt-1">{driverCount}</p>
          <p className="text-[9px] text-slate-400">Ruta Satelital</p>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-medium uppercase tracking-wider">Ventas Campo</span>
            <Briefcase className="w-3.5 h-3.5 text-teal-500" />
          </div>
          <p className="text-lg font-bold text-slate-800 mt-1">{salesCount}</p>
          <p className="text-[9px] text-slate-400">Visitas a Clientes</p>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-medium uppercase tracking-wider">Constructor</span>
            <HardHat className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <p className="text-lg font-bold text-slate-800 mt-1">{constructionCount}</p>
          <p className="text-[9px] text-slate-400">Geocerca Obra</p>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-medium uppercase tracking-wider">Seguridad</span>
            <Shield className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <p className="text-lg font-bold text-slate-800 mt-1">{securityCount}</p>
          <p className="text-[9px] text-slate-400">Caseta / 80m</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, puesto, base o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-emerald-500 transition"
          />
        </div>

        {/* Filter Selectors */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | EmployeeType)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white focus:outline-hidden focus:border-emerald-500"
          >
            <option value="all">Todas las Modalidades</option>
            <option value="oficina">🏢 Oficina</option>
            <option value="home_office">🏠 Home Office</option>
            <option value="chofer">🚛 Chofer / Ruta</option>
            <option value="vendedor_campo">💼 Vendedor de Campo</option>
            <option value="constructor">🏗️ Constructor / Obra</option>
            <option value="seguridad">🛡️ Seguridad / Caseta</option>
            <option value="operativo">📦 Operativo / Almacén</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'all' | UserRole)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white focus:outline-hidden focus:border-emerald-500"
          >
            <option value="all">Todos los Roles</option>
            <option value="colaborador">Colaborador</option>
            <option value="supervisor_ops">Supervisor</option>
            <option value="superadmin_rh">SuperAdmin</option>
          </select>
        </div>
      </div>

      {/* Collaborators List (Clean Table / Cards) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredProfiles.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
            <p>No se encontraron colaboradores que coincidan con la búsqueda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Colaborador</th>
                  <th className="py-3 px-3">Puesto & Área</th>
                  <th className="py-3 px-3">Modalidad & Rol</th>
                  <th className="py-3 px-3">Geocerca & Base</th>
                  <th className="py-3 px-3">Ingreso & Salario</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProfiles.map((p) => {
                  const isCurrentSession = p.id === currentUser.id;
                  const yearsSeniority =
                    new Date().getFullYear() - new Date(p.hire_date).getFullYear();

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/80 transition duration-150 group"
                    >
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={
                              p.avatar_url ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                            }
                            alt={p.full_name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900">
                                {p.full_name}
                              </span>
                              {isCurrentSession && (
                                <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.2 rounded">
                                  Tú
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400">
                              <span>{p.employee_number}</span>
                              <span>•</span>
                              <span className="truncate max-w-[140px]">{p.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Position & Department */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800">{p.position}</div>
                        <div className="text-[11px] text-slate-400">{p.department}</div>
                      </td>

                      {/* Type & Role Badges */}
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {renderTypeBadge(p.employee_type)}

                          <span className="px-2 py-0.5 rounded-md font-medium text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
                            {p.role === 'superadmin_rh'
                              ? 'Admin'
                              : p.role === 'supervisor_ops'
                              ? 'Supervisor'
                              : 'Colaborador'}
                          </span>
                        </div>
                      </td>

                      {/* Base Station & Geofence */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 text-slate-700 font-medium truncate max-w-[160px]">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{p.base_name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 pl-4">
                          Radio: {p.geofence_radius}m • ({p.base_lat.toFixed(4)}, {p.base_lng.toFixed(4)})
                        </div>
                      </td>

                      {/* Seniority & Salary */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">
                          ${p.daily_salary_mxn.toFixed(2)}{' '}
                          <span className="text-[10px] text-slate-400 font-normal">/día</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Ingreso: {p.hire_date} ({yearsSeniority}a)
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setProfileToDelete(p)}
                          disabled={isCurrentSession}
                          title={
                            isCurrentSession
                              ? 'No puedes eliminar tu propio usuario en sesión'
                              : 'Dar de baja colaborador'
                          }
                          className={`p-1.5 rounded-lg border transition ${
                            isCurrentSession
                              ? 'opacity-30 cursor-not-allowed border-slate-200 text-slate-400'
                              : 'text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 border-slate-200'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Agregar Colaborador with Interactive Map & Extended Types */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 sticky top-0 bg-white z-20">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Alta de Nuevo Colaborador</h3>
                  <p className="text-[11px] text-slate-400">Verifield • Green Seven México</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitNew} className="mt-4 space-y-4 text-xs">
              {/* Extended Types Selector */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5 text-[11px]">
                  Tipo de Colaborador / Modalidad Laboral
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('oficina')}
                    className={`py-2 px-2.5 rounded-xl border text-center transition flex items-center justify-center gap-1.5 ${
                      formData.employeeType === 'oficina'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Oficina</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTypeChange('home_office')}
                    className={`py-2 px-2.5 rounded-xl border text-center transition flex items-center justify-center gap-1.5 ${
                      formData.employeeType === 'home_office'
                        ? 'bg-purple-50 text-purple-700 border-purple-300 font-bold shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Home className="w-3.5 h-3.5 text-purple-600" />
                    <span>Home Office</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTypeChange('chofer')}
                    className={`py-2 px-2.5 rounded-xl border text-center transition flex items-center justify-center gap-1.5 ${
                      formData.employeeType === 'chofer'
                        ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Chofer / Ruta</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTypeChange('vendedor_campo')}
                    className={`py-2 px-2.5 rounded-xl border text-center transition flex items-center justify-center gap-1.5 ${
                      formData.employeeType === 'vendedor_campo'
                        ? 'bg-teal-50 text-teal-700 border-teal-300 font-bold shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5 text-teal-600" />
                    <span>Vendedor Campo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTypeChange('constructor')}
                    className={`py-2 px-2.5 rounded-xl border text-center transition flex items-center justify-center gap-1.5 ${
                      formData.employeeType === 'constructor'
                        ? 'bg-amber-50 text-amber-700 border-amber-300 font-bold shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <HardHat className="w-3.5 h-3.5 text-amber-600" />
                    <span>Constructor / Obra</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTypeChange('seguridad')}
                    className={`py-2 px-2.5 rounded-xl border text-center transition flex items-center justify-center gap-1.5 ${
                      formData.employeeType === 'seguridad'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-300 font-bold shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Seguridad</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTypeChange('operativo')}
                    className={`py-2 px-2.5 rounded-xl border text-center transition flex items-center justify-center gap-1.5 sm:col-span-2 ${
                      formData.employeeType === 'operativo'
                        ? 'bg-orange-50 text-orange-700 border-orange-300 font-bold shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-orange-600" />
                    <span>Operativo / CEDIS</span>
                  </button>
                </div>
              </div>

              {/* Nombre y Correo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Arq. Ricardo Morales Nava"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="ricardo.morales@verifield.mx"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* No. Empleado y Rol */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                    No. Empleado *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="OBRA-402 / EMP-030"
                    value={formData.employeeNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, employeeNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                    Rol en Verifield
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value as UserRole })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-emerald-500 bg-white"
                  >
                    <option value="colaborador">Colaborador (Checador & Solicitudes)</option>
                    <option value="supervisor_ops">Supervisor (Turnos & Horas Extras)</option>
                    <option value="superadmin_rh">SuperAdmin RH (Control Total)</option>
                  </select>
                </div>
              </div>

              {/* Puesto y Departamento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                    Puesto / Cargo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Residente de Obra / Analista"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                    Departamento
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Interactive Geofence Map Picker */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                  Nombre de la Base o Proyecto
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Obra Residencial Polanco / Corporativo Santa Fe"
                  value={formData.baseName}
                  onChange={(e) => setFormData({ ...formData, baseName: e.target.value })}
                  className="w-full px-3 py-2 mb-2.5 rounded-lg border border-slate-200 focus:outline-hidden focus:border-emerald-500 font-medium text-slate-800"
                />

                <GeofenceMapPicker
                  latitude={formData.baseLat}
                  longitude={formData.baseLng}
                  radiusMeters={formData.geofenceRadius}
                  address={formData.baseAddress}
                  onChangeCoords={(lat, lng) =>
                    setFormData((prev) => ({ ...prev, baseLat: lat, baseLng: lng }))
                  }
                  onChangeRadius={(radius) =>
                    setFormData((prev) => ({ ...prev, geofenceRadius: radius }))
                  }
                  onChangeAddress={(addr) =>
                    setFormData((prev) => ({
                      ...prev,
                      baseAddress: addr,
                      baseName: prev.baseName || addr,
                    }))
                  }
                />
              </div>

              {/* Salario y Fecha de Ingreso */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                    Salario Diario ($ MXN) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      $
                    </span>
                    <input
                      type="number"
                      step="10"
                      min="250"
                      required
                      value={formData.dailySalary}
                      onChange={(e) =>
                        setFormData({ ...formData, dailySalary: e.target.value })
                      }
                      className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                    Fecha de Ingreso *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.hireDate}
                    onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 sticky bottom-0 bg-white py-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                >
                  Guardar Colaborador en Verifield
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Eliminación */}
      {profileToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-200 text-center">
            <div className="w-11 h-11 rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <h3 className="font-bold text-slate-900 text-sm">
              ¿Dar de baja a colaborador?
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Estás a punto de eliminar a{' '}
              <span className="font-semibold text-slate-800">
                {profileToDelete.full_name}
              </span>{' '}
              ({profileToDelete.employee_number}). No podrá realizar marcajes ni aparecerá en la
              plantilla activa.
            </p>

            <div className="mt-5 flex items-center justify-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setProfileToDelete(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold shadow-xs"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
