-- ==============================================================================
-- CHECADORPRO MX - ESQUEMA DE BASE DE DATOS POSTGRESQL PARA SUPABASE
-- Conforme a NOM-151-SCFI-2016, LFT (Reforma 40 Horas Semanales & Vacaciones Dignas)
-- ==============================================================================

-- 1. Habilitar extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Enumeraciones para tipos y estatus
CREATE TYPE user_role_type AS ENUM ('superadmin_rh', 'supervisor_ops', 'colaborador');
CREATE TYPE employee_category_type AS ENUM ('oficina', 'chofer', 'operativo');
CREATE TYPE attendance_event_type AS ENUM ('check_in', 'meal_start', 'meal_end', 'check_out');
CREATE TYPE attendance_status_type AS ENUM ('puntual', 'en_tolerancia', 'retardo_leve', 'retardo_grave', 'fuera_geocerca', 'justificado');
CREATE TYPE overtime_status_type AS ENUM ('pendiente_aprobacion', 'aprobado_jefe', 'computable_prenomina', 'rechazado');
CREATE TYPE incident_type_enum AS ENUM (
  'vacaciones', 
  'permiso_con_goce', 
  'permiso_sin_goce', 
  'incapacidad_enfermedad', 
  'incapacidad_riesgo_trabajo', 
  'incapacidad_maternidad', 
  'falta_justificada', 
  'falta_injustificada'
);
CREATE TYPE incident_status_type AS ENUM ('pendiente', 'aprobada', 'rechazada');

-- 3. Tabla: work_schedules (Jornadas laborales y topes de 40 horas semanales)
CREATE TABLE IF NOT EXISTS public.work_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    weekly_hours_limit NUMERIC(5,2) DEFAULT 40.00 NOT NULL, -- Tope 40 Horas Semanales Reforma LFT
    daily_hours NUMERIC(4,2) DEFAULT 8.00 NOT NULL,
    entry_time TIME NOT NULL DEFAULT '08:00:00',
    exit_time TIME NOT NULL DEFAULT '17:00:00',
    tolerance_minutes INTEGER DEFAULT 15 NOT NULL,
    tardiness_to_absence_count INTEGER DEFAULT 3 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla: profiles (Usuarios y colaboradores de la plataforma)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_number VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role_type NOT NULL DEFAULT 'colaborador',
    employee_type employee_category_type NOT NULL DEFAULT 'oficina',
    department VARCHAR(100) NOT NULL,
    position VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    base_name VARCHAR(150) NOT NULL DEFAULT 'Corporativo Santa Fe',
    base_lat NUMERIC(10,7) NOT NULL DEFAULT 19.3621400,
    base_lng NUMERIC(10,7) NOT NULL DEFAULT -99.2608300,
    geofence_radius INTEGER NOT NULL DEFAULT 150, -- Radio de tolerancia en metros
    hire_date DATE NOT NULL DEFAULT CURRENT_DATE, -- Para cómputo de Vacaciones Dignas
    daily_salary_mxn NUMERIC(10,2) NOT NULL DEFAULT 500.00,
    schedule_id UUID REFERENCES public.work_schedules(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabla: attendance_records (Registro de asistencia offline-first con sello NOM-151)
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY, -- Idempotencia mediante client_generated_uuid
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_type attendance_event_type NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    local_timestamp VARCHAR(80) NOT NULL,
    is_offline BOOLEAN DEFAULT FALSE,
    sync_timestamp TIMESTAMPTZ,
    latitude NUMERIC(10,7) NOT NULL,
    longitude NUMERIC(10,7) NOT NULL,
    accuracy_meters NUMERIC(6,2) DEFAULT 10.00,
    distance_to_base_meters INTEGER DEFAULT 0,
    is_geofence_violation BOOLEAN DEFAULT FALSE,
    selfie_url TEXT NOT NULL,
    photo_hash VARCHAR(64) NOT NULL, -- SHA-256 del testigo fotográfico
    status attendance_status_type NOT NULL DEFAULT 'puntual',
    notes TEXT,
    
    -- Cumplimiento NOM-151-SCFI-2016
    hash_nom151 VARCHAR(64) NOT NULL, -- SHA-256 inmutable (user_id + timestamp + lat + lng + photo_hash + event_type)
    nom151_cert_id VARCHAR(100) NOT NULL, -- Constancia de Prestador de Servicios de Certificación (PSC)
    audit_trail_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabla: overtime_logs (Autorización y desglose legal de Horas Extras según LFT)
CREATE TABLE IF NOT EXISTS public.overtime_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attendance_id UUID REFERENCES public.attendance_records(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hours NUMERIC(4,2) NOT NULL,
    multiplier_type VARCHAR(10) NOT NULL CHECK (multiplier_type IN ('doble', 'triple')), -- LFT 66 vs 68
    multiplier_factor NUMERIC(3,2) NOT NULL DEFAULT 2.00,
    hourly_rate_mxn NUMERIC(10,2) NOT NULL,
    total_payout_mxn NUMERIC(10,2) NOT NULL,
    status overtime_status_type NOT NULL DEFAULT 'pendiente_aprobacion',
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT
);

-- 7. Tabla: incidents (Vacaciones Dignas, Incapacidades IMSS, Permisos y Faltas)
CREATE TABLE IF NOT EXISTS public.incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type incident_type_enum NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count INTEGER NOT NULL DEFAULT 1,
    document_url TEXT,
    document_name VARCHAR(255),
    status incident_status_type NOT NULL DEFAULT 'pendiente',
    comments TEXT,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabla: nom151_audit_log (Bitácora forense auditable por la STPS)
CREATE TABLE IF NOT EXISTS public.nom151_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attendance_id UUID NOT NULL REFERENCES public.attendance_records(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    canonical_payload TEXT NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL,
    psc_provider VARCHAR(150) NOT NULL DEFAULT 'PSC EDICOM México / Autorizado Secretaría de Economía',
    tsa_receipt_id VARCHAR(100) NOT NULL,
    timestamp_utc TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 9. CONFIGURACIÓN DE ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overtime_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nom151_audit_log ENABLE ROW LEVEL SECURITY;

-- Funciones auxiliares de seguridad
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'superadmin_rh'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_supervisor_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('superadmin_rh', 'supervisor_ops')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas para Profiles
CREATE POLICY "Profiles: Los colaboradores pueden ver su perfil y administradores ven todo"
ON public.profiles FOR SELECT
USING (auth.uid() = id OR public.is_supervisor_or_admin());

CREATE POLICY "Profiles: Solo SuperAdmin puede modificar perfiles y salarios"
ON public.profiles FOR ALL
USING (public.is_admin());

-- Políticas para Attendance Records
CREATE POLICY "Attendance: Colaboradores pueden insertar sus propios marcajes"
ON public.attendance_records FOR INSERT
WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Attendance: Colaboradores leen sus registros; Supervisores y Admin ven todo"
ON public.attendance_records FOR SELECT
USING (auth.uid() = user_id OR public.is_supervisor_or_admin());

-- Políticas para Overtime Logs
CREATE POLICY "Overtime: Colaborador ve lo propio; Supervisores aprueban y administran"
ON public.overtime_logs FOR SELECT
USING (auth.uid() = user_id OR public.is_supervisor_or_admin());

CREATE POLICY "Overtime: Supervisores y Admin pueden autorizar o rechazar"
ON public.overtime_logs FOR UPDATE
USING (public.is_supervisor_or_admin());

-- Políticas para Incidents
CREATE POLICY "Incidents: Colaborador crea sus solicitudes"
ON public.incidents FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Incidents: Colaborador lee sus solicitudes; Supervisores y RH ven todo"
ON public.incidents FOR SELECT
USING (auth.uid() = user_id OR public.is_supervisor_or_admin());

CREATE POLICY "Incidents: Solo Supervisores y RH pueden dictaminar solicitudes"
ON public.incidents FOR UPDATE
USING (public.is_supervisor_or_admin());

-- Políticas para Bitácora NOM-151 (Solo lectura inmutable para auditoría)
CREATE POLICY "NOM-151 Audit: Lectura para administradores y auditores autorizados"
ON public.nom151_audit_log FOR SELECT
USING (public.is_supervisor_or_admin());

-- ==============================================================================
-- 10. SUPABASE STORAGE BUCKETS
-- ==============================================================================
-- Insertar configuración de buckets de almacenamiento
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('attendance-selfies', 'attendance-selfies', true),
  ('incident-documents', 'incident-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para fotos de asistencia
CREATE POLICY "Testigos Fotográficos: Acceso público de lectura"
ON storage.objects FOR SELECT
USING (bucket_id = 'attendance-selfies');

CREATE POLICY "Testigos Fotográficos: Subida permitida a usuarios autenticados"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'attendance-selfies');
