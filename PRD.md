# Product Requirement Document (PRD)
## Sistem Posko Verifikasi, Audit, AI, dan Rekonsiliasi Bansos PBP BULOG

---

## 1. Ringkasan Produk

**Nama sistem:** `bulog-posko`

**Versi:** `1.3.0` — ERP Posko Hybrid: Offline IndexedDB, Supabase Realtime Cloud, dan AI Automation

**Pengembang:** Noval Abdillah

**Wilayah operasional:** Perum BULOG Kantor Cabang Jakarta Utara — 31 kelurahan di 6 kecamatan.

**Masalah utama yang diselesaikan:**

Penyaluran bantuan pangan beras PBP 30 kg per keluarga di posko kelurahan membutuhkan verifikasi cepat, pencegahan pengambilan ganda 1 KK, audit fisik BAST, rekonsiliasi tiga sumber data (Master DTKS, BAST Fisik, Web Bulog), pengelolaan PBP pengganti, komunikasi antarposko, dan pelaporan lapangan yang rapi. Proses manual rentan terhadap NIK rusak (scientific notation Excel), tanda tangan nyasar, salah posko, warga belum ambil tidak terpantau, serta selisih antara BAST fisik dan ekspor Web Bulog.

`bulog-posko` adalah aplikasi web operasional yang menggabungkan verifikasi meja posko, audit 3-way, dashboard statistik salur system-wide, supervisor monitoring realtime, chat koordinasi antarposko, AI OCR, AI Copilot, generator SPTJM, WhatsApp reminder, dan kalkulator logistik dalam satu sistem terpadu.

**Arsitektur umum:**

```
Browser Petugas (IndexedDB lokal)
        |
        |--- Supabase Auth (login per kelurahan)
        |--- Supabase Realtime (chat antarposko)
        |--- Supabase PostgreSQL (supervisor monitoring)
        |--- Next.js API Route /api/ai (proxy ke 9router AI)
```

Data kerja harian (Master 142k, BAST, Ekspor Bulog) disimpan di IndexedDB lokal browser masing-masing petugas untuk performa maksimal dan kemampuan kerja tanpa internet. Supabase digunakan untuk autentikasi, komunikasi realtime, dan sinkronisasi statistik supervisor.

---

## 2. Target Pengguna

### 2.1 Petugas Posko Kelurahan (31 Posko)
- Melayani warga di meja posko dengan verifikasi cepat.
- Mengunggah Master Data 142k dan BAST PDF/Excel.
- Memverifikasi barcode, NIK, nama, No. KK, dan No. Urut BAST.
- Menandai hasil audit fisik BAST (Terverifikasi / Perlu Ditinjau / Ketidaksesuaian).
- Mencatat PBP pengganti yang ditolak Banpang.
- Menggunakan AI OCR KTP/KK dan AI Copilot untuk bantuan cepat.

### 2.2 Supervisor BULOG Jakarta Utara
- Memantau seluruh 31 kelurahan dari satu layar (Supervisor Dashboard Realtime).
- Melihat ringkasan statistik salur, BAST termuat, verifikasi fisik, dan log pelayanan per kelurahan.
- Data supervisor diperbarui otomatis saat petugas lapangan melakukan aktivitas tanpa input manual dari supervisor.
- Mengkoordinasikan instruksi lewat Chat Posko.

### 2.3 Tim Audit dan Administrasi
- Menganalisis selisih 3-way antara Master DTKS, BAST Fisik, dan Ekspor Web Bulog.
- Mengekspor laporan Excel audit dan dokumen siap upload Banpang.
- Mencetak SPTJM Pengganti resmi.
- Mengirim daftar warga belum ambil ke RT/RW via WhatsApp.

---

## 3. Modul dan Fitur Utama

### 3.1 Dashboard

Dashboard menyediakan ringkasan operasional posko secara terpadu:

**KPI StatCards (5 kartu sejajar):**
- Master Data Terindeks (jumlah baris acuan DTKS 142k).
- Penerima BAST Termuat (jumlah PBP terindeks dari file BAST).
- Realisasi Sudah Salur (PBP & tonase beras dari Ekspor Web Bulog File 1).
- Sisa Belum Salur (PBP belum diserahkan dari Ekspor Web Bulog File 2).
- Terverifikasi Fisik BAST (jumlah penanda OK / Tinjau / Beda).

**Statistik Salur System-Wide:**
- Mengkalkulasi realisasi penyaluran dari Ekspor Web Bulog File 1 & File 2 secara otomatis.
- Menampilkan progress bar capaian salur (`Realisasi / Total Kuota × 100%`).
- Tonase beras diserahkan dalam Kg dan Ton.
- Jika File Ekspor belum diunggah, fallback ke Log Pelayanan Meja Posko.

**Panel Detail:**
- Panel PBP Pengganti Tertolak Banpang (top 5 + navigasi ke tab Log).
- Panel Terverifikasi Fisik BAST (top 5 + status warna per penanda).
- Panel Status Sistem & Statistik Salur (status 4 modul + progress bar + wilayah BAST aktif).

**Welcome Hero Banner:**
- Tanggal hari ini, Posko Aktif, tombol cepat Mulai Pelayanan dan Rekonsiliasi Audit.

---

### 3.2 Meja Posko

Fitur pelayanan warga berbasis verifikasi multi-mode:

**FileUploadPanel (Collapsible):**
- Stepper 4 langkah: Muat Master → Muat BAST → Pilih Posko → Siap Melayani.
- Saat Master & BAST sudah termuat, panel otomatis melipat menjadi banner ringkas hijau.
- Tombol expand untuk mengganti atau menambah file.
- Upload Master menggunakan Web Worker (`excelWorker.js`) agar UI tidak freeze saat memproses 142k baris.
- Upload BAST mendukung PDF multi-halaman dan Excel multi-sheet.

**Cockpit Header:**
- Badge Posko Aktif yang jelas.
- Counter realtime Sukses Salur & Pengaduan dari Log Pelayanan hari ini.

**Scanner & Pencarian Multi-Mode:**
- Barcode BAST (scan langsung dari barcode reader USB/Bluetooth).
- NIK 16-digit.
- No. KK 16-digit.
- No. Urut Undangan BAST (misal: 1095).
- Nama Lengkap.
- Keyboard shortcut: `Enter` cek, `Esc` reset.

**Hasil Verifikasi:**
- Komparasi PBP Hak Penerima (data Master DTKS) vs Pihak Pengambil (data BAST/Dokumen).
- Proteksi 1 KK maksimal 1 alokasi 30 kg.
- Panel Keluarga 1 KK (daftar anggota KK yang terdaftar).
- Tabel Anomali BAST vs Master (warga terdaftar di kelurahan lain).

**AI di Meja Posko:**
- AI OCR KTP/KK/BAST (foto → NIK + data → auto-search).
- AI Deep Match Typo (nama tidak ketemu → AI cari kandidat terdekat).

---

### 3.3 Audit Ekspor

Fitur audit dan rekonsiliasi multi-sumber:

**Upload File Ekspor Web Bulog:**
- File 1: Sudah Diserahkan (status_serah Sudah, verification_status Sudah).
- File 2: Belum Diserahkan (status_serah Belum, verification_status Belum/Kurang Foto).
- Nilai `verification_status` dan `status_serah` dibaca murni dari Excel Web Bulog tanpa override default.

**Rekonsiliasi 3-Way (Triple Match Engine):**
- Membandingkan Master Data 142k, BAST Fisik/Log Posko, dan Ekspor Web Bulog.
- Kategori selisih:
  - `TUNGGU_INPUT_WEB`: Fisik sudah salur, Web Bulog masih Belum.
  - `BELUM_DIAMBIL`: Web Bulog Belum, posko belum melayani.
  - `HUMAN_ERROR_BAST`: Ditulis Pengganti padahal terdaftar DTKS/1 KK.
  - `POTENSI_TTD_NYASAR`: Web Bulog Sudah, tapi Posko & BAST tidak ada.
  - `MATCH_LENGKAP`: Cocok sempurna di ketiga sumber.

**Tab Rekonsiliasi BAST Fisik:**
- Tabel seluruh PBP dari Ekspor Web Bulog dengan penanda fisik.
- Filter Status PBP: Beda KK, Pengganti, Satu KK, Normal, Semua.
- Filter Penanda Fisik:
  - **Belum Ditandai** (dengan counter jumlah) — cepat lihat yang belum diverifikasi.
  - **Sudah Ditandai** — filter yang sudah diproses.
- StatCard "Belum Ditandai" dengan warna warning jika masih ada yang belum.
- Toggle penanda per baris: Terverifikasi Fisik → Perlu Ditinjau → Ketidaksesuaian → (hapus).
- Tandai Halaman Ini (batch tandai seluruh halaman sekaligus).
- Penanda disimpan di `localStorage` per posko (key: `audit_penanda_[nama_posko]`).
- Penanda sync otomatis ke `auditPenandaMap` di store global (dibaca Dashboard & Supervisor).

**Ekspor:**
- Ekspor Excel audit lengkap.
- Ekspor siap upload Banpang.
- Rincian SPTJM Pengganti per kelurahan.

**AI di Audit:**
- AI Audit Insight: ringkasan eksekutif dan rekomendasi tindakan dari statistik 3-way.
- AI WA Personalize: personalisasi pesan WhatsApp ke RT/RW dengan pilihan tone.

---

### 3.4 AI Automation — Arsitektur Backend

Seluruh AI diproses melalui server route Next.js (`app/api/ai/route.ts`) sebagai proxy ke layanan 9router AI. Client-side tidak pernah menyentuh API key secara langsung.

**Alur Request AI (End-to-End):**

```
Browser (Client)
    |
    | POST /api/ai
    | body: { action, payload }
    |
    v
Next.js Server Route (app/api/ai/route.ts)
    |
    | Baca API key dari env server (NINEROUTER_API_KEY)
    | Susun system prompt + messages sesuai action
    |
    | POST primaryBaseUrl/chat/completions
    |      (https://rmca5fb.abc-tunnel.us/v1)
    |
    | Jika gagal/timeout → fallback ke:
    |      POST fallbackBaseUrl/chat/completions
    |           (http://localhost:20128/v1)
    |
    v
9router AI Server (Model: SuperAdmin)
    |
    v
Response JSON atau SSE Streaming
    |
    v
Next.js parse → extract content dari choices[0].message.content
    |
    v
Return { result: string } ke Browser
    |
    v
Komponen React render hasil (bubble chat / OCR result / tombol ACTION)
```

**5 Action yang Didukung:**

| Action | Deskripsi | Input | Output |
|---|---|---|---|
| `ocr_ktp` | Baca NIK, nama, No. KK, RT, RW dari foto KTP/KK/BAST | `imageBase64` (data URL) | JSON `{ nik, nama, noKK, alamat, rt, rw }` |
| `copilot` | AI Copilot Posko: jawab pertanyaan, tampilkan sisa PBP, undangan nyasar, audit SOP | `userQuery`, `contextData`, `chatHistory[]` | Markdown + tag `[ACTION:VERIFY|...]` |
| `audit_insight` | Ringkasan eksekutif dari statistik rekonsiliasi 3-way | `statsData`, `poskoAktif` | Markdown ringkasan + rekomendasi |
| `wa_personalize` | Susun pesan WhatsApp ke RT/RW dengan tone tertentu | `tone`, `rtTarget`, `rwTarget`, `wargaList[]` | Teks WA siap kirim |
| `deep_match` | Fuzzy match nama typo parah ke kandidat Master Data | `targetName`, `candidateList[]` | JSON `{ bestMatchIndex, confidenceScore, alasan }` |

**OCR Character Disambiguation (Koreksi Otomatis):**
AI prompt memaksa koreksi karakter umum yang salah baca scanner OCR pada NIK/No. KK 16-digit:
- `O`, `D` → `0`
- `I`, `l`, `i` → `1`
- `B` → `8`
- `S` → `5`
- `Z` → `2`

**Action Button Interaktif (AI Copilot):**
AI Copilot dapat menyertakan tag khusus dalam responsnya:
```
[ACTION:VERIFY|NIK_ATAU_NO_URUT|NAMA_PBP|NO_URUT]
```
Tag ini dideteksi oleh `renderAiMessageContent()` di komponen `AICopilotModal.tsx` dan dirender menjadi tombol hijau **"Buka di Meja Posko"** yang langsung melakukan pencarian warga tersebut di Meja Posko.

**Data yang Dibaca AI Copilot (contextData):**
AI Copilot hanya bisa melihat data yang sudah dimuat di sesi browser aktif:
- Nama posko, kecamatan, jumlah Master & BAST (angka saja).
- Daftar sisa belum ambil (maks 80 PBP, dari File 2 Belum Serah atau BAST).
- Daftar undangan nyasar (maks 40 entri, dari join BAST vs Master).
- Daftar kurang foto (maks 60 entri, dari File 2 filter belum verifikasi).
- Daftar kejanggalan SOP (maks 40 entri, dari analisis Ekspor Bulog).
- Total log pelayanan, sukses salur, dan pengaduan hari ini.

**Model & Konfigurasi:**
- Model: `SuperAdmin` via 9router.
- Temperature: `0.2` (hampir deterministik untuk keakuratan data).
- Stream: `false` (JSON response tunggal, bukan SSE incremental).
- Primary endpoint: tunnel cloud (dikonfigurasi via env server).
- Fallback endpoint: localhost (saat tunnel mati, mode offline).

---

### 3.5 Arsitektur Pencarian Data — Multi-Index & Fallback

Pencarian warga di Meja Posko menggunakan sistem multi-index berbasis `Map` JavaScript yang dibangun saat Master Data dan BAST pertama kali diunggah:

**5 Index Cepat O(1):**

| Index | Key | Value | Dibangun dari |
|---|---|---|---|
| `masterByNIK` | NIK 16-digit (clean) | `MasterRow` | Master Data 142k |
| `masterByName` | Nama UPPERCASE tanpa simbol | `MasterRow[]` | Master Data 142k |
| `masterByKK` | No. KK 16-digit | `MasterRow[]` | Master Data 142k |
| `bastByNIK` | NIK raw + NIK clean + fixNIK | `BastRow` | BAST PDF/Excel |
| `bastByNoUrut` | `[kelurahan]_[no_urut]` atau `[no_urut]` | `BastRow` | BAST PDF/Excel |

**Urutan Fallback Pencarian (4 Lapis):**
```
Input query pengguna
    │
    ├─ 1. NIK 16-digit exact match
    │       masterByNIK.get(fixNIK(query))
    │       bastByNIK.get(nikClean)
    │
    ├─ 2. No. Urut BAST (angka di akhir query)
    │       bastByNoUrut.get(`${kelurahan}_${noUrut}`)
    │       bastByNoUrut.get(String(noUrut))
    │
    ├─ 3. Nama Lengkap (exact + includes)
    │       masterByName.get(cleanStr(query))
    │       bastRecords.find(b => cleanStr(b.NAMA) === namaClean)
    │       bastRecords.find(b => namaClean.includes(cleanStr(b.NAMA)))
    │
    └─ 4. AI Deep Match (fuzzy, jika 1-3 semua gagal)
            aiDeepMatchName(query, masterRecords.slice(0, 100))
            → bestMatchIndex + confidenceScore + alasan
```

**NIK Normalisasi (fungsi `fixNIK` & `cleanNum`):**
- Hapus semua karakter non-digit.
- Potong awalan nol berlebih.
- Validasi panjang minimal 15-16 digit.
- Tiga varian NIK disimpan sekaligus di `bastByNIK` (raw, clean, fixNIK) untuk maksimalkan match.

---

### 3.6 Chat Posko

Komunikasi realtime antarposko via Supabase Realtime:

**Infrastruktur:**
- Tabel `chat_posko` di Supabase PostgreSQL.
- Subscribe `postgres_changes` INSERT → pesan baru muncul di semua device tanpa polling.
- Notifikasi toast saat ada pesan masuk dari posko lain (dengan suara).
- Badge unread di sidebar.

**Fitur UI:**
- Filter per kecamatan (6 kecamatan Jakarta Utara).
- Filter tipe pesan: Normal, Peringatan, Informasi.
- Avatar inisial posko dengan warna khas kecamatan (`POSKO_WARNA_MAP`).
- Bubble chat: biru (pesan saya), putih/amber/sky (pesan posko lain sesuai tipe).
- Nama petugas tersimpan di `localStorage` per posko.

**Quick Template Chat (6 Template Operasional):**
Chip template siap pakai yang otomatis mengisi nama posko aktif:

| Template | Tipe | Kegunaan |
|---|---|---|
| Pelayanan Selesai | info | Lapor posko selesai melayani seluruh PBP hari ini |
| Armada Tiba | info | Lapor truk beras Bulog tiba di lokasi posko |
| Stok Kurang | peringatan | Minta tambahan stok ke logistik |
| SPTJM Siap | info | Lapor berkas SPTJM pengganti sudah lengkap |
| Undangan Nyasar | peringatan | Koordinasi warga datang ke posko yang salah |
| Kendala Web Banpang | peringatan | Lapor gangguan akses Web Bulog ke supervisor |

---

### 3.7 PBP Pengganti Tertolak

- Mencatat PBP pengganti yang tidak lolos verifikasi Banpang.
- Data: nama, NIK, No. KK, posko, catatan alasan, dan waktu pencatatan.
- Disimpan di IndexedDB lokal via `simpanPenggantiTertolakKeDB`.
- Tampil di Dashboard (top 5) dan panel full di tab Log.
- Dapat diekspor untuk keperluan audit internal.

---

### 3.8 Supervisor Monitoring Realtime

Dashboard khusus supervisor untuk memantau seluruh 31 kelurahan secara terpusat tanpa perlu meminta laporan manual dari petugas.

**Infrastruktur Supabase (2 tabel):**

| Tabel | Isi | Ukuran |
|---|---|---|
| `posko_ringkasan` | Satu baris per kelurahan (31 baris total). Berisi agregat: BAST termuat, sudah serah, belum serah, sukses salur, pengaduan, verified fisik, review, mismatch, last updated. | ~31 rows |
| `posko_log_pelayanan` | Satu baris per transaksi PBP yang dilayani. Berisi nama, NIK, status, waktu, kelurahan. | ~500 PBP × 31 kelurahan maks |

**Sync Otomatis (Fire-and-Forget dari Browser Petugas):**
Data naik ke Supabase otomatis tanpa aksi tambahan dari petugas, dipicu oleh 5 event:

| Event Petugas | Data yang Dikirim ke Supabase |
|---|---|
| Klik Sukses Salur / Alih Pengaduan | `kirimLogPelayananKeSupabase()` → insert 1 row log + upsert counter salur di ringkasan |
| Upload BAST PDF/Excel | Upsert `bast_jumlah` + `bast_diupload_at` di ringkasan |
| Upload File Sudah Serah | Upsert `sudah_serah_jumlah` di ringkasan |
| Upload File Belum Serah | Upsert `belum_serah_jumlah` di ringkasan |
| Toggle Penanda Fisik BAST | Upsert `verified_fisik`, `review_fisik`, `mismatch_fisik` di ringkasan |

**UI Supervisor (tab "Manajemen Posko"):**
- Tabel monitoring 31 kelurahan dikelompokkan per kecamatan.
- Kolom: Kelurahan, BAST, Sudah Serah, Belum Serah, Sukses Salur, Pengaduan, Verified Fisik, Review/Beda, Last Update, tombol Log.
- Tombol Log: drill-down log pelayanan harian per kelurahan (maks 200 entri terbaru).
- Auto-refresh via Supabase Realtime `postgres_changes` — tabel update saat ada perubahan tanpa reload.
- KPI agregat 6 kartu di atas tabel: Kelurahan Aktif, BAST Termuat, Total Sukses, Total Pengaduan, Terverifikasi Fisik, Ketidaksesuaian.

**Filosofi Arsitektur:**
Supervisor tidak mengupload data mentah PBP. Hanya statistik agregat yang naik ke Supabase (bukan 142k baris master atau ribuan baris BAST). Ini menjaga performa, menghindari limit Supabase free tier, dan memastikan privasi data warga.

---

### 3.9 Login Split-Screen

- Layout dua kolom: kolom kiri berisi foto/ilustrasi operasional dengan overlay gradient dan tagline, kolom kanan berisi form login.
- Warna aksen mengikuti brand `bulog-blue` (`#0B3B73`).
- Di mobile (`< lg`), kolom kiri tersembunyi, form tampil full-width.
- Background outer menggunakan `StarfieldBackground` (canvas animasi 3D 400 bintang + meteor shower).
- Autentikasi via Supabase Auth (email + password per kelurahan).
- Setelah login berhasil, `namaPosko` dan `kecamatan` otomatis dipetakan dari `EMAIL_POSKO_MAP`.

---

### 3.10 Panduan Penggunaan

- Pusat panduan terstruktur per fitur.
- Filter modul: Dashboard, Meja Posko, Audit, AI Copilot, Chat, Pengganti, Akun.
- Setiap fitur memiliki: lokasi, kapan dipakai, langkah penggunaan, hasil yang diharapkan, dan catatan khusus.
- Navigasi langsung ke tab terkait lewat tombol aksi di kartu panduan.

---

## 4. Alur Data Operasional

```
┌─────────────────────────────────────────────────────────────────────┐
│                     INPUT DATA POSKO LAPANGAN                       │
└─────────────────────────────────────────────────────────────────────┘

Master Data 142k DTKS
    │
    ├─ Sanitasi NIK/KK (hapus non-digit, fix scientific notation)
    ├─ Build index: masterByNIK, masterByName, masterByKK
    └─ Simpan IndexedDB (store: "master")

BAST PDF / Excel
    │
    ├─ Ekstraksi: barcode, NIK, No. KK, No. Urut BAST, RT, RW, Alamat
    ├─ Cross-check instant ke Master 142k (NIK + nama)
    ├─ Build index: bastByNIK, bastByNoUrut
    └─ Simpan IndexedDB (store: "bast")

Ekspor Web Bulog File 1 (Sudah Serah) + File 2 (Belum Serah)
    │
    ├─ Baca murni: verification_status, status_serah, status_pbp
    ├─ Deduplikasi antar-file
    └─ Simpan IndexedDB (store: "audit")

Log Posko (Pelayanan Hari Ini)
    │
    ├─ Simpan IndexedDB (store: "log")
    └─ Sync ke Supabase posko_log_pelayanan ──────────┐
                                                       │
Penanda Fisik BAST (Verif/Tinjau/Beda)               │   SUPABASE
    │                                                  │   CLOUD
    ├─ Simpan localStorage per posko                   │
    └─ Sync ke Supabase posko_ringkasan ───────────────┤
                                                       │
Upload BAST/Serah/BelumSerah                          │
    └─ Sync metadata ke Supabase posko_ringkasan ──────┘
                                                       │
                                     ┌─────────────────▼──────────────┐
                                     │    SUPERVISOR MONITORING        │
                                     │   Dashboard Realtime 31 Posko   │
                                     │   (subscribe postgres_changes)   │
                                     └─────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                          OUTPUT & AKSI                               │
└─────────────────────────────────────────────────────────────────────┘

Rekonsiliasi 3-Way → Kategori Selisih → Filter RT/RW
    │
    ├─ Dashboard KPI & Statistik Salur System-Wide
    ├─ Export Excel Audit & Siap Upload Banpang
    ├─ Generator Pesan WhatsApp RT/RW (+ AI Personalize)
    ├─ Cetak SPTJM Pengganti (PDF Resmi)
    └─ AI Copilot → Ringkasan + tombol "Buka di Meja Posko"
```

---

## 5. Validasi dan Aturan Bisnis

1. **NIK dan No. KK** harus dinormalisasi menjadi angka murni 16 digit bila memungkinkan (`fixNIK`, `cleanNum`).
2. **1 KK maksimal 1 alokasi** 30 kg — dicegah di level pencarian (sistem menampilkan anggota satu KK).
3. **BAST fisik** adalah bukti operasional lapangan utama dan dapat ditandai status fisiknya per baris.
4. **Master Data 142k DTKS** adalah acuan utama identitas dan wilayah domisili warga.
5. **Ekspor Web Bulog** adalah pembanding status serah dan verification_status dari sistem Banpang.
6. **Pengganti non-DTKS atau NIK pengganti kosong** wajib dibuatkan SPTJM sesuai SOP Bulog.
7. **AI membantu, tidak menggantikan keputusan petugas.** Semua hasil AI — OCR, Copilot, Deep Match — tetap memerlukan konfirmasi dokumen fisik oleh petugas.
8. **Data mentah warga (142k Master, BAST, Ekspor Bulog)** disimpan hanya di IndexedDB lokal browser masing-masing posko dan tidak pernah diunggah ke server/Supabase.

---

## 6. Role dan Hak Akses

### Petugas Kelurahan (`isSuper: false`)
- Login dengan email kelurahan → `namaPosko` dan `kecamatan` otomatis dipetakan.
- Data difilter hanya ke kelurahan yang sesuai dengan `poskoAktif`.
- Akses: Dashboard, Meja Posko, Audit, Chat, Log, Panduan.
- Tidak dapat memilih kelurahan lain.
- Data pelayanan & penanda sync otomatis ke Supabase di background.

### Supervisor (`isSuper: true`)
- Login dengan email supervisor → `isSuper: true`, akses semua kelurahan.
- Dapat memilih Posko Aktif dari dropdown 31 kelurahan di sidebar.
- Akses tambahan: tab "Manajemen Posko" (Supervisor Monitoring Realtime).
- Sidebar menampilkan badge hijau "Sedang Melihat Data [Kelurahan]".
- Tidak mengupload data mentah — hanya monitoring statistik dari Supabase.

---

## 7. Stack Teknis

| Teknologi | Versi | Peran |
|---|---|---|
| Next.js | 16.3.4 | Framework React SSR/SSG + App Router + API Routes |
| React | 19.2.8 | UI library komponen |
| TypeScript | 5 | Type safety strict mode (`strict: true`) |
| Tailwind CSS | 4 | Utility-first styling dengan custom theme Bulog |
| Zustand | 5 | Global state management (store tunggal `appStore.ts`) |
| Supabase | 2.116.0 | Auth, Realtime chat, PostgreSQL supervisor monitoring |
| IndexedDB (native) | — | Persistent storage lokal browser (Master, BAST, Audit, Log) |
| ExcelJS | 4.4.0 | Export laporan Excel multi-sheet berformat rapi |
| SheetJS/xlsx | 0.18.5 | Parse file Excel upload dari petugas (via Web Worker) |
| pdf-lib | 1.17.1 | Generate/overlay PDF SPTJM resmi Bulog |
| pdfjs-dist | 6.3.289 | Ekstraksi teks dari PDF BAST multi-halaman |
| 9router AI | — | Backend model SuperAdmin via server proxy `/api/ai` |

**Catatan Library:**
- `xlsx` digunakan di Web Worker (`public/excelWorker.js`) untuk parsing 142k baris tanpa memblokir UI thread.
- `exceljs` digunakan di main thread untuk export Excel berformat kompleks (multi-sheet, styling, header kustom).
- `pdfjs-dist` berjalan di browser untuk ekstraksi teks PDF BAST per halaman.
- `pdf-lib` berjalan di browser untuk overlay data warga ke template PDF SPTJM resmi.

---

## 8. Environment dan Konfigurasi

File `.env.local` (tidak di-push ke GitHub, tercantum di `.gitignore`):

```env
NEXT_PUBLIC_SUPABASE_URL=[LIHAT .env.local]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[LIHAT .env.local]
NINEROUTER_BASE_URL=[LIHAT .env.local]
NINEROUTER_MODEL=SuperAdmin
NINEROUTER_API_KEY=[LIHAT .env.local]
```

**Catatan penting:**
- `NEXT_PUBLIC_*` diakses client-side (Supabase auth & realtime) — nilai anon key Supabase aman diekspos karena dilindungi Row Level Security (RLS).
- `NINEROUTER_*` hanya diakses server-side di `/api/ai` — API key AI tidak pernah terekspos ke browser.
- Env dapat di-override tanpa mengubah kode sumber.
- Fallback lokal tersedia (`http://localhost:20128/v1`) untuk mode offline/development.

---

## 9. Metrik Keberhasilan

- Waktu verifikasi warga di meja posko turun dibanding proses manual sebelumnya.
- NIK/No. KK tidak rusak menjadi format scientific notation saat diimpor dari Excel.
- Pengambilan ganda 1 KK terdeteksi dan dicegah secara aktif.
- Warga belum ambil dapat difilter per RT/RW dan dikirim reminder via WhatsApp.
- Selisih antara Web Bulog, BAST fisik, dan Master DTKS dapat dikategorikan otomatis.
- Penanda fisik BAST terpantau di Dashboard dan Supervisor Monitoring.
- Supervisor dapat melihat progres 31 kelurahan tanpa menghubungi petugas satu per satu.
- Petugas dapat membuka data warga langsung dari tombol ACTION di output AI Copilot.
- Template Chat mempercepat koordinasi lapangan tanpa mengetik pesan berulang.

---

## 10. Non-Tujuan

- Tidak melakukan sinkronisasi langsung ke API Web Bulog resmi sampai endpoint resmi tersedia.
- Tidak menggantikan verifikasi dokumen fisik oleh petugas lapangan.
- Tidak menjamin akurasi OCR 100% untuk foto buram, gelap, terpotong, atau dokumen rusak.
- Tidak menyimpan data mentah PBP (142k Master, BAST, Ekspor Bulog) ke server cloud — data tetap lokal di browser.

---

## 11. Roadmap

| Status | Item |
|---|---|
| ✅ Selesai | Dashboard statistik salur system-wide dari Ekspor Web Bulog |
| ✅ Selesai | Supervisor monitoring realtime via Supabase (`posko_ringkasan`, `posko_log_pelayanan`) |
| ✅ Selesai | Filter "Belum Ditandai" per status PBP di Tab BAST Fisik |
| ✅ Selesai | Quick Template Chat 6 operasional lapangan |
| ✅ Selesai | Split-screen login layout modern |
| ✅ Selesai | Collapsible FileUploadPanel saat data sudah termuat |
| 🔜 Roadmap | Integrasi API resmi Banpang jika endpoint resmi tersedia |
| 🔜 Roadmap | Penyimpanan penanda fisik BAST ke Supabase (saat ini localStorage) |
| 🔜 Roadmap | Export paket laporan final per kelurahan (PDF + Excel bundle) |
| 🔜 Roadmap | Dataset evaluasi OCR lapangan untuk meningkatkan akurasi prompt |
| 🔜 Roadmap | Notifikasi push (PWA) untuk peringatan chat posko |
