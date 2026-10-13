export type UserRole = 'superadmin_rh' | 'supervisor_ops' | 'colaborador';
export type EmployeeType =
  | 'oficina'
  | 'chofer'
  | 'operativo'
  | 'home_office'
  | 'vendedor_campo'
  | 'constructor'
  | 'seguridad';
export type AttendanceEventType = 'check_in' | 'meal_start' | 'meal_end' | 'check_out';

export type AttendanceStatus = 
  | 'puntual' 
  | 'en_tolerancia' 
  | 'retardo_leve' 
  | 'retardo_grave' 
  | 'fuera_geocerca' 
  | 'justificado';

export type OvertimeStatus = 
  | 'pendiente_aprobacion' 
  | 'aprobado_jefe' 
  | 'computable_prenomina' 
  | 'rechazado';

export type IncidentType = 
  | 'vacaciones' 
  | 'permiso_con_goce' 
  | 'permiso_sin_goce' 
  | 'incapacidad_enfermedad' 
  | 'incapacidad_riesgo_trabajo' 
  | 'incapacidad_maternidad' 
  | 'falta_justificada' 
  | 'falta_injustificada';

export type IncidentStatus = 'pendiente' | 'aprobada' | 'rechazada';

export type AttendanceAlertType = 
  | 'retardo_leve' 
  | 'retardo_grave' 
  | 'falta_injustificada' 
  | 'retardos_acumulados_falta'
  | 'alteracion_reloj';

export interface AttendanceAlert {
  id: string;
  user_id: string;
  user_name: string;
  employee_number: string;
  department: string;
  type: AttendanceAlertType;
  severity: 'warning' | 'danger';
  title: string;
  description: string;
  timestamp: string;
  minutes_late?: number;
  read: boolean;
  resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  employee_number: string;
  role: UserRole;
  employee_type: EmployeeType;
  department: string;
  position: string;
  avatar_url?: string;
  base_name: string;
  base_address?: string;
  base_lat: number;
  base_lng: number;
  geofence_radius: number; // in meters (e.g. 150m)
  hire_date: string; // ISO date YYYY-MM-DD
  daily_salary_mxn: number;
  schedule_id: string;
}

export interface WorkSchedule {
  id: string;
  name: string;
  weekly_hours_limit: number; // 40 by default under Mexican reform
  daily_hours: number; // 8 hours
  entry_time: string; // "08:00"
  exit_time: string; // "17:00" (with 1 hour meal break)
  tolerance_minutes: number; // e.g. 15 min
  tardiness_to_absence_count: number; // e.g. 3 retardos = 1 falta
  work_days: number[]; // 1 to 5 (Mon to Fri) for 40 hours or flexible
}

export interface AttendanceRecord {
  id: string; // client_generated_uuid or supabase id
  user_id: string;
  user_name?: string;
  employee_type?: EmployeeType;
  event_type: AttendanceEventType;
  timestamp: string; // ISO UTC
  local_timestamp: string; // CDMX Local string
  is_offline: boolean;
  sync_timestamp?: string;
  latitude: number;
  longitude: number;
  accuracy_meters?: number;
  distance_to_base_meters?: number;
  is_geofence_violation: boolean;
  selfie_url: string; // Cloud URL or base64 data URL
  photo_hash: string; // SHA-256 of raw image
  status: AttendanceStatus;
  notes?: string;
  
  // NOM-151 SCFI-2016 Compliance Fields
  hash_nom151: string; // SHA-256 of immutable tuple
  nom151_cert_id: string; // PSC TSA Receipt ID
  audit_trail_id: string;

  // Anti-Tampering & Cybersecurity Fields
  is_device_clock_tampered?: boolean;
  clock_drift_seconds?: number;
  device_claimed_timestamp?: string;
  verified_time_source?: string;
  tampering_mitigation?: string;
}

export interface OvertimeLog {
  id: string;
  attendance_id: string;
  user_id: string;
  user_name: string;
  date: string;
  hours: number;
  multiplier_type: 'doble' | 'triple'; // First 9 hrs/wk double, remainder triple
  multiplier_factor: number; // 2.0 or 3.0
  hourly_rate_mxn: number;
  total_payout_mxn: number;
  status: OvertimeStatus;
  requested_at: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
}

export interface Incident {
  id: string;
  user_id: string;
  user_name: string;
  type: IncidentType;
  start_date: string;
  end_date: string;
  days_count: number;
  document_url?: string;
  document_name?: string;
  status: IncidentStatus;
  comments?: string;
  created_at: string;
  approved_by?: string;
  approved_at?: string;
}

export interface BaseStation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
}

export interface PrePayrollSummaryItem {
  user_id: string;
  employee_number: string;
  full_name: string;
  department: string;
  position: string;
  employee_type: EmployeeType;
  daily_salary_mxn: number;
  regular_days_worked: number;
  regular_salary_total: number;
  justified_absences: number;
  unjustified_absences: number;
  absence_deductions_mxn: number;
  tardiness_count: number;
  tardiness_deductions_mxn: number;
  overtime_double_hours: number;
  overtime_double_total_mxn: number;
  overtime_triple_hours: number;
  overtime_triple_total_mxn: number;
  sunday_premium_mxn: number;
  holiday_worked_mxn: number;
  gross_earnings_mxn: number;
  total_deductions_mxn: number;
  net_payable_mxn: number;
  nom151_batch_hash: string;
}

export interface Nom151AuditEntry {
  id: string;
  record_id: string;
  user_id: string;
  user_name: string;
  event_type: string;
  timestamp_utc: string;
  latitude: number;
  longitude: number;
  photo_hash: string;
  generated_hash: string;
  psc_provider: string; // e.g. "PSC EDICOM México / Seguridata NOM-151"
  tsa_receipt_id: string;
  is_verified: boolean;
}
