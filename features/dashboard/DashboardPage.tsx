/**
 * features/dashboard/DashboardPage.tsx
 * Halaman ringkasan operasional hari ini — ERP Dashboard, Statistik Salur Terpadu, & Log Status.
 */
"use client";

import { useEffect, useMemo } from "react";
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
  const bulogExportRecords   = useAppStore((s) => s.bulogExportRecords);
  const bulogSudahSerahRecords = useAppStore((s) => s.bulogSudahSerahRecords);
  const bulogBelumSerahRecords = useAppStore((s) => s.bulogBelumSerahRecords);
  const poskoAktif           = useAppStore((s) => s.poskoAktif);
  const sessionPosko         = useAppStore((s) => s.sessionPosko);
  const setActiveTab         = useAppStore((s) => s.setActiveTab);
  const auditPenandaMap      = useAppStore((s) => s.auditPenandaMap);
  const setAuditPenandaMap   = useAppStore((s) => s.setAuditPenandaMap);
  const auditFisikRecords    = useAppStore((s) => s.auditFisikRecords);

  const cleanPosko = cleanStr(poskoAktif);
  const isSuper = Boolean(sessionPosko?.isSuper);

  useEffect(() => {
    const saved = localStorage.getItem(`audit_penanda_${cleanStr(poskoAktif)}`);
    if (!saved) {
      setAuditPenandaMap({});
      return;
    }
    try {
      setAuditPenandaMap(JSON.parse(saved));
    } catch {
      setAuditPenandaMap({});
    }
  }, [poskoAktif, setAuditPenandaMap]);

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

  // Transaksi Meja Posko Lokal
  const suksesPosko   = poskoLogPelayanan.filter((l) => l.status === "SUKSES_SALUR").length;
  const pengaduanPosko = poskoLogPelayanan.filter((l) => l.status === "ALIH_PENGADUAN").length;

  // Realisasi Web Bulog System-wide
  const sudahSerahCount = useMemo(() => {
    if (bulogSudahSerahRecords.length > 0) return bulogSudahSerahRecords.length;
    return bulogExportRecords.filter((r) => {
      const s = String(r.status_serah || "").toLowerCase();
      return s.includes("sudah") || s.includes("diterima") || r._tipeEkspor === "SUDAH_DISERAHKAN";
    }).length;
  }, [bulogSudahSerahRecords, bulogExportRecords]);

  const belumSerahCount = useMemo(() => {
    if (bulogBelumSerahRecords.length > 0) return bulogBelumSerahRecords.length;
    return bulogExportRecords.filter((r) => {
      const s = String(r.status_serah || "").toLowerCase();
      return s.includes("belum") || r._tipeEkspor === "BELUM_DISERAHKAN";
    }).length;
  }, [bulogBelumSerahRecords, bulogExportRecords]);

  // Penanda Fisik BAST
  const penandaValues = Object.values(auditPenandaMap);
  const verifiedFisik = penandaValues.filter((v) => v === "VERIFIED").length;
  const reviewFisik   = penandaValues.filter((v) => v === "REVIEW").length;
  const mismatchFisik = penandaValues.filter((v) => v === "MISMATCH").length;

  // Statistik Salur Terpadu
  const totalSalurPBP = sudahSerahCount > 0 ? sudahSerahCount : suksesPosko;
  const totalSisaPBP  = belumSerahCount;
  const totalBerasKg  = totalSalurPBP * 30;
  const totalBerasTon = (totalBerasKg / 1000).toFixed(1);

  const totalKuotaPBP = (sudahSerahCount + belumSerahCount) > 0 
    ? (sudahSerahCount + belumSerahCount)
    : poskoBastRecords.length;

  const progressCapaianSalur = totalKuotaPBP > 0 ? Math.min(100, Math.round((totalSalurPBP / totalKuotaPBP) * 100)) : 0;

  const penandaRows = useMemo(() => {
    if (auditFisikRecords.length === 0 || Object.keys(auditPenandaMap).length === 0) return [];
    return auditFisikRecords
      .map((r) => {
        const nikClean = r.nik ? r.nik.replace(/\D/g, "").replace(/^0+/, "") : "";
        const key = nikClean && nikClean.length >= 15
          ? `nik:${nikClean}`
          : `row:${cleanStr(r.nama)}_${cleanStr(r.kelurahan)}_${r.no || ""}`;
        const status = auditPenandaMap[key];
        return status ? { ...r, _penandaStatus: status, _penandaKey: key } : null;
      })
      .filter(Boolean) as (typeof auditFisikRecords[0] & { _penandaStatus: "VERIFIED" | "REVIEW" | "MISMATCH" })[];
  }, [auditFisikRecords, auditPenandaMap]);

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-bulog-dark to-bulog-blue rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-sky-200 border border-white/20 rounded-full text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Posko Aktif: {poskoAktif}
              </span>
              <span className="text-xs font-semibold text-slate-300">{today}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Selamat bertugas, Petugas Posko Bulog
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Sistem Operasional &amp; Rekonsiliasi Verifikasi Bansos PBP Beras 30 Kg Wilayah Operasional Jakarta Utara.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <Button
              variant="primary"
              size="md"
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg border-none"
              icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>}
              onClick={() => setActiveTab("posko")}
            >
              Mulai Pelayanan
            </Button>
            <Button
              variant="secondary"
              size="md"
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md"
              icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>}
              onClick={() => setActiveTab("audit")}
            >
              Rekonsiliasi Audit
            </Button>
          </div>
        </div>
      </div>

      {/* 5 KPI Stat Cards Sejajar Rapi */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard
          label="Master Data Terindeks"
          value={masterRecords.length > 0 ? masterRecords.length.toLocaleString("id-ID") : "—"}
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Z"/><path d="M18 14h-8M18 10h-8M18 6h-8"/></svg>}
          variant={masterRecords.length > 0 ? "blue" : "default"}
          sub={masterRecords.length > 0 ? "142k baris acuan DTKS" : "Belum dimuat"}
        />
        <StatCard
          label="Penerima BAST Termuat"
          value={poskoBastRecords.length > 0 ? poskoBastRecords.length.toLocaleString("id-ID") : "—"}
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
          variant={poskoBastRecords.length > 0 ? "success" : "default"}
          sub={poskoLoadedFiles.length > 0 ? `${poskoLoadedFiles.length} berkas wilayah` : "Belum dimuat"}
        />
        <StatCard
          label="Realisasi Sudah Salur"
          value={totalSalurPBP > 0 ? `${totalSalurPBP.toLocaleString("id-ID")} PBP` : "—"}
          icon={<svg className="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
          variant={totalSalurPBP > 0 ? "success" : "default"}
          sub={totalSalurPBP > 0 ? `${totalBerasTon} Ton (${totalBerasKg.toLocaleString("id-ID")} Kg)` : "Belum tersalur"}
        />
        <StatCard
          label="Sisa Belum Salur"
          value={totalSisaPBP > 0 ? `${totalSisaPBP.toLocaleString("id-ID")} PBP` : "—"}
          icon={<svg className="w-5 h-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
          variant={totalSisaPBP > 0 ? "warning" : "default"}
          sub={totalSisaPBP > 0 ? "Belum diserahkan Bulog" : "Semua tersalur"}
        />
        <StatCard
          label="Terverifikasi Fisik BAST"
          value={verifiedFisik.toLocaleString("id-ID")}
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>}
          variant={verifiedFisik > 0 ? "success" : "default"}
          sub={`${reviewFisik} tinjau · ${mismatchFisik} beda`}
        />
      </div>

      {/* Main Content Grid: 3 Kolom Utama Sejajar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Panel 1: PBP Pengganti Tertolak Banpang */}
        <div>
          <Card className="h-full flex flex-col justify-between">
            <div>
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
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-400 mb-3">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                  </div>
                  <p className="text-xs font-bold text-slate-600">Belum Ada Pengganti Tertolak</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs">Catat pengganti yang tidak lolos di aplikasi Banpang lewat tab Pengganti Tertolak</p>
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
                    <p className="text-[11px] text-slate-400 text-center pt-2 font-medium">
                      +{poskoLogPenggantiTertolak.length - 5} entri lainnya
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Panel 2: Terverifikasi Fisik BAST */}
        <div>
          <Card className="h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Terverifikasi Fisik BAST</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {penandaRows.length} PBP · {verifiedFisik} OK · {reviewFisik} tinjau · {mismatchFisik} beda
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab("audit")}>
                  Lihat Semua →
                </Button>
              </div>

              {penandaRows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-400 mb-3">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <p className="text-xs font-bold text-slate-600">Belum Ada Penanda Fisik</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs">Tandai PBP di tab Rekonsiliasi BAST Fisik setelah verifikasi dokumen</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {penandaRows.slice(0, 5).map((r, i) => {
                    const dotColor =
                      r._penandaStatus === "VERIFIED" ? "bg-emerald-500" :
                      r._penandaStatus === "REVIEW"   ? "bg-amber-500"   :
                                                        "bg-rose-500";
                    const badgeVariant =
                      r._penandaStatus === "VERIFIED" ? "success" :
                      r._penandaStatus === "REVIEW"   ? "warning" :
                                                        "danger";
                    const badgeLabel =
                      r._penandaStatus === "VERIFIED" ? "Terverifikasi" :
                      r._penandaStatus === "REVIEW"   ? "Perlu Ditinjau" :
                                                        "Ketidaksesuaian";
                    return (
                      <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{r.nama || "—"}</p>
                            <p className="text-[10px] font-mono text-slate-500 truncate">
                              NIK: {r.nik || "—"} · {r.kelurahan || poskoAktif}
                              {r.status_pbp ? ` · ${r.status_pbp}` : ""}
                            </p>
                          </div>
                        </div>
                        <Badge variant={badgeVariant}>{badgeLabel}</Badge>
                      </div>
                    );
                  })}
                  {penandaRows.length > 5 && (
                    <p className="text-[11px] text-slate-400 text-center pt-2 font-medium">
                      +{penandaRows.length - 5} PBP lainnya
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Panel 3: Status Sistem & Statistik Salur Terpadu */}
        <div className="space-y-4">
          {/* Status Modul Sistem */}
          <Card>
            <h2 className="text-sm font-bold text-slate-900 mb-3">Status Modul Sistem</h2>
            <div className="space-y-2.5">
              {[
                {
                  label: "Data Master DTKS (142k)",
                  ok: masterRecords.length > 0,
                  val: masterRecords.length > 0 ? `${masterRecords.length.toLocaleString("id-ID")} baris` : "Belum dimuat",
                },
                {
                  label: "Berkas BAST Fisik",
                  ok: poskoBastRecords.length > 0,
                  val: poskoBastRecords.length > 0 ? `${poskoBastRecords.length.toLocaleString("id-ID")} PBP` : "Belum dimuat",
                },
                {
                  label: "Ekspor Web Bulog",
                  ok: bulogExportRecords.length > 0,
                  val: bulogExportRecords.length > 0 ? `${bulogExportRecords.length.toLocaleString("id-ID")} baris` : "Belum dimuat",
                },
                {
                  label: "Penanda Fisik BAST",
                  ok: verifiedFisik > 0 || reviewFisik > 0 || mismatchFisik > 0,
                  val: `${verifiedFisik} OK · ${reviewFisik} review · ${mismatchFisik} beda`,
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.ok ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                    <span className="font-medium text-slate-600">{item.label}</span>
                  </div>
                  <span className={`text-[11px] font-bold ${item.ok ? "text-emerald-700" : "text-slate-400"}`}>
                    {item.val}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Statistik Salur Terpadu */}
          <Card className="bg-gradient-to-br from-slate-50 to-blue-50/40 border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-bulog-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                Statistik Salur System-Wide
              </h3>
              <span className="text-[10px] font-bold text-bulog-blue bg-blue-100 px-2 py-0.5 rounded-full">
                {progressCapaianSalur}% Capaian
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Realisasi Diserahkan</span>
                <span className="font-bold text-emerald-700">{totalSalurPBP.toLocaleString("id-ID")} PBP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Sisa Belum Diserahkan</span>
                <span className="font-bold text-amber-700">{totalSisaPBP.toLocaleString("id-ID")} PBP</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200/60">
                <span className="text-slate-600 font-medium">Beras Diserahkan</span>
                <span className="font-extrabold text-bulog-blue">{totalBerasKg.toLocaleString("id-ID")} Kg ({totalBerasTon} Ton)</span>
              </div>

              {/* Progress Bar System-Wide */}
              <div className="pt-2">
                <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${progressCapaianSalur}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5 flex justify-between font-mono">
                  <span>Realisasi Web Bulog</span>
                  <span>{totalSalurPBP} / {totalKuotaPBP > 0 ? totalKuotaPBP : "—"} PBP</span>
                </p>
              </div>

              {/* Transaksi Posko Hari Ini */}
              {poskoLogPelayanan.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Pelayanan Posko Hari Ini:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-700">{suksesPosko} Sukses</span>
                    {pengaduanPosko > 0 && <span className="font-bold text-amber-700">{pengaduanPosko} Pengaduan</span>}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Wilayah BAST Aktif Badges */}
          {loadedBASTFiles.length > 0 && (
            <Card>
              <h2 className="text-xs font-bold text-slate-700 mb-2">Wilayah BAST Aktif ({poskoLoadedFiles.length})</h2>
              <div className="flex flex-wrap gap-1.5">
                {poskoLoadedFiles.map((kel) => (
                  <Badge key={kel} variant="success" className="text-[10px]">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    BAST: {kel}
                  </Badge>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
