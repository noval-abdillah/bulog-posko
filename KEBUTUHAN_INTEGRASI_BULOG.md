# DOKUMEN SPESIFIKASI KEBUTUHAN INTEGRASI API BULOG BANPANG

## 1. PENDAHULUAN
Aplikasi **Sistem Posko & Audit Bansos PBP Bulog** saat ini menggunakan dua metode pembandingan data:
1. Catatan Penyaluran Fisik Real-time Lapangan (Log Posko & Scanning BAST).
2. Data Ekspor Aplikasi Web Bulog (Banpang) yang diunggah secara manual oleh petugas posko.

Untuk memastikan audit penyaluran bebas dari manipulasi file manual dan memiliki pembanding data resmi yang selalu *up-to-date* (*live feed*), diperlukan modul integrasi otomatis (*API Sync Engine*) langsung dari server/aplikasi Web Bulog.

---

## 2. KEBUTUHAN DOKUMENTASI & KONFIRMASI TIM IT BULOG

Sebelum modul integrasi `BulogSyncEngine` dibangun secara penuh di dalam aplikasi, diperlukan konfirmasi resmi dan informasi teknis dari Tim IT Perum BULOG / BAPANAS mengenai poin-poin berikut:

### A. Metode Akses & Protokol Komunikasi
- [ ] Apakah aplikasi Bulog (Banpang) menyediakan **RESTful API** / **GraphQL API** resmi untuk penarikan data realisasi penyaluran?
- [ ] Jika API tidak tersedia, apakah terdapat endpoint ekspor terjadwal (misal **SFTP / Webhook Sync**) yang dapat mengirimkan file ekspor harian secara otomatis setiap pukul 23.59 WIB?

### B. Otentikasi & Keamanan (Authentication & Security)
- [ ] Metode otentikasi yang digunakan: `OAuth 2.0` (Bearer Token), `API Key` (X-API-KEY), atau `Basic Auth`?
- [ ] Apakah IP Address server posko harus didaftarkan (*IP Whitelisting*) ke firewall server Bulog?
- [ ] Apakah kredensial berlevel Kelurahan (per Posko) atau Kantor Cabang (Kabupaten/Kota)?

### C. Spesifikasi Endpoint yang Dibutuhkan
1. **Endpoint Tarik Data Penerima (Master Alokasi):**
   - `GET /api/v1/pbp/alokasi?kelurahan={id_kelurahan}&tahap={tahap}`
2. **Endpoint Tarik Realisasi Penyaluran (Live Realisasi Web Bulog):**
   - `GET /api/v1/pbp/realisasi?kelurahan={id_kelurahan}&updated_since={timestamp}`
3. **Endpoint Push Result Posko (Opsional - Sync Balik dari Posko):**
   - `POST /api/v1/pbp/serah-posko`

### D. Struktur Skema Data (JSON Payload Format)
Harap konfirmasikan format JSON respon yang dikembalikan server Bulog:
```json
{
  "status": "success",
  "data_realisasi": [
    {
      "nik_pbp": "3172032211760001",
      "nama_pbp": "JAENAL ABIDIN",
      "no_kk": "3172032105190015",
      "kelurahan": "Rawa Badak Utara",
      "status_serah": "SUDAH_DISERAHKAN",
      "tanggal_serah": "2026-09-05 10:15:00",
      "nama_pengganti": "-",
      "nik_pengganti": "-",
      "status_pbp": "NORMAL"
    }
  ]
}
```

---

## 3. ALUR KERJA TERJADWAL & SINKRONISASI MANAJEMEN (SOP)

Selama integrasi API resmi belum dibuka oleh Tim IT Bulog:
1. **Tingkat Keterlakan Unggahan Manual:** Aplikasi ini mewajibkan pencatatan **Metadata Timestamp & Tanggal Penarikan Data** pada setiap unggahan file ekspor Bulog manual (`_sourceFile`, `waktuUnggah`, `tanggalDitarikPetugas`).
2. **Penandaan Sumber Eksplisit:** Di setiap baris tabel audit dan rekonsiliasi selisih 3-way, sistem menyebutkan secara eksplisit dari mana data berasal:
   - Example: *"Sumber: Unggahan Manual (pbp_tugu.xlsx) — Ditarik Petugas per 05/09/2026 14:00 WIB"*
   - Jika API sudah aktif: *"Sumber: Real-time Live Sync API Bulog (Timestamp: 05/09/2026 14:00 WIB)"*

---

## 4. PENUTUP
Dokumen ini disusun sebagai prasyarat koordinasi resmi antar-tim teknis. Implementasi kode integrasi API di aplikasi ini siap diaktifkan begitu kredensial dan URL Endpoint resmi dari Perum BULOG / BAPANAS telah diserahterimakan.
