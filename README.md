# Sistem Posko Verifikasi, Audit, AI, dan Rekonsiliasi Bansos PBP BULOG

`bulog-posko` adalah aplikasi ERP operasional lapangan untuk membantu posko kelurahan melakukan verifikasi warga penerima bantuan pangan beras PBP 30 kg, audit BAST, rekonsiliasi Web Bulog, pencatatan pengganti tertolak, chat antarposko, dan otomasi AI.

Wilayah sasaran: Perum BULOG Kantor Cabang Jakarta Utara, 31 kelurahan di 6 kecamatan.

> **Catatan privasi:** repositori ini tidak berisi data warga asli. Seluruh contoh data menggunakan data dummy.

---

## Fitur Utama

### Dashboard

- Ringkasan Master Data, BAST, Pengganti Tertolak, Anomali, dan Terverifikasi Fisik BAST.
- Status sistem untuk Master, BAST, Ekspor Bulog, dan Penanda Fisik.
- Statistik salur dan total beras tersalur.
- Kalkulator beras untuk sisa PBP, tonase, karung, dan estimasi retur.

### Meja Posko

- Upload Master Data (skala 142k baris).
- Upload BAST PDF/Excel.
- Pencarian barcode BAST, NIK, No. KK, No. Urut BAST, dan nama.
- Proteksi 1 KK maksimal 1 alokasi 30 kg.
- AI OCR KTP/KK/BAST.
- AI Deep Match untuk nama typo.

### Audit Ekspor

- Upload File 1 Web Bulog: Sudah Diserahkan.
- Upload File 2 Web Bulog: Belum Diserahkan.
- Rekonsiliasi 3-way: Master Data, BAST/Log Posko, dan Ekspor Web Bulog.
- Filter kategori selisih dan RT/RW.
- Tandai Fisik BAST dan tampilkan rekapnya di Dashboard.
- AI Audit Insight.
- Pesan WhatsApp RT/RW dan AI WA Personalize.
- Cetak SPTJM dan export Excel.

### AI Automation

- AI Copilot Posko.
- OCR KTP, KK, dan BAST.
- Deep Match nama typo.
- Audit Insight.
- Personalisasi pesan WhatsApp.
- Tombol aksi AI "Buka di Meja Posko".
- Semua panggilan AI berjalan di server route (`/api/ai`), sehingga kredensial tidak pernah sampai ke browser.

### Chat Posko

- Chat realtime antarposko.
- Filter kecamatan dan tipe pesan.
- Badge unread dan toast notifikasi.

### Panduan Penggunaan

- Panduan lengkap per fitur.
- Filter modul: Dashboard, Meja Posko, Audit, AI, Chat, Pengganti, Data Bermasalah, Akun.

---

## Stack Teknis

- Next.js 16
- React 19
- TypeScript 5
- Tailwind CSS 4
- Zustand 5
- Supabase Auth dan Realtime
- IndexedDB (penyimpanan lokal browser)
- ExcelJS, SheetJS/xlsx
- pdf-lib, pdfjs-dist
- LLM gateway kompatibel OpenAI API

---

## Environment Variables

Buat file `.env.local` di root proyek (file ini **tidak** di-commit; pastikan sudah ada di `.gitignore`):

```env
NEXT_PUBLIC_SUPABASE_URL=<url-project-supabase-anda>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-supabase-anda>
NINEROUTER_BASE_URL=<base-url-llm-gateway>
NINEROUTER_MODEL=<nama-model>
NINEROUTER_API_KEY=<api-key-llm-gateway>
```

Catatan:

- AI dipanggil dari server route `/api/ai`; key hanya dibaca dari environment server.
- Aplikasi tidak menyimpan fallback kredensial di kode. Jika env tidak lengkap, fitur AI menampilkan pesan error.
- Aktifkan Row Level Security (RLS) di Supabase untuk semua tabel yang menyimpan data operasional.

---

## Menjalankan Lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

Build produksi:

```bash
npm run build
```

---

## Akun dan Role

- **Petugas Kelurahan:** akses posko sesuai akun.
- **Supervisor:** dapat memilih Posko Aktif dari seluruh kelurahan.
- Daftar akun dikelola secara internal dan tidak disertakan di repositori.

---

## Dokumen Terkait

- `PRD.md`: Product Requirement Document.
- `KEBUTUHAN_INTEGRASI_BULOG.md`: kebutuhan API resmi Bulog/Banpang di masa depan.

---

## Catatan Operasional

- AI membantu mempercepat pekerjaan, tetapi keputusan final tetap mengikuti dokumen fisik dan SOP supervisor.
- OCR tidak dapat dijamin sempurna untuk foto buram, gelap, miring, atau dokumen terpotong.
- Integrasi API resmi Bulog belum aktif; audit Web Bulog masih berbasis upload file ekspor manual.
