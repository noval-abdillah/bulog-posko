/**
 * lib/utils.ts
 * Utilitas murni tanpa DOM — aman dipakai di server maupun client.
 */

export function cleanStr(val: unknown): string {
  if (!val) return "";
  return String(val).toUpperCase().replace(/[^0-9A-Z]/g, "");
}

export function cleanNum(val: unknown): string {
  if (!val) return "";
  return String(val).replace(/[^0-9]/g, "");
}

/**
 * Sanitasi NIK 16-digit dari berbagai format rusak Excel:
 * - Notasi ilmiah: "3.17203E+15" → "3172030000000000" lalu diperbaiki
 * - Float Excel: 317203100401095 (kehilangan digit) → pad kiri ke 16 digit
 * - String normal: "3172031004010950" → tetap
 * - Leading zero hilang: "0317203..." → pad kiri
 */
export function fixNIK(val: unknown): string {
  if (val === null || val === undefined || val === "") return "";

  let raw = String(val).trim();

  // Jika berupa notasi ilmiah dari Excel (misal: 3.17203E+15)
  if (/^[\d.]+[eE][+\-]?\d+$/.test(raw)) {
    const num = Number(raw);
    if (!isNaN(num) && isFinite(num)) {
      raw = Math.round(num).toString();
    }
  }

  const normalized = raw.replace(/[OD]/gi, "0").replace(/[ILI]/gi, "1").replace(/B/gi, "8").replace(/S/gi, "5").replace(/Z/gi, "2");
  const digitsOnly = normalized.replace(/[^0-9]/g, "");

  if (digitsOnly.length === 0) return "";

  // Pad kiri ke 16 digit jika kurang (leading zero hilang)
  if (digitsOnly.length < 16 && digitsOnly.length >= 10) {
    return digitsOnly.padStart(16, "0");
  }

  // Jika lebih dari 16 digit, ambil 16 digit pertama
  if (digitsOnly.length > 16) {
    return digitsOnly.slice(0, 16);
  }

  return digitsOnly;
}

/**
 * Sanitasi No. KK 16-digit — sama logika dengan fixNIK
 */
export function fixNoKK(val: unknown): string {
  return fixNIK(val);
}

/**
 * Sanitasi No. KK / NIK dengan fallback ke cleanNum untuk field pendek
 */
export function fixNomor(val: unknown, minLen = 10): string {
  const fixed = fixNIK(val);
  if (fixed.length >= minLen) return fixed;
  return cleanNum(val);
}

export function formatWaktuSekarang(): string {
  return new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatTanggalFile(): string {
  return new Date().toISOString().slice(0, 10);
}
