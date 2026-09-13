/**
 * features/posko/FileUploadPanel.tsx
 * Panel upload dengan Stepper guided + Web Worker + PDF BAST parser + Cross-Check Instant & Laporan Impor Konkret.
 */
"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/store/appStore";
import { useExcelImport } from "@/hooks/useExcelImport";
import { usePdfBast } from "@/hooks/usePdfBast";
import { normalizeMasterRow, prosesImportMasterDataWithReport } from "@/services/masterData";
import { crossCheckBastKeMaster } from "@/services/bastParser";
import { cleanNum, cleanStr } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { Stepper } from "@/components/ui/Stepper";
import type { BastRow } from "@/types";

export default function FileUploadPanel() {
  const masterRecords       = useAppStore((s) => s.masterRecords);
  const bastRecords         = useAppStore((s) => s.bastRecords);
  const loadedBASTFiles     = useAppStore((s) => s.loadedBASTFiles);
  const poskoAktif          = useAppStore((s) => s.poskoAktif);
  const masterByNIK         = useAppStore((s) => s.masterByNIK);
  const masterByName        = useAppStore((s) => s.masterByName);
  const setMasterRecords    = useAppStore((s) => s.setMasterRecords);
  const appendBastRecords   = useAppStore((s) => s.appendBastRecords);
  const tambahLogBermasalah = useAppStore((s) => s.tambahLogBermasalah);
  const tambahImporReport   = useAppStore((s) => s.tambahImporReport);

  const { bacaExcelMasterViaWorker, bacaExcelSheet0 } = useExcelImport();
  const { parsePdfFile } = usePdfBast();
  const toast = useToast();

  const [masterLoading, setMasterLoading] = useState(false);
  const [masterProgressText, setMasterProgressText] = useState("");
  const [masterNama, setMasterNama] = useState("");

  const [bastLoading, setBastLoading] = useState(false);
  const [bastProgress, setBastProgress] = useState("");

  const cleanPosko = cleanStr(poskoAktif);

  const poskoBastRecords = useMemo(() => {
    return bastRecords.filter((b) => {
      const bKel = cleanStr(b.KELURAHAN_BAST || "");
      return !bKel || !cleanPosko || bKel.includes(cleanPosko) || cleanPosko.includes(bKel);
    });
  }, [bastRecords, cleanPosko]);

  const poskoLoadedFiles = useMemo(() => {
    return loadedBASTFiles.filter((f) => cleanStr(f).includes(cleanPosko) || cleanPosko.includes(cleanStr(f)));
  }, [loadedBASTFiles, cleanPosko]);

  const masterDone = masterRecords.length > 0;
  const bastDone   = poskoBastRecords.length > 0;

  const steps = [
    {
      id: 1,
      label: "Muat Data Master",
      description: "File Excel utama 142k baris",
      done: masterDone,
      active: !masterDone,
    },
    {
      id: 2,
      label: "Muat BAST Bulog",
      description: "PDF/Excel undangan penerima",
      done: bastDone,
      active: masterDone && !bastDone,
    },
    {
      id: 3,
      label: "Pilih Posko",
      description: "Diatur di sidebar kiri",
      done: true,
      active: false,
    },
    {
      id: 4,
      label: "Siap Melayani",
      description: "Semua data terindeks",
      done: masterDone && bastDone,
      active: masterDone && bastDone,
    },
  ];

  async function handleMasterChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMasterLoading(true);
    setMasterNama(file.name);
    setMasterProgressText("Membaca file...");

    try {
      const { records, sheetUsed } = await bacaExcelMasterViaWorker(file, undefined, (processed, total) => {
        setMasterProgressText(`Memproses: ${processed.toLocaleString("id-ID")}/${total.toLocaleString("id-ID")} baris`);
      });

      // Proses validasi & Laporan Impor Konkret
      const { validRecords, report, logBermasalahItems } = prosesImportMasterDataWithReport(records, file.name);

      setMasterRecords(validRecords);
      tambahImporReport(report);

      if (logBermasalahItems.length > 0) {
        tambahLogBermasalah(logBermasalahItems);
        toast.peringatan(
          `Master Data dimuat: ${validRecords.length.toLocaleString("id-ID")} baris. ${report.totalBarisSkipped} baris di-skip (NIK invalid) & ${report.totalDuplikat} NIK duplikat dicatat di Tab Data Bermasalah.`
        );
      } else {
        toast.sukses(`Master Data berhasil dimuat murni dari sheet '${sheetUsed}': ${validRecords.length.toLocaleString("id-ID")} baris`);
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Pastikan format file benar.";
      toast.error(msg);
    }
    setMasterLoading(false);
    setMasterProgressText("");
    e.target.value = "";
  }

  async function handleBastChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setBastLoading(true);

    for (const file of files) {
      const isPDF = file.name.toLowerCase().endsWith(".pdf");
      if (isPDF) {
        try {
          setBastProgress(`Membuka: ${file.name}...`);
          const { records, kelurahan, totalPerkiraan } = await parsePdfFile(
            file, poskoAktif,
            (p, t) => setBastProgress(`Hal ${p}/${t} (${Math.round((p / t) * 100)}%)`)
          );

          // Instant Cross-Check ke Master Data 142k
          const { checkedRecords, logBermasalahItems, detectedMajorityKelurahan } = crossCheckBastKeMaster(
            records,
            masterByNIK,
            masterByName
          );

          const finalKel = detectedMajorityKelurahan || kelurahan;

          appendBastRecords(checkedRecords, finalKel);
          if (logBermasalahItems.length > 0) tambahLogBermasalah(logBermasalahItems);

          const isBedaPosko = cleanStr(finalKel) !== cleanStr(poskoAktif);

          // Cek Peringatan Selisih Alokasi PDF
          if (totalPerkiraan && Math.abs(totalPerkiraan - records.length) > 5) {
            toast.peringatan(
              `Peringatan Selisih Ekstraksi PDF [${file.name}]: PDF tertera Total ${totalPerkiraan} PBP, namun berhasil dibaca ${records.length} penerima (${finalKel}). Cek halaman yang gagal di Tab Data Bermasalah.`
            );
          } else {
            const countBermasalah = logBermasalahItems.length;
            toast.sukses(
              `BAST PDF berhasil dimuat: ${records.length} penerima (${finalKel}). ${isBedaPosko ? `(Sistem mengidentifikasi wilayah ${finalKel})` : ""} ${countBermasalah > 0 ? countBermasalah + " entri tanpa padanan Master dicatat." : ""}`
            );
          }
        } catch (err: unknown) {
          console.error(err);
          const msg = err instanceof Error ? err.message : "Gagal membaca PDF.";
          toast.error(msg);
        }
      } else {
        try {
          const raw = await bacaExcelSheet0(file);
          let detectedKel = poskoAktif;
          const rawRecords: BastRow[] = raw.map((r, idx) => {
            const norm = normalizeMasterRow(r, file.name, idx + 2);
            const kel = norm.KEL_NAME || detectedKel;
            detectedKel = kel;
            return {
              NAMA: norm.NAMA || "",
              KELURAHAN_BAST: kel,
              BARCODE: (norm["BARCODE"] as string) || norm.ID_WILAYAH || "-",
              NIK: norm.NIK || "",
              NO_KK: norm.NO_KK || "",
              NO_URUT: cleanNum(r["NO"] || r["NO_URUT"] || "")
                ? parseInt(cleanNum(r["NO"] || r["NO_URUT"] || ""), 10)
                : null,
              ALAMAT_BAST: norm.ALAMAT || "",
              _sourceFile: file.name,
              _sourceRow: idx + 2,
            };
          });

          // Instant Cross-Check ke Master Data 142k
          const { checkedRecords, logBermasalahItems, detectedMajorityKelurahan } = crossCheckBastKeMaster(
            rawRecords,
            masterByNIK,
            masterByName
          );

          const finalKel = detectedMajorityKelurahan || detectedKel;

          appendBastRecords(checkedRecords, finalKel);
          if (logBermasalahItems.length > 0) tambahLogBermasalah(logBermasalahItems);

          toast.sukses(`BAST Excel berhasil dimuat: ${checkedRecords.length} penerima (${finalKel})`);
        } catch (err: unknown) {
          console.error(err);
          const msg = err instanceof Error ? err.message : "Gagal membaca Excel BAST.";
          toast.error(msg);
        }
      }
    }

    setBastLoading(false);
    setBastProgress("");
    e.target.value = "";
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
      {/* Stepper */}
      <div>
        <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Alur Konfigurasi</p>
        <Stepper steps={steps} />
      </div>

      {/* Upload area — 2 kolom */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 border-t border-slate-100">
        {/* Master */}
        <div className={`rounded-xl border-2 p-4 space-y-3 transition-colors ${masterDone ? "border-emerald-200 bg-emerald-50/30" : "border-dashed border-slate-300 bg-slate-50/50"}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-bulog-blue flex items-center gap-1.5">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Z"/><path d="M18 14h-8M18 10h-8M18 6h-8"/></svg>
              1 · Master Acuan Domisili (DTKS/P3KE)
            </span>
            {masterDone && (
              <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                {masterRecords.length.toLocaleString("id-ID")} baris
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">File Excel acuan melacak undangan nyasar &amp; RT/RW (mis: <b>UTAMA - JAKUT.xlsx</b>)</p>
          <label className={`cursor-pointer flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition shadow-sm
            ${masterDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-bulog-blue hover:bg-bulog-dark text-white"}`}>
            {masterLoading ? (
              <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>{masterProgressText || "Memproses..."}</>
            ) : (
              <><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
              {masterDone ? "Ganti File Master" : "Muat File Excel Master"}</>
            )}
            <input type="file" accept=".xlsx,.xls,.xlsb" className="hidden" onChange={handleMasterChange} disabled={masterLoading} />
          </label>
          {masterDone && masterNama && (
            <p className="text-[11px] text-emerald-700 font-medium truncate flex items-center gap-1">
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              {masterNama}
            </p>
          )}
        </div>

        {/* BAST */}
        <div className={`rounded-xl border-2 p-4 space-y-3 transition-colors ${bastDone ? "border-emerald-200 bg-emerald-50/30" : "border-dashed border-emerald-300 bg-emerald-50/20"}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-emerald-700 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              2 · Berkas Konkret BAST &amp; NIK
            </span>
            {bastDone && (
              <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                {poskoBastRecords.length.toLocaleString("id-ID")} PBP
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">PDF/Excel BAST sah penyerahan 30 Kg &amp; Barcode NIK (mis: <b>BAST Normal...pdf</b>)</p>
          <label className="cursor-pointer flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white">
            {bastLoading ? (
              <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>{bastProgress || "Memproses..."}</>
            ) : (
              <><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
              {bastDone ? `Timpa / Unggah Berkas BAST (${poskoAktif})` : `Muat PDF/Excel BAST (${poskoAktif})`}</>
            )}
            <input type="file" accept=".pdf,.xlsx,.xls,.csv" multiple className="hidden"
              onChange={handleBastChange} disabled={bastLoading} />
          </label>
          {bastDone && poskoLoadedFiles.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {poskoLoadedFiles.map((k) => (
                <span key={k} className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-md">{k}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
