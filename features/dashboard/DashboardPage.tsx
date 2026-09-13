/**
 * features/dashboard/DashboardPage.tsx
 * Halaman ringkasan operasional hari ini — KPI cards ala ERP & PBP Pengganti Tertolak.
 */
"use client";

import { useMemo } from "react";
import { useAppStore } from "@/store/appStore";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cleanStr } from "@/lib/utils";

export default function DashboardPage() {
  const masterRecords        = useAppStore((s) => s.masterRecords);
  const bastRecords          = useAppStore((s) => s.bastRecords);
  const loadedBASTFiles      = useAppStore((s) => s.loadedBASTFiles);
  const logPelayanan         = useAppStore((s) => s.logPelayanan);
  const logPenggantiTertolak = useAppStore((s) => s.logPenggantiTertolak);
  const anomaliRecordsCache  = useAppStore((s) => s.anomaliRecordsCache);
  const bulogExportRecords   = useAppStore((s) => s.bulogExportRecords);
  const poskoAktif           = useAppStore((s) => s.poskoAktif);
  const sessionPosko         = useAppStore((s) => s.sessionPosko);
  const setActiveTab         = useAppStore((s) => s.setActiveTab);

  const cleanPosko = cleanStr(poskoAktif);
  const isSuper = Boolean(sessionPosko?.isSuper);

  const poskoBastRecords = useMemo(() => {
    if (isSuper) return bastRecords;
    return bastRecords.filter((b) => {
      const bKel = cleanStr(b.KELURAHAN_BAST || "");
      return !bKel || !cleanPosko || bKel.includes(cleanPosko) || cleanPosko.includes(bKel);
    });
  }, [bastRecords, cleanPosko, isSuper]);

  const poskoLoadedFiles = useMemo(() => {
    if (isSuper) return loadedBASTFiles;
    return loadedBASTFiles.filter((f) => cleanStr(f).includes(cleanPosko) || cleanPosko.includes(cleanStr(f)));
  }, [loadedBASTFiles, cleanPosko, isSuper]);

  const poskoLogPelayanan = useMemo(() => {
    if (isSuper) return logPelayanan;
    return logPelayanan.filter((l) => {
      const lPosko = cleanStr(l.posko || "");
      return !lPosko || !cleanPosko || lPosko.includes(cleanPosko) || cleanPosko.includes(lPosko);
    });
  }, [logPelayanan, cleanPosko, isSuper]);

  const poskoLogPenggantiTertolak = useMemo(() => {
    if (isSuper) return logPenggantiTertolak;
    return logPenggantiTertolak.filter((l) => {
      const lPosko = cleanStr(l.posko || "");
      return !lPosko || !cleanPosko || lPosko.includes(cleanPosko) || cleanPosko.includes(lPosko);
    });
  }, [logPenggantiTertolak, cleanPosko, isSuper]);

  const sukses     = poskoLogPelayanan.filter((l) => l.status === "SUKSES_SALUR").length;
  const pengaduan  = poskoLogPelayanan.filter((l) => l.status === "ALIH_PENGADUAN").length;
  const totalBeras = sukses * 30;

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900">Selamat bertugas, Petugas Posko</h1>
          <p className="text-sm text-slate-500 mt-0.5">{today} · Posko aktif: <span className="font-bold text-bulog-blue">{poskoAktif}</span></p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>}
            onClick={() => setActiveTab("posko")}
          >
            Mulai Pelayanan
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Master Data Terindeks"
          value={masterRecords.length > 0 ? masterRecords.length.toLocaleString("id-ID") : "—"}
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Z"/><path d="M18 14h-8M18 10h-8M18 6h-8"/></svg>}
          variant={masterRecords.length > 0 ? "blue" : "default"}
          sub={masterRecords.length > 0 ? "Baris siap diverifikasi" : "Belum dimuat"}
        />
        <StatCard
          label="Penerima BAST Termuat"
          value={poskoBastRecords.length > 0 ? poskoBastRecords.length.toLocaleString("id-ID") : "—"}
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
          variant={poskoBastRecords.length > 0 ? "success" : "default"}
          sub={poskoLoadedFiles.length > 0 ? `${poskoLoadedFiles.length} wilayah` : "Belum dimuat"}
        />
        <StatCard
          label="PBP Pengganti Tertolak"
          value={poskoLogPenggantiTertolak.length}
          icon={
            <svg className="w-5 h-5 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          }
          variant={poskoLogPenggantiTertolak.length > 0 ? "danger" : "default"}
          sub={poskoLogPenggantiTertolak.length > 0 ? `${poskoLogPenggantiTertolak.length} entri siap diekspor` : "Belum ada entri"}
        />
        <StatCard
          label="Anomali Terdeteksi"
          value={anomaliRecordsCache.length}
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
          variant={anomaliRecordsCache.length > 0 ? "warning" : "default"}
          sub={anomaliRecordsCache.length > 0 ? "Beda wilayah BAST vs Master" : "Belum dijalankan"}
        />
      </div>

      {/* Baris 2: PBP Pengganti Tertolak + Status sistem */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* PBP Pengganti Tertolak Banpang */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">PBP Pengganti Tertolak Banpang</h2>
                <p className="text-xs text-slate-500 mt-0.5">{poskoLogPenggantiTertolak.length} entri dicatat untuk tim audit</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setActiveTab("log")}>
                Lihat Semua →
              </Button>
            </div>

            {poskoLogPenggantiTertolak.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-400 mb-3">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-slate-600">Belum Ada Pengganti Tertolak</p>
                <p className="text-xs text-slate-400 mt-1">Catat pengganti yang tidak lolos di aplikasi Banpang lewat tab Pengganti Tertolak</p>
              </div>
            ) : (
              <div className="space-y-2">
                {poskoLogPenggantiTertolak.slice(0, 5).map((l) => (
                  <div key={l.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-2 h-2 rounded-full flex-shrink-0 bg-rose-500" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{l.nama}</p>
                        <p className="text-[10px] font-mono text-slate-500 truncate">NIK: {l.nik} · {l.posko} · {l.waktu}</p>
                      </div>
                    </div>
                    <Badge variant="danger">
                      {l.catatan}
                    </Badge>
                  </div>
                ))}
                {poskoLogPenggantiTertolak.length > 5 && (
                  <p className="text-[11px] text-slate-400 text-center pt-1">
                    +{poskoLogPenggantiTertolak.length - 5} entri lainnya
                  </p>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Status sistem & ringkasan */}
        <div className="space-y-4">
          <Card>
            <h2 className="text-sm font-bold text-slate-900 mb-3">Status Sistem</h2>
            <div className="space-y-3">
              {[
                {
                  label: "Data Master",
                  ok: masterRecords.length > 0,
                  val: masterRecords.length > 0 ? `${masterRecords.length.toLocaleString("id-ID")} baris` : "Belum dimuat",
                },
                {
                  label: "Berkas BAST",
                  ok: poskoBastRecords.length > 0,
                  val: poskoBastRecords.length > 0 ? `${poskoBastRecords.length.toLocaleString("id-ID")} penerima` : "Belum dimuat",
                },
                {
                  label: "Ekspor Bulog",
                  ok: bulogExportRecords.length > 0,
                  val: bulogExportRecords.length > 0 ? `${bulogExportRecords.length.toLocaleString("id-ID")} baris` : "Belum dimuat",
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.ok ? "bg-emerald-500" : "bg-slate-300"}`} />
                    <span className="text-xs font-medium text-slate-600">{item.label}</span>
                  </div>
                  <span className={`text-[11px] font-bold ${item.ok ? "text-emerald-700" : "text-slate-400"}`}>
                    {item.val}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {pengaduan > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <div className="flex items-start gap-2.5">
                <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <div>
                  <p className="text-xs font-bold text-amber-900">{pengaduan} Warga Dialihkan</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">Perlu penanganan di meja pengaduan</p>
                </div>
              </div>
            </Card>
          )}

          <Card>
            <h3 className="text-xs font-bold text-slate-700 mb-2.5">Statistik Salur</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Selesai Salur</span>
                <span className="font-bold text-emerald-700">{sukses}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Dialihkan Pengaduan</span>
                <span className="font-bold text-rose-600">{pengaduan}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Total Beras Tersalur</span>
                <span className="font-bold text-bulog-blue">{totalBeras.toLocaleString("id-ID")} Kg</span>
              </div>
              {logPelayanan.length > 0 && (
                <div className="pt-2 mt-2 border-t border-slate-100">
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.round((sukses / logPelayanan.length) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 text-right">
                    {Math.round((sukses / logPelayanan.length) * 100)}% berhasil salur
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Wilayah BAST aktif */}
      {loadedBASTFiles.length > 0 && (
        <Card>
          <h2 className="text-sm font-bold text-slate-900 mb-3">Wilayah BAST Aktif</h2>
          <div className="flex flex-wrap gap-2">
            {loadedBASTFiles.map((kel) => (
              <Badge key={kel} variant="success">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                BAST: {kel}
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
