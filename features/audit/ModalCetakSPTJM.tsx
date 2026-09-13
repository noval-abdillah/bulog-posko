/**
 * features/audit/ModalCetakSPTJM.tsx
 * Modal & template siap cetak (print CSS & PDF overlay Bulog) Surat Pertanggungjawaban Mutlak (SPTJM)
 * pengganti penerima bansos PBP Bulog yang terisi otomatis.
 *
 * Fitur Tambahan:
 * 1. Deteksi otomatis Pengganti Tertolak di Banpang (Peringatan & Badge Red).
 * 2. Form Penandatangan Pejabat (Nama Lurah, NIP, Petugas Posko).
 * 3. Checklist Kelengkapan Berkas Fisik (KTP, KK, Surat Ket, Meterai).
 * 4. Unduh PDF Template Resmi Bulog (.pdf) via pdf-lib.
 */
"use client";

import { useState } from "react";
import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { generatePdfSptjmTerisi } from "@/services/pdfOverlaySptjm";
import { cleanNum, cleanStr } from "@/lib/utils";
import type { AuditRow, KelompokDokumenSPTJM } from "@/types";

interface ModalCetakSPTJMProps {
  row: AuditRow | null;
  onClose: () => void;
}

export default function ModalCetakSPTJM({ row, onClose }: ModalCetakSPTJMProps) {
  const logPenggantiTertolak = useAppStore((s) => s.logPenggantiTertolak);
  const pengaturanSPTJM = useAppStore((s) => s.pengaturanSPTJM);
  const setPengaturanSPTJM = useAppStore((s) => s.setPengaturanSPTJM);
  const poskoAktif = useAppStore((s) => s.poskoAktif);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Form Penandatangan State
  const [namaLurah, setNamaLurah] = useState(pengaturanSPTJM.namaLurah || "");
  const [nipLurah, setNipLurah] = useState(pengaturanSPTJM.nipLurah || "");
  const [namaPetugas, setNamaPetugas] = useState(pengaturanSPTJM.namaPetugasPosko || "");

  // Checklist Berkas State
  const [checkKtpAwal, setCheckKtpAwal] = useState(true);
  const [checkKtpPengganti, setCheckKtpPengganti] = useState(true);
  const [checkKkPengganti, setCheckKkPengganti] = useState(true);
  const [checkSuratKet, setCheckSuratKet] = useState(true);
  const [checkMeterai, setCheckMeterai] = useState(true);

  if (!row) return null;

  // Cek apakah Pengganti terdaftar di Log Pengganti Tertolak
  const nikP = cleanNum(row.nik_pengganti);
  const namaP = cleanStr(row.nama_pengganti);

  const tertolakMatch = logPenggantiTertolak.find(
    (p) =>
      (nikP && cleanNum(p.nik) === nikP) ||
      (namaP && cleanStr(p.nama) === namaP)
  );

  const hariIni = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  function handleSimpanPejabat() {
    setPengaturanSPTJM({
      namaLurah,
      nipLurah,
      namaPetugasPosko: namaPetugas,
    });
  }

  function handlePrintHTML() {
    handleSimpanPejabat();
    window.print();
  }

  async function handleDownloadPdfBulog() {
    if (!row) return;
    handleSimpanPejabat();
    setIsGeneratingPdf(true);
    try {
      const currentRow = row;
      const kelompok: KelompokDokumenSPTJM = {
        noBast: currentRow.no_bast || "BAST-2026093172031004",
        kelurahan: currentRow.kelurahan || poskoAktif,
        kecamatan: "Koja",
        provinsi: pengaturanSPTJM.provinsi,
        kabupatenKota: pengaturanSPTJM.kabupatenKota,
        alokasiBulan: pengaturanSPTJM.alokasiBulan,
        totalKasus: 1,
        isValidAll: true,
          daftarKasus: [
          {
            id: `single-${currentRow.no_bast || "unknown"}-${currentRow.nik || "unknown"}`,
            noBast: currentRow.no_bast || "BAST-2026093172031004",
            kelurahan: currentRow.kelurahan || poskoAktif,
            kecamatan: "Koja",
            pbpAwalNIK: currentRow.nik,
            pbpAwalNoKK: currentRow.no_kk || "",
            pbpAwalNama: currentRow.nama,
            pbpAwalAlamat: currentRow.alamat || "",
            penggantiNIK: currentRow.nik_pengganti || "",
            penggantiNoKK: currentRow.no_kk_pengganti || currentRow.no_kk || "",
            penggantiNama: currentRow.nama_pengganti || "",
            penggantiAlamat: currentRow.alamat_pengganti || currentRow.alamat || "",
            penggantiPekerjaan: currentRow.pekerjaan_pengganti || "Wiraswasta",
            isValidComplete: true,
            alasanBermasalah: [],
          },
        ],
      };

      const pdfBytes = await generatePdfSptjmTerisi(kelompok);
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `SPTJM_Bulog_${(currentRow.nama_pengganti || currentRow.nama).replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Gagal buat PDF SPTJM:", err);
      alert("Gagal mengunduh PDF SPTJM: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  const checklistCount = [checkKtpAwal, checkKtpPengganti, checkKkPengganti, checkSuratKet, checkMeterai].filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header modal (non-printable) */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-bulog-blue/10 flex items-center justify-center text-bulog-blue font-bold text-xs">
              📄
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Cetak Form SPTJM Pengganti PBP</h3>
                {tertolakMatch && <Badge variant="danger">TERTOLAK DI BANPANG</Badge>}
              </div>
              <p className="text-xs text-slate-500">Surat Pertanggungjawaban Mutlak Bermeterai</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="success"
              size="sm"
              onClick={handleDownloadPdfBulog}
              disabled={isGeneratingPdf}
              icon={
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
              }
            >
              {isGeneratingPdf ? "Membuat PDF..." : "Unduh PDF Bulog"}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrintHTML}
              icon={
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
              }
            >
              Cetak Dokumen
            </Button>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Tutup
            </Button>
          </div>
        </div>

        {/* Panel Kontrol Tambahan (non-printable) */}
        <div className="px-5 py-3 bg-slate-100/70 border-b border-slate-200 space-y-3 print:hidden text-xs">
          {/* Peringatan jika Pengganti Tertolak */}
          {tertolakMatch && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2">
              <svg className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <div>
                <p className="font-bold text-rose-900">PERINGATAN: PBP Pengganti Terdaftar Tertolak!</p>
                <p className="text-[11px] leading-relaxed">
                  Pengganti atas nama <b>{tertolakMatch.nama}</b> (NIK: {tertolakMatch.nik}) tercatat di <b>Log Pengganti Tertolak</b> dengan alasan: <i>"{tertolakMatch.catatan}"</i>. Periksa kembali berkas sebelum melanjutkan pencetakan.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Form Pengisian Penandatangan */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
              <p className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px]">
                <svg className="w-3.5 h-3.5 text-bulog-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Pejabat &amp; Petugas Penandatangan
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <label className="block font-semibold text-slate-600 mb-0.5">Nama Lurah/Kades</label>
                  <input
                    type="text"
                    value={namaLurah}
                    onChange={(e) => setNamaLurah(e.target.value)}
                    placeholder="Nama Lurah"
                    className="w-full px-2 py-1 border border-slate-200 rounded font-medium focus:outline-none focus:ring-1 focus:ring-bulog-blue"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-0.5">NIP Lurah</label>
                  <input
                    type="text"
                    value={nipLurah}
                    onChange={(e) => setNipLurah(e.target.value)}
                    placeholder="NIP Lurah"
                    className="w-full px-2 py-1 border border-slate-200 rounded font-mono focus:outline-none focus:ring-1 focus:ring-bulog-blue"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-0.5 text-[11px]">Nama Petugas Posko</label>
                <input
                  type="text"
                  value={namaPetugas}
                  onChange={(e) => setNamaPetugas(e.target.value)}
                  placeholder="Nama Petugas Posko Kelurahan"
                  className="w-full px-2 py-1 border border-slate-200 rounded font-medium text-[11px] focus:outline-none focus:ring-1 focus:ring-bulog-blue"
                />
              </div>
            </div>

            {/* Checklist Kelengkapan Berkas */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 11 12 14 22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                  Checklist Berkas Lampiran
                </p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${checklistCount === 5 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                  {checklistCount}/5 Lengkap
                </span>
              </div>
              <div className="space-y-1 text-[11px] font-medium text-slate-700">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={checkKtpAwal} onChange={(e) => setCheckKtpAwal(e.target.checked)} className="rounded text-bulog-blue" />
                  Fotokopi KTP PBP Awal (Hak)
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={checkKtpPengganti} onChange={(e) => setCheckKtpPengganti(e.target.checked)} className="rounded text-bulog-blue" />
                  Fotokopi KTP Pengganti
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={checkKkPengganti} onChange={(e) => setCheckKkPengganti(e.target.checked)} className="rounded text-bulog-blue" />
                  Fotokopi Kartu Keluarga (KK) Pengganti
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={checkSuratKet} onChange={(e) => setCheckSuratKet(e.target.checked)} className="rounded text-bulog-blue" />
                  Surat Keterangan Kematian / Pindah RT-RW
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={checkMeterai} onChange={(e) => setCheckMeterai(e.target.checked)} className="rounded text-bulog-blue" />
                  Meterai Rp 10.000
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Body cetak (Printable Area) */}
        <div className="p-8 overflow-y-auto font-serif text-slate-900 text-xs leading-relaxed space-y-4 print:p-0 print:text-black">
          {/* Header Surat */}
          <div className="text-center space-y-1 border-b-2 border-black pb-3">
            <h2 className="text-sm font-bold tracking-wide uppercase">SURAT PERTANGGUNGJAWABAN MUTLAK (SPTJM)</h2>
            <h3 className="text-xs font-semibold uppercase">PENERIMAAN BANTUAN PANGAN - CADANGAN BERAS PENGURUSAN (PBP)</h3>
            <p className="text-[10px] italic">PERUM BULOG KANTOR CABANG JAKARTA UTARA</p>
          </div>

          <p className="pt-2">Yang bertanda tangan di bawah ini:</p>

          {/* Form Pengganti */}
          <div className="pl-4 space-y-1.5 font-sans">
            <div className="flex">
              <span className="w-40 font-medium">Nama Lengkap</span>
              <span>: <b>{row.nama_pengganti || "..................................................."}</b></span>
            </div>
            <div className="flex">
              <span className="w-40 font-medium">NIK</span>
              <span>: <b>{row.nik_pengganti || "..................................................."}</b></span>
            </div>
            <div className="flex">
              <span className="w-40 font-medium">Kelurahan Posko</span>
              <span>: <b>{row.kelurahan || poskoAktif}</b></span>
            </div>
            <div className="flex">
              <span className="w-40 font-medium">Status Hubungan</span>
              <span>: Penerima Pengganti (Penggantian Kuota PBP)</span>
            </div>
          </div>

          <p>
            Menyatakan dengan sesungguhnya bahwa saya mengambil Bantuan Pangan Beras sebanyak <b>30 Kg</b> sebagai Pengganti dari Penerima PBP Asli berikut:
          </p>

          {/* Form PBP Asli */}
          <div className="pl-4 space-y-1.5 font-sans bg-slate-50 p-3 rounded-lg border border-slate-200 print:bg-transparent print:border-black">
            <div className="flex">
              <span className="w-40 font-medium">Nama PBP Asli (Hak)</span>
              <span>: <b>{row.nama}</b></span>
            </div>
            <div className="flex">
              <span className="w-40 font-medium">NIK PBP Asli</span>
              <span>: <b>{row.nik}</b></span>
            </div>
            <div className="flex">
              <span className="w-40 font-medium">Alasan Penggantian</span>
              <span>: {row.notes || "Penerima asli Pindah / Meninggal Dunia / Tidak Ditemukan"}</span>
            </div>
          </div>

          <p className="text-justify">
            Demikian Surat Pertanggungjawaban Mutlak ini saya buat dengan sebenarnya tanpa paksaan dari pihak manapun.
            Apabila di kemudian hari data/keterangan yang saya berikan tidak benar, maka saya bersedia dituntut sesuai ketentuan hukum yang berlaku.
          </p>

          {/* Tanda Tangan Section */}
          <div className="pt-6 flex justify-between items-start font-sans text-center">
            <div className="space-y-10">
              <div>
                <p>Mengetahui,</p>
                <p className="font-bold">Lurah / Petugas Posko {row.kelurahan || poskoAktif}</p>
              </div>
              <div className="pt-6">
                <p className="underline font-bold">{namaLurah || namaPetugas || "( ................................................... )"}</p>
                {nipLurah && <p className="text-[10px] text-slate-600 print:text-black">NIP. {nipLurah}</p>}
              </div>
            </div>
            <div className="space-y-4">
              <p>
                Jakarta Utara, {hariIni}
                <br />
                Yang Membuat Pernyataan,
              </p>
              <div className="w-24 h-14 border border-dashed border-slate-400 mx-auto flex items-center justify-center text-[9px] text-slate-400 font-mono print:border-black">
                Meterai
                <br />
                10.000
              </div>
              <p className="underline font-bold">( {row.nama_pengganti || "..................................................."} )</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
