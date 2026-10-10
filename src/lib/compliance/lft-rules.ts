/**
 * Motor de Reglas Laborales y Compliance LFT (Ley Federal del Trabajo de México)
 * Incluye:
 * - Reforma de Jornada Laboral de 40 Horas Semanales y límites diarios
 * - Tabla oficial de Vacaciones Dignas (Reforma 2023, Art. 76 LFT)
 * - Tolerancias de retardo y acumulación para deducción/falta
 * - Cálculo de Horas Extras según Art. 66, 67 y 68 de la LFT (9 primeras al 200%, excedentes al 300%)
 */

import { AttendanceStatus } from '@/types';

export const LFT_CONSTANTS = {
  DEFAULT_WEEKLY_LIMIT_HOURS: 40, // Reforma de jornada 40 horas
  MAX_DOUBLE_OVERTIME_HOURS_PER_WEEK: 9, // Art. 66 y 67 LFT: máx 3 hrs diarias, 3 veces por semana = 9 hrs dobles
  DOUBLE_OVERTIME_FACTOR: 2.0, // 200%
  TRIPLE_OVERTIME_FACTOR: 3.0, // 300%
  DEFAULT_ENTRY_TOLERANCE_MINUTES: 15,
  RETARDOS_POR_FALTA_DEFAULT: 3,
  VACATION_PREMIUM_MIN_PERCENT: 0.25, // Art. 80 LFT: 25% prima vacacional
  HOLIDAY_WORKED_MULTIPLIER: 3.0, // Art. 73 LFT: Salario ordinario + salario doble por el servicio prestado
};

/**
 * Tabla oficial de Vacaciones Dignas México (LFT Art. 76)
 * @param hireDateString Fecha de ingreso YYYY-MM-DD
 * @returns { yearsOfSeniority, statutoryVacationDays }
 */
export function calculateVacacionesDignas(hireDateString: string): {
  yearsOfSeniority: number;
  statutoryVacationDays: number;
} {
  const hireDate = new Date(hireDateString);
  const now = new Date();
  
  let years = now.getFullYear() - hireDate.getFullYear();
  const m = now.getMonth() - hireDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < hireDate.getDate())) {
    years--;
  }

  const seniority = Math.max(0, years);

  if (seniority < 1) {
    // Primer año en curso (derecho al cumplir el 1er año: 12 días)
    return { yearsOfSeniority: seniority, statutoryVacationDays: 12 };
  } else if (seniority === 1) {
    return { yearsOfSeniority: 1, statutoryVacationDays: 12 };
  } else if (seniority === 2) {
    return { yearsOfSeniority: 2, statutoryVacationDays: 14 };
  } else if (seniority === 3) {
    return { yearsOfSeniority: 3, statutoryVacationDays: 16 };
  } else if (seniority === 4) {
    return { yearsOfSeniority: 4, statutoryVacationDays: 18 };
  } else if (seniority === 5) {
    return { yearsOfSeniority: 5, statutoryVacationDays: 20 };
  } else if (seniority >= 6 && seniority <= 10) {
    return { yearsOfSeniority: seniority, statutoryVacationDays: 22 };
  } else if (seniority >= 11 && seniority <= 15) {
    return { yearsOfSeniority: seniority, statutoryVacationDays: 24 };
  } else if (seniority >= 16 && seniority <= 20) {
    return { yearsOfSeniority: seniority, statutoryVacationDays: 26 };
  } else if (seniority >= 21 && seniority <= 25) {
    return { yearsOfSeniority: seniority, statutoryVacationDays: 28 };
  } else if (seniority >= 26 && seniority <= 30) {
    return { yearsOfSeniority: seniority, statutoryVacationDays: 30 };
  } else {
    return { yearsOfSeniority: seniority, statutoryVacationDays: 32 };
  }
}

/**
 * Evalúa si una hora de entrada es puntual, en tolerancia o retardo
 */
export function evaluateEntryStatus(
  entryTimeString: string, // e.g. "08:14"
  scheduledEntryTimeString: string, // e.g. "08:00"
  toleranceMinutes: number = LFT_CONSTANTS.DEFAULT_ENTRY_TOLERANCE_MINUTES
): {
  status: AttendanceStatus;
  minutesLate: number;
  message: string;
} {
  const [entryH, entryM] = entryTimeString.split(':').map(Number);
  const [schedH, schedM] = scheduledEntryTimeString.split(':').map(Number);

  const entryMinutesTotal = entryH * 60 + entryM;
  const schedMinutesTotal = schedH * 60 + schedM;

  const diffMinutes = entryMinutesTotal - schedMinutesTotal;

  if (diffMinutes <= 0) {
    return { status: 'puntual', minutesLate: 0, message: 'Puntual - A tiempo' };
  } else if (diffMinutes <= toleranceMinutes) {
    return {
      status: 'en_tolerancia',
      minutesLate: diffMinutes,
      message: `En tolerancia permitida (${diffMinutes} min)`,
    };
  } else if (diffMinutes <= toleranceMinutes + 15) {
    return {
      status: 'retardo_leve',
      minutesLate: diffMinutes,
      message: `Retardo Leve (${diffMinutes} min)`,
    };
  } else {
    return {
      status: 'retardo_grave',
      minutesLate: diffMinutes,
      message: `Retardo Grave (${diffMinutes} min)`,
    };
  }
}

/**
 * Desglosa horas extraordinarias semanales conforme a la LFT (Art. 66-68)
 * - Primeras 9 horas a la semana: 100% adicional (pagadas dobles)
 * - Excedente de 9 horas a la semana: 200% adicional (pagadas triples)
 */
export function calculateOvertimeBreakdown(
  totalOvertimeHoursThisWeek: number,
  hourlyRateMxn: number
): {
  doubleHours: number;
  tripleHours: number;
  doublePayoutMxn: number;
  triplePayoutMxn: number;
  totalPayoutMxn: number;
} {
  const doubleHours = Math.min(totalOvertimeHoursThisWeek, LFT_CONSTANTS.MAX_DOUBLE_OVERTIME_HOURS_PER_WEEK);
  const tripleHours = Math.max(0, totalOvertimeHoursThisWeek - LFT_CONSTANTS.MAX_DOUBLE_OVERTIME_HOURS_PER_WEEK);

  const doublePayoutMxn = doubleHours * (hourlyRateMxn * LFT_CONSTANTS.DOUBLE_OVERTIME_FACTOR);
  const triplePayoutMxn = tripleHours * (hourlyRateMxn * LFT_CONSTANTS.TRIPLE_OVERTIME_FACTOR);

  return {
    doubleHours: Number(doubleHours.toFixed(2)),
    tripleHours: Number(tripleHours.toFixed(2)),
    doublePayoutMxn: Number(doublePayoutMxn.toFixed(2)),
    triplePayoutMxn: Number(triplePayoutMxn.toFixed(2)),
    totalPayoutMxn: Number((doublePayoutMxn + triplePayoutMxn).toFixed(2)),
  };
}

/**
 * Calcula la distancia en metros entre dos coordenadas GPS (Fórmula de Haversine)
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Radio de la Tierra en metros
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}
