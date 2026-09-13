/**
 * features/log/LogPage.tsx
 * Halaman Penanda PBP Pengganti Tertolak Banpang.
 * Petugas menginput Nama, NIK, dan No. KK pengganti yang tertolak di Banpang
 * lalu mengekspor daftarnya ke Excel untuk tim audit.
 */
"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/store/appStore";
import { eksporExcel } from "@/lib/excel";
import { formatWaktuSekarang, cleanStr } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { LogPenggantiTertolak } from "@/types";

const PAGE_SIZE = 50;

type SortKey = "waktu" | "nama" | "nik";
type SortDir = "asc" | "desc";

export default function LogPage() {
  const logPenggantiTertolak = useAppStore((s) => s.logPenggantiTertolak);
  const tambahPenggantiTertolak = useAppStore((s) => s.tambahPenggantiTertolak);
  const hapusPenggantiTertolak = useAppStore((s) => s.hapusPenggantiTertolak);
  const bersihkanPenggantiTertolak = useAppStore((s) => s.bersihkanPenggantiTertolak);
  const poskoAktif = useAppStore((s) => s.poskoAktif);
  const sessionPosko = useAppStore((s) => s.sessionPosko);
  const toast = useToast();

  const cleanPosko = cleanStr(poskoAktif);
  const isSuper = Boolean(sessionPosko?.isSuper);

  const scopedLogs = useMemo(() => {
    if (isSuper) return logPenggantiTertolak;
    return logPenggantiTertolak.filter((l) => {
      const lPosko = cleanStr(l.posko || "");
      return !lPosko || !cleanPosko || lPosko.includes(cleanPosko) || cleanPosko.includes(lPosko);
    });
  }, [logPenggantiTertolak, cleanPosko, isSuper]);

  // Form input state
  const [nama, setNama] = useState("");
  const [nik, setNik] = useState("");
  const [noKK, setNoKK] = useState("");
  const [catatan, setCatatan] = useState("");

  // Table filter & search state
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("waktu");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  const total = scopedLogs.length;

  function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();

    const namaClean = nama.trim();
    const nikClean = nik.trim();
    const noKKClean = noKK.trim();

    if (!namaClean) {
      toast.peringatan("Nama pengganti wajib diisi!");
      return;
    }
    if (!nikClean) {
      toast.peringatan("NIK pengganti wajib diisi!");
      return;
    }

    const newEntry: LogPenggantiTertolak = {
      id: `tertolak-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      waktu: formatWaktuSekarang(),
      posko: poskoAktif,
      nama: namaClean.toUpperCase(),
      nik: nikClean,
      noKK: noKKClean || "—",
      catatan: catatan.trim() || "Tertolak di Banpang",
    };

    tambahPenggantiTertolak(newEntry);
    toast.sukses(`PBP Pengganti Tertolak dicatat: ${newEntry.nama}`);

    // Reset form
    setNama("");
    setNik("");
    setNoKK("");
    setCatatan("");
  }

  function handleHapusItem(item: LogPenggantiTertolak) {
    if (confirm(`Hapus data ${item.nama} dari daftar tertolak?`)) {
      hapusPenggantiTertolak(item.id);
      toast.info(`Data ${item.nama} dihapus.`);
    }
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  const filtered = useMemo(() => {
    let rows = scopedLogs;
    if (search) {
      const up = search.toUpperCase();
      rows = rows.filter(
        (l) =>
          l.nama.toUpperCase().includes(up) ||
          l.nik.includes(up) ||
          l.noKK.includes(up) ||
          l.catatan.toUpperCase().includes(up)
      );
    }
    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "nama") cmp = a.nama.localeCompare(b.nama);
      else if (sortKey === "nik") cmp = a.nik.localeCompare(b.nik);
      else cmp = a.waktu.localeCompare(b.waktu);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [logPenggantiTertolak, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleExportExcel() {
    if (!logPenggantiTertolak.length) {
      toast.peringatan("Belum ada data PBP Pengganti Tertolak untuk diekspor!");
      return;
    }
    eksporExcel(
      logPenggantiTertolak.map((l, idx) => ({
        No: idx + 1,
        "Waktu Input": l.waktu,
        "Posko Pelayanan": l.posko,
        "Nama PBP Pengganti": l.nama,
        "NIK Pengganti": l.nik,
        "No. KK Pengganti": l.noKK,
        "Catatan Alasan Tolak": l.catatan,
      })) as Record<string, unknown>[],
      "Pengganti_Tertolak",
      "PBP_Pengganti_Tertolak",
      {
        judulLaporan: `Daftar PBP Pengganti Tertolak Banpang - Kelurahan ${poskoAktif}`,
        posko: poskoAktif,
      }
    );
    toast.sukses("Laporan PBP Pengganti Tertolak berhasil diunduh.");
  }

  function handleClearAll() {
    if (confirm("Apakah Anda yakin ingin mengosongkan seluruh daftar PBP Pengganti Tertolak?")) {
      bersihkanPenggantiTertolak();
      setPage(1);
      toast.info("Daftar PBP Pengganti Tertolak dikosongkan.");
    }
  }

  const SortIcon = ({ col }: { col: SortKey }) => (
    <svg
      className={`w-3 h-3 ml-1 inline ${sortKey === col ? "text-bulog-blue" : "text-slate-300"}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      {sortDir === "asc" && sortKey === col ? (
        <polyline points="18 15 12 9 6 15" />
      ) : (
        <polyline points="6 9 12 15 18 9" />
      )}
    </svg>
  );

  return (
    <div className="space-y-5">
      {/* Stat Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          label="Total Pengganti Tertolak"
          value={total}
          variant={total > 0 ? "danger" : "default"}
          icon={
            <svg className="w-5 h-5 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          }
        />
        <StatCard
          label="Posko Pelayanan"
          value={poskoAktif}
          variant="blue"
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          }
        />
        <StatCard
          label="Status Ekspor Audit"
          value={total > 0 ? "Siap Diekspor" : "Belum Ada Data"}
          variant={total > 0 ? "success" : "default"}
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          }
        />
      </div>

      {/* Form Input Sederhana */}
      <Card noPadding>
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-rose-50/50">
          <div className="flex items-center gap-2 text-rose-800">
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Input PBP Pengganti Tertolak Banpang</h2>
              <p className="text-xs text-slate-600">Catat nama, NIK, dan No. KK orang pengganti yang tidak lolos kriteria di aplikasi Banpang.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmitForm} className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama PBP Pengganti <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: BUDI SANTOSO"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/30 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                NIK Pengganti <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={16}
                value={nik}
                onChange={(e) => setNik(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="16 digit NIK"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">No. KK Pengganti</label>
              <input
                type="text"
                maxLength={16}
                value={noKK}
                onChange={(e) => setNoKK(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="16 digit No. KK (opsional)"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Catatan / Alasan Penolakan</label>
            <input
              type="text"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: Tertolak di Banpang / Terdaftar DTKS / Beda KK / dll"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/30"
            />
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              variant="danger"
              size="md"
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              }
            >
              Tambahkan ke Daftar Tertolak
            </Button>
          </div>
        </form>
      </Card>

      {/* Tabel Daftar Pengganti Tertolak */}
      <Card noPadding>
        {/* Toolbar & Search */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Daftar PBP Pengganti Tertolak ({filtered.length})</h2>
            <p className="text-xs text-slate-500 mt-0.5">Siap diekspor ke Excel untuk diserahkan ke Tim Audit</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="success"
              size="sm"
              className="flex-1 sm:flex-none"
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
              }
              onClick={handleExportExcel}
              disabled={!logPenggantiTertolak.length}
            >
              Export Excel ke Audit
            </Button>
            <Button variant="secondary" size="sm" onClick={handleClearAll} disabled={!logPenggantiTertolak.length}>
              Bersihkan
            </Button>
          </div>
        </div>

        {/* Filter / Search input */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari nama / NIK / No KK..."
              className="pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-medium w-full focus:outline-none focus:ring-2 focus:ring-bulog-blue/30"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>

        {/* MOBILE CARD VIEW (< 640px) */}
        <div className="block sm:hidden divide-y divide-slate-100">
          {paginated.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={
                  <svg className="w-6 h-6 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                }
                title={logPenggantiTertolak.length === 0 ? "Belum ada pengganti tertolak" : "Tidak ada data"}
                description={
                  logPenggantiTertolak.length === 0
                    ? "Gunakan form di atas untuk mencatat PBP pengganti yang tertolak di Banpang."
                    : "Coba kata pencarian lain."
                }
              />
            </div>
          ) : (
            paginated.map((l) => (
              <div key={l.id} className="p-4 space-y-2 bg-white active:bg-slate-50 transition">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">{l.nama}</h3>
                    <p className="text-xs font-mono text-slate-500 mt-0.5">NIK: {l.nik}</p>
                    <p className="text-xs font-mono text-slate-500">KK: {l.noKK}</p>
                  </div>
                  <button
                    onClick={() => handleHapusItem(l)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                    title="Hapus"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
                <div className="text-xs text-rose-700 bg-rose-50 p-2 rounded-lg font-medium">
                  {l.catatan}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Input: {l.waktu} · Posko: {l.posko}
                </div>
              </div>
            ))
          )}
        </div>

        {/* DESKTOP TABLE VIEW (>= 640px) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 cursor-pointer hover:text-bulog-blue" onClick={() => handleSort("waktu")}>
                  Waktu Input <SortIcon col="waktu" />
                </th>
                <th className="px-4 py-3 cursor-pointer hover:text-bulog-blue" onClick={() => handleSort("nama")}>
                  Nama Pengganti <SortIcon col="nama" />
                </th>
                <th className="px-4 py-3 cursor-pointer hover:text-bulog-blue" onClick={() => handleSort("nik")}>
                  NIK <SortIcon col="nik" />
                </th>
                <th className="px-4 py-3">No. KK</th>
                <th className="px-4 py-3">Posko</th>
                <th className="px-4 py-3">Catatan Alasan Tolak</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={
                        <svg className="w-6 h-6 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="15" y1="9" x2="9" y2="15" />
                          <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                      }
                      title={logPenggantiTertolak.length === 0 ? "Belum ada PBP pengganti tertolak" : "Tidak ada data sesuai pencarian"}
                      description={
                        logPenggantiTertolak.length === 0
                          ? "Gunakan form di atas untuk mencatat PBP pengganti yang tertolak di Banpang."
                          : "Coba kata pencarian lain."
                      }
                    />
                  </td>
                </tr>
              ) : (
                paginated.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap">{l.waktu}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{l.nama}</td>
                    <td className="px-4 py-3 font-mono text-slate-700 font-semibold">{l.nik}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">{l.noKK}</td>
                    <td className="px-4 py-3 text-slate-600">{l.posko}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded font-semibold text-[11px]">
                        {l.catatan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleHapusItem(l)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                        title="Hapus data ini"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
            <span>
              {filtered.length} entri · Hal {page} dari {totalPages}
            </span>
            <div className="flex gap-1.5 w-full sm:w-auto justify-center">
              <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                ←
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1.5 rounded-lg border font-bold transition touch-manipulation min-w-[36px] ${
                      p === page ? "bg-bulog-blue text-white border-bulog-blue" : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                →
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
