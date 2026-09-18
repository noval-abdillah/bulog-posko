/**
 * features/audit/AuditPage.tsx
 * Halaman Audit Rekonsiliasi & Modul Rekonsiliasi Selisih 3-Way (Triple Match Engine)
 * Membaca 2 File Ekspor Resmi dari Web Bulog (File 1: Sudah Diserahkan & File 2: Belum Diserahkan).
 * Membaca 100% Nilai Murni verification_status & status_serah dari Excel Web Bulog (Banpang) tanpa override default.
 */
"use client";

import { useState, useMemo, useEffect } from "react";
import { useAppStore } from "@/store/appStore";
import { useExcelImport } from "@/hooks/useExcelImport";
import { parseRtRwFromText } from "@/services/bastParser";
import {
  filterAuditRows,
  hitungStatistikBulog,
  analisaSelisih3Way,
  type FilterAudit,
} from "@/services/auditBulog";
import { eksporExcel } from "@/lib/excel";
import { aiGenerateAuditInsight } from "@/lib/ai";
import { cleanStr, cleanNum, formatWaktuSekarang, fixNIK } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import ModalCetakSPTJM from "./ModalCetakSPTJM";
import ModalPesanWA from "./ModalPesanWA";
import type { AuditRow, MasterRow, KategoriSelisih, SelisihAuditRow } from "@/types";

const PAGE_SIZE = 50;

type ModeAuditTab = "selisih3way" | "bastAudit";
type SortKey = "nama" | "status_pbp" | "kelurahan";
type SortDir = "asc" | "desc";

type TipePenanda = "VERIFIED" | "REVIEW" | "MISMATCH";

const LABELS_PENANDA: Record<TipePenanda, { label: string; bg: string; text: string; icon: string }> = {
  VERIFIED: { label: "Terverifikasi Fisik BAST", bg: "bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold", text: "Terverifikasi Fisik", icon: "✅" },
  REVIEW:   { label: "Perlu Ditinjau Ulang", bg: "bg-amber-100 text-amber-900 border-amber-300 font-extrabold", text: "Perlu Ditinjau", icon: "⚠️" },
  MISMATCH: { label: "Ditemukan Ketidaksesuaian", bg: "bg-rose-100 text-rose-900 border-rose-300 font-extrabold", text: "Ketidaksesuaian", icon: "❌" },
};

type WilayahSelisihOption = {
  key: string;
  rt: string;
  rw: string;
  label: string;
  count: number;
};

function readBulogValue(source: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return undefined;
}

function readBulogText(source: Record<string, unknown>, ...keys: string[]) {
  const value = readBulogValue(source, ...keys);
  return value === undefined || value === null ? "" : String(value).trim();
}

function getAuditIdentityKey(row: AuditRow): string {
  const nik = fixNIK(row.nik) || cleanNum(row.nik);
  if (nik) return `nik:${nik}`;

  return [
    cleanStr(row.nama),
    cleanStr(row.kelurahan),
    cleanStr(row.no_bast || ""),
  ].join("|");
}

function getAuditStatusRank(status: string): number {
  const s = status.toLowerCase();
  if (s.includes("pengganti")) return 3;
  if (s.includes("beda kk")) return 2;
  if (s.includes("satu kk")) return 1;
  return 0;
}

function countFilledFields(row: AuditRow): number {
  return [
    row.nama,
    row.nik,
    row.no_kk,
    row.alamat,
    row.status_pbp,
    row.nama_pengganti,
    row.nik_pengganti,
    row.no_kk_pengganti,
    row.alamat_pengganti,
    row.pekerjaan_pengganti,
    row.no_bast,
    row.notes,
    row.kelurahan,
    row.status_serah,
    row.verification_status,
  ].filter((v) => String(v ?? "").trim() !== "").length;
}

function getWilayahSelisihKey(row: { kelurahan?: string; rt?: string; rw?: string }): string {
  return [cleanStr(row.kelurahan || ""), cleanNum(row.rt || ""), cleanNum(row.rw || "")].join("|");
}

function formatWilayahSelisihLabel(rt: string, rw: string): string {
  const rtLabel = rt && rt !== "—" ? `RT ${rt}` : "RT —";
  const rwLabel = rw && rw !== "—" ? `RW ${rw}` : "RW —";
  return `${rtLabel} / ${rwLabel}`;
}

function pilihAuditRowLebihLengkap(a: AuditRow, b: AuditRow): AuditRow {
  const rankA = getAuditStatusRank(a.status_pbp);
  const rankB = getAuditStatusRank(b.status_pbp);
  if (rankA !== rankB) return rankA > rankB ? a : b;

  const filledA = countFilledFields(a);
  const filledB = countFilledFields(b);
  if (filledA !== filledB) return filledA > filledB ? a : b;

  const rowA = Number(a._sourceRow ?? 0);
  const rowB = Number(b._sourceRow ?? 0);
  if (rowA !== rowB) return rowA < rowB ? a : b;

  return a;
}

function buildSemuaAuditRows(records: AuditRow[], bastRecords: { NIK: string; NO_URUT: number | null }[]): AuditRow[] {
  const grouped = new Map<string, AuditRow>();
  const sourceOrder = new Map<string, number>();

  bastRecords.forEach((b, idx) => {
    const nik = fixNIK(b.NIK) || cleanNum(b.NIK);
    if (nik && !sourceOrder.has(nik)) sourceOrder.set(nik, idx);
  });

  records.forEach((row) => {
    const key = getAuditIdentityKey(row);
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, row);
      return;
    }
    grouped.set(key, pilihAuditRowLebihLengkap(existing, row));
  });

  return [...grouped.values()].sort((a, b) => {
    const orderA = sourceOrder.get(fixNIK(a.nik) || cleanNum(a.nik)) ?? Number.MAX_SAFE_INTEGER;
    const orderB = sourceOrder.get(fixNIK(b.nik) || cleanNum(b.nik)) ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;

    const rowA = Number(a._sourceRow ?? 0);
    const rowB = Number(b._sourceRow ?? 0);
    if (rowA !== rowB) return rowA - rowB;

    return String(a.nama || "").localeCompare(String(b.nama || ""));
  });
}

export default function AuditPage() {
  const bulogExportRecords        = useAppStore((s) => s.bulogExportRecords);
  const bulogSudahSerahRecords    = useAppStore((s) => s.bulogSudahSerahRecords);
  const bulogBelumSerahRecords    = useAppStore((s) => s.bulogBelumSerahRecords);
  const setBulogSudahSerahRecords = useAppStore((s) => s.setBulogSudahSerahRecords);
  const setBulogBelumSerahRecords = useAppStore((s) => s.setBulogBelumSerahRecords);
  const masterRecords             = useAppStore((s) => s.masterRecords);
  const bastRecords               = useAppStore((s) => s.bastRecords);
  const logPelayanan              = useAppStore((s) => s.logPelayanan);
  const masterByNIK               = useAppStore((s) => s.masterByNIK);
  const masterByName              = useAppStore((s) => s.masterByName);
  const bastByNIK                 = useAppStore((s) => s.bastByNIK);
  const riwayatEksporBulog       = useAppStore((s) => s.riwayatEksporBulog);
  const tambahRiwayatEksporBulog   = useAppStore((s) => s.tambahRiwayatEksporBulog);
  const poskoAktif               = useAppStore((s) => s.poskoAktif);
  const sessionPosko             = useAppStore((s) => s.sessionPosko);
  const { bacaExcelSheet0 }       = useExcelImport();
  const toast = useToast();

  const isSuper = Boolean(sessionPosko?.isSuper);
  const cleanPoskoStr = cleanStr(poskoAktif);

  const isPoskoMatch = (kel: string) => {
    const cleanKel = cleanStr(kel || "");
    if (!cleanKel || !cleanPoskoStr) return true;
    return cleanKel === cleanPoskoStr || cleanKel.includes(cleanPoskoStr) || cleanPoskoStr.includes(cleanKel);
  };

  const scopedSudahSerah = useMemo(() => {
    if (isSuper || bulogSudahSerahRecords.length === 0) return bulogSudahSerahRecords;
    const filtered = bulogSudahSerahRecords.filter((r) => isPoskoMatch(r.kelurahan || ""));
    return filtered.length > 0 ? filtered : bulogSudahSerahRecords;
  }, [bulogSudahSerahRecords, cleanPoskoStr, isSuper]);

  const scopedBelumSerah = useMemo(() => {
    if (isSuper || bulogBelumSerahRecords.length === 0) return bulogBelumSerahRecords;
    const filtered = bulogBelumSerahRecords.filter((r) => isPoskoMatch(r.kelurahan || ""));
    return filtered.length > 0 ? filtered : bulogBelumSerahRecords;
  }, [bulogBelumSerahRecords, cleanPoskoStr, isSuper]);

  const scopedExportRecords = useMemo(() => {
    if (isSuper || bulogExportRecords.length === 0) return bulogExportRecords;
    const filtered = bulogExportRecords.filter((r) => isPoskoMatch(r.kelurahan || ""));
    return filtered.length > 0 ? filtered : bulogExportRecords;
  }, [bulogExportRecords, cleanPoskoStr, isSuper]);

  const scopedBastRecords = useMemo(() => {
    if (isSuper || bastRecords.length === 0) return bastRecords;
    const filtered = bastRecords.filter((b) => isPoskoMatch(b.KELURAHAN_BAST || ""));
    return filtered.length > 0 ? filtered : bastRecords;
  }, [bastRecords, cleanPoskoStr, isSuper]);

  const [auditModeTab, setAuditModeTab] = useState<ModeAuditTab>("selisih3way");

  // Status Upload 2 File Ekspor Bulog
  const [fileSudahStatus, setFileSudahStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [fileSudahNama, setFileSudahNama]     = useState("");

  const [fileBelumStatus, setFileBelumStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [fileBelumNama, setFileBelumNama]     = useState("");

  const [tanggalDitarik, setTanggalDitarik]   = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [filter, setFilter]         = useState<FilterAudit>("Semua");
  const [search, setSearch]         = useState("");
  const [sortKey, setSortKey]       = useState<SortKey>("nama");
  const [sortDir, setSortDir]       = useState<SortDir>("asc");
  const [page, setPage]             = useState(1);

  // State untuk Tab Selisih 3-Way
  const [filterKategoriSelisih, setFilterKategoriSelisih] = useState<KategoriSelisih | "SEMUA">("SEMUA");
  const [filterRTSelisih, setFilterRTSelisih]             = useState<string>("SEMUA");
  const [searchSelisih, setSearchSelisih]                 = useState<string>("");

  const [selectedSPTJMRow, setSelectedSPTJMRow] = useState<AuditRow | null>(null);
  const [showWAModal, setShowWAModal]           = useState(false);

  const [aiInsightText, setAiInsightText]       = useState("");
  const [aiInsightLoading, setAiInsightLoading] = useState(false);

  // State Penanda Fisik BAST
  const [penandaMap, setPenandaMap] = useState<Record<string, TipePenanda>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storageKey = `audit_penanda_${cleanStr(poskoAktif)}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setPenandaMap(JSON.parse(saved));
      } catch {
        setPenandaMap({});
      }
    } else {
      setPenandaMap({});
    }
  }, [poskoAktif]);

  function getRowPenandaKey(r: AuditRow): string {
    const nikClean = fixNIK(r.nik) || cleanNum(r.nik);
    if (nikClean && nikClean !== "—") return `nik:${nikClean}`;
    return `row:${cleanStr(r.nama)}_${cleanStr(r.kelurahan)}_${r.no || ""}`;
  }

  function togglePenandaRow(r: AuditRow) {
    const key = getRowPenandaKey(r);
    setPenandaMap((prev) => {
      const current = prev[key];
      let next: TipePenanda | undefined;
      if (!current) next = "VERIFIED";
      else if (current === "VERIFIED") next = "REVIEW";
      else if (current === "REVIEW") next = "MISMATCH";
      else next = undefined;

      const updated = { ...prev };
      if (next) updated[key] = next;
      else delete updated[key];

      const storageKey = `audit_penanda_${cleanStr(poskoAktif)}`;
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
  }

  function handleTandaiHalaman(status: TipePenanda = "VERIFIED") {
    setPenandaMap((prev) => {
      const updated = { ...prev };
      paginated.forEach((r) => {
        const key = getRowPenandaKey(r);
        updated[key] = status;
      });
      const storageKey = `audit_penanda_${cleanStr(poskoAktif)}`;
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
    toast.sukses(`Semua data di halaman ${page} ditandai '${LABELS_PENANDA[status].label}'.`);
  }

  function handleResetPenandaPosko() {
    if (confirm(`Reset semua penanda fisik BAST untuk Posko ${poskoAktif}?`)) {
      setPenandaMap({});
      const storageKey = `audit_penanda_${cleanStr(poskoAktif)}`;
      localStorage.removeItem(storageKey);
      toast.info("Penanda fisik BAST berhasil di-reset.");
    }
  }

  const recordsUntukAuditFisik = useMemo(() => {
    if (scopedSudahSerah.length > 0 || scopedBelumSerah.length > 0) {
      return [...scopedSudahSerah, ...scopedBelumSerah];
    }
    return scopedExportRecords;
  }, [scopedSudahSerah, scopedBelumSerah, scopedExportRecords]);

  const statistik = hitungStatistikBulog(recordsUntukAuditFisik);

  // Evaluasi Selisih 3-Way
  const selisihRows = useMemo(() => {
    return analisaSelisih3Way(
      scopedExportRecords,
      masterRecords,
      scopedBastRecords,
      logPelayanan,
      masterByNIK,
      masterByName,
      poskoAktif,
      scopedSudahSerah,
      scopedBelumSerah
    );
  }, [scopedExportRecords, masterRecords, scopedBastRecords, logPelayanan, masterByNIK, masterByName, poskoAktif, scopedSudahSerah, scopedBelumSerah]);

  const semuaRows = useMemo(() => buildSemuaAuditRows(recordsUntukAuditFisik, scopedBastRecords), [recordsUntukAuditFisik, scopedBastRecords]);

  const belumAmbilRows = useMemo<SelisihAuditRow[]>(() => {
    if (scopedBelumSerah.length > 0) {
      const recordsToUse = scopedBelumSerah;

      const mapped = recordsToUse.map((r) => {
        const nikClean = fixNIK(r.nik) || cleanNum(r.nik);
        const namaClean = cleanStr(r.nama);

        let extractedNoUrut: number | null = null;
        const rawNoBastStr = String(r.no_bast || r.no || "").trim();
        const noMatch = rawNoBastStr.match(/(\d{1,5})$/);
        if (noMatch) extractedNoUrut = parseInt(noMatch[1], 10);

        const masterMatch = (nikClean ? masterByNIK.get(nikClean) ?? null : null)
          || (namaClean ? masterByName.get(namaClean)?.[0] ?? null : null);

        const bastMatch = (nikClean ? bastByNIK.get(nikClean) ?? null : null)
          || (extractedNoUrut ? scopedBastRecords.find((b) => b.NO_URUT === extractedNoUrut) ?? null : null)
          || (namaClean ? scopedBastRecords.find((b) => cleanStr(b.NAMA) === namaClean || cleanStr(b.NAMA).includes(namaClean) || namaClean.includes(cleanStr(b.NAMA))) ?? null : null);

        const finalNoUrut = bastMatch?.NO_URUT ?? extractedNoUrut ?? null;

        let finalRt = String(r.rt || "").trim();
        let finalRw = String(r.rw || "").trim();

        if (!finalRt && bastMatch?.NO_RT) finalRt = bastMatch.NO_RT;
        if (!finalRw && bastMatch?.NO_RW) finalRw = bastMatch.NO_RW;

        if (!finalRt && masterMatch?.NO_RT) finalRt = masterMatch.NO_RT;
        if (!finalRw && masterMatch?.NO_RW) finalRw = masterMatch.NO_RW;

        if ((!finalRt || !finalRw) && bastMatch?.ALAMAT_BAST) {
          const parsed = parseRtRwFromText(bastMatch.ALAMAT_BAST);
          if (!finalRt) finalRt = parsed.rt;
          if (!finalRw) finalRw = parsed.rw;
        }

        if ((!finalRt || !finalRw) && masterMatch?.ALAMAT) {
          const parsed = parseRtRwFromText(masterMatch.ALAMAT);
          if (!finalRt) finalRt = parsed.rt;
          if (!finalRw) finalRw = parsed.rw;
        }

        const rt = finalRt || "—";
        const rw = finalRw || "—";
        const alamatMaster = masterMatch?.ALAMAT || bastMatch?.ALAMAT_BAST || "—";

        return {
          noUrut: finalNoUrut,
          nik: nikClean || bastMatch?.NIK || r.nik || "—",
          nikBast: bastMatch?.NIK || undefined,
          nama: r.nama || bastMatch?.NAMA || masterMatch?.NAMA || "—",
          noKK: fixNIK(r.no_kk) || bastMatch?.NO_KK || masterMatch?.NO_KK || "—",
          kelurahan: r.kelurahan || bastMatch?.KELURAHAN_BAST || masterMatch?.KEL_NAME || poskoAktif,
          rt,
          rw,
          alamat: r.alamat && r.alamat !== "—" && r.alamat !== "-" ? r.alamat : alamatMaster,
          statusWebBulog: r.status_serah || "Belum diserahkan",
          verificationStatus: r.verification_status || "Belum diverifikasi",
          statusPosko: bastMatch ? "Terdaftar di BAST Undangan" : "Belum Terverifikasi",
          adaBASTFisik: Boolean(bastMatch),
          kategoriSelisih: "BELUM_DIAMBIL" as const,
          catatanRekomendasi: `Sumber daftar: file Bulog Belum Diserahkan untuk Posko ${poskoAktif}.`,
          sumberDataEkspresil: r._sourceFile ? `Ekspor Bulog (${r._sourceFile})` : "Ekspor Bulog Manual",
        };
      });

      return mapped.sort((a, b) => {
        if (a.noUrut != null && b.noUrut != null) return a.noUrut - b.noUrut;
        if (a.noUrut != null) return -1;
        if (b.noUrut != null) return 1;
        return a.nama.localeCompare(b.nama);
      });
    }

    const filteredSelisih = selisihRows.filter((r) => r.kategoriSelisih === "BELUM_DIAMBIL");
    return [...filteredSelisih].sort((a, b) => {
      if (a.noUrut != null && b.noUrut != null) return a.noUrut - b.noUrut;
      if (a.noUrut != null) return -1;
      if (b.noUrut != null) return 1;
      return a.nama.localeCompare(b.nama);
    });
  }, [scopedBelumSerah, selisihRows, masterByNIK, bastByNIK, masterByName, scopedBastRecords, poskoAktif]);

  const daftarWilayahSelisih = useMemo<WilayahSelisihOption[]>(() => {
    const grouped = new Map<string, WilayahSelisihOption>();
    const cleanPosko = cleanStr(poskoAktif);

    const isPoskoMatch = (kel: string) => {
      const cleanKel = cleanStr(kel || "");
      if (!cleanKel || !cleanPosko) return true;
      return cleanKel === cleanPosko || cleanKel.includes(cleanPosko) || cleanPosko.includes(cleanKel);
    };

    belumAmbilRows.forEach((r) => {
      if (!isPoskoMatch(r.kelurahan || "")) return;

      const key = getWilayahSelisihKey(r);
      const existing = grouped.get(key);
      if (existing) {
        existing.count += 1;
        return;
      }

      const rt = String(r.rt || "").trim() && r.rt !== "—" ? String(r.rt).trim() : "";
      const rw = String(r.rw || "").trim() && r.rw !== "—" ? String(r.rw).trim() : "";

      grouped.set(key, {
        key,
        rt,
        rw,
        label: formatWilayahSelisihLabel(rt, rw),
        count: 1,
      });
    });

    return [...grouped.values()].sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
  }, [belumAmbilRows, poskoAktif]);

  const selectedWilayahSelisih = useMemo(() => {
    if (filterRTSelisih === "SEMUA") return null;
    return daftarWilayahSelisih.find((opt) => opt.key === filterRTSelisih) ?? null;
  }, [daftarWilayahSelisih, filterRTSelisih]);

  // Filtered Selisih Rows
  const selisihFiltered = useMemo(() => {
    let rows: SelisihAuditRow[];

    if (filterKategoriSelisih === "BELUM_DIAMBIL") {
      rows = belumAmbilRows;
    } else if (filterKategoriSelisih !== "SEMUA") {
      rows = selisihRows.filter((r) => r.kategoriSelisih === filterKategoriSelisih);
    } else {
      const nonBelumAmbil = selisihRows.filter((r) => r.kategoriSelisih !== "BELUM_DIAMBIL");
      rows = [...nonBelumAmbil, ...belumAmbilRows];
    }

    if (filterRTSelisih !== "SEMUA") {
      rows = rows.filter((r) => getWilayahSelisihKey(r) === filterRTSelisih);
    }
    if (searchSelisih) {
      const up = searchSelisih.toUpperCase();
      rows = rows.filter(
        (r) =>
          r.nama.toUpperCase().includes(up) ||
          r.nik.includes(up) ||
          r.noKK.includes(up) ||
          r.alamat.toUpperCase().includes(up) ||
          (r.noUrut != null && String(r.noUrut).includes(up))
      );
    }
    return rows;
  }, [selisihRows, belumAmbilRows, filterKategoriSelisih, filterRTSelisih, searchSelisih]);

  // Filtered Audit Regular Rows
  const filtered = useMemo(() => {
    let rows = filter === "Semua"
      ? semuaRows
      : filterAuditRows(recordsUntukAuditFisik, filter, search);

    if (filter === "Semua") {
      const up = search.trim().toUpperCase();
      if (up) {
        rows = rows.filter((r) => {
          const nClean = fixNIK(r.nik) || cleanNum(r.nik);
          const bMatch = nClean ? bastByNIK.get(nClean) : scopedBastRecords.find((b) => cleanStr(b.NAMA) === cleanStr(r.nama));
          const noU = bMatch?.NO_URUT ? String(bMatch.NO_URUT) : "";

          return (
            r.nama.toUpperCase().includes(up) ||
            r.nama_pengganti.toUpperCase().includes(up) ||
            String(r.nik_pengganti).includes(up) ||
            String(r.nik).includes(up) ||
            String(r.no || "").includes(up) ||
            String(r.no_bast || "").toUpperCase().includes(up) ||
            String(r.kelurahan || "").toUpperCase().includes(up) ||
            (noU !== "" && noU.includes(up))
          );
        });
      }
    } else {
      rows = [...rows].sort((a, b) => {
        const va = String(a[sortKey] ?? "");
        const vb = String(b[sortKey] ?? "");
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      });
    }
    return rows;
  }, [recordsUntukAuditFisik, semuaRows, filter, search, sortKey, sortDir, bastByNIK, scopedBastRecords]);

  const countVerifiedFisik = useMemo(() => {
    return filtered.filter((r) => penandaMap[getRowPenandaKey(r)] === "VERIFIED").length;
  }, [filtered, penandaMap]);

  const countReviewFisik = useMemo(() => {
    return filtered.filter((r) => penandaMap[getRowPenandaKey(r)] === "REVIEW").length;
  }, [filtered, penandaMap]);

  const countMismatchFisik = useMemo(() => {
    return filtered.filter((r) => penandaMap[getRowPenandaKey(r)] === "MISMATCH").length;
  }, [filtered, penandaMap]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  }

  function handleEksporRincianSPTJM() {
    const dataToUse = bulogSudahSerahRecords.length > 0 ? bulogSudahSerahRecords : bulogExportRecords;

    if (dataToUse.length === 0) {
      toast.peringatan("Unggah file ekspor Bulog terlebih dahulu!");
      return;
    }

    const targetKelClean = cleanStr(poskoAktif);
    const penggantiRows = dataToUse.filter((row) => {
      if (!row.status_pbp.toLowerCase().includes("pengganti")) return false;
      if (targetKelClean) {
        const rowKelClean = cleanStr(row.kelurahan || "");
        if (rowKelClean && !rowKelClean.includes(targetKelClean) && !targetKelClean.includes(rowKelClean)) {
          return false;
        }
      }
      return true;
    });

    if (penggantiRows.length === 0) {
      toast.info(`Tidak ada data PBP Pengganti di Kelurahan ${poskoAktif} pada data ekspor ini.`);
      return;
    }

    const dataExport = penggantiRows.map((r, idx) => {
      const cleanPBP = fixNIK(r.nik) || cleanNum(r.nik);
      const masterPBP = cleanPBP ? masterByNIK.get(cleanPBP) : masterByName.get(cleanStr(r.nama))?.[0];
      const bastPBP = cleanPBP ? bastByNIK.get(cleanPBP) : undefined;

      const finalNoKKAwal = fixNIK(r.no_kk) || masterPBP?.NO_KK || bastPBP?.NO_KK || "—";
      const finalAlamatAwal = r.alamat && r.alamat !== "—" && r.alamat !== "-"
        ? r.alamat
        : (masterPBP
            ? `${masterPBP.ALAMAT || ""} RT ${masterPBP.NO_RT !== "" ? masterPBP.NO_RT : "—"}/RW ${masterPBP.NO_RW !== "" ? masterPBP.NO_RW : "—"}`.trim()
            : bastPBP?.ALAMAT_BAST || "—");

      const finalNoKKPengganti = fixNIK(r.no_kk_pengganti) || finalNoKKAwal;
      const finalAlamatPengganti = r.alamat_pengganti && r.alamat_pengganti !== "—" && r.alamat_pengganti !== "-"
        ? r.alamat_pengganti
        : finalAlamatAwal;

      const nikPengganti = fixNIK(r.nik_pengganti) || cleanNum(r.nik_pengganti);
      let keterangKesesuaian = "Non-DTKS (Wajib Lampirkan SPTJM)";
      if (nikPengganti && masterByNIK.has(nikPengganti)) {
        keterangKesesuaian = "Sah (Pengganti Terdaftar DTKS)";
      } else if (masterPBP && masterPBP.NO_KK && r.nama_pengganti) {
        const candidateList = masterByName.get(cleanStr(r.nama_pengganti)) ?? [];
        if (candidateList.some((c) => c.NO_KK === masterPBP.NO_KK)) {
          keterangKesesuaian = "Sah (Pengganti 1 KK)";
        }
      }

      return {
        No: idx + 1,
        "Nomor BAST": r.no_bast || `BAST-${r.kelurahan || poskoAktif}`,
        Kelurahan: r.kelurahan || poskoAktif,
        "Nama PBP Awal (Hak)": r.nama,
        "NIK PBP Awal": fixNIK(r.nik) || r.nik,
        "No. KK PBP Awal": finalNoKKAwal,
        "Alamat PBP Awal": finalAlamatAwal,
        "Nama PBP Pengganti": r.nama_pengganti || "",
        "NIK Pengganti": fixNIK(r.nik_pengganti) || r.nik_pengganti || "",
        "No. KK Pengganti": finalNoKKPengganti,
        "Alamat Pengganti": finalAlamatPengganti,
        "Pekerjaan Pengganti": r.pekerjaan_pengganti || "Wiraswasta",
        "Alasan Penggantian": r.notes || "—",
        "Status Verifikasi Web Banpang": r.verification_status || "Sudah diverifikasi",
        "Status PBP": r.status_pbp,
        "Keterangan Rekonsiliasi DTKS": keterangKesesuaian,
      };
    });

    eksporExcel(
      dataExport as Record<string, unknown>[],
      "Rincian_SPTJM",
      `Rincian_SPTJM_Pengganti_${poskoAktif}_${tanggalDitarik}`,
      {
        judulLaporan: `Rincian Dokumen SPTJM Pengganti PBP Kelurahan ${poskoAktif}`,
        posko: poskoAktif,
      }
    );
    toast.sukses(`Excel Rincian SPTJM Pengganti Kelurahan ${poskoAktif} (${dataExport.length} PBP Pengganti) berhasil diunduh.`);
  }

  // Upload File 1: Ekspor Web Bulog - Sudah Diserahkan
  async function handleUploadSudahSerah(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileSudahStatus("loading");
    setFileSudahNama(file.name);
    try {
      const raw = await bacaExcelSheet0(file);
      const records: AuditRow[] = raw.map((r, idx) => {
        const c: Record<string, unknown> = {};
        for (const k in r) {
          const cleanK = k.trim().toLowerCase().replace(/[\s_.\-\/]/g, "");
          c[cleanK] = r[k];
        }

        const valVerif = readBulogText(c, "verification", "verificationstatus", "statusverifikasi", "verifikasi", "statusphoto");
        const valSerah = readBulogText(c, "statusser", "statusserah", "statuspenyerahan", "statusdelivery", "statusmenerima", "statuspenerimaan", "statusbelummenerima", "statusterima", "penerimaan", "statussalur", "statusdistribusi", "statusditerima");
        const valPbp   = readBulogText(c, "statuspbp", "statuspenerima", "jenispenerima");

        const rawVerificationStatus = valVerif || "Sudah diverifikasi";
        const rawStatusSerah = valSerah || "Sudah diserahkan";

        const rawNoKKPBP = readBulogText(
          c,
          "nokk",
          "nokkpbp",
          "nokkawal",
          "nokkktp",
          "kartukeluarga",
          "nokartukeluarga",
          "nomorkk",
          "kk",
          "kkpbp",
          "kknomor"
        );
        const rawAlamatPBP = readBulogText(
          c,
          "alamat",
          "alamatpbp",
          "alamatktp",
          "alamatlengkap",
          "alamatdomisili",
          "jalan",
          "alamatwarga",
          "alamatpenerima",
          "alamatrumah"
        );
        const rawNoKKPengganti = readBulogText(c, "nokkpengganti", "nokkp", "nokkpen", "nokkpengambil", "nokkkuasa", "nokkpengg", "nokkpengganti");
        const rawAlamatPengganti = readBulogText(c, "alamatpengganti", "alamatp", "alamatpen", "alamatpengambil", "domisilipengganti", "alamatpe");
        const rawPekerjaanPengganti = readBulogText(c, "pekerjaan", "pekerjaanpengganti", "pekerjaanp");
        const rawNoBast = readBulogText(c, "nobast", "no_bast", "barcode", "idwilayah");

        return {
          no: (c["no"] as number) || (c["nopbp"] as number) || (c["no_pbp"] as number) || "—",
          nik: fixNIK(c["nik"] || c["nikpbp"] || c["nik_pbp"] || "") || "—",
          nama: String(c["nama"] || c["namapbp"] || c["nama_pbp"] || "").trim(),
          no_kk: fixNIK(rawNoKKPBP) || rawNoKKPBP,
          alamat: rawAlamatPBP,
          rt: String(c["rt"] || c["no_rt"] || c["rtwarga"] || c["rtpbp"] || "").trim(),
          rw: String(c["rw"] || c["no_rw"] || c["rwwarga"] || c["rwpbp"] || "").trim(),
          status_pbp: valPbp || "Normal",
          nama_pengganti: readBulogText(c, "namapengganti", "nama_pengganti", "namapen", "namap"),
          nik_pengganti: fixNIK(readBulogText(c, "nikpengganti", "nik_pengganti", "nikpengg", "nikp", "nik_pengg")) || readBulogText(c, "nikpengganti", "nik_pengganti", "nikpengg", "nikp", "nik_pengg") || "—",
          no_kk_pengganti: fixNIK(rawNoKKPengganti) || rawNoKKPengganti,
          alamat_pengganti: rawAlamatPengganti,
          pekerjaan_pengganti: rawPekerjaanPengganti,
          no_bast: rawNoBast,
          notes: String(c["notes"] || c["alasan"] || "—").trim(),
          kelurahan: (readBulogText(c, "kelurahan", "kelname", "namakelurahan", "desakelurahan", "kel", "desa", "kelurahanpenyaluran") || poskoAktif).trim(),
          status_serah: rawStatusSerah,
          verification_status: rawVerificationStatus,
          _sourceFile: file.name,
          _sourceRow: idx + 2,
          _tipeEkspor: "SUDAH_DISERAHKAN",
        };
      });

      setBulogSudahSerahRecords(records);

      tambahRiwayatEksporBulog({
        id: Math.random().toString(36).slice(2),
        namaFile: file.name,
        tipeEkspor: "SUDAH_DISERAHKAN",
        waktuUnggah: formatWaktuSekarang(),
        tanggalDitarikPetugas: tanggalDitarik,
        totalBaris: records.length,
        barisRecords: records,
      });

      setFileSudahStatus("ok");
      toast.sukses(`File 1 (Sudah Diserahkan) dimuat: ${records.length.toLocaleString("id-ID")} baris dari ${file.name}`);
    } catch {
      setFileSudahStatus("error");
      toast.error("Gagal membaca file Ekspor Bulog 'Sudah Diserahkan'. Periksa format kolom.");
    }
    e.target.value = "";
  }

  // Upload File 2: Ekspor Web Bulog - Belum Diserahkan
  async function handleUploadBelumSerah(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileBelumStatus("loading");
    setFileBelumNama(file.name);
    try {
      const raw = await bacaExcelSheet0(file);
      const records: AuditRow[] = raw.map((r, idx) => {
        const c: Record<string, unknown> = {};
        for (const k in r) {
          const cleanK = k.trim().toLowerCase().replace(/[\s_.\-\/]/g, "");
          c[cleanK] = r[k];
        }

        const valVerif = readBulogText(c, "verification", "verificationstatus", "statusverifikasi", "verifikasi", "statusphoto");
        const valSerah = readBulogText(c, "statusser", "statusserah", "statuspenyerahan", "statusdelivery", "statusmenerima", "statuspenerimaan", "statusbelummenerima", "statusterima", "penerimaan", "statussalur", "statusdistribusi", "statusditerima");
        const valPbp   = readBulogText(c, "statuspbp", "statuspenerima", "jenispenerima");

        const rawVerificationStatus = valVerif || "Belum diverifikasi";
        const rawStatusSerah = valSerah || "Belum diserahkan";

        const rawNoKKPBP = readBulogText(
          c,
          "nokk",
          "nokkpbp",
          "nokkawal",
          "nokkktp",
          "kartukeluarga",
          "nokartukeluarga",
          "nomorkk",
          "kk",
          "kkpbp",
          "kknomor"
        );
        const rawAlamatPBP = readBulogText(
          c,
          "alamat",
          "alamatpbp",
          "alamatktp",
          "alamatlengkap",
          "alamatdomisili",
          "jalan",
          "alamatwarga",
          "alamatpenerima",
          "alamatrumah"
        );
        const rawNoKKPengganti = readBulogText(c, "nokkpengganti", "nokkp", "nokkpen", "nokkpengambil", "nokkkuasa", "nokkpengg", "nokkpengganti");
        const rawAlamatPengganti = readBulogText(c, "alamatpengganti", "alamatp", "alamatpen", "alamatpengambil", "domisilipengganti", "alamatpe");
        const rawPekerjaanPengganti = readBulogText(c, "pekerjaan", "pekerjaanpengganti", "pekerjaanp");
        const rawNoBast = readBulogText(c, "nobast", "no_bast", "barcode", "idwilayah");

        return {
          no: (c["no"] as number) || (c["nopbp"] as number) || (c["no_pbp"] as number) || "—",
          nik: fixNIK(c["nik"] || c["nikpbp"] || c["nik_pbp"] || "") || "—",
          nama: String(c["nama"] || c["namapbp"] || c["nama_pbp"] || "").trim(),
          no_kk: fixNIK(rawNoKKPBP) || rawNoKKPBP,
          alamat: rawAlamatPBP,
          rt: String(c["rt"] || c["no_rt"] || c["rtwarga"] || c["rtpbp"] || "").trim(),
          rw: String(c["rw"] || c["no_rw"] || c["rwwarga"] || c["rwpbp"] || "").trim(),
          status_pbp: valPbp || "Normal",
          nama_pengganti: readBulogText(c, "namapengganti", "nama_pengganti", "namapen", "namap"),
          nik_pengganti: fixNIK(readBulogText(c, "nikpengganti", "nik_pengganti", "nikpengg", "nikp", "nik_pengg")) || readBulogText(c, "nikpengganti", "nik_pengganti", "nikpengg", "nikp", "nik_pengg") || "—",
          no_kk_pengganti: fixNIK(rawNoKKPengganti) || rawNoKKPengganti,
          alamat_pengganti: rawAlamatPengganti,
          pekerjaan_pengganti: rawPekerjaanPengganti,
          no_bast: rawNoBast,
          notes: String(c["notes"] || c["alasan"] || "—").trim(),
          kelurahan: (readBulogText(c, "kelurahan", "kelname", "namakelurahan", "desakelurahan", "kel", "desa", "kelurahanpenyaluran") || poskoAktif).trim(),
          status_serah: rawStatusSerah,
          verification_status: rawVerificationStatus,
          _sourceFile: file.name,
          _sourceRow: idx + 2,
          _tipeEkspor: "BELUM_DISERAHKAN",
        };
      });

      setBulogBelumSerahRecords(records);

      tambahRiwayatEksporBulog({
        id: Math.random().toString(36).slice(2),
        namaFile: file.name,
        tipeEkspor: "BELUM_DISERAHKAN",
        waktuUnggah: formatWaktuSekarang(),
        tanggalDitarikPetugas: tanggalDitarik,
        totalBaris: records.length,
        barisRecords: records,
      });

      setFileBelumStatus("ok");
      toast.sukses(`File 2 (Belum Diserahkan) dimuat: ${records.length.toLocaleString("id-ID")} baris dari ${file.name}`);
    } catch {
      setFileBelumStatus("error");
      toast.error("Gagal membaca file Ekspor Bulog 'Belum Diserahkan'. Periksa format kolom.");
    }
    e.target.value = "";
  }

  function handleExportSelisihKhusus(kategori: KategoriSelisih | "SEMUA") {
    let targetRows = selisihRows;
    let namaFile = "Laporan_Selisih_3Way";

    if (kategori === "TUNGGU_INPUT_WEB") {
      targetRows = selisihRows.filter((r) => r.kategoriSelisih === "TUNGGU_INPUT_WEB");
      namaFile = "Daftar_Urgensi_Tunggu_Input_Web_Bulog";
    } else if (kategori === "BELUM_DIAMBIL") {
      targetRows = belumAmbilRows;
      namaFile = "Daftar_Sisa_Warga_Belum_Ambil_Beras";
      if (selectedWilayahSelisih) {
        namaFile += `_${selectedWilayahSelisih.label.replace(/\s+/g, "_")}`;
      }
    }

    if (targetRows.length === 0) {
      toast.peringatan("Tidak ada data untuk diekspor!");
      return;
    }

    const dataExport = targetRows.map((r, idx) => ({
      No: idx + 1,
      "No. Urut BAST": r.noUrut ? r.noUrut : "—",
      NIK: r.kategoriSelisih === "POTENSI_TTD_NYASAR" ? (r.nikBast || "—") : r.nik,
      "Nama PBP": r.nama,
      "No. KK": r.noKK,
      Kelurahan: r.kelurahan,
      RT: r.rt,
      RW: r.rw,
      Alamat: r.alamat,
      "Status Web Bulog": r.statusWebBulog,
      "Verifikasi Web Bulog": r.verificationStatus,
      "Status Posko Fisik": r.statusPosko,
      "Kategori Selisih": r.kategoriSelisih,
      "Rekomendasi Tindakan": r.catatanRekomendasi,
      "Sumber Data": `${r.sumberDataEkspresil || "Ekspor Bulog"} — per ${tanggalDitarik}`,
    }));

    eksporExcel(dataExport as Record<string, unknown>[], "Data_Selisih", namaFile, {
      judulLaporan: namaFile.replace(/_/g, " "),
      posko: poskoAktif,
    });
    toast.sukses(`File ${namaFile}.xlsx berhasil diunduh.`);
  }

  function handleExportSiapUploadBanpang() {
    const dataToUse = bulogSudahSerahRecords.length > 0 ? bulogSudahSerahRecords : bulogExportRecords;
    if (dataToUse.length === 0) {
      toast.peringatan("Unggah file ekspor Bulog terlebih dahulu!");
      return;
    }
    const dataExport = dataToUse.map((r, idx) => {
      const cleanPBP = fixNIK(r.nik) || cleanNum(r.nik);
      const masterPBP = cleanPBP ? masterByNIK.get(cleanPBP) : masterByName.get(cleanStr(r.nama))?.[0];
      const bastPBP = cleanPBP ? bastByNIK.get(cleanPBP) : undefined;

      const finalNoKKAwal = fixNIK(r.no_kk) || masterPBP?.NO_KK || bastPBP?.NO_KK || "—";
      const finalAlamatAwal = r.alamat && r.alamat !== "—" && r.alamat !== "-"
        ? r.alamat
        : (masterPBP
            ? `${masterPBP.ALAMAT || ""} RT ${masterPBP.NO_RT !== "" ? masterPBP.NO_RT : "—"}/RW ${masterPBP.NO_RW !== "" ? masterPBP.NO_RW : "—"}`.trim()
            : bastPBP?.ALAMAT_BAST || "—");

      const finalNoKKPengganti = fixNIK(r.no_kk_pengganti) || (r.nama_pengganti ? finalNoKKAwal : "");
      const finalAlamatPengganti = r.alamat_pengganti && r.alamat_pengganti !== "—" && r.alamat_pengganti !== "-"
        ? r.alamat_pengganti
        : (r.nama_pengganti ? finalAlamatAwal : "");

      return {
        No: idx + 1,
        "Nomor BAST": r.no_bast || `BAST-${r.kelurahan || poskoAktif}`,
        Kelurahan: r.kelurahan || poskoAktif,
        "Nama PBP Awal": r.nama,
        "NIK PBP Awal": fixNIK(r.nik) || r.nik,
        "No. KK PBP Awal": finalNoKKAwal,
        "Alamat PBP Awal": finalAlamatAwal,
        "Status PBP": r.status_pbp || "Normal",
        "Nama Pengganti": r.nama_pengganti || "",
        "NIK Pengganti": fixNIK(r.nik_pengganti) || r.nik_pengganti || "",
        "No. KK Pengganti": finalNoKKPengganti,
        "Alamat Pengganti": finalAlamatPengganti,
        "Status Penyerahan Web": r.status_serah || "Sudah diserahkan",
        "Status Verifikasi Web": r.verification_status || "Sudah diverifikasi",
        "Sumber File Asal": r._sourceFile || "Web Bulog",
      };
    });
    eksporExcel(
      dataExport as Record<string, unknown>[],
      `Siap_Upload_Banpang`,
      `Rekap_Siap_Upload_Banpang_${poskoAktif}_${tanggalDitarik}`,
      {
        judulLaporan: `Rekapitulasi Pelayanan Posko Siap Upload Banpang Kelurahan ${poskoAktif}`,
        posko: poskoAktif,
      }
    );
    toast.sukses(`Rekap Siap Upload Banpang (${dataExport.length} baris) berhasil diunduh.`);
  }

  function handleExportAudit() {
    const dataToUse = filter === "Semua" ? filtered : bulogExportRecords;

    if (!dataToUse.length) {
      toast.peringatan("Unggah file ekspor Bulog terlebih dahulu!");
      return;
    }
    const dataExport = dataToUse.map((r, idx) => {
      const cleanPBP = fixNIK(r.nik) || cleanNum(r.nik);
      const masterPBP = cleanPBP ? masterByNIK.get(cleanPBP) : masterByName.get(cleanStr(r.nama))?.[0];
      const bastPBP = cleanPBP ? bastByNIK.get(cleanPBP) : undefined;

      const finalNoKKAwal = fixNIK(r.no_kk) || masterPBP?.NO_KK || bastPBP?.NO_KK || "—";
      const finalAlamatAwal = r.alamat && r.alamat !== "—" && r.alamat !== "-"
        ? r.alamat
        : (masterPBP
            ? `${masterPBP.ALAMAT || ""} RT ${masterPBP.NO_RT !== "" ? masterPBP.NO_RT : "—"}/RW ${masterPBP.NO_RW !== "" ? masterPBP.NO_RW : "—"}`.trim()
            : bastPBP?.ALAMAT_BAST || "—");

      const pKey = getRowPenandaKey(r);
      const pStatus = penandaMap[pKey];
      const pLabel = pStatus ? LABELS_PENANDA[pStatus].label : "Belum Ditandai";

      return {
        No: idx + 1,
        "No. Urut BAST": r.no_bast || (bastPBP?.NO_URUT ? `No. ${bastPBP.NO_URUT}` : "—"),
        "Status Penanda Fisik BAST": pLabel,
        "Nomor BAST": r.no_bast || `BAST-${r.kelurahan || poskoAktif}`,
        Kelurahan: r.kelurahan || poskoAktif,
        "Nama PBP Awal": r.nama,
        "NIK PBP Awal": fixNIK(r.nik) || r.nik,
        "No. KK PBP Awal": finalNoKKAwal,
        "Alamat PBP Awal": finalAlamatAwal,
        "Status PBP": r.status_pbp || "Normal",
        "Nama Pengganti": r.nama_pengganti || "",
        "NIK Pengganti": fixNIK(r.nik_pengganti) || r.nik_pengganti || "",
        "No. KK Pengganti": fixNIK(r.no_kk_pengganti) || (r.nama_pengganti ? finalNoKKAwal : ""),
        "Status Penyerahan Web": r.status_serah || "Belum diserahkan",
        "Status Verifikasi Web": r.verification_status || "Belum diverifikasi",
        Catatan: r.notes || "—",
        "Sumber File Asal": r._sourceFile || "Web Bulog",
      };
    });

    eksporExcel(
      dataExport as Record<string, unknown>[],
      "Hasil_Audit",
      "Audit_Bulog_Rekonsiliasi",
      {
        judulLaporan: `Laporan Hasil Audit Rekonsiliasi Kelurahan ${poskoAktif}`,
        posko: poskoAktif,
      }
    );
    toast.sukses("File audit berhasil diunduh.");
  }

  function renderBadge(row: AuditRow) {
    const s = row.status_pbp.toLowerCase();
    if (s.includes("beda kk"))   return <Badge variant="info">Perwakilan (Beda KK)</Badge>;
    if (s.includes("pengganti")) return <Badge variant="warning">PBP Pengganti</Badge>;
    if (s.includes("satu kk"))   return <Badge variant="neutral">Perwakilan (Satu KK)</Badge>;
    return <Badge variant="success">Normal</Badge>;
  }

  function renderRekomendasi(row: AuditRow) {
    const s = row.status_pbp.toLowerCase();
    if (s.includes("beda kk")) {
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
          <p className="text-[10px] font-bold text-amber-900 flex items-center gap-1">
            <svg className="w-3 h-3 text-amber-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Waspada: Salah Tulis di BAST Fisik
          </p>
          <p className="text-[10px] text-amber-800 mt-0.5 leading-snug">
            Status sah: <b>Perwakilan Kuasa Ambil</b> ({row.notes}). Hak atas nama <b>{row.nama}</b>.
          </p>
        </div>
      );
    }
    if (s.includes("pengganti")) {
      const cleanP = cleanStr(row.nama_pengganti);
      const nikP   = cleanNum(row.nik_pengganti);

      let matchP: MasterRow | undefined = undefined;
      if (nikP && nikP.length === 16) {
        matchP = masterByNIK.get(nikP);
      }

      let is1KK = false;
      const cleanPBP = cleanNum(row.nik);
      const masterPBP = cleanPBP ? masterByNIK.get(cleanPBP) : masterByName.get(cleanStr(row.nama))?.[0];

      if (masterPBP && masterPBP.NO_KK && cleanP) {
        const candidateList = masterByName.get(cleanP) ?? [];
        const sameKKMatch = candidateList.find((c) => c.NO_KK === masterPBP.NO_KK);
        if (sameKKMatch) {
          matchP = sameKKMatch;
          is1KK = true;
        }
      }

      if (matchP) {
        return (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2">
            <p className="text-[10px] font-bold text-emerald-900 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              {is1KK ? `Sah Kuasa 1 KK (${matchP.HUBUNGAN_KELUARGA || "Keluarga"})` : `Penggantian Sah (DTKS ${matchP.KEL_NAME})`}
            </p>
            <p className="text-[10px] text-emerald-800 mt-0.5 leading-snug">Alasan: {row.notes}.</p>
          </div>
        );
      }

      const isNIKKosong = !nikP || nikP.length < 16;

      return (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-2 space-y-1.5">
          <p className="text-[10px] font-bold text-rose-900 flex items-center gap-1">
            <svg className="w-3 h-3 text-rose-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            {isNIKKosong ? "NIK Pengganti Kosong di Web Bulog" : "Non-DTKS · Wajib SPTJM"}
          </p>
          <p className="text-[10px] text-rose-800 leading-snug">
            {isNIKKosong
              ? `Nama '${row.nama_pengganti}' belum terverifikasi NIK. Cek KTP fisik/SPTJM.`
              : `${row.nama_pengganti} (NIK: ${nikP}) tidak ada di Master 142k.`}
          </p>
          <button
            onClick={() => setSelectedSPTJMRow(row)}
            className="w-full py-1.5 px-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-700 text-white font-bold rounded-lg text-[10px] transition flex items-center justify-center gap-1 shadow-2xs touch-manipulation min-h-[36px]"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Cetak Form SPTJM
          </button>
        </div>
      );
    }
    if (s.includes("satu kk")) return <span className="text-[11px] text-slate-500 flex items-center gap-1"><svg className="w-3 h-3 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Sah · keluarga satu KK.</span>;
    return <span className="text-[11px] text-slate-400">Diterima langsung oleh PBP.</span>;
  }

  const SortIcon = ({ col }: { col: SortKey }) => (
    <svg className={`w-3 h-3 ml-1 inline ${sortKey === col ? "text-bulog-blue" : "text-slate-300"}`}
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {sortDir === "asc" && sortKey === col ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}
    </svg>
  );

  const countTungguInput = selisihRows.filter((r) => r.kategoriSelisih === "TUNGGU_INPUT_WEB").length;
  const countBelumAmbil  = belumAmbilRows.length;
  const countHumanError  = selisihRows.filter((r) => r.kategoriSelisih === "HUMAN_ERROR_BAST").length;
  const countMatch       = selisihRows.filter((r) => r.kategoriSelisih === "MATCH_LENGKAP").length;

  async function handleGenerateAiInsight() {
    setAiInsightLoading(true);
    toast.info("🤖 AI Auditor 9router sedang menganalisis selisih 3-way...");
    try {
      const statsData = {
        totalRecords: selisihRows.length,
        tungguInputWeb: countTungguInput,
        belumAmbilSisa: countBelumAmbil,
        salahTulisBast: countHumanError,
        matchSempurna: countMatch,
        poskoAktif,
      };
      const customKey = localStorage.getItem("ninerouter_api_key") ?? undefined;
      const customModel = localStorage.getItem("ninerouter_model") ?? undefined;
      const text = await aiGenerateAuditInsight(statsData, poskoAktif, customKey, customModel);
      setAiInsightText(text);
      toast.sukses("AI Audit Insight berhasil dihasilkan!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Gagal menghasilkan AI Insight: ${msg}`);
    } finally {
      setAiInsightLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Modal Cetak SPTJM Single */}
      {selectedSPTJMRow && (
        <ModalCetakSPTJM row={selectedSPTJMRow} onClose={() => setSelectedSPTJMRow(null)} />
      )}

      {/* Modal Format WA RT */}
      {showWAModal && (
        <ModalPesanWA
          rtTarget={filterRTSelisih}
          rwTarget={selectedWilayahSelisih?.rw || "—"}
          kelurahan={poskoAktif}
          wargaList={belumAmbilRows.filter((r) => (filterRTSelisih === "SEMUA" ? true : getWilayahSelisihKey(r) === filterRTSelisih))}
          onClose={() => setShowWAModal(false)}
        />
      )}

      {/* DUA PANEL UPLOAD EKSPOR RESMI WEB BULOG */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <svg className="w-4 h-4 text-bulog-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
              Unggah 2 File Ekspor Resmi Web Bulog (Banpang)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Unggah File 1 (Sudah Diserahkan) &amp; File 2 (Belum Diserahkan) langsung dari web Bulog untuk pembersihan data selisih
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Tanggal Data Ditarik:</span>
            <input
              type="date"
              value={tanggalDitarik}
              onChange={(e) => setTanggalDitarik(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-slate-50"
            />
          </div>
        </div>

        {/* 2 Kotak Panel Upload */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* File 1: Sudah Diserahkan */}
          <div className={`p-4 rounded-xl border-2 space-y-3 ${bulogSudahSerahRecords.length > 0 ? "bg-emerald-50/40 border-emerald-300" : "bg-slate-50/50 border-dashed border-slate-300"}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-emerald-800 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                File 1 · Sudah Diserahkan
              </span>
              {bulogSudahSerahRecords.length > 0 && (
                <Badge variant="success">{bulogSudahSerahRecords.length.toLocaleString("id-ID")} Baris</Badge>
              )}
            </div>
            <p className="text-[11px] text-slate-500">Berkas ekspor warga yang <b>SUDAH</b> berhasil di-input/foto di Web Bulog</p>
            <label className="cursor-pointer flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs touch-manipulation min-h-[44px]">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
              {fileSudahStatus === "loading" ? "Memproses..." : bulogSudahSerahRecords.length > 0 ? "Ganti File 'Sudah Diserahkan'" : "Unggah Excel (Sudah Diserahkan)"}
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleUploadSudahSerah} disabled={fileSudahStatus === "loading"} />
            </label>
            {fileSudahNama && (
              <p className="text-[10px] text-emerald-800 font-bold truncate">File: {fileSudahNama}</p>
            )}
          </div>

          {/* File 2: Belum Diserahkan */}
          <div className={`p-4 rounded-xl border-2 space-y-3 ${bulogBelumSerahRecords.length > 0 ? "bg-amber-50/40 border-amber-300" : "bg-slate-50/50 border-dashed border-slate-300"}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-amber-800 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                File 2 · Belum Diserahkan
              </span>
              {bulogBelumSerahRecords.length > 0 && (
                <Badge variant="warning">{bulogBelumSerahRecords.length.toLocaleString("id-ID")} Baris</Badge>
              )}
            </div>
            <p className="text-[11px] text-slate-500">Berkas ekspor sisa warga yang <b>BELUM</b> di-input/diambil di Web Bulog</p>
            <label className="cursor-pointer flex items-center justify-center gap-2 py-2.5 px-4 bg-bulog-blue hover:bg-bulog-dark text-white rounded-xl text-xs font-bold transition shadow-xs touch-manipulation min-h-[44px]">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
              {fileBelumStatus === "loading" ? "Memproses..." : bulogBelumSerahRecords.length > 0 ? "Ganti File 'Belum Diserahkan'" : "Unggah Excel (Belum Diserahkan)"}
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleUploadBelumSerah} disabled={fileBelumStatus === "loading"} />
            </label>
            {fileBelumNama && (
              <p className="text-[10px] text-bulog-blue font-bold truncate">File: {fileBelumNama}</p>
            )}
          </div>
        </div>

        {/* Riwayat Unggahan Manual */}
        {riwayatEksporBulog.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Riwayat Unggahan File Ekspor Terakhir:</span>
            <div className="flex flex-wrap gap-2">
              {riwayatEksporBulog.slice(0, 4).map((r, idx) => (
                <span key={`${r.id}-${idx}`} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md font-medium text-[11px] border border-slate-200">
                  📁 <b>[{r.tipeEkspor === "SUDAH_DISERAHKAN" ? "Sudah Serah" : "Belum Serah"}]</b> {r.namaFile} ({r.totalBaris} baris) · Tarik: {r.tanggalDitarikPetugas}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Sub-Tab Navigasi Mode Audit */}
      <div className="flex border-b border-slate-200 text-xs font-bold gap-2 overflow-x-auto pb-0.5">
        <button
          onClick={() => setAuditModeTab("selisih3way")}
          className={`pb-3 px-3 sm:px-4 flex items-center gap-2 border-b-2 transition whitespace-nowrap min-h-[40px] touch-manipulation ${
            auditModeTab === "selisih3way"
              ? "border-bulog-blue text-bulog-blue font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>
          1. Rekonsiliasi Selisih 3-Way
          {countTungguInput > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px]">
              {countTungguInput} Urgen
            </span>
          )}
        </button>
        <button
          onClick={() => setAuditModeTab("bastAudit")}
          className={`pb-3 px-3 sm:px-4 flex items-center gap-2 border-b-2 transition whitespace-nowrap min-h-[40px] touch-manipulation ${
            auditModeTab === "bastAudit"
              ? "border-bulog-blue text-bulog-blue font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          2. Rekonsiliasi BAST Fisik
        </button>
      </div>

      {/* MODE TAB 1: MODUL REKONSILIASI SELISIH 3-WAY */}
      {auditModeTab === "selisih3way" && (
        <div className="space-y-5">
          {/* KPI Cards Matriks Selisih */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="cursor-pointer touch-manipulation" onClick={() => setFilterKategoriSelisih("TUNGGU_INPUT_WEB")}>
              <StatCard
                label="Tunggu Input Web"
                value={countTungguInput}
                variant={countTungguInput > 0 ? "warning" : "default"}
                icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
                sub="Terverifikasi posko, web belum"
              />
            </div>
            <div className="cursor-pointer touch-manipulation" onClick={() => setFilterKategoriSelisih("BELUM_DIAMBIL")}>
              <StatCard
                label="Belum Ambil (Sisa)"
                value={countBelumAmbil}
                variant="blue"
                icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>}
                sub="Belum terverifikasi posko &amp; web"
              />
            </div>
            <div className="cursor-pointer touch-manipulation" onClick={() => setFilterKategoriSelisih("HUMAN_ERROR_BAST")}>
              <StatCard
                label="Salah Tulis BAST"
                value={countHumanError}
                variant={countHumanError > 0 ? "danger" : "default"}
                icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
                sub="Pengganti terdaftar di DTKS/1 KK"
              />
            </div>
            <div className="cursor-pointer touch-manipulation" onClick={() => setFilterKategoriSelisih("MATCH_LENGKAP")}>
              <StatCard
                label="Cocok Sempurna"
                value={countMatch}
                variant="success"
                icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
                sub="Web &amp; fisik selaras 100%"
              />
            </div>
          </div>

          {/* AI Executive Summary Card */}
          <Card className="border-sky-200 bg-sky-50/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs flex-shrink-0">
                  🤖
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    AI Ringkasan Eksekutif &amp; Rekomendasi Audit
                    <span className="text-[9px] bg-sky-200 text-sky-900 font-bold px-2 py-0.5 rounded-full border border-sky-300">9router AI</span>
                  </h3>
                  <p className="text-xs text-slate-500">Analisis otomatis pola selisih data 3-way untuk Posko {poskoAktif}</p>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleGenerateAiInsight}
                disabled={aiInsightLoading || selisihRows.length === 0}
                icon={<span>💡</span>}
              >
                {aiInsightLoading ? "AI Menganalisis..." : aiInsightText ? "Regenerate AI Insight" : "Hasilkan AI Audit Insight"}
              </Button>
            </div>

            {aiInsightText ? (
              <div className="p-4 bg-white rounded-2xl border border-sky-200 text-xs text-slate-800 leading-relaxed space-y-2 font-medium animate-fade-in-up">
                <p className="whitespace-pre-wrap font-sans">{aiInsightText}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic bg-white/60 p-3 rounded-xl border border-slate-200">
                Klik tombol "Hasilkan AI Audit Insight" untuk memicu analisis otomatis dari 9router AI berdasarkan {selisihRows.length} data selisih Posko {poskoAktif}.
              </p>
            )}
          </Card>

          <Card noPadding>
            {/* Toolbar Filter & Aksi Ekspor */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Tabel Evaluasi Selisih 3-Way</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Menyandingkan Master 142k, Log/BAST Posko Fisik, dan 2 File Ekspor Bulog ({selisihFiltered.length} baris)
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                {countTungguInput > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 md:flex-none"
                    onClick={() => handleExportSelisihKhusus("TUNGGU_INPUT_WEB")}
                    icon={<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>}
                  >
                    Export Tunggu Input Web
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1 md:flex-none"
                  onClick={() => handleExportSelisihKhusus("BELUM_DIAMBIL")}
                  icon={<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>}
                >
                  Export Sisa Belum Ambil {filterRTSelisih !== "SEMUA" ? `(RT ${filterRTSelisih})` : ""}
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  className="flex-1 md:flex-none"
                  onClick={() => setShowWAModal(true)}
                  icon={<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>}
                >
                  💬 Buat Pesan WA {selectedWilayahSelisih ? selectedWilayahSelisih.label : "Semua RT/RW"}
                </Button>
              </div>
            </div>

            {/* Filter Bar RT/RW & Kategori Selisih */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="flex gap-1.5 flex-wrap items-center w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-500">Filter Selisih:</span>
                {(
                  [
                    { val: "SEMUA", label: "Semua" },
                    { val: "TUNGGU_INPUT_WEB", label: "Tunggu Input Web" },
                    { val: "BELUM_DIAMBIL", label: "Belum Ambil" },
                    { val: "HUMAN_ERROR_BAST", label: "Salah Tulis BAST" },
                    { val: "MATCH_LENGKAP", label: "Match" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.val}
                    onClick={() => setFilterKategoriSelisih(opt.val)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border touch-manipulation min-h-[36px] ${
                      filterKategoriSelisih === opt.val
                        ? "bg-bulog-blue text-white border-bulog-blue"
                        : "bg-white text-slate-700 border-slate-200 hover:border-bulog-blue/40"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 items-center sm:ml-auto w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-500 whitespace-nowrap">RT:</span>
                <select
                  value={filterRTSelisih}
                  onChange={(e) => setFilterRTSelisih(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white touch-manipulation min-h-[38px]"
                >
                  <option value="SEMUA">Semua RT/RW</option>
                  {daftarWilayahSelisih.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label} ({opt.count})
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={searchSelisih}
                  onChange={(e) => setSearchSelisih(e.target.value)}
                  placeholder="Cari NIK / PBP / Alamat..."
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-bulog-blue/30 w-full sm:w-48"
                />
              </div>
            </div>

            {/* MOBILE CARD VIEW (< 640px) */}
            <div className="block sm:hidden divide-y divide-slate-100">
              {selisihFiltered.length === 0 ? (
                <div className="p-4">
                  <EmptyState
                    icon={<svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
                    title="Tidak ada selisih data"
                    description="Unggah File Ekspor Bulog dan Data BAST/Master."
                  />
                </div>
              ) : (
                selisihFiltered.slice(0, 100).map((r, idx) => (
                  <div key={idx} className="p-4 space-y-2 bg-white active:bg-slate-50 transition">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {r.noUrut != null && (
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-mono font-bold rounded">
                                No. {r.noUrut}
                              </span>
                            )}
                            <h4 className="text-sm font-black text-slate-900">{r.nama}</h4>
                          </div>
                          <p className="text-xs font-mono text-slate-500 mt-0.5">
                            NIK: {r.kategoriSelisih === "POTENSI_TTD_NYASAR" ? (r.nikBast || "—") : r.nik} · RT {r.rt}/RW {r.rw}
                          </p>
                        </div>
                      <div>
                        {r.kategoriSelisih === "TUNGGU_INPUT_WEB" && <Badge variant="warning">Tunggu Input Web</Badge>}
                        {r.kategoriSelisih === "BELUM_DIAMBIL" && <Badge variant="info" className="font-bold">Belum Ambil</Badge>}
                        {r.kategoriSelisih === "HUMAN_ERROR_BAST" && <Badge variant="danger">Salah Tulis BAST</Badge>}
                        {r.kategoriSelisih === "MATCH_LENGKAP" && <Badge variant="success">Match</Badge>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Web Bulog:</span>
                        <Badge variant={r.statusWebBulog.includes("Sudah") ? "success" : "neutral"}>{r.statusWebBulog}</Badge>
                        <span className="text-[9px] text-slate-500 block mt-0.5 font-mono">{r.verificationStatus}</span>
                      </div>
                      <div><span className="text-slate-400 block text-[10px]">Fisik Posko:</span><Badge variant={r.adaBASTFisik ? "success" : "neutral"}>{r.statusPosko}</Badge></div>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 leading-snug">{r.catatanRekomendasi}</p>
                  </div>
                ))
              )}
            </div>

            {/* DESKTOP TABLE VIEW (>= 640px) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Nama PBP / NIK</th>
                    <th className="px-4 py-3">RT / RW</th>
                    <th className="px-4 py-3">Status Web Bulog</th>
                    <th className="px-4 py-3">Verifikasi Web</th>
                    <th className="px-4 py-3">Status Fisik Posko</th>
                    <th className="px-4 py-3">Status Matriks Selisih</th>
                    <th className="px-4 py-3">Analisa &amp; Rekomendasi Solusi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {selisihFiltered.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <EmptyState
                          icon={<svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
                          title="Tidak ada selisih data"
                          description="Unggah File Ekspor Bulog dan Data BAST/Master untuk memicu analisa selisih 3-way."
                        />
                      </td>
                    </tr>
                  ) : (
                    selisihFiltered.slice(0, 150).map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                            {r.noUrut != null && (
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-mono font-bold rounded" title="No. Urut Undangan BAST">
                                No. {r.noUrut}
                              </span>
                            )}
                            {r.nama}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">NIK: {r.nik}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-bold text-slate-700">
                          RT {r.rt} / RW {r.rw}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={r.statusWebBulog.includes("Sudah") ? "success" : "neutral"}>
                            {r.statusWebBulog}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={/terverifikasi|sudah|ya|diterima|verified/i.test(r.verificationStatus) && !/belum/i.test(r.verificationStatus) ? "success" : "warning"}>
                            {r.verificationStatus}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={r.adaBASTFisik ? "success" : "neutral"}>
                            {r.statusPosko}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {r.kategoriSelisih === "TUNGGU_INPUT_WEB" && <Badge variant="warning">Tunggu Input Web</Badge>}
                          {r.kategoriSelisih === "BELUM_DIAMBIL" && <Badge variant="info" className="font-bold">Belum Ambil Beras</Badge>}
                          {r.kategoriSelisih === "HUMAN_ERROR_BAST" && <Badge variant="danger">Salah Tulis BAST</Badge>}
                          {r.kategoriSelisih === "MATCH_LENGKAP" && <Badge variant="success">Match Sempurna</Badge>}
                        </td>
                        <td className="px-4 py-3 max-w-[240px]">
                          <p className="text-[11px] leading-snug font-semibold text-slate-800">{r.catatanRekomendasi}</p>
                          {r.dugaanSalahKetikNIK && (
                            <span className="text-[10px] font-bold text-amber-700 block mt-0.5">{r.dugaanSalahKetikNIK}</span>
                          )}
                          <span className="text-[9px] text-slate-400 block mt-1">
                            Sumber: {r.sumberDataEkspresil || "Ekspor Bulog"} · Ditarik {tanggalDitarik}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* MODE TAB 2: ANALISA BAST FISIK REGULAR */}
      {auditModeTab === "bastAudit" && (
        <div className="space-y-5">
          {/* Statistik */}
          {recordsUntukAuditFisik.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard label="Total Realisasi" value={statistik.total.toLocaleString("id-ID")}
                icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>} />
              <StatCard label="✅ Terverifikasi Fisik" value={countVerifiedFisik.toLocaleString("id-ID")} variant="success"
                icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
                sub={`${countReviewFisik} ditinjau · ${countMismatchFisik} ketidaksesuaian`}
              />
              <StatCard label="PBP Pengganti" value={statistik.pengganti.toLocaleString("id-ID")} variant={statistik.pengganti > 0 ? "warning" : "default"}
                icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} />
              <StatCard label="Perwakilan (Beda/1 KK)" value={statistik.perwakilan.toLocaleString("id-ID")} variant="blue"
                icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>} />
            </div>
          )}

          {/* Data table */}
          <Card noPadding>
            {/* Toolbar */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Hasil Analisa BAST Fisik vs Sistem</h3>
                <p className="text-xs text-slate-500 mt-0.5">{filtered.length.toLocaleString("id-ID")} baris ditampilkan • <span className="font-bold text-emerald-700">{countVerifiedFisik} Terverifikasi Fisik</span></p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
                <Button variant="success" size="sm" className="flex-1 sm:flex-none" onClick={() => handleTandaiHalaman("VERIFIED")}>
                  ✅ Tandai Hal Ini
                </Button>
                {Object.keys(penandaMap).length > 0 && (
                  <Button variant="secondary" size="sm" className="flex-1 sm:flex-none" onClick={handleResetPenandaPosko}>
                    🔄 Reset Penanda
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1 sm:flex-none"
                  onClick={handleEksporRincianSPTJM}
                  icon={<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>}
                >
                  Rincian SPTJM Pengganti ({poskoAktif})
                </Button>
                <Button variant="success" size="sm" className="flex-1 sm:flex-none"
                  icon={<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>}
                  onClick={handleExportAudit}>
                  Ekspor Excel
                </Button>
                <Button variant="success" size="sm" className="flex-1 sm:flex-none"
                  icon={<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/><rect x="3" y="3" width="18" height="4" rx="1"/></svg>}
                  onClick={handleExportSiapUploadBanpang}>
                  Siap Upload Banpang
                </Button>
              </div>
            </div>

            {/* Filter bar */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="flex gap-1.5 flex-wrap w-full sm:w-auto">
                {(
                  [
                    { val: "BedaKK", label: "Beda KK" },
                    { val: "Pengganti", label: "Pengganti" },
                    { val: "SatuKK", label: "Satu KK" },
                    { val: "Normal", label: "Normal" },
                    { val: "Semua", label: "Semua" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.val}
                    onClick={() => { setFilter(opt.val as FilterAudit); setPage(1); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border touch-manipulation min-h-[36px] ${
                      filter === opt.val
                        ? "bg-bulog-blue text-white border-bulog-blue"
                        : "bg-white text-slate-700 border-slate-200 hover:border-bulog-blue/40"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="relative w-full sm:w-auto sm:ml-auto">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Cari nama PBP / pengganti / NIK..."
                  className="pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-medium w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-bulog-blue/30"
                />
                <svg className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
            </div>

            {/* MOBILE CARD VIEW (< 640px) */}
            <div className="block sm:hidden divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <div className="p-4">
                  <EmptyState
                    icon={<svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>}
                    title={bulogExportRecords.length === 0 ? "Belum ada data ekspor" : "Tidak ada data"}
                    description={bulogExportRecords.length === 0 ? "Unggah file hasil ekspor Bulog." : "Coba ubah filter kata pencarian."}
                  />
                </div>
              ) : (
                paginated.map((row, idx) => {
                  const nClean = fixNIK(row.nik) || cleanNum(row.nik);
                  const bMatch = nClean ? bastByNIK.get(nClean) : scopedBastRecords.find((b) => cleanStr(b.NAMA) === cleanStr(row.nama));
                  const noU = bMatch?.NO_URUT;
                  const pKey = getRowPenandaKey(row);
                  const penanda = penandaMap[pKey];

                  return (
                    <div key={idx} className="p-4 space-y-2 bg-white active:bg-slate-50 transition">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {noU != null && (
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-mono font-bold rounded">
                                No. {noU}
                              </span>
                            )}
                            <h4 className="text-sm font-black text-slate-900">{row.nama}</h4>
                          </div>
                          <p className="text-xs font-mono text-slate-500 mt-0.5">NIK: {row.nik}</p>
                        </div>
                        {renderBadge(row)}
                      </div>
                      <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                        <p><span className="text-slate-400 font-normal">Verifikasi Web:</span> <Badge variant={/terverifikasi|sudah|ya|diterima|verified/i.test(String(row.verification_status)) && !/belum/i.test(String(row.verification_status)) ? "success" : "warning"}>{row.verification_status || "Belum diverifikasi"}</Badge></p>
                        <p><span className="text-slate-400 font-normal">Pengambil:</span> <b>{row.nama_pengganti || "Penerima Asli"}</b></p>
                        <p><span className="text-slate-400 font-normal">Catatan:</span> {row.notes} ({row.kelurahan})</p>
                      </div>
                      {renderRekomendasi(row)}
                      <button
                        onClick={() => togglePenandaRow(row)}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 touch-manipulation ${
                          penanda ? LABELS_PENANDA[penanda].bg : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <span>{penanda ? LABELS_PENANDA[penanda].icon : "☐"}</span>
                        <span>{penanda ? LABELS_PENANDA[penanda].label : "Tandai Verifikasi Fisik BAST"}</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* DESKTOP TABLE VIEW (>= 640px) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="px-4 py-3">No</th>
                    <th className="px-4 py-3">Penanda Fisik BAST</th>
                    <th className="px-4 py-3 cursor-pointer hover:text-bulog-blue" onClick={() => handleSort("nama")}>
                      PBP Asli <SortIcon col="nama" />
                    </th>
                    <th className="px-4 py-3">Pihak Pengambil</th>
                    <th className="px-4 py-3 cursor-pointer hover:text-bulog-blue" onClick={() => handleSort("status_pbp")}>
                      Status <SortIcon col="status_pbp" />
                    </th>
                    <th className="px-4 py-3">Verifikasi Web</th>
                    <th className="px-4 py-3 cursor-pointer hover:text-bulog-blue" onClick={() => handleSort("kelurahan")}>
                      Catatan / Wilayah <SortIcon col="kelurahan" />
                    </th>
                    <th className="px-4 py-3">Rekomendasi Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <EmptyState
                          icon={<svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>}
                          title={bulogExportRecords.length === 0 ? "Belum ada data ekspor" : "Tidak ada data sesuai filter"}
                          description={bulogExportRecords.length === 0
                            ? "Unggah file hasil ekspor Bulog di atas untuk memulai analisa."
                            : "Coba ubah filter kategori atau kata pencarian."}
                        />
                      </td>
                    </tr>
                  ) : (
                    paginated.map((row, idx) => {
                      const nClean = fixNIK(row.nik) || cleanNum(row.nik);
                      const bMatch = nClean ? bastByNIK.get(nClean) : scopedBastRecords.find((b) => cleanStr(b.NAMA) === cleanStr(row.nama));
                      const noU = bMatch?.NO_URUT;
                      const pKey = getRowPenandaKey(row);
                      const penanda = penandaMap[pKey];

                      return (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3 text-slate-400 font-bold">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => togglePenandaRow(row)}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition flex items-center gap-1.5 touch-manipulation whitespace-nowrap ${
                                penanda ? LABELS_PENANDA[penanda].bg : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                              }`}
                              title="Klik untuk mengubah status penanda (Verified ➔ Review ➔ Mismatch ➔ Batal)"
                            >
                              <span>{penanda ? LABELS_PENANDA[penanda].icon : "☐"}</span>
                              <span>{penanda ? LABELS_PENANDA[penanda].text : "Tandai Fisik"}</span>
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                              {noU != null && (
                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-mono font-bold rounded" title="No. Urut Undangan BAST">
                                  No. {noU}
                                </span>
                              )}
                              {row.nama}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">NIK: {row.nik}</div>
                          </td>
                        <td className="px-4 py-3">
                          {row.nama_pengganti && row.nama_pengganti !== "—" && row.nama_pengganti !== "-" ? (
                            <>
                              <div className="font-bold text-slate-900">{row.nama_pengganti}</div>
                              <div className="text-[10px] text-slate-400 font-mono">NIK: {row.nik_pengganti || "—"}</div>
                            </>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Penerima Asli</span>
                          )}
                        </td>
                        <td className="px-4 py-3">{renderBadge(row)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={/terverifikasi|sudah|ya|diterima|verified/i.test(String(row.verification_status)) && !/belum/i.test(String(row.verification_status)) ? "success" : "warning"}>
                            {row.verification_status || "Belum diverifikasi"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-700 block">{row.notes}</span>
                          <span className="text-[10px] text-slate-400">{row.kelurahan}</span>
                        </td>
                        <td className="px-4 py-3 max-w-[220px]">{renderRekomendasi(row)}</td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
                <span>{filtered.length.toLocaleString("id-ID")} baris · Hal {page} dari {totalPages}</span>
                <div className="flex gap-1.5 w-full sm:w-auto justify-center">
                  <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>←</Button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                    return (
                      <button key={p} onClick={() => setPage(p)}
                        className={`px-3 py-1.5 rounded-lg border font-bold transition touch-manipulation min-w-[36px] ${p === page ? "bg-bulog-blue text-white border-bulog-blue" : "border-slate-200 hover:bg-slate-50 text-slate-700"}`}>{p}</button>
                    );
                  })}
                  <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>→</Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
