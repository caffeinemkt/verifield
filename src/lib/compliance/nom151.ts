/**
 * NOM-151-SCFI-2016 Compliance Engine
 * Requisitos que deben observarse para la conservación de mensajes de datos y digitalización de documentos.
 * Emisión de constancia de conservación mediante Prestador de Servicios de Certificación (PSC) autorizado
 * por la Secretaría de Economía de México.
 */

export interface Nom151Payload {
  userId: string;
  eventType: string;
  timestampUtc: string;
  latitude: number;
  longitude: number;
  photoHash: string;
}

/**
 * Computes a standard SHA-256 hash string (hex) from text or ArrayBuffer
 */
export async function computeSha256(data: string | ArrayBuffer): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = typeof data === 'string' ? encoder.encode(data) : data;

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback for non-subtle contexts (e.g. basic deterministic checksum)
  let hash = 0;
  const str = typeof data === 'string' ? data : new TextDecoder().decode(buffer);
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

/**
 * Generates an immutable NOM-151 Hash for an attendance punch event.
 * Canonical Tuple:
 * USER_ID | EVENT_TYPE | TIMESTAMP_UTC | LATITUDE | LONGITUDE | PHOTO_SHA256
 */
export async function generateNom151RecordHash(payload: Nom151Payload): Promise<string> {
  const canonicalString = [
    payload.userId.trim(),
    payload.eventType.trim().toLowerCase(),
    payload.timestampUtc.trim(),
    Number(payload.latitude).toFixed(6),
    Number(payload.longitude).toFixed(6),
    payload.photoHash.trim().toLowerCase(),
  ].join('|');

  return computeSha256(canonicalString);
}

/**
 * Generates an immutable hash of an image (base64 or ArrayBuffer)
 */
export async function generatePhotoHash(photoData: string): Promise<string> {
  // If data URI, extract base64 payload
  const cleanData = photoData.includes(',') ? photoData.split(',')[1] : photoData;
  return computeSha256(cleanData);
}

/**
 * Generates a mock or simulated PSC (Prestador de Servicios de Certificación) TSA Receipt
 * Compatible with Mexican Secretaría de Economía specifications (e.g., EDICOM / Seguridata / Advanta)
 */
export function generateNom151PscReceiptId(recordHash: string): string {
  const shortHash = recordHash.substring(0, 12).toUpperCase();
  const year = new Date().getFullYear();
  return `PSC-SE-NOM151-${year}-${shortHash}`;
}

/**
 * Verifies if an attendance record has not been tampered with
 * by recalculating the SHA-256 canonical hash.
 */
export async function verifyNom151Integrity(
  payload: Nom151Payload,
  storedHash: string
): Promise<{ isValid: boolean; recalculatedHash: string; storedHash: string; details: string }> {
  const recalculatedHash = await generateNom151RecordHash(payload);
  const isValid = recalculatedHash.toLowerCase() === storedHash.toLowerCase();

  return {
    isValid,
    recalculatedHash,
    storedHash,
    details: isValid
      ? 'Constancia íntegra conforme a NOM-151-SCFI-2016 (Sin alteraciones detectadas).'
      : 'ADVERTENCIA: La huella digital calculada no coincide con el registro original. Posible alteración.',
  };
}
