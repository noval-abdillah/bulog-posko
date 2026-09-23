/**
 * features/panduan/PanduanPage.tsx
 * Pusat panduan operasional per fitur untuk petugas posko Bulog.
 */
"use client";

import { useState } from "react";
import { useAppStore } from "@/store/appStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { ActiveTab } from "@/types";

type KategoriPanduan = "Semua" | "Dashboard" | "Meja Posko" | "Audit" | "AI" | "Chat" | "Pengganti" | "Data Bermasalah" | "Akun";

interface PanduanFitur {
  kategori: Exclude<KategoriPanduan, "Semua">;
  title: string;
  lokasi: string;
  kapan: string;
  langkah: string[];
  hasil: string;
  catatan: string;
  targetTab: ActiveTab;
}

const kategoriList: KategoriPanduan[] = ["Semua", "Dashboard", "Meja Posko", "Audit", "AI", "Chat", "Pengganti", "Data Bermasalah", "Akun"];

const iconByKategori: Record<Exclude<KategoriPanduan, "Semua">, React.ReactNode> = {
  Dashboard: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  "Meja Posko": <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>,
  Audit: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>,
  AI: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="7" width="14" height="12" rx="2"/><path d="M12 7V4M8 11h.01M16 11h.01M9 15h6"/></svg>,
  Chat: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>,
  Pengganti: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  "Data Bermasalah": <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Akun: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
};

export default function PanduanPage() {
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const poskoAktif = useAppStore((s) => s.poskoAktif);
  const [kategoriAktif, setKategoriAktif] = useState<KategoriPanduan>("Semua");

  const alurCepat = [
    "Login dan pastikan Posko Aktif sudah sesuai.",
    "Masuk Meja Posko, unggah Master Data 142k dan BAST PDF/Excel.",
    "Layani warga dengan scan barcode, NIK, nama, no urut, atau AI OCR KTP.",
    "Catat hasil pelayanan dan pengganti tertolak bila ada kasus Banpang.",
    "Unggah File 1 dan File 2 Web Bulog di Audit Ekspor untuk rekonsiliasi.",
    "Tandai Fisik BAST, kirim pesan WA RT/RW, cetak SPTJM, lalu pantau Dashboard.",
  ];

  const panduanFiturList: PanduanFitur[] = [
    {
      kategori: "Dashboard",
      title: "Membaca Ringkasan Dashboard",
      lokasi: "Menu Dashboard",
      kapan: "Dipakai saat supervisor atau petugas ingin melihat kondisi posko secara cepat.",
      langkah: ["Buka menu Dashboard.", "Lihat kartu Master Data, BAST Termuat, Pengganti Tertolak, Anomali, dan Terverifikasi Fisik BAST.", "Gunakan tombol Mulai Pelayanan untuk langsung menuju Meja Posko."],
      hasil: "Petugas tahu data apa yang sudah siap, berapa kasus penting, dan apakah audit fisik sudah berjalan.",
      catatan: "Angka Terverifikasi Fisik BAST berasal dari fitur Tandai Fisik di Audit Ekspor.",
      targetTab: "dashboard",
    },
    {
      kategori: "Dashboard",
      title: "Kalkulator Beras dan Retur Logistik",
      lokasi: "Topbar, tombol Kalkulator Beras",
      kapan: "Dipakai untuk menghitung sisa PBP menjadi kilogram, ton, karung 10 kg/30 kg, dan estimasi armada retur.",
      langkah: ["Klik Kalkulator Beras di bagian atas aplikasi.", "Pilih mode Sisa PBP ke Volume Beras atau Stok Karung ke Jatah PBP.", "Isi angka atau tarik sisa posko bila tersedia.", "Salin ringkasan untuk laporan WhatsApp."],
      hasil: "Petugas mendapat hitungan logistik siap salin tanpa rumus manual.",
      catatan: "Hitungan 1 PBP menggunakan alokasi 30 kg beras.",
      targetTab: "dashboard",
    },
    {
      kategori: "Meja Posko",
      title: "Unggah Master Data 142k",
      lokasi: "Menu Meja Posko, panel Upload",
      kapan: "Wajib dilakukan agar sistem bisa mencocokkan warga dengan acuan DTKS/master wilayah.",
      langkah: ["Buka Meja Posko.", "Unggah Excel Master Data 142k.", "Tunggu proses indeks NIK, nama, dan No. KK selesai.", "Pastikan kartu Dashboard menampilkan Master Data Terindeks."],
      hasil: "Pencarian NIK, nama, No. KK, dan deteksi wilayah bisa berjalan.",
      catatan: "Sistem otomatis memperbaiki format NIK Excel yang berubah menjadi notasi ilmiah.",
      targetTab: "posko",
    },
    {
      kategori: "Meja Posko",
      title: "Unggah BAST PDF atau Excel",
      lokasi: "Menu Meja Posko, panel Upload",
      kapan: "Dipakai untuk memuat daftar undangan fisik, barcode, no urut BAST, NIK, dan RT/RW.",
      langkah: ["Buka Meja Posko.", "Unggah file BAST PDF atau Excel sesuai kelurahan.", "Tunggu parsing sampai selesai.", "Cek jumlah Penerima BAST Termuat di Dashboard."],
      hasil: "Barcode dan No. Urut BAST bisa dipakai untuk pencarian instan.",
      catatan: "Untuk super user, pastikan Posko Aktif sesuai sebelum upload agar data tidak salah kelurahan.",
      targetTab: "posko",
    },
    {
      kategori: "Meja Posko",
      title: "Cari dan Verifikasi Warga",
      lokasi: "Menu Meja Posko, kolom Pencarian & Scan Barcode",
      kapan: "Dipakai saat warga datang ke meja pelayanan.",
      langkah: ["Scan barcode BAST atau ketik NIK, nama, no urut, atau No. KK.", "Tekan Enter atau tombol Cek Data.", "Baca hasil verifikasi: valid, salah posko, anomali, atau tidak ditemukan.", "Ikuti rekomendasi sistem sebelum menyerahkan beras."],
      hasil: "Petugas mendapat keputusan pelayanan lebih cepat dan konsisten.",
      catatan: "Jika data tidak ditemukan, gunakan AI Deep Match Typo untuk mencari kemungkinan salah ketik nama.",
      targetTab: "posko",
    },
    {
      kategori: "Meja Posko",
      title: "AI OCR KTP, KK, dan BAST",
      lokasi: "Menu Meja Posko, tombol AI OCR KTP",
      kapan: "Dipakai saat petugas ingin membaca foto KTP/KK/BAST tanpa mengetik manual.",
      langkah: ["Klik AI OCR KTP.", "Ambil foto KTP, KK, atau BAST dengan kamera.", "Tunggu AI membaca NIK, nama, alamat, RT/RW, dan No. KK.", "Jika NIK valid 16 digit, sistem otomatis menjalankan pencarian."],
      hasil: "Pencarian warga bisa langsung berjalan dari hasil foto dokumen.",
      catatan: "Pastikan foto terang, tidak blur, dan seluruh NIK terlihat jelas.",
      targetTab: "posko",
    },
    {
      kategori: "Meja Posko",
      title: "Proteksi Ganda 1 KK",
      lokasi: "Menu Meja Posko, bagian hasil verifikasi keluarga",
      kapan: "Dipakai otomatis saat ada anggota keluarga dengan No. KK yang sama.",
      langkah: ["Cari warga seperti biasa.", "Buka panel keluarga 1 KK pada hasil verifikasi.", "Jika sudah ada anggota KK yang salur, sistem menampilkan peringatan hard-stop.", "Jangan lakukan penyerahan ganda untuk No. KK yang sama."],
      hasil: "Pengambilan beras dobel dalam satu Kartu Keluarga dapat dicegah.",
      catatan: "Aturan sistem: 1 KK maksimal 1 kuota 30 kg.",
      targetTab: "posko",
    },
    {
      kategori: "AI",
      title: "AI Copilot Posko",
      lokasi: "Tombol AI Copilot mengambang di kanan bawah",
      kapan: "Dipakai untuk bertanya SOP, sisa PBP, undangan nyasar, kurang foto, dan audit cepat.",
      langkah: ["Klik tombol AI Copilot.", "Pilih chip cepat atau ketik pertanyaan.", "Baca jawaban AI.", "Jika muncul tombol Buka di Meja Posko, klik untuk langsung membuka data warga."],
      hasil: "Petugas bisa menelusuri data dan SOP tanpa membuka banyak menu manual.",
      catatan: "AI memakai endpoint 9router yang sudah ditanam di server, jadi petugas tidak perlu mengatur key.",
      targetTab: "dashboard",
    },
    {
      kategori: "AI",
      title: "Tombol Buka di Meja Posko dari AI",
      lokasi: "Jawaban AI Copilot",
      kapan: "Muncul ketika AI menyebut warga spesifik dari daftar BAST atau audit.",
      langkah: ["Minta AI tampilkan warga belum ambil, kurang foto, atau undangan nyasar.", "Cari tombol hijau Buka di Meja Posko pada tiap warga.", "Klik tombol tersebut.", "Sistem pindah ke Meja Posko dan menjalankan pencarian otomatis."],
      hasil: "Warga yang disebut AI bisa langsung diverifikasi di meja pelayanan.",
      catatan: "Jika tombol tidak muncul, kirim ulang pertanyaan dengan instruksi tampilkan per warga beserta tombol aksi.",
      targetTab: "posko",
    },
    {
      kategori: "Audit",
      title: "Upload File 1 dan File 2 Web Bulog",
      lokasi: "Menu Audit Ekspor, panel Unggah 2 File Ekspor Resmi",
      kapan: "Dipakai setelah petugas menarik data Sudah Diserahkan dan Belum Diserahkan dari Web Bulog.",
      langkah: ["Buka Audit Ekspor.", "Upload File 1 Sudah Diserahkan.", "Upload File 2 Belum Diserahkan.", "Pastikan riwayat unggahan muncul dan jumlah baris terbaca."],
      hasil: "Sistem bisa membandingkan Web Bulog, BAST fisik, log posko, dan Master 142k.",
      catatan: "File 1 dan File 2 sebaiknya berasal dari tanggal tarik data yang sama.",
      targetTab: "audit",
    },
    {
      kategori: "Audit",
      title: "Rekonsiliasi Selisih 3-Way",
      lokasi: "Menu Audit Ekspor, tab Selisih 3-Way",
      kapan: "Dipakai untuk mencari tunggu input web, belum ambil, human error BAST, potensi TTD nyasar, dan match lengkap.",
      langkah: ["Upload data Web Bulog dan BAST.", "Buka tab Selisih 3-Way.", "Gunakan filter kategori dan filter RT/RW.", "Ekspor daftar khusus bila perlu ditindaklanjuti."],
      hasil: "Petugas mendapat daftar selisih operasional yang bisa ditindaklanjuti.",
      catatan: "Master Data 142k menjadi acuan utama untuk wilayah dan identitas.",
      targetTab: "audit",
    },
    {
      kategori: "Audit",
      title: "Tandai Fisik BAST",
      lokasi: "Menu Audit Ekspor, tab Audit BAST Fisik",
      kapan: "Dipakai setelah petugas memeriksa BAST kertas atau status fisik penyerahan.",
      langkah: ["Buka Audit Ekspor lalu tab Audit BAST Fisik.", "Klik Tandai Fisik pada baris warga.", "Status berganti dari Terverifikasi, Perlu Ditinjau, Ketidaksesuaian, lalu batal.", "Lihat rekapnya di Dashboard pada kartu Terverifikasi Fisik BAST."],
      hasil: "Dashboard menampilkan progres pemeriksaan BAST fisik.",
      catatan: "Penanda disimpan per posko di browser lokal dan ikut masuk ke rekap Dashboard.",
      targetTab: "audit",
    },
    {
      kategori: "Audit",
      title: "Buat Pesan WA RT/RW",
      lokasi: "Menu Audit Ekspor, tombol Buat Pesan WA",
      kapan: "Dipakai untuk mengirim daftar warga belum ambil kepada Ketua RT/RW atau pengurus wilayah.",
      langkah: ["Buka tab Selisih 3-Way.", "Filter RT/RW jika ingin wilayah tertentu.", "Klik Buat Pesan WA.", "Pilih target, salin pesan, atau kirim via WA Web."],
      hasil: "Pesan pengingat warga belum ambil siap kirim dengan format rapi.",
      catatan: "Gunakan AI Personalize Pesan jika ingin gaya bahasa lebih formal, santun, atau urgen.",
      targetTab: "audit",
    },
    {
      kategori: "Audit",
      title: "Cetak SPTJM Pengganti",
      lokasi: "Menu Audit Ekspor, tombol Cetak Form SPTJM",
      kapan: "Dipakai untuk kasus pengganti non-DTKS, NIK pengganti kosong, atau kebutuhan administrasi pertanggungjawaban.",
      langkah: ["Temukan baris rekomendasi SPTJM di Audit.", "Klik Cetak Form SPTJM.", "Isi nama lurah, NIP, petugas, dan checklist berkas.", "Unduh PDF resmi atau cetak dokumen."],
      hasil: "Dokumen SPTJM siap ditandatangani dan diarsipkan.",
      catatan: "Pastikan KTP, KK, meterai, dan dokumen pendukung sudah diverifikasi fisik.",
      targetTab: "audit",
    },
    {
      kategori: "Pengganti",
      title: "Catat PBP Pengganti Tertolak Banpang",
      lokasi: "Menu Pengganti Tertolak",
      kapan: "Dipakai ketika pengganti gagal diinput atau ditolak oleh aplikasi Banpang.",
      langkah: ["Buka menu Pengganti Tertolak.", "Isi nama, NIK, posko, dan alasan penolakan.", "Simpan catatan.", "Ekspor Excel jika diminta tim audit."],
      hasil: "Kasus pengganti tertolak terdokumentasi dan muncul di Dashboard.",
      catatan: "Catatan ini tidak otomatis berarti warga berhak atau tidak berhak, tetap ikuti keputusan supervisor.",
      targetTab: "log",
    },
    {
      kategori: "Chat",
      title: "Chat Koordinasi Antar Posko",
      lokasi: "Menu Chat Posko",
      kapan: "Dipakai untuk koordinasi cepat antar kelurahan dan supervisor.",
      langkah: ["Buka Chat Posko.", "Pilih filter kecamatan atau tipe pesan jika perlu.", "Tulis pesan normal, peringatan, atau informasi.", "Pantau badge unread di sidebar."],
      hasil: "Informasi lapangan bisa dibagikan tanpa keluar dari aplikasi.",
      catatan: "Gunakan tipe Peringatan hanya untuk informasi penting yang perlu segera dibaca.",
      targetTab: "chat",
    },
    {
      kategori: "Data Bermasalah",
      title: "Pelacakan Data Bermasalah",
      lokasi: "Menu Data Bermasalah",
      kapan: "Dipakai untuk memantau masalah impor, NIK invalid, struktur file rusak, duplikat, atau data yang perlu verifikasi manual.",
      langkah: ["Buka Data Bermasalah.", "Lihat daftar masalah yang dicatat sistem.", "Gunakan sumber file dan baris/page untuk menelusuri data asal.", "Perbaiki file sumber bila diperlukan."],
      hasil: "Petugas tahu kenapa sebagian data tidak terbaca atau perlu pengecekan manual.",
      catatan: "Jika modul dalam pemeliharaan, gunakan informasi masalah dari toast/import report terlebih dahulu.",
      targetTab: "audit",
    },
    {
      kategori: "Akun",
      title: "Posko Aktif dan Super User",
      lokasi: "Sidebar bagian bawah",
      kapan: "Dipakai untuk memastikan pekerjaan dilakukan pada kelurahan yang benar.",
      langkah: ["Lihat nama Posko Aktif di sidebar atau header Dashboard.", "Jika akun super user, pilih kelurahan dari dropdown Posko Aktif.", "Pastikan pilihan benar sebelum upload BAST, audit, atau melayani warga.", "Klik tombol keluar untuk logout setelah selesai."],
      hasil: "Data upload dan pelayanan tidak tercampur antar kelurahan.",
      catatan: "Petugas non-super tidak perlu memilih posko karena otomatis mengikuti akun login.",
      targetTab: "dashboard",
    },
  ];

  const faqList = [
    {
      q: "Bagaimana jika NIK warga di Excel terpotong atau berubah jadi notasi ilmiah?",
      a: "Sistem otomatis menjalankan sanitasi NIK dan No. KK agar kembali menjadi angka murni 16 digit selama digit sumber masih cukup terbaca.",
    },
    {
      q: "Kenapa tombol Buka di Meja Posko dari AI tidak muncul?",
      a: "Tombol muncul jika jawaban AI menyertakan tag aksi warga. Kirim ulang pertanyaan dengan format daftar per warga, misalnya tampilkan warga belum ambil beserta tombol aksi.",
    },
    {
      q: "Kenapa hasil Tandai Fisik belum terlihat di Dashboard?",
      a: "Pastikan Anda menandai data di Audit Ekspor pada posko yang sama. Dashboard membaca penanda dari Posko Aktif dan localStorage browser yang sama.",
    },
    {
      q: "Apa beda File 1 dan File 2 Web Bulog?",
      a: "File 1 berisi data Sudah Diserahkan, sedangkan File 2 berisi Belum Diserahkan. Keduanya dipakai bersama untuk rekonsiliasi 3-way.",
    },
    {
      q: "Kapan harus cetak SPTJM?",
      a: "Cetak SPTJM saat ada kasus pengganti yang membutuhkan pertanggungjawaban administrasi, terutama pengganti non-DTKS, NIK pengganti kosong, atau instruksi supervisor.",
    },
    {
      q: "Apakah AI perlu petugas mengisi API Key?",
      a: "Tidak. Endpoint, model, dan key 9router sudah ditanam di server route aplikasi. Petugas cukup memakai tombol AI yang tersedia.",
    },
  ];

  const filteredPanduan = kategoriAktif === "Semua"
    ? panduanFiturList
    : panduanFiturList.filter((item) => item.kategori === kategoriAktif);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-bulog-dark via-bulog-blue to-blue-900 text-white rounded-2xl p-6 sm:p-8 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-amber-300 text-xs font-bold">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              Pusat Panduan Operasional
            </div>
            <h1 className="text-xl sm:text-2xl font-black leading-tight">Panduan Lengkap Semua Fitur Sistem Posko PBP Bulog</h1>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
              Setiap fitur dijelaskan terpisah: lokasi menu, kapan dipakai, langkah penggunaan, hasil yang diharapkan, dan catatan penting untuk petugas lapangan.
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2">
            <Badge variant="info">Posko Aktif: {poskoAktif}</Badge>
            <Button variant="success" size="sm" onClick={() => setActiveTab("posko")}>
              Mulai Pakai Posko
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-bulog-blue/10 text-bulog-blue flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Alur Cepat Operasional Harian</h2>
            <p className="text-xs text-slate-500 mt-0.5">Urutan kerja singkat dari awal buka posko sampai audit akhir.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {alurCepat.map((step, idx) => (
            <div key={step} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-bulog-blue text-white text-[11px] font-black flex items-center justify-center flex-shrink-0">{idx + 1}</span>
              <p className="text-xs font-medium text-slate-700 leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Panduan Lengkap Per Fitur</h2>
            <p className="text-xs text-slate-500 mt-0.5">Pilih modul untuk melihat panduan fitur yang relevan.</p>
          </div>
          <Badge variant="neutral">{filteredPanduan.length} panduan tampil</Badge>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {kategoriList.map((kategori) => (
            <button
              key={kategori}
              onClick={() => setKategoriAktif(kategori)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border whitespace-nowrap transition touch-manipulation ${
                kategoriAktif === kategori
                  ? "bg-bulog-blue text-white border-bulog-blue shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:border-bulog-blue/40"
              }`}
            >
              {kategori}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredPanduan.map((item, idx) => (
            <Card key={`${item.kategori}-${item.title}`} className="space-y-4 hover:border-bulog-blue/40 transition">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-bulog-blue flex items-center justify-center flex-shrink-0">
                    {iconByKategori[item.kategori]}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="info">{item.kategori}</Badge>
                      <span className="text-[10px] text-slate-400 font-mono">#{idx + 1}</span>
                    </div>
                    <h3 className="text-sm font-black text-slate-900 mt-1">{item.title}</h3>
                    <p className="text-[11px] text-bulog-blue font-bold mt-0.5">Lokasi: {item.lokasi}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <p className="font-black text-slate-700 mb-1">Kapan Dipakai</p>
                  <p className="text-slate-600 leading-relaxed">{item.kapan}</p>
                </div>
                <div>
                  <p className="font-black text-slate-700 mb-1">Langkah Penggunaan</p>
                  <ol className="space-y-1.5">
                    {item.langkah.map((step, stepIdx) => (
                      <li key={step} className="flex gap-2 text-slate-600 leading-relaxed">
                        <span className="font-black text-bulog-blue flex-shrink-0">{stepIdx + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                    <p className="font-black text-emerald-900 mb-1">Hasil</p>
                    <p className="text-emerald-800 leading-relaxed">{item.hasil}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <p className="font-black text-amber-900 mb-1">Catatan</p>
                    <p className="text-amber-800 leading-relaxed">{item.catatan}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <Button variant="secondary" size="sm" className="w-full text-xs" onClick={() => setActiveTab(item.targetTab)}>
                  Buka Menu Terkait
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Card noPadding>
        <div className="p-5 border-b border-slate-100 bg-slate-50/70">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <svg className="w-4 h-4 text-bulog-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Tanya Jawab &amp; Solusi Kendala Lapangan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Pertanyaan yang sering muncul saat pelayanan, audit, dan penggunaan AI.</p>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {faqList.map((faq) => (
            <div key={faq.q} className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
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
