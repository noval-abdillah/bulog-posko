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
import { aiScanOcrKtp, aiDeepMatchName } from "@/lib/ai";
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

  const [ocrLoading, setOcrLoading] = useState(false);
  const [deepMatching, setDeepMatching] = useState(false);

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

  async function handleAiOcrImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrLoading(true);
    toast.info("🤖 AI Vision 9router sedang membaca KTP/BAST...");
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const customKey = localStorage.getItem("ninerouter_api_key") ?? undefined;
      const res = await aiScanOcrKtp(base64, customKey);

      const targetSearch = res.nik || res.nama || "";
      if (targetSearch) {
        setQuery(targetSearch);
        toast.sukses(`AI OCR Berhasil: NIK ${res.nik || "—"} / Nama: ${res.nama || "—"}`);
        setTimeout(() => {
          const rawQ = targetSearch.trim();
          const hasil = jalankanPengecekan(
            rawQ, poskoAktif,
            poskoBastRecords, masterRecords,
            masterByNIK, masterByName,
            bastByNIK, bastByNoUrut,
            masterByKK
          );
          if (!hasil.tidakDitemukan) {
            mainkanSuaraSukses();
            tampilkan(hasil.matchesMaster[0] ?? null, hasil.matchBAST, "AI OCR Vision (9router)");
          }
        }, 100);
      } else {
        toast.peringatan("AI OCR tidak menemukan NIK/Nama yang jelas dari foto.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Gagal AI OCR: ${msg}`);
    } finally {
      setOcrLoading(false);
      e.target.value = "";
    }
  }

  async function handleAiDeepMatch() {
    if (!query.trim() || masterRecords.length === 0) return;
    setDeepMatching(true);
    toast.info("🤖 AI 9router sedang membandingkan kemiripan typo nama...");

    try {
      const candidateList = masterRecords.slice(0, 100).map((m) => ({ NAMA: m.NAMA, NIK: m.NIK, KEL: m.KEL_NAME }));
      const customKey = localStorage.getItem("ninerouter_api_key") ?? undefined;
      const res = await aiDeepMatchName(query, candidateList, customKey);

      if (res.bestMatchIndex != null && candidateList[res.bestMatchIndex]) {
        const matchedItem = masterRecords[res.bestMatchIndex];
        mainkanSuaraSukses();
        setShowNotFound(false);
        tampilkan(matchedItem, null, `AI Deep Match (${res.confidenceScore}%) — ${res.alasan}`);
        toast.sukses(`AI Match Cocok: ${matchedItem.NAMA} (${res.confidenceScore}%)`);
      } else {
        toast.peringatan("AI Deep Match tidak menemukan kandidat nama yang cocok.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Gagal AI Deep Match: ${msg}`);
    } finally {
      setDeepMatching(false);
    }
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
          <div className="flex gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
            <label className={`cursor-pointer flex items-center justify-center gap-1.5 px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 active:scale-[0.98] text-white font-bold rounded-xl text-xs transition shadow-sm touch-manipulation min-h-[48px] flex-1 sm:flex-none ${!readyScan || ocrLoading ? "opacity-50 pointer-events-none" : ""}`}>
              {ocrLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  <span>Memproses AI...</span>
                </>
              ) : (
                <>
                  <span className="text-base">📷</span>
                  <span>AI OCR KTP</span>
                </>
              )}
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleAiOcrImage} disabled={ocrLoading || !readyScan} />
            </label>
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
        <Card className="border-rose-200 bg-rose-50/40">
          <EmptyState
            icon={
              <svg className="w-7 h-7 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            }
            title="DATA TIDAK DITEMUKAN"
            description={`Tidak ditemukan secara langsung untuk "${query}" di BAST Posko ${poskoAktif} maupun Master Data.`}
            action={
              <div className="flex gap-2 flex-wrap justify-center">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAiDeepMatch}
                  disabled={deepMatching || masterRecords.length === 0}
                  icon={<span>🤖</span>}
                >
                  {deepMatching ? "AI Matching..." : "AI Deep Match Typo"}
                </Button>
                <Button variant="secondary" size="sm" onClick={bersihkan}>
                  Coba Pencarian Lain
                </Button>
              </div>
            }
          />
        </Card>
      )}

      {/* Tabel anomali */}
      <TabelAnomali />
    </div>
  );
}
