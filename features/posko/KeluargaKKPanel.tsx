/**
 * features/posko/KeluargaKKPanel.tsx
 * Komponen deteksi seluruh anggota keluarga (1 KK) & proteksi ganda penyerahan PBP.
 * Menampilkan daftar anggota keluarga, status riwayat salur masing-masing, dan banner peringatan.
 */
"use client";

import { useAppStore } from "@/store/appStore";
import { Badge } from "@/components/ui/Badge";
import { cleanNum } from "@/lib/utils";
import type { MasterRow } from "@/types";

interface Props {
  noKK: string;
  currentNIK: string;
  onPilihAnggota?: (item: MasterRow) => void;
}

export default function KeluargaKKPanel({ noKK, currentNIK, onPilihAnggota }: Props) {
  const masterByKK         = useAppStore((s) => s.masterByKK);
  const logPelayanan       = useAppStore((s) => s.logPelayanan);
  const bulogExportRecords = useAppStore((s) => s.bulogExportRecords);

  const cleanCurrentKK = cleanNum(noKK);
  if (!cleanCurrentKK || cleanCurrentKK.length < 10) return null;

  const anggotaKKList = masterByKK.get(cleanCurrentKK) ?? [];
  if (anggotaKKList.length === 0) return null;

  // Cek apakah ada anggota KK ini yang sudah pernah diserahkan
  const logMapByNIK = new Map<string, typeof logPelayanan[0]>();
  logPelayanan.forEach((l) => {
    if (l.nik && l.nik !== "-") logMapByNIK.get(cleanNum(l.nik)) ?? logMapByNIK.set(cleanNum(l.nik), l);
  });

  const bulogExportMapByNIK = new Map<string, typeof bulogExportRecords[0]>();
  bulogExportRecords.forEach((b) => {
    if (b.nik) bulogExportMapByNIK.set(cleanNum(b.nik), b);
  });

  let anggotaSudahSalur: { nama: string; nik: string; sumber: string; waktu?: string } | null = null;

  for (const m of anggotaKKList) {
    const mNIK = cleanNum(m.NIK);
    if (!mNIK) continue;

    const logMatch = logMapByNIK.get(mNIK);
    if (logMatch && logMatch.status === "SUKSES_SALUR") {
      anggotaSudahSalur = {
        nama: m.NAMA,
        nik: m.NIK,
        sumber: `Riwayat Posko Meja (${logMatch.posko})`,
        waktu: logMatch.waktu,
      };
      break;
    }

    const auditMatch = bulogExportMapByNIK.get(mNIK);
    if (auditMatch) {
      const sLower = String(auditMatch.status_serah || "").toLowerCase();
      if (sLower.includes("sudah") || sLower.includes("diterima") || sLower.includes("ya")) {
        anggotaSudahSalur = {
          nama: auditMatch.nama || m.NAMA,
          nik: m.NIK,
          sumber: `Web Bulog (${auditMatch.kelurahan})`,
        };
        break;
      }
    }
  }

  const isSudahDiserahkan1KK = Boolean(anggotaSudahSalur);

  function getAnggotaKey(item: MasterRow, idx: number) {
    return [item.NIK || "", item._sourceFile || "", item._sourceRow ?? idx].join("|");
  }

  return (
    <div className="space-y-3">
      {/* Banner Peringatan Ditolak / Berhasil */}
      {isSudahDiserahkan1KK ? (
        <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-950 flex items-start gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0 font-bold text-lg">
            🛑
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-sm font-black text-rose-900 uppercase tracking-wide">
                PERINGATAN GANDA 1 KK: PENYERAHAN DITOLAK
              </h4>
              <Badge variant="danger">1 KK Maksimal 1 Kuota</Badge>
            </div>
            <p className="text-xs font-semibold text-rose-800 mt-1 leading-relaxed">
              Kuota beras 30 Kg untuk No. KK <span className="font-mono font-bold">{noKK}</span> <b>SUDAH PERNAH DIAMBIL / DISERAHKAN</b> oleh{" "}
              <u className="font-extrabold">{anggotaSudahSalur?.nama}</u> (NIK: {anggotaSudahSalur?.nik}) via {anggotaSudahSalur?.sumber}
              {anggotaSudahSalur?.waktu ? ` pada jam ${anggotaSudahSalur.waktu}` : ""}.
            </p>
            <p className="text-[11px] text-rose-700 font-bold mt-1.5">
              ⚠️ Aturan Perum BULOG: Aplikasi menolak penyerahan 2 kali dalam 1 Kartu Keluarga yang sama!
            </p>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-900">
              Proteksi 1 KK Valid: Belum ada anggota keluarga di KK ini yang mengambil beras.
            </span>
          </div>
          <Badge variant="success">0 / {anggotaKKList.length} Terlayani</Badge>
        </div>
      )}

      {/* Widget Daftar Anggota Keluarga (1 KK) */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-bulog-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <h4 className="text-xs font-black uppercase text-slate-800 tracking-wide">
              Anggota Keluarga Terdaftar di KK: <span className="font-mono text-bulog-blue">{noKK}</span>
            </h4>
          </div>
          <span className="text-[10px] text-slate-500 font-bold">{anggotaKKList.length} Jiwa</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {anggotaKKList.map((m, idx) => {
            const isCurrent = m.NIK === currentNIK;
            const mNIK = cleanNum(m.NIK);
            const logM = logMapByNIK.get(mNIK);
            const isMDiserahkan = logM?.status === "SUKSES_SALUR";

            return (
              <div
                key={getAnggotaKey(m, idx)}
                onClick={() => !isCurrent && onPilihAnggota?.(m)}
                className={`p-3 rounded-xl border text-xs transition flex flex-col justify-between gap-1.5 ${
                  isCurrent
                    ? "bg-blue-100/70 border-bulog-blue/40 shadow-xs"
                    : isMDiserahkan
                    ? "bg-rose-50 border-rose-200"
                    : "bg-white border-slate-200 hover:bg-slate-100 cursor-pointer"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-black text-slate-900 text-sm">{m.NAMA}</span>
                    {isCurrent && <span className="ml-2 text-[9px] bg-bulog-blue text-white font-bold px-1.5 py-0.5 rounded">Sedang Di-scan</span>}
                  </div>
                  {isMDiserahkan ? (
                    <Badge variant="danger">Diserahkan</Badge>
                  ) : (
                    <Badge variant="neutral">{m.HUBUNGAN_KELUARGA || "Anggota"}</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-mono">NIK: {m.NIK}</span>
                  <span>Usia: {m.USIA || "—"} thn</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
