/**
 * lib/supabasePosko.ts
 * Sync statistik per kelurahan ke Supabase untuk monitoring supervisor.
 * Tidak menyimpan data mentah PBP — hanya angka agregat & log pelayanan.
 *
 * Tabel yang dibutuhkan:
 *   posko_ringkasan      — 31 rows, upsert per kelurahan
 *   posko_log_pelayanan  — log per PBP yang dilayani
 */

import { supabase } from "@/lib/supabase";
import type { LogEntry } from "@/types";

// ── Tipe ──────────────────────────────────────────────────────────────────────

export interface RingkasanKelurahan {
  kelurahan: string;
  kecamatan: string;
  total_sukses: number;
  total_pengaduan: number;
  bast_jumlah: number;
  bast_diupload_at: string | null;
  sudah_serah_jumlah: number;
  belum_serah_jumlah: number;
  verified_fisik: number;
  review_fisik: number;
  mismatch_fisik: number;
  last_updated_at: string | null;
}

// ── Ringkasan Kelurahan ───────────────────────────────────────────────────────

export async function upsertRingkasanKelurahan(
  data: Partial<RingkasanKelurahan> & { kelurahan: string; kecamatan: string }
): Promise<void> {
  await supabase.from("posko_ringkasan").upsert(
    { ...data, last_updated_at: new Date().toISOString() },
    { onConflict: "kelurahan" }
  );
}

export async function ambilSemuaRingkasan(): Promise<RingkasanKelurahan[]> {
  const { data, error } = await supabase
    .from("posko_ringkasan")
    .select("*")
    .order("kelurahan", { ascending: true });
  if (error || !data) return [];
  return data as RingkasanKelurahan[];
}

export function subscribeRingkasan(
  onUpdate: (updated: RingkasanKelurahan) => void
) {
  return supabase
    .channel("posko_ringkasan_realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "posko_ringkasan" },
      (payload) => onUpdate(payload.new as RingkasanKelurahan)
    )
    .subscribe();
}

// ── Log Pelayanan ─────────────────────────────────────────────────────────────

export async function kirimLogPelayananKeSupabase(
  entry: LogEntry,
  kecamatan: string
): Promise<void> {
  await supabase.from("posko_log_pelayanan").insert({
    kelurahan: entry.posko,
    kecamatan,
    nama_pbp: entry.nama,
    nik: entry.nik,
    status: entry.status,
    waktu: entry.waktu,
    alokasi_kg: entry.alokasiKg,
  });
}

export async function ambilLogPelayananKelurahan(
  kelurahan: string
): Promise<LogEntry[]> {
  const { data, error } = await supabase
    .from("posko_log_pelayanan")
    .select("*")
    .eq("kelurahan", kelurahan)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error || !data) return [];
  return data.map((r) => ({
    waktu: r.waktu ?? r.created_at ?? "",
    nama: r.nama_pbp ?? "",
    nik: r.nik ?? "",
    kelurahanAsal: r.kelurahan ?? "",
    posko: r.kelurahan ?? "",
    status: r.status as LogEntry["status"],
    alokasiKg: r.alokasi_kg ?? 0,
  }));
}
