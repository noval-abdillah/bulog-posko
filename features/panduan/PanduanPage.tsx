/**
 * features/panduan/PanduanPage.tsx
 * Halaman Panduan Operasional Sistem Posko Beras PBP Bulog.
 * Didesain khusus secara visual & ramah untuk petugas posko yang belum terbiasa/awam.
 */
"use client";

import { useAppStore } from "@/store/appStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function PanduanPage() {
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const poskoAktif = useAppStore((s) => s.poskoAktif);

  const langkahList = [
    {
      no: 1,
      title: "Memuat Master Acuan & Berkas BAST",
      subtitle: "Acuan Domisili vs Berkas Konkret",
      icon: (
        <svg className="w-5 h-5 text-bulog-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
        </svg>
      ),
      deskripsi:
        "Unggah Excel Master Data 142k (sebagai acuan melacak undangan nyasar & RT/RW) dan Berkas Konkret BAST PDF/Excel (sebagai penyerahan sah yang berisi NIK & Barcode).",
      actionLabel: "Buka Meja Posko",
      targetTab: "posko" as const,
    },
    {
      no: 2,
      title: "Verifikasi Identitas & Layani Warga",
      subtitle: "Pencarian Instan Multi-Mode",
      icon: (
        <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
      deskripsi:
        "Ketik atau scan Barcode BAST 47-digit, NIK 16-digit, No. KK, No. Urut BAST (contoh: 1095), atau Nama warga. Sistem akan menampilkan status kelayakan (VALID, ANOMALI, atau SALAH POSKO).",
      actionLabel: "Mulai Pelayanan",
      targetTab: "posko" as const,
    },
    {
      no: 3,
      title: "Proteksi Ganda 1 KK (Max 30 Kg Beras)",
      subtitle: "1 Kartu Keluarga = Max 1 Alokasi",
      icon: (
        <svg className="w-5 h-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      deskripsi:
        "Jika ada anggota keluarga dari No. KK yang sama sudah mengambil beras 30 Kg di posko mana saja, sistem otomatis memberi peringatan keras (Hard-Stop) untuk mencegah pengambilan ganda.",
      actionLabel: "Cek Anggota KK",
      targetTab: "posko" as const,
    },
    {
      no: 4,
      title: "Pencatatan PBP Pengganti Tertolak Banpang",
      subtitle: "Dokumentasi Penolakan Sistem Web",
      icon: (
        <svg className="w-5 h-5 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      ),
      deskripsi:
        "Jika warga pengganti tidak lolos kriteria saat di-input ke aplikasi Banpang, catat Nama, NIK, dan alasan di tab 'Pengganti Tertolak'. Anda bisa langsung mengekspor daftarnya ke Excel untuk tim audit.",
      actionLabel: "Buka Pengganti Tertolak",
      targetTab: "log" as const,
    },
    {
      no: 5,
      title: "Audit Rekonsiliasi 3-Way & Kirim WA RT",
      subtitle: "Penyandingan Data Posko vs Web Bulog",
      icon: (
        <svg className="w-5 h-5 text-bulog-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
        </svg>
      ),
      deskripsi:
        "Unggah file ekspor Web Bulog (Sudah & Belum Diserahkan). Sistem otomatis menyandingkannya dengan BAST posko. Pilih filter RT lalu klik '💬 Buat Pesan WA RT' untuk mengirim daftar warga yang belum ambil beras ke Ketua RT.",
      actionLabel: "Buka Audit Ekspor",
      targetTab: "audit" as const,
    },
    {
      no: 6,
      title: "Cetak Dokumen & PDF Resmi SPTJM",
      subtitle: "Surat Pertanggungjawaban Mutlak",
      icon: (
        <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
      deskripsi:
        "Untuk kasus PBP Pengganti Non-DTKS, klik 'Cetak Form SPTJM' di tabel audit. Isi nama Lurah/NIP/Petugas, centang checklist berkas (KTP/KK/Meterai), lalu klik 'Unduh PDF Bulog' untuk mendapatkan PDF resmi terisi.",
      actionLabel: "Ke Audit SPTJM",
      targetTab: "audit" as const,
    },
    {
      no: 7,
      title: "Kalkulator & Stok Opname Logistik Beras",
      subtitle: "Hitung Retur Truk & Stok Karung Gudang",
      icon: (
        <svg className="w-5 h-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <line x1="8" y1="6" x2="16" y2="6" />
          <line x1="16" y1="14" x2="16" y2="18" />
          <path d="M16 10h.01M12 10h.01M8 10h.01M12 14h.01M8 14h.01M12 18h.01M8 18h.01" />
        </svg>
      ),
      deskripsi:
        "Klik tombol '🧮 Kalkulator Beras' di baris paling atas (Topbar). Hitung konversi sisa PBP ke Kg/Ton, jumlah karung 10kg/30kg, dan estimasi armada truk retur. Hasilnya bisa disalin langsung ke WhatsApp.",
      actionLabel: "Pelajari Kalkulator",
      targetTab: "dashboard" as const,
    },
  ];

  const faqList = [
    {
      q: "Bagaimana jika NIK warga di Excel terpotong / berubah jadi notasi ilmiah (3.17203E+15)?",
      a: "Sistem Bulog Posko memiliki fitur fixNIK() otomatis. Seluruh NIK & No. KK akan dibersihkan dan dikembalikan ke format 16-digit murni. Hasil ekspor Excel juga dijamin tidak akan pernah berubah jadi E+15.",
    },
    {
      q: "Bagaimana jika lembar BAST kertas terlanjur ditandatangani salah baris (TTD Nyasar)?",
      a: "Warga Asli yang terdaftar di Master/BAST TETAP BERHAK MENERIMA BERAS 30 KG selama statusnya valid di posko. Petugas cukup meminta TTD ulang warga asli di kolom perbaikan BAST.",
    },
    {
      q: "Apakah data antar-posko kelurahan bisa saling menimpa / bertabrakan?",
      a: "Tidak. Sistem menggunakan indeks komposit 'Sesi Posko' ([Kelurahan]_[NoUrut]). No. Urut BAST 1 di Rawa Badak Utara dan No. Urut 1 di Tugu Utara tersimpan secara terisolasi.",
    },
    {
      q: "Apakah aplikasi ini membutuhkan koneksi internet saat melayani warga?",
      a: "Tidak. Seluruh verifikasi, parsing PDF, dan database IndexedDB bekerja 100% di browser lokal Anda tanpa koneksi internet.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Panduan */}
      <div className="bg-gradient-to-r from-bulog-dark via-bulog-blue to-blue-900 text-white rounded-2xl p-6 sm:p-8 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-amber-300 text-xs font-bold">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              Panduan Panduan Operasional Posko
            </div>
            <h1 className="text-xl sm:text-2xl font-black leading-tight">Petunjuk Penggunaan Sistem Posko PBP Bulog</h1>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
              Panduan langkah demi langkah untuk petugas lapangan dalam melayani warga, memverifikasi kuota beras 30 Kg, mencatat PBP pengganti tertolak, hingga melakukan rekonsiliasi data audit.
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2">
            <Badge variant="info">Posko Aktif: {poskoAktif}</Badge>
            <Button variant="success" size="sm" onClick={() => setActiveTab("posko")}>
              Mulai Pakai Posko →
            </Button>
          </div>
        </div>
      </div>

      {/* Grid 7 Langkah Operasional */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-bulog-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          7 Langkah Mudah Operasional Posko
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {langkahList.map((item) => (
            <Card key={item.no} className="flex flex-col justify-between space-y-4 hover:border-bulog-blue/40 transition">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center font-black text-xs text-bulog-blue">
                    #{item.no}
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">{item.icon}</div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                  <p className="text-[11px] font-semibold text-bulog-blue mt-0.5">{item.subtitle}</p>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{item.deskripsi}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <Button variant="secondary" size="sm" className="w-full text-xs" onClick={() => setActiveTab(item.targetTab)}>
                  {item.actionLabel} →
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Pusat FAQ & Solusi Kendala Lapangan */}
      <Card noPadding>
        <div className="p-5 border-b border-slate-100 bg-slate-50/70">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <svg className="w-4 h-4 text-bulog-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Tanya Jawab &amp; Solusi Kendala Lapangan (FAQ)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Pertanyaan umum yang sering ditemui petugas saat bertugas di posko kelurahan</p>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {faqList.map((faq, idx) => (
            <div key={idx} className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
              <p className="text-xs font-bold text-slate-900 flex items-start gap-1.5">
                <span className="text-bulog-blue font-black flex-shrink-0">Q:</span>
                {faq.q}
              </p>
              <p className="text-xs text-slate-600 leading-relaxed pl-5">{faq.a}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
