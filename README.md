# 🏛️ Sistem Posko Verifikasi, Audit, & Rekonsiliasi Bansos PBP - Perum BULOG

[![Next.js](https://img.shields.io/badge/Next.js-16.3.4-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime%20Auth-emerald?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**`bulog-posko`** adalah aplikasi ERP operasional lapangan berbasis web (*Hybrid Client-Side & Cloud Real-Time*) yang dirancang khusus untuk mempermudah, mempercepat, dan menjamin ketepatan penyaluran Bantuan Pangan Beras (PBP) 30 Kg per Keluarga Penerima Manfaat (KPM) di tingkat posko kelurahan.

Sistem ini digunakan oleh Petugas Posko Kelurahan & Supervisor Perum BULOG Kantor Cabang Jakarta Utara yang membawahi **31 Kelurahan di 6 Kecamatan** (Koja, Cilincing, Kelapa Gading, Pademangan, Penjaringan, Tanjung Priok).

---

## 🌟 Keunggulan Utama & Fitur Unggulan

- **🔐 Autentikasi Akses & Isolasi Ruang Kerja (Workspace Isolation):** Terproteksi oleh 33 Akun Resmi (31 Kelurahan + 1 Supervisor Pusat + 1 Admin) via Supabase Auth & Row Level Security (RLS). Data tiap posko kelurahan terisolasi ketat.
- **💬 Chat Real-Time Multi-Device Antar Posko:** Komunikasi instan antar-perangkat via WebSocket Supabase Realtime dengan visual badge per kecamatan dan filter jenis pesan (💬 Normal, ⚠️ Peringatan, ℹ️ Info).
- **📄 Ekstraksi Presisi PDF BAST & RT/RW Cerdas:** Parser PDF yang mengekstrak NIK 16-digit, No. KK 16-digit, No. Urut Undangan, serta mendeteksi berbagai format penulisan RT/RW (`RT 005/RW 003`, `RT.05 RW.03`, `05/03`) dari berkas BAST PDF.
- **⚡ Triple-Match 3-Way Engine & Smart Sorting:** Menandingkan Master Data (142k DTKS), BAST/Log Posko, dan 2 file ekspor resmi Web Bulog (*Sudah* & *Belum Diserahkan*). Sisa PBP diurutkan berdasarkan **No. Urut Undangan BAST**.
- **📱 Generator WhatsApp Reminder Pintar:** Menyusun draft pengingat WA per RT/RW dan **Rekapitulasi Semua RT/RW** (termasuk warga berstatus `RT — / RW —` belum teridentifikasi) dengan switcher wilayah langsung di dalam modal.
- **🧾 Generator Dokumen SPTJM & PDF Overlay Resmi:** Pembuatan form SPTJM PBP Pengganti siap cetak (HTML/CSS) dan PDF resmi terisi (`/SPTJM-Pengganti.pdf` via *pdf-lib*).
- **📊 Laporan Excel Korporat Berwarna (ExcelJS Engine):** Ekspor Excel (`.xlsx`) profesional dengan Kop BULOG Navy/Blue, auto-fit width, zebra striping, dan format NIK/KK murni teks (anti-`3.17203E+15`).
- **📦 Web Worker Background Engine:** Memproses pembacaan Excel Master 142.000 baris di background thread tanpa membuat UI freeze.

---

## 🛠️ Stack Teknis

- **Web Framework:** [Next.js 16.3.4](https://nextjs.org/) (App Router & Turbopack)
- **UI Library & Styling:** [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/) (Custom BULOG Navy/Blue Theme `#0B3B73`, `#07264B`)
- **Language:** [TypeScript 5](https://www.typescriptlang.org/)
- **Cloud Backend & Realtime:** [Supabase](https://supabase.com/) (Auth, PostgreSQL, Realtime WebSocket)
- **State Management:** [Zustand 5](https://zustand-demo.pmnd.rs/) (dengan IndexedDB Persistent Storage `BulogPoskoDB` v2)
- **Document Processors:** `exceljs`, `xlsx` (SheetJS), `pdf-lib`, `pdfjs-dist`

---

## 🚀 Panduan Memulai (Getting Started)

### 1. Prasyarat
- Node.js versi `18.x` atau lebih baru
- npm / yarn / pnpm

### 2. Instalasi Proyek
```bash
# Clone repository
git clone https://github.com/noval-abdillah/bulog-posko.git

# Masuk ke direktori proyek
cd bulog-posko

# Install dependensi
npm install
```

### 3. Konfigurasi Environment Variables
Buat file `.env.local` di root proyek dan tambahkan kredensial Supabase Anda:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Setup Database Supabase
Jalankan skrip SQL pembuat tabel `chat_posko` di dashboard Supabase Anda (SQL Editor).

### 5. Menjalankan Server Development
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) pada browser Anda.

---

## 🔐 Akun Login Posko Kelurahan

| Peran | Wilayah | Format Email Login | Hak Akses |
|---|---|---|---|
| Petugas Kelurahan | 31 Kelurahan Jakut | `kelurahan.[namakelurahan]@bulog-jakut.id` | Terisolasi per Kelurahan |
| Supervisor Pusat | Kota Jakarta Utara | `supervisor@bulog-jakut.id` | Akses Seluruh 31 Posko |

---

## 🌐 Deploy ke Vercel

1. Push repository ke GitHub.
2. Import repository di [Vercel Dashboard](https://vercel.com/new).
3. Tambahkan **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Klik **Deploy**.

---

## 👨‍💻 Pengembang

Dikembangkan oleh **Noval Abdillah**  
*Perum BULOG — Sistem Posko Verifikasi & Audit Bansos PBP Kota Jakarta Utara*

---

## 📜 Lisensi

Proyek ini dilesensikan di bawah [MIT License](LICENSE).
