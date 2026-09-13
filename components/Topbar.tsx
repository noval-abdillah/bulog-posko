/**
 * components/Topbar.tsx
 * Topbar di atas area konten: judul halaman, status data, Kalkulator Beras, dan Reset Data.
 */
"use client";

import { useState } from "react";
import { useAppStore } from "@/store/appStore";
import { useToast } from "@/components/ui/Toast";
import ModalKalkulatorBeras from "@/components/ui/ModalKalkulatorBeras";

const PAGE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  posko:     "Meja Posko",
  log:       "Pengganti Tertolak",
  audit:     "Audit Ekspor",
  bermasalah:"Data Bermasalah",
  panduan:   "Panduan Penggunaan",
};

export default function Topbar() {
  const activeTab      = useAppStore((s) => s.activeTab);
  const toggleSidebar  = useAppStore((s) => s.toggleSidebar);
  const masterRecords  = useAppStore((s) => s.masterRecords);
  const bastRecords    = useAppStore((s) => s.bastRecords);
  const poskoAktif     = useAppStore((s) => s.poskoAktif);
  const resetSemuaData = useAppStore((s) => s.resetSemuaData);
  const toast = useToast();

  const [showKalkulator, setShowKalkulator] = useState(false);

  async function handleResetData() {
    if (confirm("Apakah Anda yakin ingin mengosongkan semua data ter-index (Master, BAST, Log, Audit) dari memori browser?")) {
      await resetSemuaData();
      toast.info("Semua data ter-index dan memori lokal IndexedDB berhasil dikosongkan.");
    }
  }

  return (
    <>
      <header className="pt-safe bg-white border-b border-slate-200 flex flex-col justify-center flex-shrink-0 sticky top-0 z-30">
        <div className="h-14 flex items-center justify-between px-4 lg:px-6 w-full">
          <div className="flex items-center gap-3">
          {/* Hamburger */}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
            aria-label="Toggle sidebar"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium hidden sm:inline">Bulog Posko</span>
            <span className="text-slate-300 hidden sm:inline">/</span>
            <span className="font-bold text-slate-800">{PAGE_LABELS[activeTab]}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status badge data */}
          {(masterRecords.length > 0 || bastRecords.length > 0) && (
            <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" />
              {(masterRecords.length + bastRecords.length).toLocaleString("id-ID")} Terindeks
            </span>
          )}

          {/* Posko pill */}
          <span className="hidden md:flex items-center gap-1.5 text-[11px] font-bold text-bulog-blue bg-bulog-blue/8 border border-bulog-blue/20 px-2.5 py-1 rounded-lg">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            {poskoAktif}
          </span>

          {/* Tombol Quick-Calculator Beras */}
          <button
            onClick={() => setShowKalkulator(true)}
            title="Kalkulator & Stok Opname Logistik Beras PBP"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 active:scale-[0.96] text-bulog-blue border border-blue-200 text-xs font-bold rounded-xl transition shadow-2xs"
          >
            <svg className="w-3.5 h-3.5 text-bulog-blue flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <line x1="8" y1="6" x2="16" y2="6" />
              <line x1="16" y1="14" x2="16" y2="18" />
              <path d="M16 10h.01M12 10h.01M8 10h.01M12 14h.01M8 14h.01M12 18h.01M8 18h.01" />
            </svg>
            <span className="hidden sm:inline">Kalkulator Beras</span>
          </button>

          {/* Reset button */}
          {(masterRecords.length > 0 || bastRecords.length > 0) && (
            <button
              onClick={handleResetData}
              title="Bersihkan memori lokal IndexedDB"
              className="p-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 border border-slate-200 rounded-xl transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          )}
        </div>
        </div>
      </header>

      {/* Modal Quick-Calculator Beras */}
      {showKalkulator && (
        <ModalKalkulatorBeras onClose={() => setShowKalkulator(false)} />
      )}
    </>
  );
}
