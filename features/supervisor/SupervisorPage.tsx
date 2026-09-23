/**
 * features/supervisor/SupervisorPage.tsx
 * Dashboard monitoring supervisor — ringkasan statistik 31 kelurahan secara real-time.
 * Data dikirim otomatis dari browser petugas saat mereka melakukan aksi (login tidak perlu upload).
 * Supervisor hanya memantau: tidak upload, tidak edit data petugas.
 */
"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { useAppStore } from "@/store/appStore";
import { useToast } from "@/components/ui/Toast";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  ambilSemuaRingkasan,
  ambilLogPelayananKelurahan,
  subscribeRingkasan,
  type RingkasanKelurahan,
} from "@/lib/supabasePosko";
import type { LogEntry } from "@/types";

const KECAMATAN_URUTAN = [
  "Koja", "Cilincing", "Kelapa Gading", "Pademangan", "Penjaringan", "Tanjung Priok",
];

export default function SupervisorPage() {
  const sessionPosko = useAppStore((s) => s.sessionPosko);
  const toast = useToast();

  const [ringkasan, setRingkasan]         = useState<RingkasanKelurahan[]>([]);
  const [loading, setLoading]             = useState(true);
  const [lastRefresh, setLastRefresh]     = useState<Date | null>(null);

  const [drillKelurahan, setDrillKelurahan] = useState<string | null>(null);
  const [drillLogs, setDrillLogs]           = useState<LogEntry[]>([]);
  const [drillLoading, setDrillLoading]     = useState(false);

  const muat = useCallback(async () => {
    setLoading(true);
    const data = await ambilSemuaRingkasan();
    setRingkasan(data);
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    muat();
    const channel = subscribeRingkasan((updated) => {
      setRingkasan((prev) => {
        const idx = prev.findIndex((r) => r.kelurahan === updated.kelurahan);
        if (idx === -1) return [...prev, updated];
        const next = [...prev];
        next[idx] = updated;
        return next;
      });
      setLastRefresh(new Date());
    });
    return () => { channel.unsubscribe(); };
  }, [muat]);

  async function handleDrillDown(kelurahan: string) {
    if (drillKelurahan === kelurahan) { setDrillKelurahan(null); return; }
    setDrillKelurahan(kelurahan);
    setDrillLoading(true);
    const logs = await ambilLogPelayananKelurahan(kelurahan);
    setDrillLogs(logs);
    setDrillLoading(false);
  }

  if (!sessionPosko?.isSuper) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        Halaman ini hanya dapat diakses oleh Supervisor.
      </div>
    );
  }

  // Hitung total agregat semua kelurahan
  const totalSukses    = ringkasan.reduce((a, r) => a + (r.total_sukses ?? 0), 0);
  const totalPengaduan = ringkasan.reduce((a, r) => a + (r.total_pengaduan ?? 0), 0);
  const totalVerified  = ringkasan.reduce((a, r) => a + (r.verified_fisik ?? 0), 0);
  const totalMismatch  = ringkasan.reduce((a, r) => a + (r.mismatch_fisik ?? 0), 0);
  const kelAktif       = ringkasan.filter((r) => (r.total_sukses ?? 0) + (r.total_pengaduan ?? 0) > 0).length;
  const kelBastTermuat = ringkasan.filter((r) => (r.bast_jumlah ?? 0) > 0).length;

  // Kelompokkan per kecamatan
  const perKecamatan = KECAMATAN_URUTAN.map((kec) => ({
    kecamatan: kec,
    rows: ringkasan.filter((r) => r.kecamatan === kec),
  }));
  const sisaRows = ringkasan.filter((r) => !KECAMATAN_URUTAN.includes(r.kecamatan ?? ""));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900">Monitoring Supervisor</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Data diperbarui otomatis saat petugas melakukan aktivitas di lapangan.
            {lastRefresh && (
              <span className="ml-2 text-slate-400">
                Terakhir: {lastRefresh.toLocaleTimeString("id-ID")}
              </span>
            )}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={muat}
          icon={
            <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
          }
        >
          {loading ? "Memuat…" : "Refresh"}
        </Button>
      </div>

      {/* KPI Agregat */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Kelurahan Aktif", value: `${kelAktif}/31`, color: kelAktif > 0 ? "text-emerald-700" : "text-slate-400", bg: "bg-emerald-50" },
          { label: "BAST Termuat", value: `${kelBastTermuat}/31`, color: kelBastTermuat > 0 ? "text-bulog-blue" : "text-slate-400", bg: "bg-blue-50" },
          { label: "Total Sukses Salur", value: totalSukses.toLocaleString("id-ID"), color: "text-emerald-700", bg: "bg-emerald-50" },
          { label: "Total Pengaduan", value: totalPengaduan.toLocaleString("id-ID"), color: totalPengaduan > 0 ? "text-amber-700" : "text-slate-400", bg: "bg-amber-50" },
          { label: "Terverifikasi Fisik", value: totalVerified.toLocaleString("id-ID"), color: totalVerified > 0 ? "text-emerald-700" : "text-slate-400", bg: "bg-emerald-50" },
          { label: "Ketidaksesuaian", value: totalMismatch.toLocaleString("id-ID"), color: totalMismatch > 0 ? "text-rose-700" : "text-slate-400", bg: "bg-rose-50" },
        ].map((k) => (
          <div key={k.label} className={`${k.bg} rounded-2xl px-4 py-3`}>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-tight">{k.label}</p>
            <p className={`text-xl font-black mt-1 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Tabel per kecamatan */}
      {loading && ringkasan.length === 0 ? (
        <Card>
          <div className="flex items-center justify-center py-12 gap-3 text-slate-400">
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            <span className="text-sm font-medium">Memuat data dari Supabase…</span>
          </div>
        </Card>
      ) : ringkasan.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <svg className="w-10 h-10 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 1 1 0 10h-2M8 12h8"/>
            </svg>
            <div>
              <p className="text-sm font-bold text-slate-600">Belum Ada Data Masuk</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Data akan muncul secara otomatis saat petugas kelurahan mulai melayani PBP, 
                upload BAST, atau menandai verifikasi fisik di browser mereka masing-masing.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-5">
          {[...perKecamatan, ...(sisaRows.length > 0 ? [{ kecamatan: "Lainnya", rows: sisaRows }] : [])].map(({ kecamatan, rows }) => {
            if (rows.length === 0) return null;
            return (
              <Card key={kecamatan} noPadding>
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Kecamatan {kecamatan}
                  </h2>
                  <span className="text-[10px] text-slate-400">{rows.length} kelurahan</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr className="text-[10px] font-black text-slate-500 uppercase tracking-wide">
                        <th className="px-4 py-2.5 text-left">Kelurahan</th>
                        <th className="px-4 py-2.5 text-center">BAST</th>
                        <th className="px-4 py-2.5 text-center">Sudah Serah</th>
                        <th className="px-4 py-2.5 text-center">Belum Serah</th>
                        <th className="px-4 py-2.5 text-center">Sukses Salur</th>
                        <th className="px-4 py-2.5 text-center">Pengaduan</th>
                        <th className="px-4 py-2.5 text-center">Verified Fisik</th>
                        <th className="px-4 py-2.5 text-center">Review / Beda</th>
                        <th className="px-4 py-2.5 text-center">Update</th>
                        <th className="px-4 py-2.5 text-center">Detail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {rows.map((r) => {
                        const aktif = (r.total_sukses ?? 0) + (r.total_pengaduan ?? 0) > 0;
                        const isDrill = drillKelurahan === r.kelurahan;
                        return (
                          <Fragment key={r.kelurahan}>
                            <tr
                              className={`transition ${isDrill ? "bg-bulog-light" : aktif ? "hover:bg-slate-50" : "opacity-60 hover:opacity-100 hover:bg-slate-50"}`}
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${aktif ? "bg-emerald-500" : "bg-slate-300"}`} />
                                  <span className="font-bold text-slate-900">{r.kelurahan}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                {(r.bast_jumlah ?? 0) > 0
                                  ? <Badge variant="success">{(r.bast_jumlah ?? 0).toLocaleString("id-ID")}</Badge>
                                  : <span className="text-slate-300">—</span>}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {(r.sudah_serah_jumlah ?? 0) > 0
                                  ? <Badge variant="blue">{(r.sudah_serah_jumlah ?? 0).toLocaleString("id-ID")}</Badge>
                                  : <span className="text-slate-300">—</span>}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {(r.belum_serah_jumlah ?? 0) > 0
                                  ? <Badge variant="warning">{(r.belum_serah_jumlah ?? 0).toLocaleString("id-ID")}</Badge>
                                  : <span className="text-slate-300">—</span>}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {(r.total_sukses ?? 0) > 0
                                  ? <span className="font-black text-emerald-700">{r.total_sukses}</span>
                                  : <span className="text-slate-300">—</span>}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {(r.total_pengaduan ?? 0) > 0
                                  ? <span className="font-black text-amber-600">{r.total_pengaduan}</span>
                                  : <span className="text-slate-300">—</span>}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {(r.verified_fisik ?? 0) > 0
                                  ? <span className="font-black text-emerald-700">{r.verified_fisik}</span>
                                  : <span className="text-slate-300">—</span>}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {((r.review_fisik ?? 0) + (r.mismatch_fisik ?? 0)) > 0 ? (
                                  <span className="font-bold text-rose-600">
                                    {(r.review_fisik ?? 0)}R · {(r.mismatch_fisik ?? 0)}X
                                  </span>
                                ) : <span className="text-slate-300">—</span>}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {r.last_updated_at ? (
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(r.last_updated_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                ) : <span className="text-slate-300">—</span>}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {aktif && (
                                  <button
                                    onClick={() => handleDrillDown(r.kelurahan)}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                                      isDrill
                                        ? "bg-bulog-blue text-white border-bulog-blue"
                                        : "border-slate-200 text-slate-600 hover:border-bulog-blue hover:text-bulog-blue"
                                    }`}
                                  >
                                    {isDrill ? "Tutup" : "Log"}
                                  </button>
                                )}
                              </td>
                            </tr>

                            {/* Drill-down row log pelayanan */}
                            {isDrill && (
                              <tr>
                                <td colSpan={10} className="px-4 pb-4 bg-bulog-light">
                                  <div className="pt-3">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">
                                      Log Pelayanan Harian — {r.kelurahan}
                                    </p>
                                    {drillLoading ? (
                                      <div className="flex items-center gap-2 text-slate-400 py-3">
                                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                                        </svg>
                                        <span className="text-xs">Memuat log…</span>
                                      </div>
                                    ) : drillLogs.length === 0 ? (
                                      <p className="text-xs text-slate-400 py-3">Belum ada log pelayanan.</p>
                                    ) : (
                                      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                                        <table className="w-full text-xs">
                                          <thead className="bg-slate-50 border-b border-slate-100">
                                            <tr className="text-[10px] font-black text-slate-500 uppercase">
                                              <th className="px-3 py-2 text-left">Waktu</th>
                                              <th className="px-3 py-2 text-left">Nama PBP</th>
                                              <th className="px-3 py-2 text-left">NIK</th>
                                              <th className="px-3 py-2 text-center">Status</th>
                                              <th className="px-3 py-2 text-center">Beras (Kg)</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-50">
                                            {drillLogs.map((l, i) => (
                                              <tr key={i} className="hover:bg-slate-50 transition">
                                                <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{l.waktu}</td>
                                                <td className="px-3 py-2 font-bold text-slate-900">{l.nama}</td>
                                                <td className="px-3 py-2 font-mono text-slate-500">{l.nik || "—"}</td>
                                                <td className="px-3 py-2 text-center">
                                                  <Badge variant={l.status === "SUKSES_SALUR" ? "success" : "warning"}>
                                                    {l.status === "SUKSES_SALUR" ? "Sukses" : "Pengaduan"}
                                                  </Badge>
                                                </td>
                                                <td className="px-3 py-2 text-center font-bold text-bulog-blue">
                                                  {l.alokasiKg > 0 ? l.alokasiKg : "—"}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                        {drillLogs.length >= 200 && (
                                          <p className="text-[10px] text-slate-400 text-center py-2 border-t border-slate-100">
                                            Menampilkan 200 entri terbaru
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Info box */}
      <Card className="bg-slate-50 border-slate-200">
        <div className="flex items-start gap-3">
          <svg className="w-4 h-4 text-bulog-blue flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Data ini terisi <b>otomatis</b> saat petugas kelurahan melakukan aktivitas:{" "}
            menekan tombol <b>Sukses Salur</b> atau <b>Alih Pengaduan</b> di Meja Posko,{" "}
            mengupload file <b>BAST / Sudah Serah / Belum Serah</b>, atau menandai <b>Verifikasi Fisik BAST</b>.
            Supervisor tidak perlu input data apapun di halaman ini.
          </p>
        </div>
      </Card>
    </div>
  );
}
