/**
 * features/posko/TabelAnomali.tsx
 * Tabel rekonsiliasi anomali massal — Responsive View (Mobile Card List vs Desktop Table).
 */
"use client";

import { useState } from "react";
import { useAppStore } from "@/store/appStore";
import { cleanStr, fixNIK } from "@/lib/utils";
import { eksporExcel } from "@/lib/excel";
import { useToast } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { AnomaliRow } from "@/types";

export default function TabelAnomali() {
  const bastRecords         = useAppStore((s) => s.bastRecords);
  const masterRecords       = useAppStore((s) => s.masterRecords);
  const masterByNIK         = useAppStore((s) => s.masterByNIK);
  const masterByName        = useAppStore((s) => s.masterByName);
  const anomaliRecordsCache = useAppStore((s) => s.anomaliRecordsCache);
  const setAnomaliCache     = useAppStore((s) => s.setAnomaliCache);
  const poskoAktif          = useAppStore((s) => s.poskoAktif);
  const toast = useToast();

  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  function jalankanCekAnomali() {
    if (bastRecords.length === 0 || masterRecords.length === 0) {
      toast.peringatan("Unggah file Master dan minimal 1 file BAST terlebih dahulu!");
      return;
    }
    setStatus("loading");

    setTimeout(() => {
      const hasil: AnomaliRow[] = [];
      for (const b of bastRecords) {
        let match = null;
        if (b.NIK && masterByNIK.has(b.NIK)) {
          match = masterByNIK.get(b.NIK)!;
        } else {
          const found = masterByName.get(cleanStr(b.NAMA));
          if (found?.length) match = found[0];
        }

        if (match) {
          const kMaster = cleanStr(match.KEL_NAME || "");
          const kBAST   = cleanStr(b.KELURAHAN_BAST || "");
          if (kMaster && kBAST && !kMaster.includes(kBAST) && !kBAST.includes(kMaster)) {
            hasil.push({
              nama: b.NAMA,
              nik: match.NIK || b.NIK || "—",
              kelBAST: b.KELURAHAN_BAST,
              kelMaster: match.KEL_NAME,
              alamatMaster: `${match.ALAMAT || ""} (RT ${match.NO_RT || "—"}/RW ${match.NO_RW || "—"})`,
              status: "Undangan BAST di kelurahan lain",
            });
          }
        }
      }

      setAnomaliCache(hasil);
      setStatus("done");
      if (hasil.length > 0) {
        toast.peringatan(`Ditemukan ${hasil.length} anomali beda wilayah!`);
      } else {
        toast.sukses("Semua penerima BAST cocok wilayahnya dengan Master Data.");
      }
    }, 50);
  }

  function handleExportAnomali() {
    if (!anomaliRecordsCache.length) return;
    const dataExport = anomaliRecordsCache.map((item, idx) => ({
      No: idx + 1,
      "Nama PBP": item.nama,
      NIK: fixNIK(item.nik) || item.nik,
      "Kelurahan BAST": item.kelBAST,
      "Kelurahan Master (DTKS)": item.kelMaster,
      "Alamat Master": item.alamatMaster,
      "Status Anomali Wilayah": item.status,
    }));
    eksporExcel(
      dataExport as Record<string, unknown>[],
      "Anomali_Wilayah",
      "Laporan_Anomali_BAST_vs_Master",
      {
        judulLaporan: `Laporan Rekonsiliasi Anomali Wilayah BAST vs Master Data - ${poskoAktif}`,
        posko: poskoAktif,
      }
    );
    toast.sukses("File Excel anomali berhasil diunduh.");
  }

  return (
    <Card noPadding>
      <div className="p-4 sm:p-5 border-b border-slate-100">
        <CardHeader
          title="Rekonsiliasi Anomali Wilayah"
          subtitle="Penerima BAST yang berbeda kelurahan dengan Master Data"
          icon={
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          }
          actions={
            <div className="flex gap-2 w-full sm:w-auto">
              {status === "done" && anomaliRecordsCache.length > 0 && (
                <Button
                  variant="success"
                  size="sm"
                  className="flex-1 sm:flex-none"
                  onClick={handleExportAnomali}
                  icon={<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>}
                >
                  Unduh Excel
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 sm:flex-none"
                loading={status === "loading"}
                onClick={jalankanCekAnomali}
                icon={<svg className="w-3.5 h-3.5 text-bulog-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>}
              >
                Cek Anomali Massal
              </Button>
            </div>
          }
        />
      </div>

      {/* MOBILE CARD VIEW (< 640px) */}
      <div className="block sm:hidden divide-y divide-slate-100">
        {status === "idle" && (
          <div className="p-4">
            <EmptyState
              icon={<svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>}
              title="Belum dijalankan"
              description="Klik 'Cek Anomali Massal' setelah file Master & BAST terunggah."
            />
          </div>
        )}
        {status === "loading" && (
          <div className="py-8 text-center text-slate-500">
            <svg className="w-5 h-5 animate-spin text-bulog-blue mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            <span className="text-xs font-medium">Menyandingkan data...</span>
          </div>
        )}
        {status === "done" && anomaliRecordsCache.length === 0 && (
          <div className="p-4">
            <EmptyState
              icon={<svg className="w-6 h-6 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
              title="Tidak ada anomali"
              description="Semua penerima BAST cocok wilayahnya dengan Data Master."
            />
          </div>
        )}
        {status === "done" && anomaliRecordsCache.map((item, idx) => (
          <div key={idx} className="p-4 space-y-2 bg-white">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-sm font-black text-slate-900">{item.nama}</h4>
                <p className="text-xs font-mono text-slate-500 mt-0.5">NIK: {item.nik}</p>
              </div>
              <Badge variant="warning">Tahan · Salur di {item.kelMaster}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
              <div><span className="text-slate-400 block text-[10px]">BAST:</span><span className="font-bold text-amber-800">{item.kelBAST}</span></div>
              <div><span className="text-slate-400 block text-[10px]">Master:</span><span className="font-bold text-bulog-blue">{item.kelMaster}</span></div>
            </div>
            <p className="text-[11px] text-slate-500 truncate"><span className="text-slate-400">Alamat:</span> {item.alamatMaster}</p>
          </div>
        ))}
      </div>

      {/* DESKTOP TABLE VIEW (>= 640px) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Nama Penerima</th>
              <th className="px-4 py-3">NIK</th>
              <th className="px-4 py-3">Kelurahan BAST</th>
              <th className="px-4 py-3">Kelurahan Master</th>
              <th className="px-4 py-3">Alamat Master</th>
              <th className="px-4 py-3">Rekomendasi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {status === "idle" && (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    icon={<svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>}
                    title="Belum dijalankan"
                    description="Klik tombol 'Cek Anomali Massal' setelah file Master dan BAST terunggah."
                  />
                </td>
              </tr>
            )}
            {status === "loading" && (
              <tr>
                <td colSpan={6} className="py-10 text-center">
                  <div className="flex items-center justify-center gap-2 text-slate-500">
                    <svg className="w-4 h-4 animate-spin text-bulog-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    <span className="text-sm font-medium">Menyandingkan data...</span>
                  </div>
                </td>
              </tr>
            )}
            {status === "done" && anomaliRecordsCache.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    icon={<svg className="w-6 h-6 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
                    title="Tidak ada anomali"
                    description="Semua penerima BAST cocok wilayahnya dengan Data Master."
                  />
                </td>
              </tr>
            )}
            {status === "done" && anomaliRecordsCache.map((item, idx) => (
              <tr key={idx} className="hover:bg-amber-50/40 transition">
                <td className="px-4 py-3 font-bold text-slate-800">{item.nama}</td>
                <td className="px-4 py-3 font-mono text-slate-500">{item.nik}</td>
                <td className="px-4 py-3"><Badge variant="warning">{item.kelBAST}</Badge></td>
                <td className="px-4 py-3"><Badge variant="blue">{item.kelMaster}</Badge></td>
                <td className="px-4 py-3 text-slate-500 max-w-[180px] truncate">{item.alamatMaster}</td>
                <td className="px-4 py-3">
                  <Badge variant="warning">Tahan · Salur di {item.kelMaster}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
