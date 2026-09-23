# Sistem Posko Verifikasi, Audit, AI, dan Rekonsiliasi Bansos PBP BULOG

`bulog-posko` adalah aplikasi ERP operasional lapangan untuk membantu posko kelurahan melakukan verifikasi warga penerima bantuan pangan beras PBP 30 kg, audit BAST, rekonsiliasi Web Bulog, pencatatan pengganti tertolak, chat antarposko, dan otomasi AI.

Wilayah sasaran: Perum BULOG Kantor Cabang Jakarta Utara, 31 kelurahan di 6 kecamatan.

---

## Fitur Utama

### Dashboard

- Ringkasan Master Data, BAST, Pengganti Tertolak, Anomali, dan Terverifikasi Fisik BAST.
- Status sistem untuk Master, BAST, Ekspor Bulog, dan Penanda Fisik.
- Statistik salur dan total beras tersalur.
- Kalkulator beras untuk sisa PBP, tonase, karung, dan estimasi retur.

### Meja Posko

- Upload Master Data 142k.
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

### AI Automation 9router

- AI Copilot Posko.
- OCR KTP, KK, dan BAST.
- Deep Match nama typo.
- Audit Insight.
- Personalize pesan WhatsApp.
- Tombol aksi AI “Buka di Meja Posko”.
- Endpoint dan key sudah ditanam di server route, sehingga petugas tidak perlu setting manual.

### Chat Posko

- Chat realtime antarposko.
- Filter kecamatan dan tipe pesan.
- Badge unread dan toast notifikasi.

### Panduan Penggunaan

- Panduan lengkap per fitur.
- Filter modul: Dashboard, Meja Posko, Audit, AI, Chat, Pengganti, Data Bermasalah, Akun.

---

## Stack Teknis

- Next.js 16.3.4.
- React 19.2.8.
- TypeScript 5.
- Tailwind CSS 4.
- Zustand 5.
- Supabase Auth dan Realtime.
- IndexedDB lokal browser.
- ExcelJS, SheetJS/xlsx.
- pdf-lib, pdfjs-dist.
- 9router AI.

---

## Environment Variables

`.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://iruetylbefvfxowiabxz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_dPAxXeGxuJpm3hK14W5zTA_gJsXeIMo
NINEROUTER_BASE_URL=https://rmca5fb.abc-tunnel.us/v1
NINEROUTER_MODEL=SuperAdmin
NINEROUTER_API_KEY=sk-72efa463d1cdd68f-7pr8z9-62aaafeb
```

Catatan:

- AI dipanggil dari server route `/api/ai`.
- Pengguna tidak perlu mengisi key di UI.
- Jika env tidak tersedia, route AI tetap memiliki fallback endpoint/key/model sesuai konfigurasi sistem.

---

## Menjalankan Lokal

```bash
npm install
npm run dev
```

Buka:

```text
http://localhost:3000
```

Build produksi:

```bash
npm run build
```

---

## Akun dan Role

- Petugas Kelurahan: akses posko sesuai akun.
- Supervisor: bisa memilih Posko Aktif dari seluruh kelurahan.
- Daftar akun terdokumentasi di `AKUN.md`.

---

## Dokumen Terkait

- `PRD.md`: Product Requirement Document terbaru.
- `AKUN.md`: daftar akun posko.
- `KEBUTUHAN_INTEGRASI_BULOG.md`: kebutuhan API resmi Bulog/Banpang masa depan.
- `PRESENTASI_CLAUDE_PPT.md`: bahan Markdown siap ubah menjadi PPT di Claude.

---

## Catatan Operasional

- AI membantu mempercepat pekerjaan, tetapi keputusan final tetap mengikuti dokumen fisik dan SOP supervisor.
- OCR tidak bisa dijamin sempurna untuk foto buram, gelap, miring, atau dokumen terpotong.
- Integrasi API resmi Bulog belum aktif; audit Web Bulog masih berbasis upload file ekspor manual.
