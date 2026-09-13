# Product Requirement Document (PRD)
## Sistem Posko Verifikasi, Audit, & Rekonsiliasi Bansos PBP - Perum BULOG

---

### 1. Ringkasan Produk

* **Nama Sistem:** `bulog-posko` (Sistem Posko Verifikasi, Audit, & Rekonsiliasi Bansos PBP - Perum BULOG)
* **Versi Sistem:** `1.0.0` (Production Ready — Hybrid Offline ERP & Cloud Real-Time)
* **Pengembang:** Noval Abdillah
* **Masalah yang Dipecahkan:** 
  Penyaluran Bantuan Pangan Beras (PBP) sebanyak 30 Kg per Keluarga Penerima Manfaat (KPM) di tingkat posko kelurahan sering menghadapi kendala operasional seperti lambatnya verifikasi identitas di meja posko, risiko penyaluran ganda dalam 1 Kartu Keluarga (KK), kesalahan penulisan/tanda tangan pada berkas BAST kertas (*TTD Nyasar*), serta selisih data antara fisik penyerahan di lapangan dengan laporan ekspor Web Bulog Banpang.
  
  Sistem **bulog-posko v1.0.0** hadir sebagai aplikasi ERP operasional lapangan berbasis web (*hybrid client-side & cloud real-time*) yang memungkinkan petugas verifikasi bekerja dengan cepat, akurat, aman, dan terisolasi per posko kelurahan. Sistem ini mendukung pencarian instan multi-mode (Barcode BAST 47 digit, NIK 16 digit, No. KK 16 digit, No. Urut BAST, Nama), proteksi ganda 1 KK max 1 kali salur, pencatatan PBP Pengganti Tertolak Banpang, rekonsiliasi data 3 arah (*Triple-Match Engine*), otomatisasi pembuatan dokumen SPTJM (Surat Pertanggungjawaban Mutlak), kalkulator logistik beras, hingga **Chat Koordinasi Real-Time Multi-Device Antar Posko** dan **Autentikasi Akses Terisolasi per Kelurahan**.

* **Pengguna Utama (Target User):** Petugas Posko Kelurahan / Field Officer & Supervisor Perum BULOG Kantor Cabang Jakarta Utara yang membawahi **31 Kelurahan di 6 Kecamatan** (Koja, Cilincing, Kelapa Gading, Pademangan, Penjaringan, Tanjung Priok).

---

### 2. Keunggulan Utama & Fitur Unggulan

1. **🔐 Autentikasi Akses & Isolasi Ruang Kerja (Workspace Isolation):**
   Terproteksi oleh **33 Akun Resmi** (31 Kelurahan + 1 Supervisor Pusat + 1 Admin) menggunakan Supabase Auth & Row Level Security (RLS). Setiap posko kelurahan memiliki ruang kerja data yang terisolasi ketat sehingga data BAST dan audit tidak bercampur antar kelurahan.

2. **💬 Chat Koordinasi Real-Time Multi-Device Antar Posko:**
   Fasilitas komunikasi instan antar-perangkat via WebSocket Supabase Realtime dengan visual badge per kecamatan, penanda tipe pesan (💬 Normal, ⚠️ Peringatan, ℹ️ Informasi), filter kecamatan, dan notifikasi pesan belum dibaca.

3. **📄 Ekstraksi Presisi PDF BAST & RT/RW Cerdas:**
   Parser PDF cerdas yang mengekstrak NIK 16-digit, No. KK 16-digit, No. Urut Undangan, serta mendeteksi berbagai format penulisan RT/RW (seperti `RT 005/RW 003`, `RT.05 RW.03`, `RT/RW 05/03`, `05/03`) langsung dari dokumen BAST PDF resmi.

4. **⚡ Triple-Match 3-Way Engine & Smart Sorting No. Urut BAST:**
   Menandingkan Master Data (142k DTKS), berkas BAST/Log Posko Fisik, dan 2 file ekspor resmi Web Bulog (*Sudah Diserahkan* & *Belum Diserahkan*). Mengurutkan sisa PBP belum ambil secara presisi berdasarkan **No. Urut Undangan BAST (1, 2, 3... 1095)**.

5. **📱 Generator WhatsApp Reminder RT/RW Pintar:**
   Penyusun draft pesan pengingat WA per RT/RW dan **Rekapitulasi Semua RT/RW** (termasuk warga berstatus `RT — / RW —` yang belum teridentifikasi) lengkap dengan switcher wilayah langsung di dalam modal modal generator.

6. **🧾 Generator Dokumen SPTJM & PDF Overlay Resmi:**
   Pembuatan form SPTJM PBP Pengganti siap cetak (HTML/CSS) dan ekspor PDF resmi terisi (`/SPTJM-Pengganti.pdf` via *pdf-lib*).

7. **📊 Laporan Excel Korporat Berwarna (ExcelJS Engine):**
   Ekspor berkas Excel (`.xlsx`) profesional dengan Kop Resmi BULOG Navy/Blue, auto-fit width, zebra striping, highlight status otomatis, dan format NIK/KK murni teks (anti-notasi eksponen `3.17203E+15`).

---

### 3. Tujuan & Non-Tujuan

#### Tujuan (In-Scope)
1. **Verifikasi Instan di Meja Posko:** Memvalidasi kelayakan penerima beras 30 Kg dalam hitungan detik dengan prioritas data BAST PDF posko aktif.
2. **Proteksi Penyaluran Ganda (1 KK Max 1 Kali Salur):** Mencegah penyaluran beras lebih dari 1 kali kepada anggota keluarga dalam Kartu Keluarga yang sama.
3. **Pencatatan PBP Pengganti Tertolak Banpang:** Menyediakan modul khusus untuk menginput dan mengekspor daftar PBP Pengganti yang tidak memenuhi kriteria/tertolak di sistem Banpang untuk diserahkan ke tim audit.
4. **Rekonsiliasi Selisih 3-Way (Triple Match Engine):** Menandingkan data Master (DTKS 142k), berkas BAST/Log Posko, dan 2 file ekspor resmi Web Bulog (*Sudah Diserahkan* & *Belum Diserahkan*) untuk mengelompokkan 5 kategori selisih.
5. **Chat Real-Time Multi-Device:** Menghubungkan seluruh petugas posko se-Jakarta Utara untuk koordinasi lapangan instan.
6. **Otomatisasi Dokumen SPTJM:** Menghasilkan dokumen SPTJM siap cetak (HTML/CSS) dan file PDF resmi terisi.
7. **Kalkulator & Stok Opname Logistik Beras:** Menyediakan alat bantu hitung instan untuk konversi Sisa PBP ke Volume Beras (Kg/Ton), Karung (10kg/30kg), estimasi armada truk retur, serta stok opname fisik gudang posko.

#### Non-Tujuan (Out-of-Scope)
1. **Tidak Ada Sinkronisasi Online Otomatis ke Web Banpang:** Aplikasi bekerja berbasis impor-ekspor file Excel/PDF manual (spesifikasi API online dicatat terpisah pada `KEBUTUHAN_INTEGRASI_BULOG.md` untuk pengembangan masa depan).

---

### 4. Peran Pengguna (User Roles)

1. **Petugas Posko Kelurahan (31 Akun Kelurahan)**
   * **Wewenang & Hak Akses:**
     * Memuat & mengelola Master Data 142k (Excel) dan Berkas BAST (PDF/Excel) khusus kelurahannya.
     * Mengakses Meja Posko untuk verifikasi identitas warga.
     * Menandai status "Selesai Salur (30 Kg)" atau "Alihkan Pengaduan".
     * Menginput data PBP Pengganti Tertolak Banpang dan mengekspor daftarnya ke Excel.
     * Mengirim dan menerima pesan di tab Chat Koordinasi Antar Posko secara real-time.
     * Men-generate draft pesan reminder WhatsApp ke Ketua RT per wilayah.
     * Mengunduh & mencetak berkas SPTJM tunggal (PDF) maupun massal (Excel).

2. **Supervisor Pusat (1 Akun Supervisor)**
   * **Wewenang & Hak Akses:**
     * Memiliki seluruh hak akses Petugas Posko Kelurahan.
     * Bebas memilih dan beralih Posko Aktif di antara 31 kelurahan se-Jakarta Utara via dropdown Sidebar.
     * Memantau ringkasan realisasi dan audit trail seluruh kelurahan.
     * Mengirim pesan instruksi bertipe ⚠️ *Peringatan* atau ℹ️ *Informasi* ke seluruh posko via Chat.

---

### 5. Struktur Wilayah Operasional (31 Kelurahan / 6 Kecamatan)

| No | Kecamatan | Daftar Kelurahan Pembawaan Akun Posko |
|---|---|---|
| 1 | **Koja** | Rawa Badak Utara, Rawa Badak Selatan, Tugu Selatan, Tugu Utara, Koja, Lagoa |
| 2 | **Cilincing** | Cilincing, Kalibaru, Marunda, Rorotan, Semper Barat, Semper Timur, Sukapura |
| 3 | **Kelapa Gading** | Kelapa Gading Barat, Kelapa Gading Timur, Pegangsaan Dua |
| 4 | **Pademangan** | Ancol, Pademangan Barat, Pademangan Timur |
| 5 | **Penjaringan** | Kamal Muara, Kapuk Muara, Pejagalan, Penjaringan, Pluit |
| 6 | **Tanjung Priok** | Kebon Bawang, Papanggo, Sungai Bambu, Sunter Agung, Sunter Jaya, Tanjung Priok, Warakas |

---

### 6. Alur Data & Hirarki Sumber Data

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    HIRARKI 3 SUMBER DATA LAPANGAN                       │
├─────────────────────────┬──────────────────────┬────────────────────────┤
│ 1. Master Data Acuan    │ 2. Berkas Konkret    │ 3. Ekspor Web Bulog    │
│    (142k DTKS/P3KE)     │    BAST (PDF/Excel)   │    (Sudah & Belum)     │
│  - Acuan Domisili/RT-RW │  - NIK 16-Digit Sah  │  - Penyerahan Sistem   │
│  - Pelacak Nyasar       │  - Barcode & No Urut │  - Status Verifikasi   │
└────────────┬────────────┴──────────┬───────────┴───────────┬────────────┘
             │                       │                       │
             ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      SANISASI & PARSING ENGINE                          │
│  - Pembersihan NIK & KK via fixNIK() (Anti-Notasi Eksponen 3.17203E+15) │
│  - Multi-Alias Header Parser (NO_KK, ALAMAT, NIK_PBP, KARTU_KELUARGA)   │
│  - Web Worker Background Processing (public/excelWorker.js)             │
│  - PDF Regex Barcode & RT/RW Extractor (services/bastParser.ts)         │
└────────────┬────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   SUPABASE CLOUD & INDEXEDDB ENGINE                     │
│  - Supabase Auth & Row Level Security (RLS) per Kelurahan               │
│  - Real-time WebSocket Channel (chat_posko)                             │
│  - IndexedDB (BulogPoskoDB v2: master, bast, log, audit, pengganti, meta)│
│  - Zustand Global Store & Fast Lookup Maps                              │
└────────────┬────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         PENGOLAHAN & OUTPUT                             │
│  - Verification Cockpit & Hard-stop Protection 1 KK Max 30 Kg           │
│  - Triple-Match 3-Way Engine (SelisihAuditRow & KategoriSelisih)        │
│  - Laporan Excel Korporat Berwarna (ExcelJS Engine + Auto Width)        │
│  - PDF Overlay SPTJM Resmi (pdf-lib pada /SPTJM-Pengganti.pdf)          │
│  - Draft WhatsApp Web API (api.whatsapp.com/send)                       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 7. Stack Teknis & Infrastruktur

* **Next.js `16.3.4` (App Router & Turbopack)** — Web Framework fullstack React Single-Page Application (SPA).
* **React `19.2.8` & TypeScript `^5`** — UI Library deklaratif dengan type-safety domain bisnis ketat.
* **Supabase Cloud (`@supabase/supabase-js ^2`)** — Backend-as-a-Service untuk Autentikasi Posko & Chat Realtime WebSocket.
* **Zustand `^5.0.15`** — Global state management terpusat dengan fast lookup indexing Map O(1).
* **Tailwind CSS `^4`** — Styling ERP modern dengan variabel warna resmi BULOG (`#0B3B73`, `#07264B`, `#EBF3FB`).
* **ExcelJS `^4.4.0`** — Engine pembuat berkas Excel (.xlsx) berwarna korporat dengan Kop BULOG.
* **xlsx (SheetJS) `^0.18.5` & Web Worker API** — Parser Excel Master 142k di background thread tanpa freeze UI.
* **pdf-lib `^1.17.1` & pdfjs-dist `^6.3.289`** — Overlay PDF template SPTJM dan ekstraksi barcode/tanda tangan BAST PDF.
* **IndexedDB (BulogPoskoDB v2)** — Database lokal browser untuk persistensi data offline.

---

### 8. Metrik & Indikator Keberhasilan

* **Zero Data Loss:** 100% data ter-persist di IndexedDB lokal browser.
* **Performance Speed:** Parsing Excel Master 142.000 baris selesai di bawah 3 detik.
* **Zero Format Corruption:** 0% notasi ilmiah (`E+15`) pada NIK/KK saat mengekspor file Excel.
* **Real-time Latency:** Pesan chat koordinasi antar-posko tersampaikan dalam < 100ms.
