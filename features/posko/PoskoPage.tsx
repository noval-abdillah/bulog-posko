/**
 * features/posko/PoskoPage.tsx
 * Halaman Meja Posko — Stepper guided + cockpit pencarian + hasil verifikasi + audio feedback + Mobile Keyboard UX.
 */
"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useAppStore } from "@/store/appStore";
import { jalankanPengecekan } from "@/services/verifikasi";
import { cleanStr } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { mainkanSuaraSukses, mainkanSuaraPeringatan } from "@/lib/audio";
import type { MasterRow, BastRow } from "@/types";

import FileUploadPanel from "./FileUploadPanel";
import DuplicateSelector from "./DuplicateSelector";
import HasilVerifikasi from "./HasilVerifikasi";
import TabelAnomali from "./TabelAnomali";

export default function PoskoPage() {
  const masterRecords = useAppStore((s) => s.masterRecords);
  const bastRecords   = useAppStore((s) => s.bastRecords);
  const masterByNIK   = useAppStore((s) => s.masterByNIK);
  const masterByName  = useAppStore((s) => s.masterByName);
  const bastByNIK     = useAppStore((s) => s.bastByNIK);
  const bastByNoUrut  = useAppStore((s) => s.bastByNoUrut);
  const masterByKK    = useAppStore((s) => s.masterByKK);
  const poskoAktif    = useAppStore((s) => s.poskoAktif);
  const toast = useToast();

  const [query, setQuery] = useState("");
  const [showResult, setShowResult]       = useState(false);
  const [showNotFound, setShowNotFound]   = useState(false);
  const [showDuplicate, setShowDuplicate] = useState(false);

  const [rowMaster, setRowMaster] = useState<MasterRow | null>(null);
  const [rowBAST, setRowBAST]     = useState<BastRow | null>(null);
  const [matchMode, setMatchMode] = useState("Normal");
  const [dupList, setDupList]     = useState<MasterRow[]>([]);
  const [dupBAST, setDupBAST]     = useState<BastRow | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const poskoBastRecords = useMemo(() => {
    const cleanPosko = cleanStr(poskoAktif);
    return bastRecords.filter((b) => {
      const kelClean = cleanStr(b.KELURAHAN_BAST || "");
      return !kelClean || !cleanPosko || kelClean.includes(cleanPosko) || cleanPosko.includes(kelClean);
    });
  }, [bastRecords, poskoAktif]);

  const readyScan = masterRecords.length > 0 || poskoBastRecords.length > 0;

  const bersihkan = useCallback(() => {
    setQuery("");
    setShowResult(false);
    setShowNotFound(false);
    setShowDuplicate(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") bersihkan();
    }
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, [bersihkan]);

  function cekData() {
    const rawQ = query.trim();
    if (!rawQ) return;
    if (!readyScan) {
      mainkanSuaraPeringatan();
      toast.peringatan("Harap unggah file Master atau BAST terlebih dahulu!");
      return;
    }

    setShowResult(false);
    setShowNotFound(false);
    setShowDuplicate(false);

    const hasil = jalankanPengecekan(
      rawQ, poskoAktif,
      poskoBastRecords, masterRecords,
      masterByNIK, masterByName,
      bastByNIK, bastByNoUrut,
      masterByKK
    );

    if (hasil.tidakDitemukan) {
      mainkanSuaraPeringatan();
      setShowNotFound(true);
      return;
    }

    mainkanSuaraSukses();

    if (hasil.adaDuplikat) {
      setDupList(hasil.matchesMaster);
      setDupBAST(hasil.matchBAST);
      setShowDuplicate(true);
      const mode = hasil.matchMode + " (Otomatis Sesuai Posko)";
      setMatchMode(mode);
      tampilkan(hasil.matchesMaster[0] ?? null, hasil.matchBAST, mode);
    } else {
      tampilkan(hasil.matchesMaster[0] ?? null, hasil.matchBAST, hasil.matchMode);
    }
  }

  function tampilkan(master: MasterRow | null, bast: BastRow | null, mode: string) {
    setRowMaster(master);
    setRowBAST(bast);
    setMatchMode(mode);
    setShowResult(true);
  }

  function handleDupPilih(item: MasterRow) {
    setShowDuplicate(false);
    tampilkan(item, dupBAST, matchMode.replace(" (Otomatis Sesuai Posko)", ""));
  }

  return (
    <div className="space-y-5">
      {/* Stepper + Upload */}
      <FileUploadPanel />

      {/* Cockpit scan */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-bulog-orange/10 flex items-center justify-center text-bulog-orange flex-shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h4M7 16h8"/></svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Pencarian &amp; Scan Barcode</h2>
            <p className="text-xs text-slate-500">Scan barcode BAST, ketik NIK, nama, atau nomor urut</p>
          </div>
        </div>

        {/* Search bar besar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              inputMode="search"
              enterKeyHint="search"
              autoCapitalize="characters"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && cekData()}
              placeholder="Scan barcode BAST / NIK 16 digit / Nama Lengkap / No Urut (cth: 1095)..."
              className={`w-full px-4 py-3.5 pl-11 border-2 rounded-xl focus:outline-none text-base font-bold uppercase tracking-wide transition touch-manipulation min-h-[48px]
                ${readyScan
                  ? "border-slate-300 focus:border-bulog-blue bg-white"
                  : "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"}`}
              disabled={!readyScan}
              autoFocus
            />
            <span className={`absolute left-3.5 top-3.5 ${readyScan ? "text-slate-400" : "text-slate-300"}`}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            {query && (
              <button
                onClick={bersihkan}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 p-1 touch-manipulation"
                aria-label="Hapus pencarian"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </button>
            )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="primary"
              size="lg"
              className="flex-1 sm:flex-none"
              onClick={cekData}
              disabled={!readyScan || !query.trim()}
              icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>}
            >
              Cek Data
            </Button>
            <Button variant="secondary" size="lg" className="flex-1 sm:flex-none" onClick={bersihkan} aria-label="Reset pencarian">
              Reset
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 mt-2.5 gap-2">
          <span>
            {readyScan
              ? <>Mendukung: <b>Barcode BAST</b> · <b>NIK 16 digit</b> · <b>Nama Lengkap</b> · <b>No. Urut (cth: 1095)</b></>
              : "Muat file Master atau BAST terlebih dahulu untuk mulai scanning"}
          </span>
          <span className="flex items-center gap-1 text-bulog-blue font-medium">
            <kbd className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-mono">Enter</kbd> cek · <kbd className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-mono">Esc</kbd> reset
          </span>
        </div>

        {/* Duplicate selector */}
        {showDuplicate && (
          <div className="mt-3">
            <DuplicateSelector
              matchesMaster={dupList}
              matchBAST={dupBAST}
              poskoAktif={poskoAktif}
              matchMode={matchMode}
              onPilih={handleDupPilih}
            />
          </div>
        )}
      </Card>

      {/* Hasil verifikasi */}
      {showResult && (
        <HasilVerifikasi
          rowMaster={rowMaster}
          rowBAST={rowBAST}
          posko={poskoAktif}
          matchMode={matchMode}
          onSimpan={bersihkan}
          onPilihAnggota={(m) => tampilkan(m, rowBAST, "Anggota Keluarga (1 KK)")}
        />
      )}

      {/* Not found */}
      {showNotFound && (
        <Card>
          <EmptyState
            icon={
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            }
            title="DATA TIDAK DITEMUKAN"
            description="Tidak ditemukan di Master Data maupun BAST yang dimuat. Pastikan nama/NIK benar atau arahkan warga ke Meja Pengaduan."
            action={
              <Button variant="secondary" size="sm" onClick={bersihkan}>Coba Pencarian Lain</Button>
            }
          />
        </Card>
      )}

      {/* Tabel anomali */}
      <TabelAnomali />
    </div>
  );
}
