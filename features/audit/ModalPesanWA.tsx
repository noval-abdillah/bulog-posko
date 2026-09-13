/**
 * features/audit/ModalPesanWA.tsx
 * Modal Generator Pesan WhatsApp Siap Kirim per RT/RW atau Rekap Semua RT/RW.
 * Memudahkan petugas mengirimkan daftar warga yang belum mengambil beras ke Ketua RT/RW/Pengurus Wilayah.
 */
"use client";

import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  generatePesanWAReminderRT,
  generatePesanWAReminderSemuaRT,
  bukaWhatsAppWeb,
} from "@/lib/whatsapp";
import type { SelisihAuditRow } from "@/types";

interface ModalPesanWAProps {
  rtTarget: string;
  rwTarget: string;
  kelurahan: string;
  wargaList: SelisihAuditRow[];
  onClose: () => void;
}

export default function ModalPesanWA({
  rtTarget,
  rwTarget,
  kelurahan,
  wargaList,
  onClose,
}: ModalPesanWAProps) {
  const isSemuaDefault = rtTarget === "SEMUA";
  const [selectedRtKey, setSelectedRtKey] = useState<string>(isSemuaDefault ? "SEMUA" : rtTarget);
  const [nomorHp, setNomorHp] = useState("");
  const toast = useToast();

  const daftarRT = useMemo(() => {
    const map = new Map<string, { rt: string; rw: string; label: string; list: SelisihAuditRow[] }>();
    wargaList.forEach((w) => {
      const rt = String(w.rt || "").trim();
      const rw = String(w.rw || "").trim();
      const isUnassigned = (!rt || rt === "—" || rt === "-") && (!rw || rw === "—" || rw === "-");
      const key = isUnassigned ? "BELUM_TERIDENTIFIKASI" : `${rt}|${rw}`;
      const label = isUnassigned
        ? "📌 Warga Belum Teridentifikasi RT/RW (RT — / RW —)"
        : `RT ${rt || "—"}${rw && rw !== "—" ? ` / RW ${rw}` : ""}`;

      const existing = map.get(key);
      if (existing) {
        existing.list.push(w);
      } else {
        map.set(key, { rt, rw, label, list: [w] });
      }
    });

    return [...map.entries()].sort(([k1], [k2]) => {
      if (k1 === "BELUM_TERIDENTIFIKASI") return 1;
      if (k2 === "BELUM_TERIDENTIFIKASI") return -1;
      return k1.localeCompare(k2, undefined, { numeric: true });
    });
  }, [wargaList]);

  const { pesan, targetLabel, subText, activeCount } = useMemo(() => {
    if (selectedRtKey === "SEMUA") {
      return {
        pesan: generatePesanWAReminderSemuaRT(kelurahan, wargaList),
        targetLabel: "Semua RT/RW & Warga RT —",
        subText: `${wargaList.length} total warga PBP belum ambil beras (termasuk RT/RW belum teridentifikasi)`,
        activeCount: wargaList.length,
      };
    }

    const item = daftarRT.find(([k]) => k === selectedRtKey);
    if (!item) {
      return {
        pesan: generatePesanWAReminderRT(rtTarget, rwTarget, kelurahan, wargaList),
        targetLabel: `RT ${rtTarget}${rwTarget && rwTarget !== "—" ? ` / RW ${rwTarget}` : ""}`,
        subText: `${wargaList.length} warga PBP belum ambil beras`,
        activeCount: wargaList.length,
      };
    }

    const [, data] = item;
    return {
      pesan: generatePesanWAReminderRT(data.rt || "—", data.rw || "—", kelurahan, data.list),
      targetLabel: data.label,
      subText: `${data.list.length} warga PBP di ${data.label}`,
      activeCount: data.list.length,
    };
  }, [selectedRtKey, kelurahan, wargaList, rtTarget, rwTarget, daftarRT]);

  function handleSalin() {
    navigator.clipboard.writeText(pesan);
    toast.sukses(`Pesan WA (${targetLabel}) berhasil disalin ke clipboard!`);
  }

  function handleKirim() {
    bukaWhatsAppWeb(pesan, nomorHp);
    toast.sukses(`Membuka WhatsApp Web untuk ${targetLabel}...`);
  }

  const modal = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-base flex-shrink-0">
              💬
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Generator Pesan WhatsApp RT/RW
              </h3>
              <p className="text-xs text-slate-500">{subText}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
            aria-label="Tutup modal"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Dropdown Pemilih Wilayah / RT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pilih Target Penerima Pesan:
              </label>
              <select
                value={selectedRtKey}
                onChange={(e) => setSelectedRtKey(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="SEMUA">🌐 Rekap Semua RT/RW ({wargaList.length} Warga)</option>
                {daftarRT.map(([key, data]) => (
                  <option key={key} value={key}>
                    {data.label} ({data.list.length} Warga)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor WA Tujuan (Opsional):
              </label>
              <input
                type="tel"
                value={nomorHp}
                onChange={(e) => setNomorHp(e.target.value)}
                placeholder="Contoh: 08123456789"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                Pratinjau Pesan WA — <span className="text-emerald-700 font-extrabold">{targetLabel}</span> ({activeCount} Warga):
              </label>
              <span className="text-[10px] text-slate-400 font-mono">Siap Kirim</span>
            </div>
            <textarea
              readOnly
              rows={10}
              value={pesan}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-800 leading-relaxed focus:outline-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSalin}
            className="w-full sm:w-auto"
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            }
          >
            Salin Teks Pesan
          </Button>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="secondary" size="sm" onClick={onClose} className="flex-1 sm:flex-none">
              Batal
            </Button>
            <Button
              variant="success"
              size="sm"
              className="flex-1 sm:flex-none"
              onClick={handleKirim}
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              }
            >
              Kirim via WA Web
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof window === "undefined") return null;

  return createPortal(modal, document.body);
}
