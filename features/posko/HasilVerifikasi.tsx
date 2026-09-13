/**
 * features/posko/HasilVerifikasi.tsx
 * Panel detail PBP gaya ERP form-view + widget Anggota Keluarga 1 KK + Penanda TTD Nyasar + sticky action bar (Mobile-Optimized).
 */
"use client";

import { useAppStore } from "@/store/appStore";
import { cleanStr } from "@/lib/utils";
import { buatLogEntry, parseRtRwFromText } from "@/services/verifikasi";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import KeluargaKKPanel from "./KeluargaKKPanel";
import type { MasterRow, BastRow } from "@/types";

const ICONS = {
  checkCircle: (
    <svg className="w-6 h-6 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  alertTriangle: (
    <svg className="w-6 h-6 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  alertOctagon: (
    <svg className="w-6 h-6 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/>
      <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  infoCircle: (
    <svg className="w-6 h-6 text-bulog-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
};

interface Props {
  rowMaster: MasterRow | null;
  rowBAST: BastRow | null;
  posko: string;
  matchMode: string;
  onSimpan: () => void;
  onPilihAnggota?: (item: MasterRow) => void;
}

type StatusType = "valid" | "anomali" | "salahPosko" | "bastOnly" | "masterOnly";

function getStatusConfig(type: StatusType, kelDB: string, kelBAST: string, posko: string, noUrut?: number | null) {
  const configs = {
    valid: {
      wrap: "bg-emerald-50 border-emerald-300",
      iconBg: "bg-emerald-100",
      icon: ICONS.checkCircle,
      badgeVariant: "success" as const,
      badgeLabel: "SESUAI & VALID",
      title: "Siap Salur",
      sub: `Data Master, BAST, dan Posko (${posko}) cocok sempurna.`,
      instruksi: `1. Periksa KTP fisik warga.  2. Serahkan 30 Kg beras.  3. Minta tanda tangan/cap jempol pada lembar BAST${noUrut ? " No. Urut " + noUrut : ""}.`,
    },
    anomali: {
      wrap: "bg-amber-50 border-amber-300",
      iconBg: "bg-amber-100",
      icon: ICONS.alertTriangle,
      badgeVariant: "warning" as const,
      badgeLabel: "ANOMALI WILAYAH",
      title: "Undangan Mental",
      sub: `Master: [${kelDB}] vs BAST: [${kelBAST}] — berbeda.`,
      instruksi: `TAHAN PENYERAHAN! Kuota tercatat di Posko ${kelDB}. Jangan ambil dari stok posko ${posko}.`,
    },
    salahPosko: {
      wrap: "bg-amber-50 border-amber-300",
      iconBg: "bg-amber-100",
      icon: ICONS.alertTriangle,
      badgeVariant: "warning" as const,
      badgeLabel: "SALAH POSKO",
      title: "Salah Meja Pelayanan",
      sub: `Warga terdaftar di [${kelDB}], bukan di posko [${posko}] ini.`,
      instruksi: `Arahkan warga ke posko Kelurahan ${kelDB}.`,
    },
    bastOnly: {
      wrap: "bg-rose-50 border-rose-300",
      iconBg: "bg-rose-100",
      icon: ICONS.alertOctagon,
      badgeVariant: "danger" as const,
      badgeLabel: "TIDAK ADA DI MASTER",
      title: "Ada di BAST, Tidak di Master",
      sub: `Ada di BAST Kelurahan [${kelBAST}], tidak ada di 142k Master Data Jakut.`,
      instruksi: "Arahkan warga ke Meja Pengaduan untuk validasi berkas fisik & SPTJM.",
    },
    masterOnly: {
      wrap: "bg-blue-50 border-blue-300",
      iconBg: "bg-blue-100",
      icon: ICONS.infoCircle,
      badgeVariant: "info" as const,
      badgeLabel: "HANYA DI MASTER",
      title: "BAST Belum Termuat",
      sub: `Terdaftar di Master [${kelDB}], lembar BAST belum dimuat.`,
      instruksi: "Periksa apakah warga membawa surat kehilangan atau undangan tambahan resmi.",
    },
  };
  return configs[type];
}

interface FieldRowProps { label: string; value: string; mono?: boolean; }
function FieldRow({ label, value, mono }: FieldRowProps) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-slate-100 last:border-0 gap-4">
      <span className="text-xs text-slate-600 font-semibold flex-shrink-0 w-32 sm:w-36">{label}</span>
      <span className={`text-xs font-bold text-slate-900 text-right flex-1 min-w-0 break-all ${mono ? "font-mono" : ""}`}>{value || "—"}</span>
    </div>
  );
}

export default function HasilVerifikasi({ rowMaster, rowBAST, posko, matchMode, onSimpan, onPilihAnggota }: Props) {
  const tambahLogPelayanan  = useAppStore((s) => s.tambahLogPelayanan);
  const setCurrentActivePBP = useAppStore((s) => s.setCurrentActivePBP);
  const toast = useToast();

  const kelDB   = rowMaster ? String(rowMaster.KEL_NAME || "—").trim() : "Tidak Ada di Master";
  const kecDB   = rowMaster ? String(rowMaster.KEC_NAME || "—").trim() : "—";
  const kelBAST = rowBAST   ? String(rowBAST.KELURAHAN_BAST || "—").trim() : "Tidak Ada di BAST";

  const cleanDB   = cleanStr(kelDB);
  const cleanBASTStr = cleanStr(kelBAST);
  const cleanPosko   = cleanStr(posko);

  const isCocokWilayah = cleanDB && cleanBASTStr && (cleanDB.includes(cleanBASTStr) || cleanBASTStr.includes(cleanDB));
  const isPoskoCocok   = cleanPosko.includes(cleanDB) || cleanPosko.includes(cleanBASTStr);

  let statusType: StatusType = "masterOnly";
  if (isCocokWilayah && isPoskoCocok)           statusType = "valid";
  else if (!isCocokWilayah && rowMaster && rowBAST) statusType = "anomali";
  else if (!isPoskoCocok && isCocokWilayah)     statusType = "salahPosko";
  else if (!rowMaster && rowBAST)               statusType = "bastOnly";

  const cfg = getStatusConfig(statusType, kelDB, kelBAST, posko, rowBAST?.NO_URUT);

  const namaTampil   = rowBAST?.NAMA || rowMaster?.NAMA || "—";

  const hasRealBastNIK = Boolean(rowBAST?.NIK && /^\d{16}$/.test(rowBAST.NIK));
  const hasRealMasterNIK = Boolean(rowMaster?.NIK && !rowMaster._isTanpaNIK && !rowMaster.NIK.startsWith("IDW-") && /^\d{16}$/.test(rowMaster.NIK));
  const nikTampil    = hasRealBastNIK ? rowBAST!.NIK : (hasRealMasterNIK ? rowMaster!.NIK : (rowBAST?.NIK || rowMaster?.NIK || "—"));

  const hasRealBastKK = Boolean(rowBAST?.NO_KK && /^\d{16}$/.test(rowBAST.NO_KK));
  const hasRealMasterKK = Boolean(rowMaster?.NO_KK && !rowMaster.NO_KK.startsWith("IDW-") && /^\d{16}$/.test(rowMaster.NO_KK));
  const noKKTampil   = hasRealBastKK ? rowBAST!.NO_KK : (hasRealMasterKK ? rowMaster!.NO_KK : (rowBAST?.NO_KK || rowMaster?.NO_KK || "—"));

  const noUrutTampil = rowBAST?.NO_URUT ? `${rowBAST.NO_URUT}` : "—";
  const isTanpaNIK   = Boolean((!hasRealBastNIK && !hasRealMasterNIK) || (rowMaster?._isTanpaNIK || (nikTampil && (nikTampil.startsWith("IDW-") || nikTampil === "—"))));

  let finalRtBast = rowBAST?.NO_RT || "";
  let finalRwBast = rowBAST?.NO_RW || "";

  if ((!finalRtBast || !finalRwBast) && rowBAST?.ALAMAT_BAST) {
    const parsed = parseRtRwFromText(rowBAST.ALAMAT_BAST);
    if (!finalRtBast) finalRtBast = parsed.rt;
    if (!finalRwBast) finalRwBast = parsed.rw;
  }

  const rtBastStr = finalRtBast ? `RT ${finalRtBast}` : "";
  const rwBastStr = finalRwBast ? `RW ${finalRwBast}` : "";
  const rtRwBAST  = [rtBastStr, rwBastStr].filter(Boolean).join(" / ");

  const rtMasterStr = rowMaster?.NO_RT ? `RT ${rowMaster.NO_RT}` : "";
  const rwMasterStr = rowMaster?.NO_RW ? `RW ${rowMaster.NO_RW}` : "";
  const rtRwMaster  = [rtMasterStr, rwMasterStr].filter(Boolean).join(" / ");

  function handleLayaniSukses() {
    tambahLogPelayanan(buatLogEntry({ master: rowMaster, bast: rowBAST, posko }, "SUKSES_SALUR"));
    toast.sukses(`Berhasil dicatat: ${namaTampil} — Selesai Salur 30 Kg`);
    setCurrentActivePBP(null);
    onSimpan();
  }

  function handleAlihkanPengaduan() {
    tambahLogPelayanan(buatLogEntry({ master: rowMaster, bast: rowBAST, posko }, "ALIH_PENGADUAN"));
    toast.peringatan(`${namaTampil} dialihkan ke Meja Pengaduan`);
    setCurrentActivePBP(null);
    onSimpan();
  }

  return (
    <div className="rounded-2xl border overflow-hidden shadow-sm space-y-4 animate-zoom-in-95">
      <div className="rounded-2xl border overflow-hidden bg-white shadow-sm">
        {/* Status banner */}
        <div className={`px-4 sm:px-5 py-4 border-b flex items-start sm:items-center gap-3 ${cfg.wrap}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.iconBg}`}>
            {cfg.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={cfg.badgeVariant}>{cfg.badgeLabel}</Badge>
              <span className="text-[10px] text-slate-600 font-medium">Pencocokan: {matchMode}</span>
            </div>
            <h3 className="text-sm font-black text-slate-900 mt-0.5">{cfg.title}</h3>
            <p className="text-xs text-slate-800 leading-snug">{cfg.sub}</p>
          </div>
        </div>

        <div className="bg-white">
          {/* Nama besar + NIK — hero row */}
          <div className="px-4 sm:px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Nama Penerima Manfaat (PBP)</p>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 leading-tight">{namaTampil}</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${isTanpaNIK ? "bg-amber-100 text-amber-900 border border-amber-300 font-sans" : "bg-slate-100 text-slate-700 font-mono"}`}>
                  {isTanpaNIK ? `Tanpa NIK (DTKS/P3KE) · ID: ${rowMaster?.ID_WILAYAH || nikTampil}` : `NIK: ${nikTampil}`}
                </span>
                <span className="text-[11px] font-bold bg-amber-100 text-amber-900 px-2.5 py-1 rounded-lg">No BAST: {noUrutTampil}</span>
                <span className="text-[11px] font-mono font-bold bg-blue-50 text-bulog-blue border border-blue-200 px-2.5 py-1 rounded-lg">No. KK: {noKKTampil}</span>
              </div>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-1 text-left sm:text-right">
              <span className="text-[10px] text-slate-500 font-medium">Posko Aktif</span>
              <span className="text-sm font-black text-bulog-blue">{posko}</span>
            </div>
          </div>

          {/* Detail 2 kolom — ERP form-view */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {/* Kolom kiri: Data Master */}
            <div className="px-4 sm:px-5 py-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-bulog-blue mb-2 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Z"/></svg>
                Acuan Domisili Master (DTKS/P3KE)
              </p>
              <FieldRow label="Kelurahan" value={kelDB} />
              <FieldRow label="Kecamatan" value={kecDB} />
              <FieldRow label="Alamat KTP" value={rowMaster?.ALAMAT || "—"} />
              <FieldRow label="RT / RW" value={rowMaster ? `RT ${rowMaster.NO_RT !== "" ? rowMaster.NO_RT : "—"} / RW ${rowMaster.NO_RW !== "" ? rowMaster.NO_RW : "—"}` : "—"} />
              <FieldRow label="Usia" value={rowMaster?.USIA ? `${rowMaster.USIA} Tahun` : "—"} />
              <FieldRow label="Hub. Keluarga" value={rowMaster?.HUBUNGAN_KELUARGA || "—"} />
              <FieldRow label="Desil / Program" value={rowMaster ? `Desil ${rowMaster.DESIL || "—"} · ${rowMaster.bansos || "—"}` : "—"} />
              <FieldRow label="No. KK" value={noKKTampil} mono />
            </div>

            {/* Kolom kanan: Dokumen BAST */}
            <div className="px-4 sm:px-5 py-4 space-y-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-700 mb-2 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  Dokumen Konkret BAST &amp; Banpang
                </p>
                <FieldRow label="Kelurahan BAST" value={kelBAST} />
                <FieldRow label="Nomor Urut" value={noUrutTampil} />
                <FieldRow label="Barcode" value={rowBAST?.BARCODE || "—"} mono />
                <FieldRow label="RT / RW BAST" value={rtRwBAST || (rtRwMaster || "—")} />
                <FieldRow label="Alamat BAST" value={rowBAST?.ALAMAT_BAST || "—"} />
                <FieldRow label="ID Wilayah" value={rowMaster?.ID_WILAYAH || "—"} mono />
              </div>

              {/* Instruksi petugas */}
              <div className={`p-3 rounded-xl text-xs leading-relaxed font-medium border ${cfg.wrap}`}>
                <p className="font-bold mb-1 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12.01" y2="8"/><line x1="12" y1="12" x2="12" y2="16"/></svg>
                  Instruksi Petugas Lapangan
                </p>
                {cfg.instruksi}
              </div>

              {/* Penanda Edukasi TTD Nyasar di Kertas BAST */}
              <div className="p-3 rounded-xl text-[11px] leading-relaxed font-medium bg-amber-50/80 border border-amber-200 text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1 text-amber-900">
                  <svg className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  Deteksi TTD Nyasar / Salah Baris di BAST Kertas:
                </p>
                <p className="text-amber-800">
                  Jika lembar BAST kertas terlanjur ditandatangani orang lain/salah baris, Warga Asli ini <b>TETAP BERHAK MENERIMA BERAS 30 KG</b> selama statusnya valid &amp; belum pernah diserahkan. Cukup minta TTD ulang di kolom catatan/perbaikan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Widget Anggota Keluarga 1 KK & Proteksi Ganda */}
      {noKKTampil !== "—" && (
        <KeluargaKKPanel
          noKK={noKKTampil}
          currentNIK={nikTampil}
          onPilihAnggota={onPilihAnggota}
        />
      )}

      {/* Sticky action bar */}
      <div className="sticky bottom-0 bg-white border-t border-slate-200 px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] z-20 rounded-b-2xl">
        <p className="text-xs font-semibold text-slate-700 hidden sm:block">Catat hasil pelayanan ke riwayat harian posko:</p>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button
            variant="success"
            size="md"
            className="flex-1 sm:flex-none"
            icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
            onClick={handleLayaniSukses}
          >
            Tandai Selesai Salur (30 Kg)
          </Button>
          <Button
            variant="danger"
            size="md"
            className="flex-1 sm:flex-none"
            icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
            onClick={handleAlihkanPengaduan}
          >
            Alihkan Pengaduan
          </Button>
        </div>
      </div>
    </div>
  );
}
