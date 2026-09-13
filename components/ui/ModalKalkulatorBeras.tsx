/**
 * components/ui/ModalKalkulatorBeras.tsx
 * Modal Quick-Calculator & Stok Opname Logistik Beras PBP Perum BULOG.
 * Memudahkan petugas posko menghitung sisa PBP, konversi Kg, Karung, Estimasi Retur Truk,
 * serta Stok Opname Karung Fisik.
 */
"use client";

import { useState } from "react";
import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { cleanNum } from "@/lib/utils";
import { analisaSelisih3Way } from "@/services/auditBulog";

interface ModalKalkulatorBerasProps {
  onClose: () => void;
}

type ModeKalkulator = "pbp_ke_beras" | "karung_ke_pbp";

export default function ModalKalkulatorBeras({ onClose }: ModalKalkulatorBerasProps) {
  const poskoAktif = useAppStore((s) => s.poskoAktif);
  const masterRecords = useAppStore((s) => s.masterRecords);
  const bastRecords = useAppStore((s) => s.bastRecords);
  const bulogExportRecords = useAppStore((s) => s.bulogExportRecords);
  const bulogSudahSerahRecords = useAppStore((s) => s.bulogSudahSerahRecords);
  const bulogBelumSerahRecords = useAppStore((s) => s.bulogBelumSerahRecords);
  const logPelayanan = useAppStore((s) => s.logPelayanan);
  const masterByNIK = useAppStore((s) => s.masterByNIK);
  const masterByName = useAppStore((s) => s.masterByName);
  const toast = useToast();

  const [mode, setMode] = useState<ModeKalkulator>("pbp_ke_beras");

  // State Mode A: PBP -> Beras
  const [sisaPBPInput, setSisaPBPInput] = useState<string>("100");

  // State Mode B: Karung -> PBP
  const [karung10kgInput, setKarung10kgInput] = useState<string>("300");

  // Hitung otomatis Mode A
  const pbpCount = parseInt(sisaPBPInput || "0", 10) || 0;
  const totalKg = pbpCount * 30;
  const totalTon = (totalKg / 1000).toFixed(2);
  const karung10Kg = pbpCount * 3;
  const karung30Kg = pbpCount * 1;

  let estimasiArmada = "Pick-up / Mobil Boks Kecil (≤ 1,5 Ton)";
  if (totalKg > 1500 && totalKg <= 5000) {
    estimasiArmada = "Truk Engkel CDE (≤ 5 Ton)";
  } else if (totalKg > 5000 && totalKg <= 10000) {
    estimasiArmada = "Truk Double CDD (≤ 10 Ton)";
  } else if (totalKg > 10000) {
    estimasiArmada = "Truk Fuso / Tronton (> 10 Ton)";
  }

  // Hitung otomatis Mode B
  const karungCount = parseInt(karung10kgInput || "0", 10) || 0;
  const pbpHasilKarung = Math.floor(karungCount / 3);
  const sisaKarungGantung = karungCount % 3;

  function handleTarikSisaSistem() {
    const selisih = analisaSelisih3Way(
      bulogExportRecords,
      masterRecords,
      bastRecords,
      logPelayanan,
      masterByNIK,
      masterByName,
      poskoAktif,
      bulogSudahSerahRecords,
      bulogBelumSerahRecords
    );

    // Filter khusus poskoAktif & sisa yang BELUM_DIAMBIL atau TUNGGU_INPUT_WEB
    const targetPoskoClean = poskoAktif.toUpperCase().replace(/[^0-9A-Z]/g, "");
    const sisaPosko = selisih.filter((r) => {
      const kelClean = (r.kelurahan || "").toUpperCase().replace(/[^0-9A-Z]/g, "");
      if (targetPoskoClean && kelClean && !kelClean.includes(targetPoskoClean) && !targetPoskoClean.includes(kelClean)) {
        return false;
      }
      return r.kategoriSelisih === "BELUM_DIAMBIL" || r.kategoriSelisih === "TUNGGU_INPUT_WEB";
    });

    const totalSisa = sisaPosko.length > 0 ? sisaPosko.length : 100;
    setSisaPBPInput(String(totalSisa));
    toast.sukses(`Sisa PBP Posko ${poskoAktif} ditarik dari sistem: ${totalSisa} PBP (${(totalSisa * 30).toLocaleString("id-ID")} Kg Beras)`);
  }

  function handleSalinRingkasanWA() {
    const tgl = new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    let textWA = "";
    if (mode === "pbp_ke_beras") {
      textWA = `*LAPORAN STOK RETUR LOGISTIK BERAS PBP*
📍 *Posko:* ${poskoAktif}
📅 *Tanggal:* ${tgl}

• *Sisa PBP Belum Ambil:* ${pbpCount.toLocaleString("id-ID")} PBP
• *Total Volume Beras:* ${totalKg.toLocaleString("id-ID")} Kg (${totalTon} Ton)
• *Jumlah Karung (10 Kg):* ${karung10Kg.toLocaleString("id-ID")} Karung
• *Jumlah Karung (30 Kg):* ${karung30Kg.toLocaleString("id-ID")} Karung
• *Rekomendasi Armada Retur:* ${estimasiArmada}

_Laporan dibuat otomatis dari Kalkulator Logistik Bulog Posko_`;
    } else {
      textWA = `*LAPORAN STOK OPNAME FISIK KARUNG BERAS*
📍 *Posko:* ${poskoAktif}
📅 *Tanggal:* ${tgl}

• *Fisik Karung 10 Kg:* ${karungCount.toLocaleString("id-ID")} Karung
• *Ekuivalen Jatah PBP:* ${pbpHasilKarung.toLocaleString("id-ID")} PBP (${(pbpHasilKarung * 30).toLocaleString("id-ID")} Kg)
• *Sisa Karung Gantung:* ${sisaKarungGantung} Karung (Belum Genap 30 Kg)

_Laporan dibuat otomatis dari Kalkulator Logistik Bulog Posko_`;
    }

    navigator.clipboard.writeText(textWA);
    toast.sukses("Ringkasan kalkulator berhasil disalin ke clipboard!");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="px-5 py-4 bg-bulog-blue text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-amber-400 flex-shrink-0">
              <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="2" width="16" height="20" rx="2" />
                <line x1="8" y1="6" x2="16" y2="6" />
                <line x1="16" y1="14" x2="16" y2="18" />
                <path d="M16 10h.01M12 10h.01M8 10h.01M12 14h.01M8 14h.01M12 18h.01M8 18h.01" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">Kalkulator Logistik Beras PBP</h3>
              <p className="text-[11px] text-white/70">Posko: {poskoAktif} · 1 PBP = 30 Kg Beras</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg transition"
            aria-label="Tutup kalkulator"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tab Switcher Mode */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex gap-2">
          <button
            onClick={() => setMode("pbp_ke_beras")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition ${
              mode === "pbp_ke_beras"
                ? "bg-bulog-blue text-white shadow-sm"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            Sisa PBP ➔ Volume Beras (Kg)
          </button>
          <button
            onClick={() => setMode("karung_ke_pbp")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition ${
              mode === "karung_ke_pbp"
                ? "bg-bulog-blue text-white shadow-sm"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            Stok Karung ➔ Jatah PBP
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {mode === "pbp_ke_beras" ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Jumlah Sisa PBP (Penerima Hak):
                  </label>
                  <button
                    type="button"
                    onClick={handleTarikSisaSistem}
                    className="text-[11px] text-bulog-blue hover:underline font-bold flex items-center gap-1"
                  >
                    ⚡ Tarik Sisa Posko Ini
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={sisaPBPInput}
                    onChange={(e) => setSisaPBPInput(cleanNum(e.target.value))}
                    placeholder="Masukkan jumlah PBP..."
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-bulog-blue"
                  />
                  <span className="absolute right-3 top-3 text-xs font-bold text-slate-400">PBP</span>
                </div>
              </div>

              {/* Hasil Perhitungan Mode A */}
              <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-bulog-blue">Hasil Konversi Beras &amp; Retur Logistik</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-blue-100">
                    <span className="text-[10px] text-slate-500 font-bold block">Total Volume Beras</span>
                    <span className="text-xl font-black text-bulog-blue">{totalKg.toLocaleString("id-ID")} Kg</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">({totalTon} Ton)</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-blue-100">
                    <span className="text-[10px] text-slate-500 font-bold block">Karung 10 Kg (Standard)</span>
                    <span className="text-xl font-black text-emerald-700">{karung10Kg.toLocaleString("id-ID")}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Karung (3x PBP)</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                    <span className="text-[10px] text-slate-500 font-bold block">Kemasan 30 Kg</span>
                    <span className="text-sm font-black text-slate-800">{karung30Kg.toLocaleString("id-ID")} Karung</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                    <span className="text-[10px] text-slate-500 font-bold block">Estimasi Truk Retur</span>
                    <span className="text-[11px] font-bold text-amber-800 leading-tight block">{estimasiArmada}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jumlah Karung Fisik Beras 10 Kg di Posko:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={karung10kgInput}
                    onChange={(e) => setKarung10kgInput(cleanNum(e.target.value))}
                    placeholder="Masukkan jumlah karung 10kg..."
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-bulog-blue"
                  />
                  <span className="absolute right-3 top-3 text-xs font-bold text-slate-400">Karung</span>
                </div>
              </div>

              {/* Hasil Perhitungan Mode B */}
              <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Hasil Stok Opname Karung</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-slate-500 font-bold block">Jatah PBP Terlayani</span>
                    <span className="text-xl font-black text-emerald-700">{pbpHasilKarung.toLocaleString("id-ID")} PBP</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">({(pbpHasilKarung * 30).toLocaleString("id-ID")} Kg)</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-slate-500 font-bold block">Sisa Karung Gantung</span>
                    <span className="text-xl font-black text-amber-700">{sisaKarungGantung} Karung</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">(Belum genap 30 Kg)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSalinRingkasanWA}
            className="w-full sm:w-auto"
            icon={
              <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            }
          >
            Salin Ringkasan WA
          </Button>

          <Button variant="primary" size="sm" onClick={onClose} className="w-full sm:w-auto">
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}
