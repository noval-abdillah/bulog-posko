# Instruksi untuk Claude / AI Presentasi

Ubah dokumen Markdown ini menjadi presentasi PowerPoint profesional untuk stakeholder Perum BULOG.
Gunakan gaya korporat: navy blue (#0B3B73), putih, aksen biru muda, dan oranye (#E87722) secukupnya.
Buat slide ringkas, visual, dan siap dipresentasikan kepada pimpinan operasional.

Format output yang diinginkan:
- 14 slide.
- Setiap slide berisi judul, bullet utama, saran visual, dan speaker notes singkat.
- Bahasa Indonesia formal-operasional.
- Jangan gunakan emoji.
- Prioritaskan nilai bisnis, alur kerja lapangan, AI automation, arsitektur teknis menengah, dan dampak operasional.

---

# DECK: Sistem Posko Verifikasi, Audit, AI, dan Rekonsiliasi Bansos PBP BULOG

## Slide 1 — Judul

**Sistem Posko Verifikasi, Audit, AI, dan Rekonsiliasi Bansos PBP**

**Subtitle:**
Perum BULOG Kantor Cabang Jakarta Utara

ERP operasional lapangan untuk percepatan pelayanan warga, audit BAST, rekonsiliasi Web Bulog, supervisor monitoring realtime, dan otomasi AI di posko kelurahan.

**Detail:**
- Wilayah: Jakarta Utara
- Cakupan: 31 Kelurahan, 6 Kecamatan
- Alokasi: Beras Bantuan Pangan 30 Kg per Keluarga

**Visual suggestion:**
- Hero dashboard mockup dengan KPI cards
- Peta Jakarta Utara sederhana dengan 6 kecamatan
- Logo Perum BULOG di pojok kanan atas

**Speaker notes:**
Presentasi ini menjelaskan sistem operasional posko yang dirancang khusus untuk kebutuhan lapangan penyaluran PBP: verifikasi warga cepat, audit fisik BAST, rekonsiliasi data tiga sumber, dan koordinasi supervisor secara realtime.

---

## Slide 2 — Masalah Lapangan yang Diselesaikan

**Tantangan operasional nyata di posko kelurahan:**

- Verifikasi warga lambat saat antrean posko ramai — harus buka file Excel manual
- NIK dan No. KK sering rusak menjadi format angka ilmiah (scientific notation) di Excel
- Risiko pengambilan ganda dalam satu Kartu Keluarga
- Tanda tangan BAST bisa mengenai baris salah atau warga salah posko
- Data Web Bulog berbeda kondisi dengan lapangan fisik (tanda tangan nyasar, TTD belum diinput)
- Warga belum ambil sulit dipantau per RT/RW secara sistematis
- Supervisor tidak bisa memantau progres 31 kelurahan tanpa menghubungi petugas satu per satu
- Koordinasi antarposko tersebar di grup WhatsApp yang tidak terstruktur

**Visual suggestion:**
- Diagram pain point: 8 masalah utama dalam grid kartu merah/kuning
- Panah dari masalah ke solusi sistem

**Speaker notes:**
Sistem dibangun untuk menjawab masalah operasional nyata yang selama ini tersebar di file Excel, kertas BAST, pesan WhatsApp, dan laporan manual. Seluruh kebutuhan ini disatukan dalam satu platform.

---

## Slide 3 — Solusi: Satu Platform, Semua Kebutuhan Posko

**Modul solusi yang tersedia dalam satu sistem:**

- Meja Posko: verifikasi warga instan via barcode, NIK, atau No. Urut BAST
- Dashboard: ringkasan statistik salur system-wide dari data nyata
- Audit Ekspor: rekonsiliasi 3-way otomatis dengan kategorisasi selisih
- AI Automation: OCR KTP, Copilot asisten, Deep Match typo, WA Personalize
- Supervisor Monitoring: pantau 31 kelurahan realtime tanpa input manual
- Chat Posko: komunikasi terstruktur dengan template operasional lapangan
- Generator SPTJM: dokumen pengganti resmi siap cetak
- WhatsApp Reminder: daftar warga belum ambil per RT/RW

**Visual suggestion:**
- Hub-and-spoke diagram: "bulog-posko" di tengah, 8 modul di sekeliling
- Ikon tiap modul dengan label singkat

**Speaker notes:**
Semua kebutuhan operasional digabungkan dalam satu workflow sehingga petugas dan supervisor tidak perlu berpindah-pindah alat atau menunggu laporan manual.

---

## Slide 4 — Arsitektur Sistem: Hybrid Lokal + Cloud

**Pendekatan arsitektur hybrid untuk performa dan keandalan:**

**Komponen Lokal Browser (IndexedDB):**
- Master Data 142.000 baris DTKS — parsing via Web Worker, tidak membekukan UI
- BAST PDF/Excel — ekstraksi teks per halaman
- Ekspor Web Bulog (File Sudah Serah + File Belum Serah)
- Log Pelayanan Meja Posko harian

**Komponen Cloud Supabase:**
- Autentikasi login per kelurahan (Supabase Auth)
- Chat koordinasi antarposko (Supabase Realtime)
- Supervisor monitoring: tabel ringkasan 31 baris + log pelayanan
- Data warga TIDAK diunggah ke cloud — hanya statistik agregat

**Komponen AI (9router, server-side):**
- Proxy aman via Next.js API Route `/api/ai`
- API key tidak pernah terekspos ke browser

**Visual suggestion:**
- Diagram tiga lapis: Browser (lokal) | Supabase (cloud) | 9router AI (server)
- Panah dua arah antara browser dan Supabase (auth + realtime + statistik)
- Panah satu arah browser ke /api/ai ke 9router

**Speaker notes:**
Data sensitif warga (142k Master, BAST, Ekspor Bulog) tidak pernah meninggalkan browser petugas. Cloud hanya digunakan untuk autentikasi, chat, dan ringkasan statistik yang sangat ringan.

---

## Slide 5 — Meja Posko: Verifikasi Instan Berbasis Multi-Index

**Alur verifikasi petugas di meja posko:**

1. Upload Master Data 142k — diproses Web Worker di background, UI tetap responsif
2. Upload BAST PDF/Excel — ekstraksi otomatis barcode, NIK, No. Urut, RT/RW
3. Scan atau ketik pencarian warga

**Empat lapis fallback pencarian data:**

| Lapis | Metode | Kecepatan |
|---|---|---|
| 1 | NIK 16-digit exact match (Map O(1)) | < 1ms |
| 2 | No. Urut BAST (Map O(1)) | < 1ms |
| 3 | Nama lengkap exact + fuzzy string | < 5ms |
| 4 | AI Deep Match typo (9router AI) | ~2-5 detik |

**Format pencarian yang didukung:**
- Barcode BAST (scan USB/Bluetooth)
- NIK 16-digit
- No. KK 16-digit
- No. Urut Undangan BAST (contoh: 1095)
- Nama Lengkap

**Visual suggestion:**
- Diagram alur: Input query → 4 lapis pencarian → hasil verifikasi
- Ilustrasi search bar dengan contoh No. Urut dan NIK

**Speaker notes:**
Sistem membangun lima Map index saat file pertama kali diunggah sehingga pencarian selanjutnya berjalan dalam hitungan milidetik. AI hanya dipanggil jika keempat cara konvensional gagal menemukan warga.

---

## Slide 6 — AI Automation: Arsitektur Backend dan Lima Kemampuan

**Alur teknis request AI (browser ke model):**

```
Browser → POST /api/ai (body: action, payload)
        → Next.js Server Route (baca API key dari env)
        → Susun system prompt sesuai action
        → POST 9router tunnel (cloud endpoint)
        → Jika gagal → fallback localhost:20128
        → Model SuperAdmin memproses
        → Response JSON / SSE parsing
        → Return { result } ke browser
        → Komponen render output + tombol ACTION
```

**Lima action AI yang tersedia:**

| Action | Kemampuan |
|---|---|
| `ocr_ktp` | Baca NIK, nama, No. KK, RT, RW dari foto KTP/KK/BAST |
| `copilot` | Asisten tanya-jawab SOP, sisa PBP, undangan nyasar, audit |
| `audit_insight` | Ringkasan eksekutif selisih 3-way + rekomendasi tindakan |
| `wa_personalize` | Susun pesan WhatsApp RT/RW dengan tone formal/santun/urgen |
| `deep_match` | Fuzzy match nama typo ke kandidat Master Data |

**OCR Character Disambiguation (koreksi otomatis prompt AI):**
O/D → 0, I/l → 1, B → 8, S → 5, Z → 2

**Visual suggestion:**
- Flowchart alur request browser ke 9router ke response
- Tabel 5 action dengan ikon masing-masing

**Speaker notes:**
API key AI tersimpan di environment server, tidak pernah terekspos ke browser pengguna. Sistem fallback ke localhost memastikan AI tetap bisa digunakan saat koneksi tunnel terputus.

---

## Slide 7 — AI Copilot: Asisten Data Operasional Lapangan

**Apa yang AI Copilot ketahui dari data posko aktif:**

- Jumlah Master Data dan BAST yang termuat (angka, bukan data mentah)
- Daftar sisa PBP belum ambil beras (maks 80 PBP, urut No. BAST)
- Daftar undangan nyasar — warga BAST terdaftar di kelurahan lain (maks 40)
- Daftar kurang foto/belum verifikasi di Web Bulog (maks 60)
- Kejanggalan SOP: potensi TTD nyasar, NIK pengganti kosong (maks 40)
- Log pelayanan hari ini: sukses salur, pengaduan

**Kemampuan interaktif AI Copilot:**
- Menampilkan daftar warga dengan No. Urut BAST secara berurutan
- Menyertakan tag `[ACTION:VERIFY|NIK|NAMA|NO_URUT]` di respons
- Tag dirender oleh UI menjadi tombol hijau "Buka di Meja Posko"
- Petugas klik tombol → Meja Posko langsung membuka data warga tersebut

**Quick Action Chips (pertanyaan preset):**
- Sisa PBP Belum Ambil
- Cari Undangan Nyasar
- PBP Kurang Foto
- Audit Kejanggalan SOP
- SOP Salur 30 Kg
- Analisis Ringkasan Data

**Visual suggestion:**
- Chat bubble AI dengan tombol hijau "Buka di Meja Posko"
- Diagram data yang dibaca AI (6 jenis data dengan ukuran maks)

**Speaker notes:**
AI Copilot bukan sekadar chatbot — ia adalah asisten data yang dapat mengarahkan petugas langsung ke warga spesifik yang disebutkan dalam percakapan, tanpa perlu mencari manual.

---

## Slide 8 — Audit Ekspor: Rekonsiliasi 3-Way Otomatis

**Tiga sumber data yang dibandingkan:**

- Master Data 142k DTKS (acuan identitas dan wilayah domisili)
- BAST Fisik / Log Pelayanan Meja Posko (bukti operasional lapangan)
- Ekspor Web Bulog File 1 (Sudah Serah) + File 2 (Belum Serah)

**Lima kategori hasil rekonsiliasi:**

| Kategori | Kondisi | Tindakan |
|---|---|---|
| TUNGGU INPUT WEB | Fisik sudah salur, Web masih Belum | Input manual Web Bulog |
| BELUM DIAMBIL | Web Belum, Posko belum melayani | Jadwalkan pengambilan |
| HUMAN ERROR BAST | Ditulis Pengganti padahal 1 KK/DTKS | Klarifikasi dokumen |
| POTENSI TTD NYASAR | Web Sudah, Fisik tidak ada | Investigasi lapangan |
| MATCH LENGKAP | Cocok di ketiga sumber | Tidak perlu tindakan |

**Tab Rekonsiliasi BAST Fisik:**
- Filter "Belum Ditandai" — langsung tampilkan PBP yang belum diverifikasi fisik
- StatCard counter "Belum Ditandai" dengan warna peringatan
- Toggle penanda per baris: Terverifikasi / Perlu Ditinjau / Ketidaksesuaian
- Tandai Halaman Sekaligus (batch)

**Visual suggestion:**
- Venn diagram tiga lingkaran: Master, BAST, Web Bulog
- Tabel lima kategori dengan kode warna

**Speaker notes:**
Rekonsiliasi 3-way memberikan gambaran presisi apakah kondisi fisik lapangan, master DTKS, dan sistem Web Bulog sudah selaras. Filter "Belum Ditandai" memudahkan petugas fokus pada pekerjaan yang belum selesai.

---

## Slide 9 — Supervisor Monitoring Realtime: 31 Kelurahan dalam Satu Layar

**Prinsip arsitektur supervisor monitoring:**

Data statistik naik ke Supabase otomatis saat petugas melakukan aktivitas — supervisor tidak perlu meminta laporan atau mengupload data apapun.

**Dua tabel Supabase yang digunakan:**

| Tabel | Isi | Ukuran |
|---|---|---|
| posko_ringkasan | 1 baris per kelurahan, diperbarui terus | 31 baris |
| posko_log_pelayanan | 1 baris per transaksi PBP | ~500 PBP x 31 kel |

**5 event yang memicu sync otomatis dari browser petugas:**

1. Klik Sukses Salur / Alih Pengaduan → kirim log + update counter salur
2. Upload BAST → update jumlah BAST termuat dan waktu upload
3. Upload File Sudah Serah → update jumlah sudah serah
4. Upload File Belum Serah → update jumlah belum serah
5. Toggle Penanda Fisik BAST → update counter Verified/Review/Mismatch

**UI supervisor (tab Manajemen Posko):**
- Tabel 31 kelurahan dikelompokkan per kecamatan
- Kolom: BAST, Sudah Serah, Belum Serah, Sukses Salur, Pengaduan, Verified Fisik
- Klik tombol Log → drill-down log pelayanan per kelurahan
- Auto-update via Supabase Realtime tanpa reload halaman

**Visual suggestion:**
- Tabel monitoring 31 kelurahan dengan badge status warna
- Diagram alur: Petugas Lapangan → Event → Supabase → Supervisor Dashboard

**Speaker notes:**
Supervisor mendapat visibilitas penuh kondisi lapangan secara realtime. Data warga tidak dikirim ke cloud — hanya angka agregat yang sangat ringan dan tidak melanggar privasi.

---

## Slide 10 — Chat Koordinasi + Template Operasional Lapangan

**Infrastruktur Chat Posko:**
- Tabel chat_posko di Supabase PostgreSQL
- Subscribe postgres_changes INSERT — pesan muncul di semua device tanpa polling
- Notifikasi toast + suara saat pesan dari posko lain masuk
- Badge unread di sidebar
- Filter per kecamatan (6 kecamatan Jakarta Utara) dan tipe pesan

**Tipe pesan dengan visual berbeda:**
- Normal: bubble putih (informasi biasa)
- Peringatan: bubble kuning amber (perlu perhatian segera)
- Informasi: bubble biru langit (update status/kondisi)

**6 Quick Template Operasional (chip siap kirim):**

| Template | Tipe | Kegunaan |
|---|---|---|
| Pelayanan Selesai | Informasi | Lapor posko selesai melayani seluruh PBP |
| Armada Tiba | Informasi | Lapor truk beras Bulog tiba di lokasi |
| Stok Kurang | Peringatan | Minta tambahan stok ke tim logistik |
| SPTJM Siap | Informasi | Berkas pengganti lengkap, siap ditandatangani |
| Undangan Nyasar | Peringatan | Koordinasi warga datang ke posko yang salah |
| Kendala Web Banpang | Peringatan | Lapor gangguan akses ke supervisor |

Klik template → nama posko aktif otomatis terisi → tinggal klik Kirim.

**Visual suggestion:**
- Chat interface dengan dua bubble berbeda (mine vs others)
- Deretan chip template di atas input box

**Speaker notes:**
Template chat menghilangkan kebutuhan mengetik pesan berulang dan memastikan format pesan koordinasi lapangan konsisten dan mudah dibaca supervisor.

---

## Slide 11 — WhatsApp Reminder + SPTJM Pengganti

**WhatsApp Reminder per RT/RW:**

- Daftar warga belum ambil dikelompokkan otomatis per RT/RW
- Selector RT/RW dengan counter jumlah warga per wilayah
- Tiga pilihan tone pesan: Santun & Persuasif, Formal Resmi, Urgen H-1 Penutupan
- AI WA Personalize: input daftar warga → output pesan WA siap salin ke WhatsApp
- Tombol "Rekap Semua RT/RW" untuk pesan komprehensif lintas wilayah

**Generator SPTJM Pengganti:**

- Form terstruktur: data PBP awal (hak), data PBP pengganti, data wilayah
- Validasi kelengkapan field: NIK, No. KK, alamat, pekerjaan
- Overlay otomatis ke template PDF resmi Bulog
- Output: PDF SPTJM siap cetak dan ditandatangani lurah
- Pengaturan wilayah: provinsi, kabupaten/kota, alokasi bulan, nama lurah, NIP lurah

**Export Laporan:**
- Export Excel audit rekonsiliasi 3-way
- Export data siap upload ke Banpang (format sesuai kebutuhan sistem)
- Export rincian SPTJM semua pengganti per kelurahan

**Visual suggestion:**
- Modal WhatsApp di kiri, dokumen SPTJM di kanan
- Tombol tone pesan dengan warna berbeda

**Speaker notes:**
Sistem menghilangkan pekerjaan ketik ulang dan format manual. Petugas tinggal memilih RT/RW, klik AI Personalize, dan pesan WhatsApp siap dikirim ke ketua RT/RW dalam hitungan detik.

---

## Slide 12 — Dashboard: Monitoring Statistik Salur System-Wide

**Statistik Salur terintegrasi dengan data sistem nyata:**

Berbeda dari dashboard konvensional yang hanya menampilkan angka log pelayanan manual, Dashboard bulog-posko mengkalkulasi realisasi dari sumber resmi Ekspor Web Bulog:

**Sumber kalkulasi statistik salur:**
- File 1 Sudah Serah → jumlah PBP realisasi + tonase beras
- File 2 Belum Serah → sisa PBP belum diserahkan
- Jika ekspor belum diunggah → fallback ke Log Pelayanan Meja Posko

**Indikator yang ditampilkan:**
- Total Realisasi Sudah Salur (PBP + Kg + Ton)
- Sisa Belum Salur (PBP + estimasi stok beras)
- Progress Bar Capaian: Realisasi / Total Kuota x 100%
- Progres Meja Posko hari ini (Sukses Salur vs Pengaduan)

**5 KPI StatCards sejajar:**
- Master Data Terindeks (acuan DTKS)
- Penerima BAST Termuat
- Realisasi Sudah Salur
- Sisa Belum Salur
- Terverifikasi Fisik BAST

**Welcome Hero Banner:**
- Nama posko, tanggal hari ini, status live, tombol cepat aksi

**Visual suggestion:**
- Hero banner gradien navy ke biru
- 5 StatCard berjejer dengan angka besar
- Progress bar capaian dengan label persentase

**Speaker notes:**
Dashboard sebelumnya hanya menampilkan data dari input manual meja posko. Versi baru secara otomatis membaca realisasi dari file ekspor resmi Web Bulog sehingga angka dashboard mencerminkan kondisi sistem yang sesungguhnya.

---

## Slide 13 — Alur Kerja Petugas Lapangan (End-to-End)

**Workflow petugas kelurahan dalam satu hari operasional:**

```
Pagi: Persiapan Data
    Login → Upload Master 142k (via Web Worker, background)
           → Upload BAST PDF Posko
           → Sistem membangun 5 index pencarian O(1)

Siang: Pelayanan Warga
    Scan barcode / ketik NIK → Verifikasi instan
        → Cocok: tampilkan data warga, konfirmasi 1 KK
        → Catat: Sukses Salur / Alih Pengaduan
        → Tidak ketemu: AI Deep Match typo → verifikasi manual
    Log pelayanan → sync otomatis ke Supabase (supervisor lihat realtime)

Sore: Upload Ekspor Bulog
    Upload File 1 Sudah Serah + File 2 Belum Serah
        → Dashboard update statistik salur
        → Rekonsiliasi 3-way otomatis berjalan
        → Supervisor monitoring update metadata

Audit: Penandaan Fisik BAST
    Buka tab Rekonsiliasi BAST Fisik
        → Filter "Belum Ditandai" → fokus yang belum selesai
        → Toggle penanda per baris: Verif / Tinjau / Beda
        → Sync counter ke Supervisor Dashboard

Koordinasi: Chat & WA Reminder
    Kirim update ke chat posko (template atau pesan bebas)
    Generate WA reminder per RT/RW untuk warga belum ambil
    Cetak SPTJM untuk pengganti jika diperlukan
```

**Visual suggestion:**
- Timeline horizontal 5 fase: Persiapan → Pelayanan → Upload Ekspor → Audit → Koordinasi
- Ikon mini tiap fase dengan warna berbeda

**Speaker notes:**
Workflow ini menunjukkan bagaimana sistem menemani petugas dari pagi hingga selesai — setiap tindakan petugas secara otomatis memperbarui supervisor monitoring tanpa langkah tambahan.

---

## Slide 14 — Dampak Operasional + Roadmap

**Dampak yang terukur dari implementasi sistem:**

| Sebelum | Sesudah |
|---|---|
| Verifikasi manual buka Excel | Verifikasi instan < 1 detik via index O(1) |
| NIK rusak scientific notation | NIK ternormalisasi otomatis di impor |
| Pengambilan ganda 1 KK tidak terdeteksi | Proteksi otomatis saat pencarian |
| Audit selisih manual lintas file | Rekonsiliasi 3-way otomatis terkategori |
| Supervisor telepon satu per satu | Monitoring realtime 31 kelurahan 1 layar |
| Pesan WA RT/RW ketik manual | Template + AI Personalize dalam detik |
| Koordinasi antarposko via grup WA | Chat terstruktur dengan template operasional |
| SPTJM diketik ulang tiap kasus | Generator PDF otomatis dari data sistem |

**Roadmap Pengembangan:**

| Status | Item |
|---|---|
| Selesai | Supervisor monitoring realtime via Supabase |
| Selesai | Filter Belum Ditandai + StatCard di Audit BAST |
| Selesai | Quick Template Chat 6 operasional |
| Selesai | Dashboard Statistik Salur System-Wide |
| Rencana | Integrasi API resmi Banpang saat endpoint tersedia |
| Rencana | Penyimpanan penanda fisik BAST ke Supabase cloud |
| Rencana | Export paket laporan final per kelurahan (PDF + Excel bundle) |
| Rencana | Notifikasi push PWA untuk peringatan chat posko |

**Penutup:**

`bulog-posko` menyatukan pelayanan, audit, AI, supervisor monitoring, komunikasi, dan pelaporan dalam satu sistem operasional — dirancang khusus untuk memperkuat akurasi, kecepatan, dan transparansi penyaluran PBP Perum BULOG.

**Visual suggestion:**
- Tabel Before vs After dua kolom
- Timeline roadmap 4 item selesai + 4 item rencana
- Tagline penutup dengan background navy

**Speaker notes:**
Nilai utama sistem bukan hanya digitalisasi file — melainkan pengurangan beban kerja manual, peningkatan akurasi data lintas sumber, dan transparansi kondisi lapangan yang bisa dipantau supervisor secara langsung.
