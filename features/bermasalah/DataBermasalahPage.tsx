/**
 * features/bermasalah/DataBermasalahPage.tsx
 * Halaman Audit & Pelacakan Data Bermasalah — Responsive View (Mobile Card List vs Desktop Table).
 */
"use client";

import { useState } from "react";
import { useAppStore } from "@/store/appStore";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";
import { eksporExcel } from "@/lib/excel";
import { useToast } from "@/components/ui/Toast";

export default function DataBermasalahPage() {
  const logBermasalah            = useAppStore((s) => s.logBermasalah);
  const imporReports             = useAppStore((s) => s.imporReports);
  const bersihkanDataBermasalah = useAppStore((s) => s.bersihkanDataBermasalah);
  const poskoAktif               = useAppStore((s) => s.poskoAktif);
  const setActiveTab             = useAppStore((s) => s.setActiveTab);
  const toast = useToast();

  const [filterSumber, setFilterSumber] = useState<string>("SEMUA");
  const [filterMasalah, setFilterMasalah] = useState<string>("SEMUA");
  const [search, setSearch] = useState<string>("");

  const filteredLogs = logBermasalah.filter((item) => {
    if (filterSumber !== "SEMUA" && item.sumber !== filterSumber) return false;
    if (filterMasalah !== "SEMUA" && item.tipeMasalah !== filterMasalah) return false;
    if (search) {
      const up = search.toUpperCase();
      return (
        item.fileAsal.toUpperCase().includes(up) ||
        item.pesanBahasa.toUpperCase().includes(up) ||
        JSON.stringify(item.dataMentah).toUpperCase().includes(up)
      );
    }
    return true;
  });

  const countTTDNyasar    = logBermasalah.filter((i) => i.tipeMasalah === "POTENSI_TTD_NYASAR").length;
  const countTanpaMaster  = logBermasalah.filter((i) => i.tipeMasalah === "TIDAK_ADA_DI_MASTER").length;
  const countVerifManual  = logBermasalah.filter((i) => i.tipeMasalah === "PERLU_VERIFIKASI_MANUAL").length;
  const countPengganti    = logBermasalah.filter((i) =>
    i.tipeMasalah === "PENGGANTI_NON_DTKS" ||
    i.tipeMasalah === "NIK_PENGGANTI_KOSONG" ||
    i.tipeMasalah === "PBP_PENGGANTI_TERTOLAK"
  ).length;

  function handleExportLogBermasalah() {
    if (logBermasalah.length === 0) {
      toast.peringatan("Tidak ada data bermasalah untuk diekspor!");
      return;
    }

    const dataExport = logBermasalah.map((item, idx) => ({
      No: idx + 1,
      "Waktu Catat": item.waktuPencatatan,
      "Sumber Berkas": item.sumber,
      "Nama File Asal": item.fileAsal,
      "Lokasi (Baris/Page)": item.nomorBarisOrPage,
      "Jenis Masalah Data": item.tipeMasalah,
      "Keterangan Detail Audit": item.pesanBahasa,
    }));

    eksporExcel(
      dataExport,
      "Jejak_Audit_Bermasalah",
      "Audit_Jejak_Data_Bermasalah",
      {
        judulLaporan: `Laporan Jejak Audit Kualitas Data & Rekam Masalah Impor - ${poskoAktif}`,
        posko: poskoAktif,
      }
    );
    toast.sukses("Laporan data bermasalah berhasil diunduh.");
  }

  return (
    <div className="relative">
      {/* Floating Maintenance Overlay Modal */}
      <div className="absolute inset-0 z-30 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-amber-300 max-w-md w-full p-6 text-center space-y-4 animate-zoom-in-95 sticky top-20">
          <div className="w-16 h-16 mx-auto bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center text-3xl shadow-xs">
            🚧
          </div>
          <div>
            <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-[10px] font-black uppercase tracking-wider">
              Dalam Tahap Pengembangan / Maintenance
            </span>
            <h2 className="text-lg font-black text-slate-900 mt-2">
              Modul Pelacakan Data Bermasalah
            </h2>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Modul pelacakan &amp; audit jejak data bermasalah sedang ditingkatkan oleh Tim Pengembang untuk mendukung integrasi otomatisasi data tingkat lanjut.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <Button
              variant="primary"
              size="sm"
              className="flex-1"
              onClick={() => setActiveTab("posko")}
            >
              Kembali ke Meja Posko
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={() => setActiveTab("dashboard")}
            >
              Kembali ke Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Blurred Main Background Content */}
      <div className="space-y-6 blur-sm pointer-events-none select-none opacity-40">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900">Pusat Pelacakan &amp; Data Bermasalah</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit keterlakan data: Jejak sumber file asal, nomor baris, halaman PDF, &amp; alasan kegagalan.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {logBermasalah.length > 0 && (
            <>
              <Button
                variant="success"
                size="sm"
                className="flex-1 sm:flex-none"
                onClick={handleExportLogBermasalah}
                icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>}
              >
                Ekspor Laporan Audit
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 sm:flex-none"
                onClick={() => {
                  bersihkanDataBermasalah();
                  toast.info("Log data bermasalah dikosongkan.");
                }}
              >
                Bersihkan Log
              </Button>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards Ringkasan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Potensi TTD Nyasar"
          value={countTTDNyasar}
          variant={countTTDNyasar > 0 ? "danger" : "default"}
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>}
          sub="Web Bulog Serah, Posko Belum"
        />
        <StatCard
          label="BAST Tanpa Master"
          value={countTanpaMaster}
          variant={countTanpaMaster > 0 ? "warning" : "default"}
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><line x1="9" y1="15" x2="15" y2="15"/></svg>}
          sub="Tercantum BAST, tidak di 142k"
        />
        <StatCard
          label="Perlu Verifikasi Manual"
          value={countVerifManual}
          variant={countVerifManual > 0 ? "blue" : "default"}
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>}
          sub="Ejaan nama / NIK berbeda"
        />
        <StatCard
          label="Pengganti Non-DTKS / Tertolak"
          value={countPengganti}
          variant={countPengganti > 0 ? "danger" : "default"}
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/></svg>}
          sub="Wajib SPTJM / Tertolak Banpang"
        />
      </div>

      {/* Section Laporan Impor Konkret */}
      {imporReports.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-bulog-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <h3 className="text-sm font-bold text-slate-900">Laporan Konkret Impor Terbaru</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {imporReports.slice(0, 4).map((rep, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 truncate max-w-[200px]">{rep.namaFile}</span>
                  <Badge variant={rep.totalBarisSkipped > 0 ? "warning" : "success"}>{rep.waktuImpor}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div>Total Baris File: <b>{rep.totalBarisSumber.toLocaleString("id-ID")}</b></div>
                  <div>Berhasil Dimuat: <b className="text-emerald-700">{rep.totalBerhasilDimuat.toLocaleString("id-ID")}</b></div>
                  <div>Baris Di-skip: <b className="text-rose-700">{rep.totalBarisSkipped}</b></div>
                  <div>NIK Duplikat: <b className="text-amber-700">{rep.totalDuplikat}</b></div>
                </div>

                {rep.contohBarisGagal.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Contoh Baris Gagal / Bermasalah:</p>
                    {rep.contohBarisGagal.map((g, gIdx) => (
                      <p key={gIdx} className="text-[10px] text-rose-800 font-mono">
                        · [Baris {g.baris}] {g.alasan}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tabel Log Data Bermasalah Detail */}
      <Card noPadding>
        {/* Toolbar & Filter */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Tabel Jejak Sumber Data Bermasalah</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Menampilkan {filteredLogs.length} dari {logBermasalah.length} penyimpangan terdeteksi
            </p>
          </div>
          <div className="flex gap-2 flex-wrap items-center w-full sm:w-auto">
            <select
              value={filterSumber}
              onChange={(e) => setFilterSumber(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white touch-manipulation min-h-[38px] flex-1 sm:flex-none"
            >
              <option value="SEMUA">Semua Sumber</option>
              <option value="MASTER_EXCEL">Master Excel</option>
              <option value="BAST_PDF">BAST PDF</option>
              <option value="BAST_EXCEL">BAST Excel</option>
              <option value="EKSPOR_BULOG">Ekspor Bulog</option>
            </select>

            <select
              value={filterMasalah}
              onChange={(e) => setFilterMasalah(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white touch-manipulation min-h-[38px] flex-1 sm:flex-none"
            >
              <option value="SEMUA">Semua Tipe Masalah</option>
              <option value="NIK_INVALID">NIK Invalid / Kosong</option>
              <option value="NIK_DUPLIKAT">NIK Duplikat</option>
              <option value="TIDAK_ADA_DI_MASTER">BAST Tidak Ada di Master</option>
              <option value="PERLU_VERIFIKASI_MANUAL">Ejaan Beda / Verifikasi Manual</option>
            </select>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari file / kata kunci..."
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-bulog-blue/30 w-full sm:w-48"
            />
          </div>
        </div>

        {/* MOBILE CARD VIEW (< 640px) */}
        <div className="block sm:hidden divide-y divide-slate-100">
          {filteredLogs.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={<svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
                title={logBermasalah.length === 0 ? "Tidak ada data bermasalah" : "Tidak ada data"}
                description={logBermasalah.length === 0 ? "Semua data Master & BAST valid." : "Coba ubah filter pencarian."}
              />
            </div>
          ) : (
            filteredLogs.slice(0, 100).map((item) => (
              <div key={item.id} className="p-4 space-y-2 bg-white">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">{item.fileAsal}</h4>
                    <p className="text-[11px] text-bulog-blue font-bold mt-0.5">{item.nomorBarisOrPage} · <span className="text-slate-400 font-normal">{item.sumber}</span></p>
                  </div>
                  <div>
                    {item.tipeMasalah === "NIK_INVALID" && <Badge variant="danger">NIK Invalid</Badge>}
                    {item.tipeMasalah === "NIK_DUPLIKAT" && <Badge variant="warning">NIK Duplikat</Badge>}
                    {item.tipeMasalah === "TIDAK_ADA_DI_MASTER" && <Badge variant="danger">Tidak Ada di Master</Badge>}
                    {item.tipeMasalah === "PERLU_VERIFIKASI_MANUAL" && <Badge variant="info">Verifikasi Manual</Badge>}
                  </div>
                </div>
                <p className="text-xs text-slate-800 font-medium leading-snug">{item.pesanBahasa}</p>
                <code className="text-[10px] font-mono text-slate-500 bg-slate-100 p-2 rounded-lg block truncate">
                  {JSON.stringify(item.dataMentah)}
                </code>
              </div>
            ))
          )}
        </div>

        {/* DESKTOP TABLE VIEW (>= 640px) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Sumber &amp; File Asal</th>
                <th className="px-4 py-3">Lokasi (Baris / Hal)</th>
                <th className="px-4 py-3">Tipe Penyimpangan</th>
                <th className="px-4 py-3">Pesan Laporan &amp; Rekomendasi</th>
                <th className="px-4 py-3">Data Mentah Sumber</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={<svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
                      title={logBermasalah.length === 0 ? "Tidak ada data bermasalah" : "Tidak ada data sesuai filter"}
                      description={logBermasalah.length === 0
                        ? "Semua data Master, BAST, dan Ekspor Bulog yang diunggah valid dan selaras."
                        : "Coba ubah filter sumber atau tipe masalah."}
                    />
                  </td>
                </tr>
              ) : (
                filteredLogs.slice(0, 200).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-400">{item.waktuPencatatan}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{item.fileAsal}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{item.sumber}</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-bulog-blue whitespace-nowrap">{item.nomorBarisOrPage}</td>
                    <td className="px-4 py-3">
                      {item.tipeMasalah === "NIK_INVALID" && <Badge variant="danger">NIK Invalid</Badge>}
                      {item.tipeMasalah === "NIK_DUPLIKAT" && <Badge variant="warning">NIK Duplikat</Badge>}
                      {item.tipeMasalah === "TIDAK_ADA_DI_MASTER" && <Badge variant="danger">Tidak Ada di Master</Badge>}
                      {item.tipeMasalah === "PERLU_VERIFIKASI_MANUAL" && <Badge variant="info">Verifikasi Manual</Badge>}
                    </td>
                    <td className="px-4 py-3 max-w-[260px]">
                      <p className="text-[11px] font-semibold text-slate-800 leading-snug">{item.pesanBahasa}</p>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <code className="text-[10px] font-mono text-slate-500 bg-slate-100 p-1.5 rounded block truncate">
                        {JSON.stringify(item.dataMentah)}
                      </code>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
      </div>
    </div>
  );
}
